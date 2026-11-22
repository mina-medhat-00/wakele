import { ANSWER_WORDS } from "@/constants/words";
import type {
  CellData,
  GameStatus,
  LetterState,
  WordleAction,
  WordleState,
} from "@/types/wordle";

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const REVIEW_WORDS = [
  "Genius",
  "Magnificent",
  "Impressive",
  "Splendid",
  "Great",
  "Phew",
];

const FALLBACK_WORD = "AWAKE";

const STATE_PRIORITY: Record<LetterState, number> = {
  correct: 3,
  present: 2,
  absent: 1,
  tbd: 0,
  empty: 0,
};

const ANSWERS = ANSWER_WORDS.map((word) => word.toUpperCase()).filter(
  (word) => word.length === WORD_LENGTH && /^[A-Z]+$/.test(word),
);
const VALID_GUESSES = new Set([...ANSWERS, FALLBACK_WORD]);

/** A random answer. Never throws, so the alarm can always be dismissed. */
export function pickRandomWord(random: () => number = Math.random): string {
  return ANSWERS[Math.floor(random() * ANSWERS.length)] ?? FALLBACK_WORD;
}

export function isValidGuess(guess: string): boolean {
  return VALID_GUESSES.has(guess);
}

function createEmptyBoard(): CellData[][] {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, (): CellData => ({
      char: "",
      state: "empty",
    })),
  );
}

export function createInitialState(targetWord: string): WordleState {
  return {
    targetWord,
    board: createEmptyBoard(),
    currentRow: 0,
    currentCol: 0,
    gameStatus: "playing",
    letterStates: {},
    invalidRow: null,
    invalidCount: 0,
  };
}

/** Standard Wordle scoring, handling repeated letters correctly. */
export function evaluateGuess(guess: string, target: string): LetterState[] {
  const result = Array.from(
    { length: WORD_LENGTH },
    (): LetterState => "absent",
  );
  const remaining = target.split("");
  const guessChars = guess.split("");

  guessChars.forEach((char, i) => {
    if (char === remaining[i]) {
      result[i] = "correct";
      remaining[i] = "#";
      guessChars[i] = "*";
    }
  });

  guessChars.forEach((char, i) => {
    if (char === "*") {
      return;
    }
    const idx = remaining.indexOf(char);
    if (idx !== -1) {
      result[i] = "present";
      remaining[idx] = "#";
    }
  });

  return result;
}

function setCell(
  board: CellData[][],
  row: number,
  col: number,
  cell: CellData,
): CellData[][] {
  return board.map((cells, r) =>
    r === row ? cells.map((c, i) => (i === col ? cell : c)) : cells,
  );
}

export function wordleReducer(
  state: WordleState,
  action: WordleAction,
): WordleState {
  switch (action.type) {
    case "add": {
      const letter = action.letter.toUpperCase();
      if (
        state.gameStatus !== "playing" ||
        state.currentCol >= WORD_LENGTH ||
        !/^[A-Z]$/.test(letter)
      ) {
        return state;
      }
      return {
        ...state,
        board: setCell(state.board, state.currentRow, state.currentCol, {
          char: letter,
          state: "tbd",
        }),
        currentCol: state.currentCol + 1,
      };
    }

    case "delete": {
      if (state.gameStatus !== "playing" || state.currentCol <= 0) {
        return state;
      }
      return {
        ...state,
        board: setCell(state.board, state.currentRow, state.currentCol - 1, {
          char: "",
          state: "empty",
        }),
        currentCol: state.currentCol - 1,
      };
    }

    case "submit": {
      if (state.gameStatus !== "playing" || state.currentCol < WORD_LENGTH) {
        return state;
      }
      const row = state.board[state.currentRow] ?? [];
      const guess = row.map((cell) => cell.char).join("");
      if (!isValidGuess(guess)) {
        return {
          ...state,
          invalidRow: state.currentRow,
          invalidCount: state.invalidCount + 1,
        };
      }

      const states = evaluateGuess(guess, state.targetWord);
      const board = state.board.map((cells, r) =>
        r === state.currentRow
          ? cells.map((cell, i) => ({ ...cell, state: states[i] ?? "absent" }))
          : cells,
      );
      const letterStates = { ...state.letterStates };
      states.forEach((letterState, i) => {
        const letter = guess[i];
        if (letter === undefined) {
          return;
        }
        const previous = letterStates[letter];
        if (
          previous === undefined ||
          STATE_PRIORITY[letterState] > STATE_PRIORITY[previous]
        ) {
          letterStates[letter] = letterState;
        }
      });

      const won = guess === state.targetWord;
      const lastRow = state.currentRow + 1 >= MAX_GUESSES;
      let gameStatus: GameStatus = "playing";
      if (won) {
        gameStatus = "won";
      } else if (lastRow) {
        gameStatus = "lost";
      }
      return {
        ...state,
        board,
        letterStates,
        invalidRow: null,
        gameStatus,
        currentRow: won || lastRow ? state.currentRow : state.currentRow + 1,
        currentCol: won || lastRow ? state.currentCol : 0,
      };
    }

    case "clearInvalid":
      return { ...state, invalidRow: null };

    case "reset":
      return createInitialState(action.targetWord);
  }
}
