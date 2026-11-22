import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import type { TimePickerProps } from "@/types/clock";

export default function TimePicker({
  visible,
  initialValue,
  onConfirm,
  onCancel,
}: TimePickerProps): React.JSX.Element | null {
  // iOS only: the time scrolled to so far, before Done/Cancel.
  const [draft, setDraft] = useState<Date | null>(null);
  const value = draft ?? initialValue ?? new Date();
  // Keep the latest callbacks without reopening the Android dialog on re-render.
  const latest = useRef({ initialValue, onConfirm, onCancel });
  useEffect(() => {
    latest.current = { initialValue, onConfirm, onCancel };
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "time",
        display: "clock",
        value: latest.current.initialValue ?? new Date(),
        onValueChange: (_event, date) => {
          latest.current.onConfirm(date);
        },
        onDismiss: () => {
          latest.current.onCancel();
        },
      });
    }
  }, [visible]);

  if (Platform.OS === "android") {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-[#1E1E20] pb-8">
          <View className="flex-row justify-between px-5 py-3">
            <TouchableOpacity
              onPress={() => {
                setDraft(null);
                onCancel();
              }}
              hitSlop={10}
            >
              <Text className="text-lg text-[#D7DADC]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onConfirm(value);
                setDraft(null);
              }}
              hitSlop={10}
            >
              <Text className="text-lg font-bold text-primary-green">Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            mode="time"
            display="spinner"
            themeVariant="dark"
            value={value}
            onValueChange={(_event, date) => {
              setDraft(date);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
