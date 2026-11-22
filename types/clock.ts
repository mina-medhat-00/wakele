export interface TimePickerProps {
  visible: boolean;
  initialValue?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export interface TimerDuration {
  hours?: number;
  minutes?: number;
  seconds?: number;
}
