import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

function openRingScreen(notification: Notifications.Notification) {
  const alarmId = notification.request.content.data?.alarmId;
  if (typeof alarmId !== "string") {
    return;
  }
  router.push({ pathname: "/ring", params: { alarmId } });
}

export function useAlarmRinging(ready: boolean) {
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !lastResponse) {
      return;
    }
    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) {
      return;
    }
    handledId.current = id;
    openRingScreen(lastResponse.notification);
  }, [ready, lastResponse]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const sub = Notifications.addNotificationReceivedListener(openRingScreen);
    return () => sub.remove();
  }, [ready]);
}
