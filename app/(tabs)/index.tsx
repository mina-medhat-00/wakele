import "@/global.css";
import { useCallback, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { format } from "date-fns";
import { deleteAlarm, getAlarms, saveAlarm } from "@/utils/alarmStorage";
import {
  cancelAlarmNotification,
  requestPermissions,
  scheduleAlarmNotification,
} from "@/utils/alarmScheduler";
import { Alarm } from "@/types/types";
import TimePicker from "@/components/clock/TimePicker";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function repeatLabel(days: number[]) {
  if (days.length === 0) return "Once";
  if (days.length === 7) return "Every day";
  return days.map((d) => DAY_NAMES[d]).join(", ");
}

function AlarmCard({
  alarm,
  onToggle,
  onDelete,
}: {
  alarm: Alarm;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-primary-grey bg-[#1E1E20] px-5 py-4">
      <View className="flex-1">
        <Text
          className={`text-5xl font-bold ${alarm.enabled ? "text-white" : "text-[#A1A1A6]"}`}
        >
          {alarm.time}
        </Text>
        <Text className="mt-1 text-base text-[#D7DADC]">
          {alarm.label} · {repeatLabel(alarm.days)}
        </Text>
      </View>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          accessibilityLabel={`Delete ${alarm.time} alarm`}
          hitSlop={10}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#D7DADC" />
        </TouchableOpacity>
        <Switch
          accessibilityLabel={`Turn ${alarm.time} alarm ${alarm.enabled ? "off" : "on"}`}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#565758", true: "#538D4E" }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

export default function AlarmScreen() {
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  // Reload on focus so alarms dismissed on the ring screen show their new state.
  useFocusEffect(
    useCallback(() => {
      getAlarms().then(setAlarms);
    }, []),
  );

  const toggleAlarm = async (alarm: Alarm) => {
    if (alarm.enabled) {
      if (alarm.notificationId) {
        await cancelAlarmNotification(alarm.notificationId);
      }
      await saveAlarm({ ...alarm, enabled: false, notificationId: null });
    } else {
      if (!(await requestPermissions())) return;
      const notificationId = await scheduleAlarmNotification(alarm);
      await saveAlarm({ ...alarm, enabled: true, notificationId });
    }

    setAlarms(await getAlarms());
  };

  const removeAlarm = async (alarm: Alarm) => {
    if (alarm.notificationId) {
      await cancelAlarmNotification(alarm.notificationId);
    }

    await deleteAlarm(alarm.id);
    setAlarms(await getAlarms());
  };

  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirm = async (date: Date) => {
    setTimePickerVisibility(false);

    if (!(await requestPermissions())) return;

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: format(date, "HH:mm"),
      label: "Alarm",
      enabled: true,
      days: [],
      notificationId: null,
    };

    newAlarm.notificationId = await scheduleAlarmNotification(newAlarm);
    await saveAlarm(newAlarm);
    setAlarms(await getAlarms());
  };

  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top"]}>
      <View className="px-5 pb-4 pt-6">
        <Text className="text-4xl font-bold text-white">Alarms</Text>
      </View>

      {sortedAlarms.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Ionicons name="alarm-outline" size={64} color="#818384" />
          <Text className="text-xl font-bold text-white">No alarms yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-5 pb-4">
          {sortedAlarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onToggle={() => toggleAlarm(alarm)}
              onDelete={() => removeAlarm(alarm)}
            />
          ))}
        </ScrollView>
      )}

      <View className="px-5 pb-5 pt-2">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary-green py-4"
          onPress={() => setTimePickerVisibility(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-lg font-bold text-white">Add alarm</Text>
        </TouchableOpacity>
      </View>

      <TimePicker
        visible={isTimePickerVisible}
        onConfirm={handleConfirm}
        onCancel={hideTimePicker}
      />
    </SafeAreaView>
  );
}
