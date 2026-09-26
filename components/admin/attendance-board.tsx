"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AttendanceCheck,
  AttendanceNotice,
  useAttendanceMarks,
} from "@/components/admin/attendance-kit";
import {
  ATTENDANCE_DAYS,
  dayKey,
  dayLabel,
  formatMarkTime,
  type AttendanceDay,
  type AttendanceMarks,
} from "@/lib/attendance/days";

export type AttendanceDelegate = {
  id: string;
  fullName: string;
  isHead: boolean;
  registrationId: string;
  type: "delegate" | "delegation";
  school: string;
  country: string | null;
  committee: string | null;
  marks: AttendanceMarks;
};

type View = "all" | "outstanding" | "present";
type Grouping = "name" | "school";

const VIEWS: { value: View; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Not in" },
  { value: "present", label: "Present" },
];

function seatLabel(row: AttendanceDelegate) {
  return [row.country, row.committee].filter(Boolean).join(" · ");
}

type Props = {
  delegates: AttendanceDelegate[];
  initialDay: AttendanceDay;
};

export function AttendanceBoard({ delegates, initialDay }: Props) {
  const [activeDay, setActiveDay] = useState<AttendanceDay>(initialDay);
  const [view, setView] = useState<View>("all");
  const [grouping, setGrouping] = useState<Grouping>("name");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const attendance = useAttendanceMarks(
    useMemo(
      () => Object.fromEntries(delegates.map((row) => [row.id, row.marks])),
      [delegates],
    ),
  );
  const { marksFor, isPending, toggle, notice, setNotice, undo } = attendance;
  const isIn = (row: AttendanceDelegate, day: AttendanceDay) =>
    Boolean(marksFor(row.id)[dayKey(day)]);

  // Stable register numbers — alphabetical order, like the printed sheet.
  const serials = useMemo(
    () => new Map(delegates.map((row, index) => [row.id, index + 1])),
    [delegates],
  );
  const digits = String(delegates.length).length;

  const tally = useMemo(() => {
    const count = (day: AttendanceDay) =>
      delegates.filter((row) => attendance.marks[row.id]?.[dayKey(day)]).length;
    return { 1: count(1), 2: count(2) };
  }, [delegates, attendance.marks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = dayKey(activeDay);
    return delegates.filter((row) => {
      const present = Boolean(attendance.marks[row.id]?.[key]);
      if (view === "outstanding" && present) return false;
      if (view === "present" && !present) return false;
      if (!q) return true;
      return [
        row.fullName,
        row.school,
        row.registrationId,
        row.country ?? "",
        row.committee ?? "",
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [delegates, attendance.marks, query, view, activeDay]);

  const groups = useMemo(() => {
    if (grouping === "name") return [{ title: null, rows: visible }];
    const bySchool = new Map<string, AttendanceDelegate[]>();
    for (const row of visible) {
      const school = row.school.trim() || "Independent";
      bySchool.set(school, [...(bySchool.get(school) ?? []), row]);
    }
    return [...bySchool.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, groupRows]) => ({ title, rows: groupRows }));
  }, [visible, grouping]);

  // "/" jumps to search, the way gate staff scan for the next name.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA";
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      return;
    }
    // Enter ticks the only match for the active day, then clears for the next arrival.
    if (event.key === "Enter" && query.trim() && visible.length === 1) {
      event.preventDefault();
      const [match] = visible;
      const markedAt = marksFor(match.id)[dayKey(activeDay)];
      if (markedAt) {
        setNotice({
          tone: "ok",
          text: `${match.fullName} already in · ${dayLabel(activeDay)} at ${formatMarkTime(markedAt)}`,
        });
      } else {
        toggle(match.id, match.fullName, activeDay);
      }
      setQuery("");
    }
  }

  const total = delegates.length;

  return (
    <div className="register">
      <div className="register-days" role="group" aria-label="Conference day">
        {ATTENDANCE_DAYS.map(({ day, label, date }) => {
          const present = tally[day];
          const share = total ? Math.round((present / total) * 100) : 0;
          const active = day === activeDay;
          return (
            <button
              key={day}
              type="button"
              className={`register-day${active ? " register-day-active" : ""}`}
              aria-pressed={active}
              onClick={() => setActiveDay(day)}
            >
              <span className="register-day-head">
                <span className="register-day-label">{label}</span>
                <span className="register-day-date">{date}</span>
              </span>
              <span className="register-day-count">
                {present}
                <span className="register-day-total">/{total}</span>
              </span>
              <span className="register-day-bar" aria-hidden="true">
                <span style={{ width: `${share}%` }} />
              </span>
              <span className="register-day-sub">
                {total - present} not in · {share}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="register-toolbar">
        <label className="register-search">
          <span className="sr-only">Search delegates</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search name, school, ID, country…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd aria-hidden="true">/</kbd>
        </label>

        <div className="register-segment" role="group" aria-label="Show">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="register-segment" role="group" aria-label="Order">
          <button
            type="button"
            aria-pressed={grouping === "name"}
            onClick={() => setGrouping("name")}
          >
            A–Z
          </button>
          <button
            type="button"
            aria-pressed={grouping === "school"}
            onClick={() => setGrouping("school")}
          >
            By school
          </button>
        </div>
      </div>

      <AttendanceNotice notice={notice} onUndo={undo} />

      {total === 0 ? (
        <p className="admin-empty">No confirmed delegates yet</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">
          {query ? `No delegate matches “${query}”` : "Nobody on this list"}
        </p>
      ) : (
        <div className="register-sheet-wrap">
          <table className="register-sheet">
            <thead>
              <tr>
                <th scope="col" className="register-col-no">No.</th>
                <th scope="col">Delegate</th>
                <th scope="col" className="register-col-wide">School</th>
                <th scope="col" className="register-col-wide">Seat</th>
                {ATTENDANCE_DAYS.map(({ day, label }) => (
                  <th
                    key={day}
                    scope="col"
                    className={`register-col-day${day === activeDay ? " register-col-active" : ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => {
              const groupPresent = group.rows.filter((row) =>
                isIn(row, activeDay),
              ).length;
              return (
                <tbody key={group.title ?? "all"}>
                  {group.title && (
                    <tr className="register-group">
                      <th scope="colgroup" colSpan={6}>
                        <span>{group.title}</span>
                        <span className="register-group-count">
                          {groupPresent}/{group.rows.length} in
                        </span>
                      </th>
                    </tr>
                  )}
                  {group.rows.map((row) => {
                    const seat = seatLabel(row);
                    return (
                      <tr
                        key={row.id}
                        className={isIn(row, activeDay) ? "register-row-in" : undefined}
                      >
                        <td className="register-col-no">
                          {String(serials.get(row.id)).padStart(digits, "0")}
                        </td>
                        <td className="register-delegate">
                          <span className="register-name">{row.fullName}</span>
                          <span className="register-meta">
                            <span className="register-id">{row.registrationId}</span>
                            {row.type === "delegation" && row.isHead && (
                              <span className="register-tag">Head</span>
                            )}
                          </span>
                          {row.school && grouping === "name" && (
                            <span className="register-meta register-meta-narrow">
                              {row.school}
                            </span>
                          )}
                          {seat && (
                            <span className="register-meta register-meta-narrow">
                              {seat}
                            </span>
                          )}
                        </td>
                        <td className="register-col-wide">{row.school || "—"}</td>
                        <td className="register-col-wide">
                          {seat || <span className="register-muted">Unallotted</span>}
                        </td>
                        {ATTENDANCE_DAYS.map(({ day, label }) => (
                          <td
                            key={day}
                            className={`register-col-day${day === activeDay ? " register-col-active" : ""}`}
                          >
                            <AttendanceCheck
                              markedAt={marksFor(row.id)[dayKey(day)]}
                              busy={isPending(row.id, day)}
                              label={`${row.fullName} present on ${label}`}
                              onToggle={() => toggle(row.id, row.fullName, day)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      <p className="register-foot">
        Showing {visible.length} of {total} · Enter ticks the only match ·
        Esc clears search
      </p>
    </div>
  );
}
