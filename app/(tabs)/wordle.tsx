import Board from "@/components/wordle/Board";
import Keyboard from "@/components/wordle/Keyboard";
import { useWordle } from "@/hooks/useWordle";
import "@/global.css";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WordleScreen() {
  const {
    board,
    letterStates,
    gameStatus,
    targetWord,
    invalidRow,
    addLetter,
    deleteLetter,
    submitGuess,
    resetGame,
  } = useWordle();

  const handleKey = (key: string) => {
    if (key === "ENTER") submitGuess();
    else if (key === "⌫") deleteLetter();
    else addLetter(key);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>WORDLE</Text>
        </View>

        {/* Game status banner */}
        {gameStatus === "won" && (
          <View style={styles.banner}>
            <Text style={styles.bannerTextWon}>
              Genius! The word was {targetWord}
            </Text>
            <TouchableOpacity onPress={resetGame} style={styles.playAgainBtn}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
        {gameStatus === "lost" && (
          <View style={styles.banner}>
            <Text style={styles.bannerTextLost}>The word was {targetWord}</Text>
            <TouchableOpacity onPress={resetGame} style={styles.playAgainBtn}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Board */}
        <View style={styles.boardWrapper}>
          <Board board={board} invalidRow={invalidRow} />
        </View>

        {/* Keyboard */}
        <Keyboard letterStates={letterStates} onKey={handleKey} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#121213",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3c",
    paddingVertical: 12,
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 6,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  bannerTextWon: {
    color: "#538d4e",
    fontSize: 18,
    fontWeight: "bold",
  },
  bannerTextLost: {
    color: "#b59f3b",
    fontSize: 18,
    fontWeight: "bold",
  },
  playAgainBtn: {
    backgroundColor: "#538d4e",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playAgainText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
