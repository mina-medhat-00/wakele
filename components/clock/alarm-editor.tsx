import { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { format, parse } from "date-fns";
import TimePicker from "@/components/clock/time-picker";
import {
  DAY_NAMES,
  EVERY_DAY,
  WEEKDAYS,
  WEEKEND,
  repeatLabel,
  sameDays,
} from "@/utils/days";

import type { AlarmEditorProps } from "@/types/alarm";

const PRESETS = [
  { label: "Once", days: [] as number[] },
  { label: "Weekdays", days: WEEKDAYS },
  { label: "Weekends", days: WEEKEND },
  { label: "Every day", days: EVERY_DAY },
];

export default function AlarmEditor({
  initial,
  onSave,
  onCancel,
}: AlarmEditorProps): React.JSX.Element {
  const [time, setTime] = useState(
    () => initial?.time ?? format(new Date(), "HH:mm"),
  );
  const [days, setDays] = useState<number[]>(() => initial?.days ?? []);
  const [pickingTime, setPickingTime] = useState(false);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onCancel}>
        <Pressable className="gap-6 rounded-t-3xl border-t border-primary-grey bg-[#1E1E20] px-5 pb-8 pt-5">
          <Text className="text-center text-lg font-bold text-white">
            {initial ? "Edit alarm" : "New alarm"}
          </Text>

          <TouchableOpacity
            accessibilityLabel={`Alarm time ${time}. Tap to change`}
            activeOpacity={0.7}
            className="items-center rounded-2xl border border-primary-grey py-4"
            onPress={() => {
              setPickingTime(true);
            }}
          >
            <Text className="text-6xl font-bold text-white">{time}</Text>
            <Text className="mt-1 text-sm text-[#D7DADC]">Tap to change</Text>
          </TouchableOpacity>

          <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-base font-bold text-white">Repeat</Text>
              <Text className="text-base text-[#D7DADC]">
                {repeatLabel(days)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              {DAY_NAMES.map((name, day) => {
                const selected = days.includes(day);
                return (
                  <TouchableOpacity
                    key={name}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={name}
                    activeOpacity={0.7}
                    onPress={() => {
                      toggleDay(day);
                    }}
                    className={`h-11 w-11 items-center justify-center rounded-full border ${
                      selected
                        ? "border-primary-green bg-primary-green"
                        : "border-[#818384]"
                    }`}
                  >
                    <Text className="text-sm font-bold text-white">
                      {name.slice(0, 2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = sameDays(days, preset.days);
                return (
                  <TouchableOpacity
                    key={preset.label}
                    activeOpacity={0.7}
                    onPress={() => {
                      setDays(preset.days);
                    }}
                    className={`rounded-full border px-3 py-1.5 ${
                      active
                        ? "border-primary-green bg-primary-green/20"
                        : "border-primary-grey"
                    }`}
                  >
                    <Text
                      className={`text-sm ${active ? "font-bold text-white" : "text-[#D7DADC]"}`}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-1 items-center rounded-xl border border-primary-grey py-4"
              onPress={onCancel}
            >
              <Text className="text-lg font-bold text-[#D7DADC]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-1 items-center rounded-xl bg-primary-green py-4"
              onPress={() => {
                onSave({ time, days: [...days].sort((a, b) => a - b) });
              }}
            >
              <Text className="text-lg font-bold text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>

      <TimePicker
        visible={pickingTime}
        initialValue={parse(time, "HH:mm", new Date())}
        onConfirm={(date) => {
          setTime(format(date, "HH:mm"));
          setPickingTime(false);
        }}
        onCancel={() => {
          setPickingTime(false);
        }}
      />
    </Modal>
  );
}
