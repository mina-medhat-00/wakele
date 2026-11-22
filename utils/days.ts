export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS = [0, 1, 2, 3, 4];
export const WEEKEND = [5, 6];
export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export function sameDays(a: readonly number[], b: readonly number[]): boolean {
  return (
    new Set(a).size === new Set(b).size && a.every((day) => b.includes(day))
  );
}

export function repeatLabel(days: readonly number[]): string {
  if (days.length === 0) {
    return "Once";
  }
  if (sameDays(days, EVERY_DAY)) {
    return "Every day";
  }
  if (sameDays(days, WEEKDAYS)) {
    return "Weekdays";
  }
  if (sameDays(days, WEEKEND)) {
    return "Weekends";
  }
  return [...new Set(days)]
    .sort((a, b) => a - b)
    .map((day) => DAY_NAMES[day])
    .join(", ");
}

/** Converts our Mon-first index (0 = Mon) to expo-notifications' weekday (1 = Sun … 7 = Sat). */
export function toExpoWeekday(day: number): number {
  return ((day + 1) % 7) + 1;
}

/** Parses "HH:mm" into numbers. */
export function parseTime(time: string): { hour: number; minute: number } {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return { hour, minute };
}
