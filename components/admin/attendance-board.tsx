"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { setAttendanceAction } from "@/lib/admin/actions/attendance";

export type AttendanceDelegate = {
  id: string;
  fullName: string;
  isHead: boolean;
  registrationId: string;
  type: "delegate" | "delegation";
  school: string;
  country: string | null;
  committee: string | null;
  /** ISO time the delegate was marked present, or null if absent. */
  day1: string | null;
  day2: string | null;
};

type Day = 1 | 2;
type View = "all" | "outstanding" | "present";
type Grouping = "name" | "school";

const DAYS: { day: Day; label: string; date: string }[] = [
  { day: 1, label: "Day 1", date: "Sat 17 Oct" },
  { day: 2, label: "Day 2", date: "Sun 18 Oct" },
];

const VIEWS: { value: View; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Not in" },
  { value: "present", label: "Present" },
];

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Karachi",
});

function dayKey(day: Day) {
  return day === 1 ? "day1" : "day2";
}

function seatLabel(row: AttendanceDelegate) {
  return [row.country, row.committee].filter(Boolean).join(" · ");
}

type Props = {
  delegates: AttendanceDelegate[];
  initialDay: Day;
};

export function AttendanceBoard({ delegates, initialDay }: Props) {
  const [rows, setRows] = useState(delegates);
  const [activeDay, setActiveDay] = useState<Day>(initialDay);
  const [view, setView] = useState<View>("all");
  const [grouping, setGrouping] = useState<Grouping>("name");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{
    tone: "ok" | "error";
    text: string;
    undo?: { id: string; day: Day };
  } | null>(null);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  // Stable register numbers — alphabetical order, like the printed sheet.
  const serials = useMemo(
    () => new Map(delegates.map((row, index) => [row.id, index + 1])),
    [delegates],
  );
  const digits = String(delegates.length).length;

  const tally = useMemo(
    () => ({
      1: rows.filter((row) => row.day1).length,
      2: rows.filter((row) => row.day2).length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = dayKey(activeDay);
    return rows.filter((row) => {
      if (view === "outstanding" && row[key]) return false;
      if (view === "present" && !row[key]) return false;
      if (!q) return true;
      return [
        row.fullName,
        row.school,
        row.registrationId,
        row.country ?? "",
        row.committee ?? "",
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [rows, query, view, activeDay]);

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

  function applyMark(id: string, day: Day, value: string | null) {
    const key = dayKey(day);
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  function toggle(delegate: AttendanceDelegate, day: Day) {
    const key = dayKey(day);
    const pendingKey = `${delegate.id}:${day}`;
    if (pending.has(pendingKey)) return;

    const previous = delegate[key];
    const present = !previous;
    const dayLabel = DAYS[day - 1].label;

    setPending((prev) => new Set(prev).add(pendingKey));
    applyMark(delegate.id, day, present ? new Date().toISOString() : null);
    setNotice({
      tone: "ok",
      text: `${delegate.fullName} marked ${present ? "present" : "absent"} · ${dayLabel}`,
      undo: { id: delegate.id, day },
    });

    startTransition(async () => {
      // A thrown action (e.g. an expired session) must roll back, not crash the sheet.
      const result = await setAttendanceAction(delegate.id, day, present).catch(
        () => ({
          error: "not saved — check your connection or sign in again",
          markedAt: undefined,
        }),
      );
      if (result.error) {
        applyMark(delegate.id, day, previous);
        setNotice({
          tone: "error",
          text: `Couldn’t update ${delegate.fullName}: ${result.error}`,
        });
      } else if (result.markedAt !== undefined) {
        applyMark(delegate.id, day, result.markedAt);
      }
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(pendingKey);
        return copy;
      });
    });
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      return;
    }
    // Enter ticks the only match for the active day, then clears for the next arrival.
    if (event.key === "Enter" && query.trim() && visible.length === 1) {
      event.preventDefault();
      const [match] = visible;
      const markedAt = match[dayKey(activeDay)];
      if (markedAt) {
        setNotice({
          tone: "ok",
          text: `${match.fullName} already in · ${DAYS[activeDay - 1].label} at ${timeFormat.format(new Date(markedAt))}`,
        });
      } else {
        toggle(match, activeDay);
      }
      setQuery("");
    }
  }

  const total = rows.length;

  return (
    <div className="register">
      <div className="register-days" role="group" aria-label="Conference day">
        {DAYS.map(({ day, label, date }) => {
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

      <div className="register-notice" aria-live="polite">
        {notice && (
          <p className={`register-notice-line register-notice-${notice.tone}`}>
            <span>{notice.text}</span>
            {notice.undo && (
              <button
                type="button"
                onClick={() => {
                  const { id, day } = notice.undo!;
                  const current = rows.find((row) => row.id === id);
                  if (current) toggle(current, day);
                }}
              >
                Undo
              </button>
            )}
          </p>
        )}
      </div>

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
                {DAYS.map(({ day, label }) => (
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
              const groupPresent = group.rows.filter(
                (row) => row[dayKey(activeDay)],
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
                        className={row[dayKey(activeDay)] ? "register-row-in" : undefined}
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
                        {DAYS.map(({ day, label }) => {
                          const markedAt = row[dayKey(day)];
                          const busy = pending.has(`${row.id}:${day}`);
                          return (
                            <td
                              key={day}
                              className={`register-col-day${day === activeDay ? " register-col-active" : ""}`}
                            >
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={Boolean(markedAt)}
                                aria-label={`${row.fullName} present on ${label}`}
                                aria-busy={busy}
                                className="register-check"
                                onClick={() => toggle(row, day)}
                              >
                                <span className="register-box" aria-hidden="true">
                                  {markedAt && (
                                    <svg viewBox="0 0 20 20">
                                      <path d="M4 10.5 8.2 14.5 16 5.5" />
                                    </svg>
                                  )}
                                </span>
                                <span className="register-time">
                                  {busy
                                    ? "…"
                                    : markedAt
                                      ? timeFormat.format(new Date(markedAt))
                                      : ""}
                                </span>
                              </button>
                            </td>
                          );
                        })}
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
