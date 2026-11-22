import { NativeModule, requireOptionalNativeModule } from "expo";

export type ScheduleOptions = {
  key: string;
  alarmId: string;
  hour: number;
  minute: number;
  weekday: number | null;
  label: string;
  url: string;
};

type Events = {
  onRing(event: { alarmId: string }): void;
};

declare class AlarmRingerModule extends NativeModule<Events> {
  schedule(options: ScheduleOptions): number;
  cancel(key: string): void;
  getScheduledKeys(): string[];
  rearmAll(): void;
  startRinging(alarmId: string, label: string, url: string): void;
  stopRinging(): void;
  getRingingAlarmId(): string | null;
  canScheduleExactAlarms(): boolean;
}

export default requireOptionalNativeModule<AlarmRingerModule>("AlarmRinger");
