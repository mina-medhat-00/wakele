import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#538D4E",
        tabBarInactiveTintColor: "#D7DADC",
        tabBarStyle: {
          backgroundColor: "#121213",
          borderTopColor: "#3A3A3C",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Alarm",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "alarm" : "alarm-outline"}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
