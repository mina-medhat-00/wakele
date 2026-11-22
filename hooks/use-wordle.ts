import { useCallback, useState } from "react";
import { ANSWER_WORDS } from "@/constants/words";

export type LetterState = "correct" | "present" | "absent" | "tbd" | "empty";
export type GameStatus = "playing" | "won" | "lost";

export interface CellData {
  char: string;
  state: LetterState;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const REVIEW_WORDS = [
  "Genius",
  "Magnificent",
  "Impressive",
  "Splendid",
  "Great",
  "Phew",
];
const STATE_PRIORITY: Record<LetterState, number> = {
  correct: 3,
  present: 2,
  absent: 1,
  tbd: 0,
  empty: 0,
};

function pickRandomWord(): string {
  const filtered = ANSWER_WORDS.filter((w) => w.length === WORD_LENGTH);
  return filtered[Math.floor(Math.random() * filtered.length)].toUpperCase();
}

function createEmptyBoard(): CellData[][] {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({
      char: "",
      state: "empty" as LetterState,
    })),
  );
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");

  // First pass: mark correct positions
  guessChars.forEach((char, i) => {
    if (char === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = "#";
      guessChars[i] = "*";
    }
  });

  // Second pass: mark present letters
  guessChars.forEach((char, i) => {
    if (char === "*") return;
    const idx = targetChars.indexOf(char);
    if (idx !== -1) {
      result[i] = "present";
      targetChars[idx] = "#";
    }
  });

  return result;
}

export function useWordle() {
  const [targetWord, setTargetWord] = useState<string>(pickRandomWord);
  const [board, setBoard] = useState<CellData[][]>(createEmptyBoard);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [review, setReview] = useState<string>("");
  const [invalidRow, setInvalidRow] = useState<number | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>(
    {},
  );

  const addLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== "playing") return;
      if (currentCol >= WORD_LENGTH) return;

      setBoard((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        next[currentRow][currentCol] = { char: letter, state: "tbd" };
        return next;
      });
      setCurrentCol((prev) => prev + 1);
    },
    [currentRow, currentCol, gameStatus],
  );

  const deleteLetter = useCallback(() => {
    if (gameStatus !== "playing") return;
    if (currentCol <= 0) return;

    setBoard((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[currentRow][currentCol - 1] = { char: "", state: "empty" };
      return next;
    });
    setCurrentCol((prev) => prev - 1);
  }, [currentRow, currentCol, gameStatus]);

  const submitGuess = useCallback(() => {
    if (gameStatus !== "playing") return;
    if (currentCol < WORD_LENGTH) return;

    const guess = board[currentRow].map((c) => c.char).join("");

    const allValidWords = ANSWER_WORDS.map((w) => w.toUpperCase());

    if (!allValidWords.includes(guess)) {
      setInvalidRow(currentRow);
      setIsInvalid(true);
      setTimeout(() => setInvalidRow(null), 3000);
      setTimeout(() => setIsInvalid(false), 3000);
      return;
    }

    const states = evaluateGuess(guess, targetWord);

    setBoard((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      states.forEach((state, i) => {
        next[currentRow][i] = { char: guess[i], state };
      });
      return next;
    });

    setLetterStates((prev) => {
      const next = { ...prev };
      states.forEach((state, i) => {
        const letter = guess[i];
        if (
          !next[letter] ||
          STATE_PRIORITY[state] > STATE_PRIORITY[next[letter]]
        ) {
          next[letter] = state;
        }
      });
      return next;
    });

    if (guess === targetWord) {
      setReview(REVIEW_WORDS[currentRow]);
      setTimeout(() => setReview(""), 3000);
      setGameStatus("won");
    } else if (currentRow + 1 >= MAX_GUESSES) {
      setGameStatus("lost");
    } else {
      setCurrentRow((prev) => prev + 1);
      setCurrentCol(0);
    }
  }, [board, currentRow, currentCol, gameStatus, targetWord]);

  const resetGame = useCallback(() => {
    setTargetWord(pickRandomWord());
    setBoard(createEmptyBoard());
    setCurrentRow(0);
    setCurrentCol(0);
    setGameStatus("playing");
    setLetterStates({});
    setInvalidRow(null);
  }, []);

  return {
    board,
    currentRow,
    letterStates,
    gameStatus,
    targetWord,
    invalidRow,
    isInvalid,
    addLetter,
    deleteLetter,
    submitGuess,
    resetGame,
    review,
  };
}
