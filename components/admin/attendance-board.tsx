"use client";

import { useMemo, useState, useTransition } from "react";
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
  day1: boolean;
  day2: boolean;
};

type Day = 1 | 2;
type Filter = "all" | "absent-1" | "absent-2";

const DAYS: { day: Day; label: string; date: string }[] = [
  { day: 1, label: "Day 1", date: "17 Oct" },
  { day: 2, label: "Day 2", date: "18 Oct" },
];

type Props = {
  delegates: AttendanceDelegate[];
};

function dayKey(day: Day) {
  return day === 1 ? "day1" : "day2";
}

export function AttendanceBoard({ delegates }: Props) {
  const [rows, setRows] = useState(delegates);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totals = useMemo(
    () => ({
      1: rows.filter((row) => row.day1).length,
      2: rows.filter((row) => row.day2).length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "absent-1" && row.day1) return false;
      if (filter === "absent-2" && row.day2) return false;
      if (!q) return true;
      return [row.fullName, row.school, row.registrationId, row.country ?? "", row.committee ?? ""]
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  function toggle(delegate: AttendanceDelegate, day: Day) {
    const key = dayKey(day);
    const pendingKey = `${delegate.id}:${day}`;
    const next = !delegate[key];

    setError(null);
    setPending((prev) => new Set(prev).add(pendingKey));
    setRows((prev) =>
      prev.map((row) => (row.id === delegate.id ? { ...row, [key]: next } : row)),
    );

    startTransition(async () => {
      const result = await setAttendanceAction(delegate.id, day, next);
      if (result.error) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === delegate.id ? { ...row, [key]: !next } : row,
          ),
        );
        setError(`Couldn’t update ${delegate.fullName}: ${result.error}`);
      }
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(pendingKey);
        return copy;
      });
    });
  }

  return (
    <>
      <div className="admin-stat-grid attendance-stats">
        {DAYS.map(({ day, label, date }) => (
          <div
            key={day}
            className="admin-stat-card admin-stat-card-static admin-stat-card-confirmed"
          >
            <p className="admin-stat-label">
              {label} · {date}
            </p>
            <p className="admin-stat-value">
              {totals[day]}
              <span className="attendance-stat-total"> / {rows.length}</span>
            </p>
            <p className="admin-stat-sub">
              {rows.length - totals[day]} not yet at the gate
            </p>
          </div>
        ))}
      </div>

      <div className="admin-filters attendance-filters">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, school, ID, country…"
          aria-label="Search delegates"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          aria-label="Filter delegates"
        >
          <option value="all">All delegates</option>
          <option value="absent-1">Not present · Day 1</option>
          <option value="absent-2">Not present · Day 2</option>
        </select>
      </div>

      {error && (
        <p className="admin-toast admin-toast-error" role="alert">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="admin-empty">No confirmed delegates yet</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">No delegates match</p>
      ) : (
        <ul className="staff-reg-list attendance-list">
          {visible.map((row) => (
            <li key={row.id} className="staff-reg-card attendance-card">
              <div className="attendance-main">
                <div className="attendance-info">
                  <p className="staff-reg-id">
                    {row.registrationId}
                    {row.type === "delegation" && row.isHead && " · Head delegate"}
                  </p>
                  <p className="staff-reg-name">{row.fullName}</p>
                  <p className="staff-reg-meta">{row.school || "—"}</p>
                  {(row.country || row.committee) && (
                    <p className="staff-reg-meta">
                      {[row.country, row.committee].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                <div className="attendance-toggles">
                  {DAYS.map(({ day, label }) => {
                    const present = row[dayKey(day)];
                    const busy = pending.has(`${row.id}:${day}`);
                    return (
                      <button
                        key={day}
                        type="button"
                        role="switch"
                        aria-checked={present}
                        aria-label={`${row.fullName} present on ${label}`}
                        className={`staff-payment-toggle attendance-toggle${present ? " staff-payment-toggle-on" : ""}`}
                        disabled={busy}
                        onClick={() => toggle(row, day)}
                      >
                        <span className="staff-payment-toggle-thumb" />
                        <span className="staff-payment-toggle-label">
                          {label} · {present ? "Present" : "Absent"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
