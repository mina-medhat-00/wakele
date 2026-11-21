import "@/global.css";
import { useEffect, useState } from "react";
import { BackHandler, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { format } from "date-fns";
import Board from "@/components/wordle/Board";
import Keyboard from "@/components/wordle/Keyboard";
import { useWordle } from "@/hooks/useWordle";
import { getAlarms, saveAlarm } from "@/utils/alarmStorage";
import { Alarm } from "@/types/types";
import ALARM_SOUND from "@/assets/sounds/alarm.wav";

export default function RingScreen() {
  const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const {
    board,
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
  } = useWordle();

  const solved = gameStatus === "won";

  // Loop the alarm until the word is solved.
  useEffect(() => {
    if (solved) return;

    const player = createAudioPlayer(ALARM_SOUND);
    player.loop = true;
    player.volume = 1;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).finally(() => player.play());

    return () => player.remove();
  }, [solved]);

  useEffect(() => {
    getAlarms().then((alarms) =>
      setAlarm(alarms.find((a) => a.id === alarmId) ?? null),
    );
  }, [alarmId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => !solved,
    );
    return () => sub.remove();
  }, [solved]);

  const handleKey = (key: string) => {
    if (key === "ENTER") submitGuess();
    else if (key === "DELETE") deleteLetter();
    else addLetter(key);
  };

  const dismiss = async () => {
    if (alarm && alarm.days.length === 0) {
      await saveAlarm({ ...alarm, enabled: false, notificationId: null });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top", "bottom"]}>
      <View className="items-center px-5 pt-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="alarm" size={22} color="#538D4E" />
          <Text className="text-base font-bold uppercase tracking-widest text-[#D7DADC]">
            {alarm?.label ?? "Alarm"}
          </Text>
        </View>
        <Text className="text-5xl font-bold text-white">
          {alarm?.time ?? format(new Date(), "HH:mm")}
        </Text>
        <Text className="mt-1 text-base text-[#D7DADC]">
          {solved ? "Nice. You're awake." : "Guess the word to stop the alarm"}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center gap-4">
        <Board board={board} invalidRow={invalidRow} />

        {gameStatus === "lost" && (
          <View className="w-full items-center gap-2">
            <Text className="text-base text-[#D7DADC]">
              The word was{" "}
              <Text className="font-bold text-white">{targetWord}</Text>
            </Text>
            <TouchableOpacity
              className="w-1/2 rounded-md bg-primary-yellow py-3"
              onPress={resetGame}
            >
              <Text className="text-center text-lg font-bold text-white">
                Try a new word
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {solved && (
          <TouchableOpacity
            className="w-2/3 flex-row items-center justify-center gap-2 rounded-md bg-primary-green py-3"
            onPress={dismiss}
          >
            <Ionicons name="checkmark-circle" size={22} color="white" />
            <Text className="text-lg font-bold text-white">Dismiss alarm</Text>
          </TouchableOpacity>
        )}
      </View>

      {(isInvalid || review) && (
        <View className="absolute top-40 self-center rounded-md bg-white p-2">
          <Text className="text-center text-lg font-bold text-black">
            {isInvalid ? "Not in word list" : review}
          </Text>
        </View>
      )}

      {!solved && <Keyboard letterStates={letterStates} onKey={handleKey} />}
    </SafeAreaView>
  );
}
