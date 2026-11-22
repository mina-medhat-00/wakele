import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { type LetterState } from "@/hooks/useWordle";

const KEY_COLORS: Record<LetterState, string> = {
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#3a3a3c",
  tbd: "#818384",
  empty: "#818384",
};

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

interface KeyProps {
  label: string;
  state: LetterState;
  onPress: () => void;
}

interface KeyboardProps {
  letterStates: Record<string, LetterState>;
  onKey: (key: string) => void;
}

const Key = ({ label, state, onPress }: KeyProps) => {
  const isWide = label === "ENTER" || label === "DELETE";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[{ backgroundColor: KEY_COLORS[state] }]}
      className={`${isWide ? "w-14" : "w-10"} h-14 rounded-md items-center justify-center`}
    >
      {label === "DELETE" ? (
        <Ionicons name="backspace-outline" size={24} color="white" />
      ) : (
        <Text
          className={`text-white font-bold ${isWide ? "text-sm" : "text-xl"}`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function Keyboard({ letterStates, onKey }: KeyboardProps) {
  return (
    <View className="w-full flex-col gap-2 p-3">
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row justify-center gap-1">
          {row.map((label) => (
            <Key
              key={label}
              label={label}
              state={letterStates[label] ?? "empty"}
              onPress={() => onKey(label)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
