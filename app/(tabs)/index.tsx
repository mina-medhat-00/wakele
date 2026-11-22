import "@/global.css";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import {
  removeAlarm,
  requestPermissions,
  saveAndSchedule,
  setAlarmEnabled,
  syncAlarms,
} from "@/utils/alarm-scheduler";
import { repeatLabel } from "@/utils/days";
import { COLORS } from "@/constants/colors";
import type {
  Alarm,
  AlarmCardProps,
  AlarmDraft,
  AlarmEditorState,
} from "@/types/alarm";
import AlarmEditor from "@/components/clock/alarm-editor";

function AlarmCard({
  alarm,
  onEdit,
  onToggle,
  onDelete,
}: AlarmCardProps): React.JSX.Element {
  const repeat = repeatLabel(alarm.days);
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-primary-grey bg-[#1E1E20] px-5 py-4">
      <TouchableOpacity
        accessibilityLabel={`Edit ${alarm.time} alarm, ${repeat}`}
        activeOpacity={0.7}
        className="flex-1"
        onPress={onEdit}
      >
        <Text
          className={`text-5xl font-bold ${alarm.enabled ? "text-white" : "text-[#A1A1A6]"}`}
        >
          {alarm.time}
        </Text>
        <Text className="mt-1 text-base text-[#D7DADC]">
          {`${alarm.label} · ${repeat}`}
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          accessibilityLabel={`Delete ${alarm.time} alarm`}
          hitSlop={10}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Switch
          accessibilityLabel={`Turn ${alarm.time} alarm ${alarm.enabled ? "off" : "on"}`}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.greyMid, true: COLORS.green }}
          thumbColor={COLORS.white}
        />
      </View>
    </View>
  );
}

/**
 * Asks for notification permission. Without it Android still rings (the native ringer
 * doesn't need it) but can't show the lock-screen alarm, while iOS can't ring at all.
 * Returns whether the alarm can be scheduled.
 */
async function ensureCanRing(): Promise<boolean> {
  if (await requestPermissions()) {
    return true;
  }
  const canRingAnyway = Platform.OS === "android";
  Alert.alert(
    "Notifications are off",
    canRingAnyway
      ? "The alarm will still ring, but it can't show on the lock screen. Turn on notifications for wakele to open the puzzle straight from the alarm."
      : "Alarms can't ring without notifications. Turn them on for wakele in Settings.",
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Open settings",
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ],
  );
  return canRingAnyway;
}

export default function AlarmScreen(): React.JSX.Element {
  const [editor, setEditor] = useState<AlarmEditorState>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const refresh = useCallback(async () => {
    setAlarms(await syncAlarms());
  }, []);

  // Re-sync on focus and when returning to the app, so alarms that rang (or were
  // dismissed) while we weren't looking show their real state.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
      }
    });
    return () => {
      sub.remove();
    };
  }, [refresh]);

  const toggleAlarm = async (alarm: Alarm): Promise<void> => {
    if (!alarm.enabled && !(await ensureCanRing())) {
      return;
    }
    setAlarms(await setAlarmEnabled(alarm, !alarm.enabled));
  };

  const deleteAlarm = async (alarm: Alarm): Promise<void> => {
    setAlarms(await removeAlarm(alarm));
  };

  const handleSave = async (draft: AlarmDraft): Promise<void> => {
    const existing = editor?.mode === "edit" ? editor.alarm : null;
    setEditor(null);
    if (!(await ensureCanRing())) {
      return;
    }
    setAlarms(await saveAndSchedule(existing, draft));
  };

  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <SafeAreaView className="flex-1 bg-primary-black" edges={["top"]}>
      <View className="px-5 pb-4 pt-6">
        <Text className="text-4xl font-bold text-white">Alarms</Text>
      </View>

      {sortedAlarms.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Ionicons name="alarm-outline" size={64} color={COLORS.greyKey} />
          <Text className="text-xl font-bold text-white">No alarms yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-5 pb-4">
          {sortedAlarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onEdit={() => {
                setEditor({ mode: "edit", alarm });
              }}
              onToggle={() => {
                void toggleAlarm(alarm);
              }}
              onDelete={() => {
                void deleteAlarm(alarm);
              }}
            />
          ))}
        </ScrollView>
      )}

      <View className="px-5 pb-5 pt-2">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary-green py-4"
          onPress={() => {
            setEditor({ mode: "new" });
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text className="text-lg font-bold text-white">Add alarm</Text>
        </TouchableOpacity>
      </View>

      {editor !== null && (
        <AlarmEditor
          initial={editor.mode === "edit" ? editor.alarm : null}
          onSave={(draft) => {
            void handleSave(draft);
          }}
          onCancel={() => {
            setEditor(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
