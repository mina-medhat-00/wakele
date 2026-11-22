import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteAlarm,
  getAlarms,
  saveAlarm,
  updateAlarms,
} from "@/utils/alarm-storage";
import type { Alarm } from "@/types/alarm";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual<object>(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);

const KEY = "wakele_alarms";

function alarm(id: string, overrides: Partial<Alarm> = {}): Alarm {
  return {
    id,
    time: "07:00",
    label: "Alarm",
    enabled: true,
    days: [],
    notificationIds: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getAlarms", () => {
  it("returns nothing when storage is empty", async () => {
    await expect(getAlarms()).resolves.toEqual([]);
  });

  it("survives corrupted JSON instead of crashing the alarm list", async () => {
    await AsyncStorage.setItem(KEY, "{not json");
    await expect(getAlarms()).resolves.toEqual([]);
  });

  it("ignores a non-array value", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ id: "1" }));
    await expect(getAlarms()).resolves.toEqual([]);
  });

  it("drops malformed entries but keeps valid ones", async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify([
        alarm("ok"),
        { ...alarm("bad-time"), time: "25:00" },
        { ...alarm("bad-day"), days: [7] },
        { ...alarm("bad-enabled"), enabled: "yes" },
        null,
        "garbage",
      ]),
    );
    const alarms = await getAlarms();
    expect(alarms.map((a) => a.id)).toEqual(["ok"]);
  });

  it("migrates the legacy single notificationId", async () => {
    const { notificationIds: _ids, ...legacy } = alarm("old");
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify([{ ...legacy, notificationId: "notif-1" }]),
    );
    const [migrated] = await getAlarms();
    expect(migrated?.notificationIds).toEqual(["notif-1"]);
    expect(migrated).not.toHaveProperty("notificationId");
  });

  it("de-duplicates and sorts repeat days", async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify([alarm("a", { days: [4, 0, 4] })]),
    );
    const [loaded] = await getAlarms();
    expect(loaded?.days).toEqual([0, 4]);
  });
});

describe("writes", () => {
  it("adds, replaces and deletes alarms", async () => {
    await saveAlarm(alarm("a"));
    await saveAlarm(alarm("b"));
    await saveAlarm(alarm("a", { time: "08:30" }));
    expect((await getAlarms()).map((a) => [a.id, a.time])).toEqual([
      ["a", "08:30"],
      ["b", "07:00"],
    ]);
    await deleteAlarm("a");
    expect((await getAlarms()).map((a) => a.id)).toEqual(["b"]);
  });

  it("does not lose concurrent saves", async () => {
    const ids = Array.from({ length: 25 }, (_, i) => `id-${String(i)}`);
    await Promise.all(ids.map(async (id) => await saveAlarm(alarm(id))));
    expect((await getAlarms()).map((a) => a.id).sort()).toEqual(
      [...ids].sort(),
    );
  });

  it("keeps working after a failed update", async () => {
    await expect(
      updateAlarms(() => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await saveAlarm(alarm("after"));
    expect((await getAlarms()).map((a) => a.id)).toEqual(["after"]);
  });
});
