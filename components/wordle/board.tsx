import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { MAX_GUESSES, WORD_LENGTH } from "@/utils/wordle-game";
import type { BoardProps, CellProps, LetterState } from "@/types/wordle";

const CELL_COLORS: Record<LetterState, string> = {
  correct: COLORS.green,
  present: COLORS.yellow,
  absent: COLORS.grey,
  tbd: COLORS.transparent,
  empty: COLORS.transparent,
};

const BORDER_COLORS: Record<LetterState, string> = {
  correct: COLORS.green,
  present: COLORS.yellow,
  absent: COLORS.grey,
  tbd: COLORS.greyMid,
  empty: COLORS.grey,
};

// Rows and columns are fixed positions on the board, so they get fixed keys.
const ROW_KEYS = Array.from(
  { length: MAX_GUESSES },
  (_, i) => `row-${String(i)}`,
);
const COL_KEYS = Array.from(
  { length: WORD_LENGTH },
  (_, i) => `col-${String(i)}`,
);

function Cell({ cell, shake, shakeKey }: CellProps): React.JSX.Element {
  const translateX = useSharedValue(0);

  // `shakeKey` changes on every rejected guess, so repeated rejections shake again.
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
  }, [shake, shakeKey, translateX]);

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
      className="h-16 w-16 items-center justify-center border-2"
    >
      <Text className="text-3xl font-bold text-white">{cell.char}</Text>
    </Animated.View>
  );
}

export default function Board({
  board,
  invalidRow,
  shakeKey,
}: BoardProps): React.JSX.Element {
  return (
    <View className="items-center justify-center gap-2">
      {ROW_KEYS.map((rowKey, rowIdx) => (
        <View key={rowKey} className="flex-row gap-2">
          {COL_KEYS.map((colKey, colIdx) => (
            <Cell
              key={colKey}
              cell={board[rowIdx]?.[colIdx] ?? { char: "", state: "empty" }}
              shake={invalidRow === rowIdx}
              shakeKey={shakeKey}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
