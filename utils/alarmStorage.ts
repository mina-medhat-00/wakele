import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alarm } from "@/types/types";

const ALARMS_KEY = "wakele_alarms";

export async function getAlarms(): Promise<Alarm[]> {
  const raw = await AsyncStorage.getItem(ALARMS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAlarm(alarm: Alarm): Promise<void> {
  const alarms = await getAlarms();
  const index = alarms.findIndex((a) => a.id === alarm.id);

  index >= 0 ? (alarms[index] = alarm) : alarms.push(alarm);

  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}

export async function deleteAlarm(id: string): Promise<void> {
  const alarms = await getAlarms();

  await AsyncStorage.setItem(
    ALARMS_KEY,
    JSON.stringify(alarms.filter((a) => a.id !== id)),
  );
}
