import { parseTime, repeatLabel, sameDays, toExpoWeekday } from "@/utils/days";

describe("repeatLabel", () => {
  it.each([
    [[], "Once"],
    [[0, 1, 2, 3, 4], "Weekdays"],
    [[5, 6], "Weekends"],
    [[6, 5, 4, 3, 2, 1, 0], "Every day"],
    [[2, 0], "Mon, Wed"],
    [[0, 0, 2], "Mon, Wed"],
  ])("%j -> %s", (days, label) => {
    expect(repeatLabel(days)).toBe(label);
  });
});

describe("sameDays", () => {
  it("ignores order and duplicates", () => {
    expect(sameDays([1, 0], [0, 1])).toBe(true);
    expect(sameDays([0, 0], [0])).toBe(true);
    expect(sameDays([0], [0, 1])).toBe(false);
  });
});

describe("toExpoWeekday", () => {
  it("maps Monday-first indexes to expo's Sunday-first weekdays", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(toExpoWeekday)).toEqual([
      2, 3, 4, 5, 6, 7, 1,
    ]);
  });
});

describe("parseTime", () => {
  it("parses HH:mm", () => {
    expect(parseTime("07:05")).toEqual({ hour: 7, minute: 5 });
    expect(parseTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });
});
