import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import AlarmRinger from "@/modules/alarm-ringer";
import {
  alarmKeys,
  cancelAlarm,
  removeAlarm,
  saveAndSchedule,
  scheduleAlarm,
  setAlarmEnabled,
  syncAlarms,
} from "@/utils/alarm-scheduler";
import { getAlarms, saveAlarm } from "@/utils/alarm-storage";
import type { ScheduleOptions } from "@/modules/alarm-ringer";
import type { Alarm } from "@/types/alarm";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual<object>(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);

jest.mock("expo-linking", () => ({
  createURL: (path: string, options: { queryParams: { alarmId: string } }) =>
    `wakele://${path.replace(/^\//, "")}?alarmId=${options.queryParams.alarmId}`,
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidNotificationPriority: { MAX: "max" },
  SchedulableTriggerInputTypes: { WEEKLY: "weekly", DATE: "date" },
}));

jest.mock("@/modules/alarm-ringer", () => {
  const scheduled = new Map<string, unknown>();
  return {
    __esModule: true,
    default: {
      scheduled,
      ringingId: null as string | null,
      schedule: jest.fn((options: { key: string }) => {
        scheduled.set(options.key, options);
        return Date.now();
      }),
      cancel: jest.fn((key: string) => {
        scheduled.delete(key);
      }),
      getScheduledKeys: jest.fn(() => [...scheduled.keys()]),
      rearmAll: jest.fn(),
      getRingingAlarmId: jest.fn(function (this: { ringingId: string | null }) {
        return this.ringingId;
      }),
    },
  };
});

const ringer = AlarmRinger as unknown as {
  scheduled: Map<string, ScheduleOptions>;
  ringingId: string | null;
  schedule: jest.Mock;
  cancel: jest.Mock;
  rearmAll: jest.Mock;
};
const notifications = jest.mocked(Notifications);

function alarm(id: string, overrides: Partial<Alarm> = {}): Alarm {
  const base: Alarm = {
    id,
    time: "07:30",
    label: "Alarm",
    enabled: true,
    days: [],
    notificationIds: [],
    ...overrides,
  };
  return overrides.notificationIds === undefined
    ? { ...base, notificationIds: alarmKeys(base) }
    : base;
}

async function store(...alarms: Alarm[]): Promise<void> {
  for (const a of alarms) {
    await saveAlarm(a);
  }
}

function armNatively(a: Alarm): void {
  for (const key of alarmKeys(a)) {
    ringer.scheduled.set(key, {
      key,
      alarmId: a.id,
      hour: 7,
      minute: 30,
      weekday: null,
      label: a.label,
      url: "",
    });
  }
}

async function find(id: string): Promise<Alarm | undefined> {
  return (await getAlarms()).find((a) => a.id === id);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  ringer.scheduled.clear();
  ringer.ringingId = null;
  jest.clearAllMocks();
  notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
});

describe("scheduleAlarm (Android native ringer)", () => {
  it("schedules a one-time alarm under a single key", async () => {
    const ids = await scheduleAlarm(alarm("a", { notificationIds: [] }));
    expect(ids).toEqual(["a-once"]);
    expect(ringer.scheduled.get("a-once")).toMatchObject({
      alarmId: "a",
      hour: 7,
      minute: 30,
      weekday: null,
      url: "wakele://ring?alarmId=a",
    });
  });

  it("schedules one weekly occurrence per repeat day", async () => {
    const ids = await scheduleAlarm(
      alarm("w", { days: [0, 4, 6], notificationIds: [] }),
    );
    expect(ids).toEqual(["w-0", "w-4", "w-6"]);
    expect([...ringer.scheduled.values()].map((o) => o.weekday)).toEqual([
      0, 4, 6,
    ]);
  });

  it("gives an unlabeled alarm a readable label", async () => {
    await scheduleAlarm(alarm("x", { label: "", notificationIds: [] }));
    expect(ringer.scheduled.get("x-once")?.label).toBe("Alarm");
  });

  it("is idempotent: scheduling twice keeps one entry per key", async () => {
    const a = alarm("a", { days: [1], notificationIds: [] });
    await scheduleAlarm(a);
    await scheduleAlarm(a);
    expect([...ringer.scheduled.keys()]).toEqual(["a-1"]);
  });

  it("cancels every key, including unknown ones", async () => {
    await scheduleAlarm(alarm("a", { days: [1, 2], notificationIds: [] }));
    await cancelAlarm(["a-1", "a-2", "does-not-exist"]);
    expect(ringer.scheduled.size).toBe(0);
  });
});

describe("syncAlarms", () => {
  it("re-arms native alarms every time (recovers from force-stop)", async () => {
    await syncAlarms();
    expect(ringer.rearmAll).toHaveBeenCalledTimes(1);
  });

  it("leaves healthy alarms alone", async () => {
    const once = alarm("once");
    const weekly = alarm("weekly", { days: [0, 2] });
    armNatively(once);
    armNatively(weekly);
    await store(once, weekly);

    const result = await syncAlarms();
    expect(result).toEqual([once, weekly]);
    expect(ringer.schedule).not.toHaveBeenCalled();
    expect(ringer.cancel).not.toHaveBeenCalled();
  });

  it("switches off a one-time alarm that already rang but was never dismissed", async () => {
    await store(alarm("rang"));
    await syncAlarms();
    expect(await find("rang")).toMatchObject({
      enabled: false,
      notificationIds: [],
    });
  });

  it("keeps a one-time alarm on while it is still ringing", async () => {
    await store(alarm("ringing"));
    ringer.ringingId = "ringing";
    await syncAlarms();
    expect((await find("ringing"))?.enabled).toBe(true);
  });

  it("re-schedules a repeating alarm whose occurrences went missing", async () => {
    const weekly = alarm("weekly", { days: [1, 3] });
    ringer.scheduled.set("weekly-1", {} as ScheduleOptions);
    await store(weekly);

    await syncAlarms();
    expect([...ringer.scheduled.keys()].sort()).toEqual([
      "weekly-1",
      "weekly-3",
    ]);
    expect((await find("weekly"))?.enabled).toBe(true);
  });

  it("migrates an alarm scheduled by an older version to the native ringer", async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "legacy-notif" } as Notifications.NotificationRequest,
    ]);
    await store(alarm("old", { notificationIds: ["legacy-notif"] }));

    await syncAlarms();
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      "legacy-notif",
    );
    expect(await find("old")).toMatchObject({
      enabled: true,
      notificationIds: ["old-once"],
    });
    expect(ringer.scheduled.has("old-once")).toBe(true);
  });

  it("switches off a legacy one-time alarm whose notification already fired", async () => {
    await store(alarm("old", { notificationIds: ["fired-notif"] }));
    await syncAlarms();
    expect(await find("old")).toMatchObject({ enabled: false });
    expect(ringer.scheduled.size).toBe(0);
  });

  it("migrates a legacy repeating alarm even if its notifications are gone", async () => {
    await store(alarm("old", { days: [2], notificationIds: ["gone"] }));
    await syncAlarms();
    expect(await find("old")).toMatchObject({
      enabled: true,
      notificationIds: ["old-2"],
    });
  });

  it("cancels native alarms that no enabled alarm owns", async () => {
    const off = alarm("off", { enabled: false, notificationIds: [] });
    armNatively(alarm("off"));
    ringer.scheduled.set("deleted-once", {} as ScheduleOptions);
    await store(off);

    await syncAlarms();
    expect(ringer.scheduled.size).toBe(0);
  });

  it("does not cancel an alarm that is saved while a sync is running", async () => {
    let saving: Promise<Alarm[]> | undefined;
    notifications.getAllScheduledNotificationsAsync.mockImplementation(
      async () => {
        saving = saveAndSchedule(null, { time: "06:45", days: [] });
        await Promise.resolve();
        return [];
      },
    );
    await syncAlarms();
    const alarms = await (saving ?? Promise.reject(new Error("not started")));
    const created = alarms.find((a) => a.time === "06:45");
    expect(created?.enabled).toBe(true);
    expect(ringer.scheduled.has(`${created?.id ?? ""}-once`)).toBe(true);
  });

  it("toggling and deleting keep native alarms in step", async () => {
    const [created] = await saveAndSchedule(null, {
      time: "06:00",
      days: [1, 2],
    });
    if (created === undefined) {
      throw new Error("alarm not created");
    }
    expect([...ringer.scheduled.keys()]).toEqual(alarmKeys(created));

    const [off] = await setAlarmEnabled(created, false);
    expect(ringer.scheduled.size).toBe(0);
    expect(off?.notificationIds).toEqual([]);

    if (off === undefined) {
      throw new Error("alarm missing");
    }
    await setAlarmEnabled(off, true);
    expect(ringer.scheduled.size).toBe(2);

    await removeAlarm(created);
    expect(ringer.scheduled.size).toBe(0);
    await expect(getAlarms()).resolves.toEqual([]);
  });

  it("editing an alarm's days cancels the days that were removed", async () => {
    const [created] = await saveAndSchedule(null, {
      time: "06:00",
      days: [0, 1, 2],
    });
    if (created === undefined) {
      throw new Error("alarm not created");
    }
    await saveAndSchedule(created, { time: "06:30", days: [2] });
    expect([...ringer.scheduled.keys()]).toEqual([`${created.id}-2`]);
    expect(ringer.scheduled.get(`${created.id}-2`)?.minute).toBe(30);
  });

  it("is safe to run concurrently", async () => {
    await store(alarm("rang"), alarm("weekly", { days: [5] }));
    await Promise.all([syncAlarms(), syncAlarms(), syncAlarms()]);
    expect(await find("rang")).toMatchObject({ enabled: false });
    expect(await find("weekly")).toMatchObject({ enabled: true });
    expect([...ringer.scheduled.keys()]).toEqual(["weekly-5"]);
  });
});
