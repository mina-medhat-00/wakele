import { useCallback, useEffect, useReducer, useState } from "react";
import type { UseWordle } from "@/types/wordle";
import {
  REVIEW_WORDS,
  createInitialState,
  pickRandomWord,
  wordleReducer,
} from "@/utils/wordle-game";

const TOAST_MS = 3000;

export function useWordle(): UseWordle {
  const [state, dispatch] = useReducer(wordleReducer, undefined, () =>
    createInitialState(pickRandomWord()),
  );
  const [reviewHidden, setReviewHidden] = useState(false);

  // Feedback for a rejected guess, restarts on every rejection and clears on unmount
  useEffect(() => {
    if (state.invalidCount === 0) {
      return;
    }
    const timer = setTimeout(() => {
      dispatch({ type: "clearInvalid" });
    }, TOAST_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [state.invalidCount]);

  // The review toast ("Genius", "Great") shows for a few seconds after a win
  useEffect(() => {
    if (state.gameStatus !== "won") {
      return;
    }
    const timer = setTimeout(() => {
      setReviewHidden(true);
    }, TOAST_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [state.gameStatus]);
  const review =
    state.gameStatus === "won" && !reviewHidden
      ? (REVIEW_WORDS[state.currentRow] ?? "Phew")
      : "";

  const addLetter = useCallback((letter: string) => {
    dispatch({ type: "add", letter });
  }, []);
  const deleteLetter = useCallback(() => {
    dispatch({ type: "delete" });
  }, []);
  const submitGuess = useCallback(() => {
    dispatch({ type: "submit" });
  }, []);
  const resetGame = useCallback(() => {
    setReviewHidden(false);
    dispatch({ type: "reset", targetWord: pickRandomWord() });
  }, []);

  return {
    board: state.board,
    currentRow: state.currentRow,
    letterStates: state.letterStates,
    gameStatus: state.gameStatus,
    targetWord: state.targetWord,
    invalidRow: state.invalidRow,
    invalidCount: state.invalidCount,
    isInvalid: state.invalidRow !== null,
    review,
    addLetter,
    deleteLetter,
    submitGuess,
    resetGame,
  };
}
