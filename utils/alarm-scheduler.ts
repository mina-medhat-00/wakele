import * as Notifications from "expo-notifications";
import {
  AndroidImportance,
  AndroidNotificationVisibility,
} from "expo-notifications";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import AlarmRinger from "@/modules/alarm-ringer";
import type { Alarm, AlarmDraft } from "@/types/alarm";
import { parseTime, toExpoWeekday } from "@/utils/days";
import { getAlarms, runExclusive, writeAlarms } from "@/utils/alarm-storage";

const ALARM_CHANNEL_ID = "alarm";
const ALARM_SOUND = "alarm.wav";

Notifications.setNotificationHandler({
  handleNotification: async () =>
    await Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

function getNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function ringScreenUrl(alarmId: string): string {
  return Linking.createURL("/ring", { queryParams: { alarmId } });
}

/** Native scheduling keys for an alarm: one per repeat day, or one for a one-time alarm. */
export function alarmKeys(alarm: Alarm): string[] {
  return alarm.days.length > 0
    ? alarm.days.map((day) => `${alarm.id}-${String(day)}`)
    : [`${alarm.id}-once`];
}

/**
 * Android: schedules exact alarms with the native ringer, which loops the sound
 * in a foreground service until the Wordle is solved (even if the app is closed).
 */
function scheduleNativeAlarms(
  ringer: NonNullable<typeof AlarmRinger>,
  alarm: Alarm,
): string[] {
  const { hour, minute } = parseTime(alarm.time);
  const keys = alarmKeys(alarm);
  const weekdays = alarm.days.length > 0 ? alarm.days : [null];
  weekdays.forEach((weekday, index) => {
    ringer.schedule({
      key: keys[index] ?? `${alarm.id}-once`,
      alarmId: alarm.id,
      hour,
      minute,
      weekday,
      label: alarm.label === "" ? "Alarm" : alarm.label,
      url: ringScreenUrl(alarm.id),
    });
  });
  return keys;
}

async function ensureAlarmChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: "Alarms",
    importance: AndroidImportance.MAX,
    sound: ALARM_SOUND,
    vibrationPattern: [0, 500, 250, 500],
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}

export async function requestPermissions(): Promise<boolean> {
  await ensureAlarmChannel();
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/**
 * Schedules an alarm and returns its ids: native alarm keys on Android, notification
 * ids on iOS (one per repeat day, or one for the next occurrence of a one-time alarm).
 */
export async function scheduleAlarm(alarm: Alarm): Promise<string[]> {
  if (AlarmRinger !== null) {
    return scheduleNativeAlarms(AlarmRinger, alarm);
  }

  const { hour, minute } = parseTime(alarm.time);
  const triggers: Notifications.NotificationTriggerInput[] =
    alarm.days.length > 0
      ? alarm.days.map((day) => ({
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: ALARM_CHANNEL_ID,
          weekday: toExpoWeekday(day),
          hour,
          minute,
        }))
      : [
          {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            channelId: ALARM_CHANNEL_ID,
            date: getNextOccurrence(hour, minute),
          },
        ];

  return await Promise.all(
    triggers.map(
      async (trigger) =>
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Alarm",
            body: alarm.label === "" ? alarm.time : alarm.label,
            sound: ALARM_SOUND,
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { alarmId: alarm.id },
          },
          trigger,
        }),
    ),
  );
}

export async function cancelAlarm(ids: readonly string[]): Promise<void> {
  // Ids may be native alarm keys or (from older versions) notification ids; cancelling
  // an unknown id is a no-op either way.
  ids.forEach((id) => {
    AlarmRinger?.cancel(id);
  });
  await Promise.all(
    ids.map(async (id) => {
      await Notifications.cancelScheduledNotificationAsync(id);
    }),
  );
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * Makes the stored alarms and Android's scheduled alarms agree. Run on launch and
 * whenever the alarm list is shown. It:
 * - re-arms alarms that Android dropped (force-stop, data restore);
 * - switches off one-time alarms that already rang (even if never dismissed);
 * - migrates alarms scheduled by older versions (notification ids) to native alarms;
 * - cancels native alarms that no enabled alarm owns any more.
 */
export async function syncAlarms(): Promise<Alarm[]> {
  return await runExclusive(syncAlarmsUnlocked);
}

async function syncAlarmsUnlocked(): Promise<Alarm[]> {
  if (AlarmRinger === null) {
    return await getAlarms();
  }
  const ringer = AlarmRinger;
  ringer.rearmAll();
  const scheduled = new Set(ringer.getScheduledKeys());
  const ringingId = ringer.getRingingAlarmId();
  const alarms = await getAlarms();
  const updates = new Map<string, Alarm>();
  const pendingNotifications = new Set(
    (await Notifications.getAllScheduledNotificationsAsync()).map(
      (notification) => notification.identifier,
    ),
  );

  for (const alarm of alarms) {
    const expected = alarmKeys(alarm);
    if (!alarm.enabled) {
      continue;
    }
    if (!sameIds(alarm.notificationIds, expected)) {
      // Scheduled by an older version (notification ids): move it to native alarms,
      // unless it was a one-time alarm whose notification already fired.
      const alreadyRang =
        alarm.days.length === 0 &&
        !alarm.notificationIds.some((id) => pendingNotifications.has(id));
      await cancelAlarm(alarm.notificationIds);
      updates.set(
        alarm.id,
        alreadyRang
          ? { ...alarm, enabled: false, notificationIds: [] }
          : { ...alarm, notificationIds: scheduleNativeAlarms(ringer, alarm) },
      );
    } else if (!expected.every((key) => scheduled.has(key))) {
      if (alarm.days.length === 0) {
        // A one-time alarm that is no longer scheduled has already rung.
        if (alarm.id !== ringingId) {
          updates.set(alarm.id, {
            ...alarm,
            enabled: false,
            notificationIds: [],
          });
        }
      } else {
        updates.set(alarm.id, {
          ...alarm,
          notificationIds: scheduleNativeAlarms(ringer, alarm),
        });
      }
    }
  }

  const owned = new Set(
    alarms
      .map((alarm) => updates.get(alarm.id) ?? alarm)
      .filter((alarm) => alarm.enabled)
      .flatMap((alarm) => alarm.notificationIds),
  );
  for (const key of ringer.getScheduledKeys()) {
    if (!owned.has(key)) {
      ringer.cancel(key);
    }
  }

  if (updates.size === 0) {
    return alarms;
  }
  return await writeAlarms(
    alarms.map((alarm) => updates.get(alarm.id) ?? alarm),
  );
}

/** Creates or updates an alarm, scheduling it (it is always enabled after saving). */
export async function saveAndSchedule(
  existing: Alarm | null,
  draft: AlarmDraft,
): Promise<Alarm[]> {
  return await runExclusive(async () => {
    if (existing !== null) {
      await cancelAlarm(existing.notificationIds);
    }
    const alarm: Alarm = {
      id: existing?.id ?? Date.now().toString(),
      label: existing?.label ?? "Alarm",
      time: draft.time,
      days: draft.days,
      enabled: true,
      notificationIds: [],
    };
    alarm.notificationIds = await scheduleAlarm(alarm);
    const alarms = await getAlarms();
    return await writeAlarms(
      alarms.some((a) => a.id === alarm.id)
        ? alarms.map((a) => (a.id === alarm.id ? alarm : a))
        : [...alarms, alarm],
    );
  });
}

/** Turns an alarm on (scheduling it) or off (cancelling it). */
export async function setAlarmEnabled(
  alarm: Alarm,
  enabled: boolean,
): Promise<Alarm[]> {
  return await runExclusive(async () => {
    await cancelAlarm(alarm.notificationIds);
    const updated: Alarm = enabled
      ? { ...alarm, enabled, notificationIds: await scheduleAlarm(alarm) }
      : { ...alarm, enabled, notificationIds: [] };
    return await writeAlarms(
      (await getAlarms()).map((a) => (a.id === alarm.id ? updated : a)),
    );
  });
}

/** Cancels and deletes an alarm. */
export async function removeAlarm(alarm: Alarm): Promise<Alarm[]> {
  return await runExclusive(async () => {
    await cancelAlarm(alarm.notificationIds);
    return await writeAlarms(
      (await getAlarms()).filter((a) => a.id !== alarm.id),
    );
  });
}
