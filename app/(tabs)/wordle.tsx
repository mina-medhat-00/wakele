import "@/global.css";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Board from "@/components/wordle/Board";
import Keyboard from "@/components/wordle/Keyboard";
import { useWordle } from "@/hooks/useWordle";

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
    else if (key === "DELETE") deleteLetter();
    else addLetter(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top"]}>
      <View className="flex-1 justify-space-between items-center">
        {/* Board */}
        <View className="flex-1 justify-center items-center w-full">
          <Board board={board} invalidRow={invalidRow} />

          {/* Game status banner */}
          {gameStatus !== "playing" && (
            <View className="mt-4 gap-2 w-full items-center justify-center">
              <View className="bg-white p-2 rounded-md items-center justify-center">
                <Text className="text-black text-lg font-bold">
                  {targetWord}
                </Text>
              </View>

              <TouchableOpacity
                className="bg-primary-green py-2 w-1/2 rounded-md"
                onPress={resetGame}
              >
                <Text className="text-white text-lg font-bold text-center">
                  RETRY
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Keyboard */}
        <Keyboard letterStates={letterStates} onKey={handleKey} />
      </View>
    </SafeAreaView>
  );
}
