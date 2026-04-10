import "@/global.css";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { deleteAlarm, getAlarms, saveAlarm } from "@/utils/alarmStorage";
import {
  cancelAlarmNotification,
  requestPermissions,
  scheduleAlarmNotification,
} from "@/utils/alarmScheduler";
import { Alarm } from "@/types/types";

export default function App() {
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    getAlarms().then(setAlarms);
  }, []);

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const toggleAlarm = async (alarm: Alarm) => {
    if (alarm.enabled && alarm.notificationId) {
      await cancelAlarmNotification(alarm.notificationId);
      await saveAlarm({ ...alarm, enabled: false, notificationId: null });
    } else {
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

  const handleConfirm = async (date: Date) => {
    const timeString = format(date, "HH:mm");
    const granted = await requestPermissions();

    if (!granted) {
      return;
    }

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: timeString,
      label: "Alarm",
      enabled: true,
      days: [],
      notificationId: null,
    };

    // Schedule the OS notification
    const notificationId = await scheduleAlarmNotification(newAlarm);
    newAlarm.notificationId = notificationId;

    // Persist to AsyncStorage
    await saveAlarm(newAlarm);

    setAlarms((prev) => [...prev, newAlarm]);
    hideTimePicker();
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top"]}>
      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          activeOpacity={0.7}
          className="bg-primary-green py-2 px-4 rounded-md"
          onPress={showTimePicker}
        >
          <Text className="text-white font-bold text-lg">Pick Time</Text>
        </TouchableOpacity>

        {alarms.map((alarm) => (
          <View key={alarm.id} className="bg-white mb-2">
            <Text>Time: {alarm.time}</Text>
            <Text>Label: {alarm.label}</Text>
            <Text>Enabled: {alarm.enabled}</Text>
            <Text>Days: {alarm.days.join(", ")}</Text>
          </View>
        ))}

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={(date) => handleConfirm(date)}
          onCancel={hideTimePicker}
          timePickerModeAndroid="clock"
        />
      </View>
    </SafeAreaView>
  );
}
