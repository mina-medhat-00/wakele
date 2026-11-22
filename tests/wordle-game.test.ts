import { ANSWER_WORDS } from "@/constants/words";
import {
  MAX_GUESSES,
  WORD_LENGTH,
  createInitialState,
  evaluateGuess,
  isValidGuess,
  pickRandomWord,
  wordleReducer,
} from "@/utils/wordle-game";
import type { WordleAction, WordleState } from "@/types/wordle";

const VALID_WORDS = ANSWER_WORDS.map((w) => w.toUpperCase()).filter(
  (w) => w.length === WORD_LENGTH,
);

function play(state: WordleState, actions: WordleAction[]): WordleState {
  return actions.reduce(wordleReducer, state);
}

function type(word: string): WordleAction[] {
  return [
    ...word.split("").map((letter): WordleAction => ({ type: "add", letter })),
    { type: "submit" },
  ];
}

function wrongWord(target: string): string {
  const word = VALID_WORDS.find((w) => w !== target);
  if (word === undefined) {
    throw new Error("word list too small for tests");
  }
  return word;
}

describe("evaluateGuess", () => {
  it("marks an exact match all correct", () => {
    expect(evaluateGuess("CRANE", "CRANE")).toEqual(Array(5).fill("correct"));
  });

  it("marks letters that are not in the word absent", () => {
    expect(evaluateGuess("BBBBB", "CRANE")).toEqual(Array(5).fill("absent"));
  });

  it("only credits a repeated guess letter as often as it appears in the target", () => {
    expect(evaluateGuess("EERIE", "CRANE")).toEqual([
      "absent",
      "absent",
      "present",
      "absent",
      "correct",
    ]);
  });

  it("does not mark a letter present more times than the target has it", () => {
    expect(evaluateGuess("EEXXX", "XXXXE")).toEqual([
      "present",
      "absent",
      "correct",
      "correct",
      "present",
    ]);
  });

  it("prefers a correct position over an earlier present one", () => {
    expect(evaluateGuess("LOYAL", "FINAL")).toEqual([
      "absent",
      "absent",
      "absent",
      "correct",
      "correct",
    ]);
  });
});

describe("pickRandomWord", () => {
  it("always returns a guessable 5-letter word, so an alarm can always be dismissed", () => {
    for (const r of [0, 0.25, 0.5, 0.999999]) {
      const word = pickRandomWord(() => r);
      expect(word).toHaveLength(WORD_LENGTH);
      expect(isValidGuess(word)).toBe(true);
    }
  });

  it("falls back to a valid word instead of crashing on an out-of-range index", () => {
    const word = pickRandomWord(() => 1);
    expect(isValidGuess(word)).toBe(true);
  });
});

describe("wordleReducer", () => {
  const target = VALID_WORDS[0] ?? "CRANE";
  const initial = createInitialState(target);

  it("ignores letters beyond the row length", () => {
    const state = play(
      initial,
      "ABCDEF".split("").map((letter) => ({ type: "add", letter })),
    );
    expect(state.currentCol).toBe(WORD_LENGTH);
    expect(state.board[0]?.map((c) => c.char).join("")).toBe("ABCDE");
  });

  it("upper-cases input and rejects non-letters", () => {
    const state = play(initial, [
      { type: "add", letter: "a" },
      { type: "add", letter: "1" },
      { type: "add", letter: "ENTER" },
      { type: "add", letter: "" },
    ]);
    expect(state.currentCol).toBe(1);
    expect(state.board[0]?.[0]?.char).toBe("A");
  });

  it("never leaves gaps when letters arrive faster than renders", () => {
    const state = play(initial, [
      { type: "add", letter: "A" },
      { type: "add", letter: "B" },
      { type: "delete" },
      { type: "add", letter: "C" },
    ]);
    expect(state.board[0]?.map((c) => c.char).join("")).toBe("AC");
    expect(state.currentCol).toBe(2);
  });

  it("does nothing when deleting from an empty row", () => {
    expect(wordleReducer(initial, { type: "delete" })).toBe(initial);
  });

  it("does not submit an incomplete row", () => {
    const state = play(initial, [
      { type: "add", letter: "A" },
      { type: "submit" },
    ]);
    expect(state.currentRow).toBe(0);
    expect(state.invalidCount).toBe(0);
  });

  it("rejects words that are not in the list without using up a guess", () => {
    const state = play(initial, type("ZZZZZ"));
    expect(state.currentRow).toBe(0);
    expect(state.invalidRow).toBe(0);
    expect(state.invalidCount).toBe(1);
    const again = wordleReducer(state, { type: "submit" });
    expect(again.invalidCount).toBe(2);
  });

  it("moves to the next row after a valid wrong guess", () => {
    const state = play(initial, type(wrongWord(target)));
    expect(state.currentRow).toBe(1);
    expect(state.currentCol).toBe(0);
    expect(state.gameStatus).toBe("playing");
  });

  it("wins on the target word and ignores further input", () => {
    const won = play(initial, type(target));
    expect(won.gameStatus).toBe("won");
    expect(won.board[0]?.every((c) => c.state === "correct")).toBe(true);
    const after = play(won, [{ type: "add", letter: "A" }, { type: "submit" }]);
    expect(after).toBe(won);
  });

  it("loses after the last guess", () => {
    const wrong = wrongWord(target);
    const lost = play(
      initial,
      Array.from({ length: MAX_GUESSES }, () => type(wrong)).flat(),
    );
    expect(lost.gameStatus).toBe("lost");
  });

  it("can still win on the last guess", () => {
    const wrong = wrongWord(target);
    const state = play(initial, [
      ...Array.from({ length: MAX_GUESSES - 1 }, () => type(wrong)).flat(),
      ...type(target),
    ]);
    expect(state.gameStatus).toBe("won");
  });

  it("keeps the best known state for each keyboard letter", () => {
    const state = play(initial, [...type(wrongWord(target)), ...type(target)]);
    for (const letter of target) {
      expect(state.letterStates[letter]).toBe("correct");
    }
  });

  it("resets to a fresh game with the new word", () => {
    const lost = play(initial, type(wrongWord(target)));
    const reset = wordleReducer(lost, { type: "reset", targetWord: "AWAKE" });
    expect(reset).toEqual(createInitialState("AWAKE"));
  });
});
