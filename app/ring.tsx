import "@/global.css";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { format } from "date-fns";
import Board from "@/components/wordle/board";
import Keyboard from "@/components/wordle/keyboard";
import { useWordle } from "@/hooks/use-wordle";
import { getAlarms, updateAlarms } from "@/utils/alarm-storage";
import { ringScreenUrl } from "@/utils/alarm-scheduler";
import AlarmRinger from "@/modules/alarm-ringer";
import { COLORS } from "@/constants/colors";
import type { Alarm, RingScreenParams } from "@/types/alarm";
import ALARM_SOUND from "@/assets/sounds/alarm.wav";

/** One-time alarms switch off once solved; weekly ones stay scheduled. */
async function finishAlarm(alarmId: string | undefined): Promise<void> {
  if (alarmId === undefined) {
    return;
  }
  await updateAlarms((alarms) =>
    alarms.map((alarm) =>
      alarm.id === alarmId && alarm.days.length === 0
        ? { ...alarm, enabled: false, notificationIds: [] }
        : alarm,
    ),
  );
}

function leave(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

export default function RingScreen(): React.JSX.Element {
  const { alarmId } = useLocalSearchParams<RingScreenParams>();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const {
    board,
    letterStates,
    gameStatus,
    targetWord,
    invalidRow,
    invalidCount,
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
    if (AlarmRinger !== null) {
      // Android: the native foreground service owns the looping sound, so it keeps
      // ringing even if the app is backgrounded or closed.
      if (solved) {
        AlarmRinger.stopRinging();
      } else if (AlarmRinger.getRingingAlarmId() === null) {
        // Opened directly (not by a firing alarm): ring so it can't be skipped.
        AlarmRinger.startRinging(
          alarmId ?? "",
          "Alarm",
          ringScreenUrl(alarmId ?? ""),
        );
      }
      return;
    }

    if (solved) {
      return;
    }
    const player = createAudioPlayer(ALARM_SOUND);
    player.loop = true;
    player.volume = 1;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).finally(() => {
      player.play();
    });

    return () => {
      player.remove();
    };
  }, [solved, alarmId]);

  // Record the dismissal as soon as it's solved, even if "Dismiss" is never tapped.
  useEffect(() => {
    if (solved) {
      void finishAlarm(alarmId);
    }
  }, [solved, alarmId]);

  useEffect(() => {
    void getAlarms().then((alarms) => {
      setAlarm(alarms.find((a) => a.id === alarmId) ?? null);
    });
  }, [alarmId]);

  // The back button can't be used to escape the alarm; once solved it leaves normally.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (solved) {
        leave();
      }
      return true;
    });
    return () => {
      sub.remove();
    };
  }, [solved]);

  const handleKey = useCallback(
    (key: string): void => {
      if (key === "ENTER") {
        submitGuess();
      } else if (key === "DELETE") {
        deleteLetter();
      } else {
        addLetter(key);
      }
    },
    [submitGuess, deleteLetter, addLetter],
  );

  const toast = isInvalid ? "Not in word list" : review;

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top", "bottom"]}>
      <View className="items-center px-5 pt-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="alarm" size={22} color={COLORS.green} />
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
        <Board board={board} invalidRow={invalidRow} shakeKey={invalidCount} />

        {gameStatus === "lost" ? (
          <View className="w-full items-center gap-2">
            <Text className="text-base text-[#D7DADC]">
              {"The word was "}
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
        ) : null}

        {solved ? (
          <TouchableOpacity
            className="w-2/3 flex-row items-center justify-center gap-2 rounded-md bg-primary-green py-3"
            onPress={leave}
          >
            <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
            <Text className="text-lg font-bold text-white">Dismiss alarm</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {toast === "" ? null : (
        <View className="absolute top-40 self-center rounded-md bg-white p-2">
          <Text className="text-center text-lg font-bold text-black">
            {toast}
          </Text>
        </View>
      )}

      {solved ? null : (
        <Keyboard letterStates={letterStates} onKey={handleKey} />
      )}
    </SafeAreaView>
  );
}
