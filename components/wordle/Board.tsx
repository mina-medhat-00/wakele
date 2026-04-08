import { Text, View } from "react-native";
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
  return (
    <View
      style={[
        {
          borderColor: BORDER_COLORS[cell.state],
          backgroundColor: CELL_COLORS[cell.state],
        },
        shake && { borderColor: "#ff4444" },
      ]}
      className={`w-16 h-16 border-2 items-center justify-center`}
    >
      <Text className="text-white text-3xl font-bold">{cell.char}</Text>
    </View>
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
