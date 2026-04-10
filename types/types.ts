export type Alarm = {
  id: string;
  time: string; // "HH:mm" format (e.g. "07:30")
  label: string;
  enabled: boolean;
  days: number[]; // [0-6] for recurring, empty = one-time
  notificationId: string | null;
};
