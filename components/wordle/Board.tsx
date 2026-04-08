import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  useSharedValue,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { type CellData } from "@/hooks/useWordle";

const CELL_COLORS: Record<string, string> = {
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#3a3a3c",
  tbd: "transparent",
  empty: "transparent",
};

const BORDER_COLORS: Record<string, string> = {
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#3a3a3c",
  tbd: "#565758",
  empty: "#3a3a3c",
};

interface CellProps {
  cell: CellData;
  shake: boolean;
}

interface BoardProps {
  board: CellData[][];
  invalidRow: number | null;
}

const Cell = ({ cell, shake }: CellProps) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shake) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [shake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          borderColor: BORDER_COLORS[cell.state],
          backgroundColor: CELL_COLORS[cell.state],
        },
        animatedStyle,
      ]}
      className="w-16 h-16 border-2 items-center justify-center"
    >
      <Text className="text-white text-3xl font-bold">{cell.char}</Text>
    </Animated.View>
  );
};

export default function Board({ board, invalidRow }: BoardProps) {
  return (
    <View className="gap-2 items-center justify-center">
      {board.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row gap-2">
          {row.map((cell, colIdx) => (
            <Cell key={colIdx} cell={cell} shake={invalidRow === rowIdx} />
          ))}
        </View>
      ))}
    </View>
  );
}
