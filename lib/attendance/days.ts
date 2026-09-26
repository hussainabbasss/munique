export type AttendanceDay = 1 | 2;

/** ISO time the delegate was marked present on each day, or null if not in. */
export type AttendanceMarks = {
  day1: string | null;
  day2: string | null;
};

export const ATTENDANCE_DAYS: {
  day: AttendanceDay;
  label: string;
  date: string;
}[] = [
  { day: 1, label: "Day 1", date: "Sat 17 Oct" },
  { day: 2, label: "Day 2", date: "Sun 18 Oct" },
];

const DAY_2_DATE = "2026-10-18";

export const NO_MARKS: AttendanceMarks = { day1: null, day2: null };

export function dayKey(day: AttendanceDay): keyof AttendanceMarks {
  return day === 1 ? "day1" : "day2";
}

export function dayLabel(day: AttendanceDay) {
  return ATTENDANCE_DAYS[day - 1].label;
}

const markTimeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Karachi",
});

export function formatMarkTime(iso: string) {
  return markTimeFormat.format(new Date(iso));
}

/** Day 2 from 18 Oct (Pakistan time) onwards, Day 1 before that. */
export function currentConferenceDay(): AttendanceDay {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
  }).format(new Date());
  return today >= DAY_2_DATE ? 2 : 1;
}

export function marksFromRows(
  rows: { day: number; marked_at: string }[] | null | undefined,
): AttendanceMarks {
  const at = (day: number) =>
    rows?.find((row) => row.day === day)?.marked_at ?? null;
  return { day1: at(1), day2: at(2) };
}

/** delegate_id → marks, from a flat delegate_attendance select. */
export function marksByDelegate(
  rows: { delegate_id: string; day: number; marked_at: string }[] | null | undefined,
): Record<string, AttendanceMarks> {
  const map: Record<string, AttendanceMarks> = {};
  for (const row of rows ?? []) {
    const marks = (map[row.delegate_id] ??= { day1: null, day2: null });
    if (row.day === 1 || row.day === 2) {
      marks[dayKey(row.day)] = row.marked_at;
    }
  }
  return map;
}
