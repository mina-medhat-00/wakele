import { type LetterState } from "@/hooks/useWordle";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

interface KeyProps {
  label: string;
  state: LetterState;
  onPress: () => void;
}

const Key = ({ label, state, onPress }: KeyProps) => {
  const isWide = label === "ENTER" || label === "⌫";
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.key,
        { backgroundColor: KEY_COLORS[state] },
        isWide && styles.keyWide,
      ]}
    >
      <Text style={[styles.keyText, isWide && styles.keyTextWide]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface KeyboardProps {
  letterStates: Record<string, LetterState>;
  onKey: (key: string) => void;
}

export default function Keyboard({ letterStates, onKey }: KeyboardProps) {
  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
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

const styles = StyleSheet.create({
  keyboard: {
    flexDirection: "column",
    gap: 6,
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  key: {
    height: 56,
    width: 34,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  keyWide: {
    width: 52,
  },
  keyText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  keyTextWide: {
    fontSize: 12,
  },
});
