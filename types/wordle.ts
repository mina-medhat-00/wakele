export type LetterState = "correct" | "present" | "absent" | "tbd" | "empty";
export type GameStatus = "playing" | "won" | "lost";

export interface CellData {
  char: string;
  state: LetterState;
}

export interface CellProps {
  cell: CellData;
  shake: boolean;
  shakeKey: number;
}

export interface BoardProps {
  board: CellData[][];
  invalidRow: number | null;
  shakeKey: number;
}

export interface KeyProps {
  label: string;
  state: LetterState;
  onPress: () => void;
}

export interface KeyboardProps {
  letterStates: Partial<Record<string, LetterState>>;
  onKey: (key: string) => void;
}

export interface WordleState {
  targetWord: string;
  board: CellData[][];
  currentRow: number;
  currentCol: number;
  gameStatus: GameStatus;
  letterStates: Partial<Record<string, LetterState>>;
  invalidRow: number | null;
  invalidCount: number;
}

export type WordleAction =
  | { type: "add"; letter: string }
  | { type: "delete" }
  | { type: "submit" }
  | { type: "clearInvalid" }
  | { type: "reset"; targetWord: string };

/** Public API of the useWordle hook. */
export interface UseWordle {
  board: CellData[][];
  currentRow: number;
  letterStates: Partial<Record<string, LetterState>>;
  gameStatus: GameStatus;
  targetWord: string;
  invalidRow: number | null;
  invalidCount: number;
  isInvalid: boolean;
  review: string;
  addLetter: (letter: string) => void;
  deleteLetter: () => void;
  submitGuess: () => void;
  resetGame: () => void;
}
