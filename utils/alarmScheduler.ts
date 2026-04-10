import * as Notifications from "expo-notifications";
import { Alarm } from "@/types/types";

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
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
export async function requestPermissions() {
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
          weekday: alarm.days[0] + 1,
          hour: hours,
          minute: minutes,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: getNextOccurrence(hours, minutes),
        };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Alarm",
      body: alarm.label || alarm.time,
      sound: true,
    },
    trigger,
  });

  return notificationId;
}

export async function cancelAlarmNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
