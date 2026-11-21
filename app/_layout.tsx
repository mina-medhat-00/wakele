import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAlarmRinging } from "@/hooks/useAlarmRinging";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    "LibreFranklin-Regular": require("../assets/fonts/LibreFranklin-Regular.otf"),
  });

  useAlarmRinging(loaded);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
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
