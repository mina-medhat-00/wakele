import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router, usePathname } from "expo-router";
import AlarmRinger from "@/modules/alarm-ringer";

/**
 * Opens the ring screen when an alarm goes off:
 * @Android
 * - The native ringer emits `onRing` (and its full-screen notification deep-links to /ring when the app isn't open)
 * @iOS
 * - Alarm notifications are received in the foreground or tapped
 * - Pass `ready` once the navigator is mounted so navigation isn't attempted early
 */
export function useAlarmRinging(ready: boolean): void {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const openRingScreen = (alarmId: unknown): void => {
      if (typeof alarmId !== "string" || pathnameRef.current === "/ring") {
        return;
      }
      router.push({ pathname: "/ring", params: { alarmId } });
    };

    if (AlarmRinger !== null) {
      // App opened (e.g. from the launcher) while an alarm is already ringing
      openRingScreen(AlarmRinger.getRingingAlarmId());
      const sub = AlarmRinger.addListener("onRing", ({ alarmId }) => {
        openRingScreen(alarmId);
      });
      return () => {
        sub.remove();
      };
    }

    if (lastResponse !== null && lastResponse !== undefined) {
      const id = lastResponse.notification.request.identifier;
      if (handledId.current !== id) {
        handledId.current = id;
        openRingScreen(
          lastResponse.notification.request.content.data?.["alarmId"],
        );
      }
    }
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        openRingScreen(notification.request.content.data?.["alarmId"]);
      },
    );
    return () => {
      sub.remove();
    };
  }, [ready, lastResponse]);
}
