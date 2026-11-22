export interface Alarm {
  id: string;
  time: string; // HH:mm
  label: string;
  enabled: boolean;
  days: number[]; // e.g. 0 = Mon
  notificationIds: string[]; // one per scheduled day (one id for one-time alarms)
}

// Alarm as persisted in AsyncStorage; older versions kept a single `notificationId`
export interface StoredAlarm extends Omit<Alarm, "notificationIds"> {
  notificationIds?: string[];
  notificationId?: string | null;
}

// The editable part of an alarm (what the editor sheet returns)
export interface AlarmDraft {
  time: string;
  days: number[];
}

// Whether the alarm editor is closed, creating a new alarm, or editing one
export type AlarmEditorState =
  { mode: "new" } | { mode: "edit"; alarm: Alarm } | null;

export interface AlarmEditorProps {
  initial: AlarmDraft | null;
  onSave: (draft: AlarmDraft) => void;
  onCancel: () => void;
}

export interface AlarmCardProps {
  alarm: Alarm;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

// Route params of the ring screen (`/ring?alarmId=…`)
export type RingScreenParams = Partial<Record<"alarmId", string>>;
