import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "@/constants/colors";
import type { KeyboardProps, KeyProps, LetterState } from "@/types/wordle";

const KEY_COLORS: Record<LetterState, string> = {
  correct: COLORS.green,
  present: COLORS.yellow,
  absent: COLORS.grey,
  tbd: COLORS.greyKey,
  empty: COLORS.greyKey,
};

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

function Key({ label, state, onPress }: KeyProps): React.JSX.Element {
  const isWide = label === "ENTER" || label === "DELETE";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ backgroundColor: KEY_COLORS[state] }}
      className={`${isWide ? "w-14" : "w-10"} h-14 rounded-md items-center justify-center`}
    >
      {label === "DELETE" ? (
        <Ionicons name="backspace-outline" size={24} color={COLORS.white} />
      ) : (
        <Text
          className={`text-white font-bold ${isWide ? "text-sm" : "text-xl"}`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function Keyboard({
  letterStates,
  onKey,
}: KeyboardProps): React.JSX.Element {
  return (
    <View className="w-full flex-col gap-2 p-3">
      {ROWS.map((row) => (
        <View key={row.join("")} className="flex-row justify-center gap-1">
          {row.map((label) => (
            <Key
              key={label}
              label={label}
              state={letterStates[label] ?? "empty"}
              onPress={() => {
                onKey(label);
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
