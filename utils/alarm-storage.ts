import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Alarm, StoredAlarm } from "@/types/alarm";

const ALARMS_KEY = "wakele_alarms";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Every alarm operation (save, toggle, delete, sync, dismiss) runs through this queue,
 * one at a time. Without it a sync that read the list before a save finished could
 * cancel the newly scheduled native alarm as an "orphan".
 */
let queue: Promise<unknown> = Promise.resolve();

export async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return await result;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isStoredAlarm(value: unknown): value is StoredAlarm {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const a = value as Record<string, unknown>;
  return (
    typeof a["id"] === "string" &&
    typeof a["time"] === "string" &&
    TIME_PATTERN.test(a["time"]) &&
    typeof a["label"] === "string" &&
    typeof a["enabled"] === "boolean" &&
    Array.isArray(a["days"]) &&
    a["days"].every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    (a["notificationIds"] === undefined || isStringArray(a["notificationIds"]))
  );
}

function normalize({
  notificationId,
  notificationIds,
  ...alarm
}: StoredAlarm): Alarm {
  return {
    ...alarm,
    days: [...new Set(alarm.days)].sort((x, y) => x - y),
    // Alarms saved before repeat support kept a single `notificationId`.
    notificationIds:
      notificationIds ??
      (notificationId !== undefined && notificationId !== null
        ? [notificationId]
        : []),
  };
}

export async function getAlarms(): Promise<Alarm[]> {
  const raw = await AsyncStorage.getItem(ALARMS_KEY);
  if (raw === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return []; // corrupted storage: start fresh rather than crash
  }
  return Array.isArray(parsed)
    ? parsed.filter(isStoredAlarm).map(normalize)
    : [];
}

/** Replaces all stored alarms. Only call inside `runExclusive`. */
export async function writeAlarms(alarms: Alarm[]): Promise<Alarm[]> {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  return alarms;
}

/** Applies `update` to the stored alarms, exclusively. */
export async function updateAlarms(
  update: (alarms: Alarm[]) => Alarm[],
): Promise<Alarm[]> {
  return await runExclusive(
    async () => await writeAlarms(update(await getAlarms())),
  );
}

export async function saveAlarm(alarm: Alarm): Promise<Alarm[]> {
  return await updateAlarms((alarms) =>
    alarms.some((a) => a.id === alarm.id)
      ? alarms.map((a) => (a.id === alarm.id ? alarm : a))
      : [...alarms, alarm],
  );
}

export async function deleteAlarm(id: string): Promise<Alarm[]> {
  return await updateAlarms((alarms) => alarms.filter((a) => a.id !== id));
}
