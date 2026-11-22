import * as Notifications from "expo-notifications";
import {
  AndroidImportance,
  AndroidNotificationVisibility,
} from "expo-notifications";
import { Platform } from "react-native";
import { Alarm } from "@/types/types";

const ALARM_CHANNEL_ID = "alarm";
const ALARM_SOUND = "alarm.wav";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getNextOccurrence(hours: number, minutes: number): Date {
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function ensureAlarmChannel() {
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

export async function requestPermissions() {
  await ensureAlarmChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAlarmNotification(alarm: Alarm): Promise<string> {
  const [hours, minutes] = alarm.time.split(":").map(Number);

  // Recurring vs One-time
  const trigger: Notifications.NotificationTriggerInput =
    alarm.days.length > 0
      ? {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: ALARM_CHANNEL_ID,
          weekday: alarm.days[0] + 1,
          hour: hours,
          minute: minutes,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          channelId: ALARM_CHANNEL_ID,
          date: getNextOccurrence(hours, minutes),
        };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Alarm",
      body: alarm.label || alarm.time,
      sound: ALARM_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { alarmId: alarm.id },
    },
    trigger,
  });

  return notificationId;
}

export async function cancelAlarmNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
