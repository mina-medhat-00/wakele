import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

interface TimePickerProps {
  visible: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/**
 * Time picker built directly on @react-native-community/datetimepicker using its
 * `onValueChange`/`onDismiss` API (the deprecated `onChange` is never passed).
 * Android shows the native clock dialog; iOS shows a spinner in a bottom sheet.
 */
export default function TimePicker({
  visible,
  onConfirm,
  onCancel,
}: TimePickerProps) {
  const [value, setValue] = useState(() => new Date());
  // Keep the latest callbacks without reopening the Android dialog on re-render.
  const callbacks = useRef({ onConfirm, onCancel });
  useEffect(() => {
    callbacks.current = { onConfirm, onCancel };
  });

  useEffect(() => {
    if (!visible) return;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "time",
        display: "clock",
        value: new Date(),
        onValueChange: (_event, date) => callbacks.current.onConfirm(date),
        onDismiss: () => callbacks.current.onCancel(),
      });
    }
  }, [visible]);

  if (Platform.OS === "android") return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-[#1E1E20] pb-8">
          <View className="flex-row justify-between px-5 py-3">
            <TouchableOpacity
              onPress={() => {
                setValue(new Date());
                onCancel();
              }}
              hitSlop={10}
            >
              <Text className="text-lg text-[#D7DADC]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onConfirm(value);
                setValue(new Date());
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
            onValueChange={(_event, date) => setValue(date)}
          />
        </View>
      </View>
    </Modal>
  );
}
