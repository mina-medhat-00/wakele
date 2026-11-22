import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAlarmRinging } from "@/hooks/use-alarm-ringing";
import { syncAlarms } from "@/utils/alarm-scheduler";
import LIBRE_FRANKLIN_REGULAR from "@/assets/fonts/libre-franklin-regular.otf";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const [loaded] = useFonts({
    "LibreFranklin-Regular": LIBRE_FRANKLIN_REGULAR,
  });

  useAlarmRinging(loaded);

  // Re-arm anything Android dropped (e.g. after a force-stop) as soon as the app opens.
  useEffect(() => {
    void syncAlarms();
  }, []);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="ring"
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}
