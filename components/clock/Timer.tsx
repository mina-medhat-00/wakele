import "@/global.css";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TimerPickerModal } from "react-native-timer-picker";

export default function Timer() {
  const [showPicker, setShowPicker] = useState(false);
  const [timerString, setTimerString] = useState<string | null>(null);

  const formatTime = ({
    hours,
    minutes,
    seconds,
  }: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  }) => {
    const timeParts = [];

    if (hours !== undefined) {
      timeParts.push(hours.toString().padStart(2, "0"));
    }
    if (minutes !== undefined) {
      timeParts.push(minutes.toString().padStart(2, "0"));
    }
    if (seconds !== undefined) {
      timeParts.push(seconds.toString().padStart(2, "0"));
    }

    return timeParts.join(":");
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top"]}>
      <View className="items-center justify-center">
        <Text style={{ fontSize: 18, color: "#F1F1F1" }}>
          {timerString !== null ? "Timer set for" : "No timer set"}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPicker(true)}
        >
          <View className="items-center">
            {timerString && <Text>{timerString}</Text>}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPicker(true)}
            >
              <View className="mt-4">
                <Text className="text-white text-lg font-bold">Set Timer</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TimerPickerModal
          styles={{
            theme: "dark",
          }}
          modalProps={{
            overlayOpacity: 0.2,
          }}
          closeOnOverlayPress
          modalTitle="Set Timer"
          onConfirm={(pickedDuration) => {
            setTimerString(formatTime(pickedDuration));
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
          setIsVisible={setShowPicker}
          visible={showPicker}
        />
      </View>
    </SafeAreaView>
  );
}
