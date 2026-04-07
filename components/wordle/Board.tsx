import { type CellData } from "@/hooks/useWordle";
import { StyleSheet, Text, View } from "react-native";

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

const Cell = ({ cell, shake }: CellProps) => {
  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: CELL_COLORS[cell.state],
          borderColor: BORDER_COLORS[cell.state],
        },
        shake && styles.shake,
      ]}
    >
      <Text style={styles.cellText}>{cell.char}</Text>
    </View>
  );
};

interface BoardProps {
  board: CellData[][];
  invalidRow: number | null;
}

export default function Board({ board, invalidRow }: BoardProps) {
  return (
    <View style={styles.board}>
      {board.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((cell, colIdx) => (
            <Cell key={colIdx} cell={cell} shake={invalidRow === rowIdx} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  cell: {
    width: 56,
    height: 56,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  shake: {
    borderColor: "#ff4444",
  },
});
