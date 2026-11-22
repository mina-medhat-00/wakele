import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { COLORS } from "@/constants/colors";
import type {
  TabBarIconProps,
  TabBarIconRenderProps,
} from "@/types/navigation";

function AlarmTabIcon({ color, focused }: TabBarIconProps): React.JSX.Element {
  return (
    <Ionicons
      name={focused ? "alarm" : "alarm-outline"}
      size={24}
      color={color}
    />
  );
}

const renderAlarmIcon = ({
  color,
  focused,
  size,
}: TabBarIconRenderProps): React.JSX.Element => (
  <AlarmTabIcon
    color={typeof color === "string" ? color : COLORS.textMuted}
    focused={focused}
    size={size}
  />
);

export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        // Light grey on the near-black bar (~13:1 contrast) so unselected tabs stay readable.
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopColor: COLORS.grey,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Alarm", tabBarIcon: renderAlarmIcon }}
      />
    </Tabs>
  );
}
