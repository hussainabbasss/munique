"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { setAttendanceAction } from "@/lib/admin/actions/attendance";
import {
  NO_MARKS,
  dayKey,
  dayLabel,
  formatMarkTime,
  type AttendanceDay,
  type AttendanceMarks,
} from "@/lib/attendance/days";

export type AttendanceNoticeState = {
  tone: "ok" | "error";
  text: string;
  undo?: { id: string; name: string; day: AttendanceDay };
};

/**
 * Optimistic present/absent marks for a set of delegates, shared by the gate
 * register and the country matrix. Failed saves roll back with a notice.
 */
export function useAttendanceMarks(initial: Record<string, AttendanceMarks>) {
  const [marks, setMarks] = useState(initial);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<AttendanceNoticeState | null>(null);
  const [, startTransition] = useTransition();
  const marksRef = useRef(marks);
  const pendingRef = useRef(pending);
  const noticeRef = useRef(notice);

  useEffect(() => {
    marksRef.current = marks;
    pendingRef.current = pending;
    noticeRef.current = notice;
  }, [marks, pending, notice]);

  const marksFor = useCallback(
    (id: string) => marks[id] ?? NO_MARKS,
    [marks],
  );

  const isPending = useCallback(
    (id: string, day: AttendanceDay) => pending.has(`${id}:${day}`),
    [pending],
  );

  const apply = (id: string, day: AttendanceDay, value: string | null) =>
    setMarks((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? NO_MARKS), [dayKey(day)]: value },
    }));

  const toggle = useCallback((id: string, name: string, day: AttendanceDay) => {
    const pendingKey = `${id}:${day}`;
    if (pendingRef.current.has(pendingKey)) return;

    const previous = (marksRef.current[id] ?? NO_MARKS)[dayKey(day)];
    const present = !previous;

    setPending((prev) => new Set(prev).add(pendingKey));
    apply(id, day, present ? new Date().toISOString() : null);
    setNotice({
      tone: "ok",
      text: `${name} marked ${present ? "present" : "absent"} · ${dayLabel(day)}`,
      undo: { id, name, day },
    });

    startTransition(async () => {
      // A thrown action (e.g. an expired session) must roll back, not crash the page.
      const result = await setAttendanceAction(id, day, present).catch(() => ({
        error: "not saved — check your connection or sign in again",
        markedAt: undefined,
      }));
      if (result.error) {
        apply(id, day, previous);
        setNotice({ tone: "error", text: `Couldn’t update ${name}: ${result.error}` });
      } else if (result.markedAt !== undefined) {
        apply(id, day, result.markedAt);
      }
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(pendingKey);
        return copy;
      });
    });
  }, []);

  const undo = useCallback(() => {
    const target = noticeRef.current?.undo;
    if (target) toggle(target.id, target.name, target.day);
  }, [toggle]);

  return { marks, marksFor, isPending, toggle, notice, setNotice, undo };
}

export function AttendanceCheck({
  markedAt,
  busy,
  label,
  onToggle,
}: {
  markedAt: string | null;
  busy: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(markedAt)}
      aria-label={label}
      aria-busy={busy}
      className="register-check"
      onClick={onToggle}
    >
      <span className="register-box" aria-hidden="true">
        {markedAt && (
          <svg viewBox="0 0 20 20">
            <path d="M4 10.5 8.2 14.5 16 5.5" />
          </svg>
        )}
      </span>
      <span className="register-time">
        {busy ? "…" : markedAt ? formatMarkTime(markedAt) : ""}
      </span>
    </button>
  );
}

export function AttendanceNotice({
  notice,
  onUndo,
}: {
  notice: AttendanceNoticeState | null;
  onUndo: () => void;
}) {
  return (
    <div className="register-notice" aria-live="polite">
      {notice && (
        <p className={`register-notice-line register-notice-${notice.tone}`}>
          <span>{notice.text}</span>
          {notice.undo && (
            <button type="button" onClick={onUndo}>
              Undo
            </button>
          )}
        </p>
      )}
    </div>
  );
}
