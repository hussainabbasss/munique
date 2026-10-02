"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RegistrationProfileDialog } from "@/components/admin/registration-profile-dialog";
import {
  AttendanceCheck,
  AttendanceNotice,
  useAttendanceMarks,
} from "@/components/admin/attendance-kit";
import {
  ATTENDANCE_DAYS,
  dayKey,
  dayLabel,
  type AttendanceDay,
  type AttendanceMarks,
} from "@/lib/attendance/days";
import type {
  CommitteeMatrix,
  SeatHolder,
} from "@/lib/allotments/country-matrix";

type SeatFilter = "all" | "taken" | "left" | "absent";

type ProfileTarget = {
  registrationUuid: string;
  focusDelegateId: string | null;
};

type Props = {
  committees: CommitteeMatrix[];
  attendance: Record<string, AttendanceMarks>;
  initialDay: AttendanceDay;
  initialAttendanceOn: boolean;
};

const OVERVIEW = "overview";

function seatedDelegateIds(committee: CommitteeMatrix) {
  return [
    ...new Set(
      committee.seats.flatMap((seat) =>
        seat.holders.map((holder) => holder.delegateId),
      ),
    ),
  ];
}

export function CountryMatrix({
  committees,
  attendance,
  initialDay,
  initialAttendanceOn,
}: Props) {
  const [activeId, setActiveId] = useState<string>(OVERVIEW);
  const [seatFilter, setSeatFilter] = useState<SeatFilter>("all");
  const [search, setSearch] = useState("");
  const [profileTarget, setProfileTarget] = useState<ProfileTarget | null>(
    null,
  );
  const [attendanceOn, setAttendanceOn] = useState(initialAttendanceOn);
  const [day, setDay] = useState<AttendanceDay>(initialDay);
  const { marks, marksFor, isPending, toggle, notice, undo } =
    useAttendanceMarks(attendance);

  const setAttendance = (on: boolean) => {
    setAttendanceOn(on);
    if (!on && seatFilter === "absent") setSeatFilter("all");
    // Keep the mode in the URL so a refresh (or a shared link) stays in attendance mode.
    const url = new URL(window.location.href);
    if (on) url.searchParams.set("attendance", "on");
    else url.searchParams.delete("attendance");
    window.history.replaceState(null, "", url);
  };

  const isIn = (delegateId: string) => Boolean(marks[delegateId]?.[dayKey(day)]);

  const presence = (committee: CommitteeMatrix) => {
    const ids = seatedDelegateIds(committee);
    return { present: ids.filter(isIn).length, seated: ids.length };
  };

  const totalPresence = committees.reduce(
    (sum, committee) => {
      const { present, seated } = presence(committee);
      return { present: sum.present + present, seated: sum.seated + seated };
    },
    { present: 0, seated: 0 },
  );

  const totals = useMemo(
    () =>
      committees.reduce(
        (sum, committee) => ({
          total: sum.total + committee.total,
          taken: sum.taken + committee.taken,
          left: sum.left + committee.left,
        }),
        { total: 0, taken: 0, left: 0 },
      ),
    [committees],
  );

  const active = committees.find((committee) => committee.id === activeId);

  const visibleSeats = useMemo(() => {
    if (!active) return [];
    const term = search.trim().toLowerCase();

    return active.seats.filter((seat) => {
      const isTaken = seat.holders.length > 0;
      if (seatFilter === "taken" && !isTaken) return false;
      if (seatFilter === "left" && isTaken) return false;
      if (
        seatFilter === "absent" &&
        !seat.holders.some(
          (holder) => !marks[holder.delegateId]?.[dayKey(day)],
        )
      ) {
        return false;
      }
      if (!term) return true;
      return (
        seat.country.toLowerCase().includes(term) ||
        seat.holders.some(
          (holder) =>
            holder.fullName.toLowerCase().includes(term) ||
            holder.registrationId.toLowerCase().includes(term) ||
            (holder.school ?? "").toLowerCase().includes(term),
        )
      );
    });
  }, [active, seatFilter, search, marks, day]);

  const holderLabel = (holder: SeatHolder) =>
    holder.type === "delegation" && holder.isHeadDelegate
      ? `${holder.fullName} (head)`
      : holder.fullName;

  const openCommittee = (id: string) => {
    setActiveId(id);
    setSeatFilter("all");
    setSearch("");
  };

  if (committees.length === 0) {
    return <p className="admin-empty">No committees yet — add committees first.</p>;
  }

  const activePresence = active ? presence(active) : null;
  const absentSeats = active
    ? active.seats.filter((seat) =>
        seat.holders.some((holder) => !isIn(holder.delegateId)),
      ).length
    : 0;

  return (
    <div className="register">
      <div className="admin-country-matrix-toolbar">
        <button
          type="button"
          role="switch"
          aria-checked={attendanceOn}
          className="admin-theme-toggle admin-country-matrix-switch"
          onClick={() => setAttendance(!attendanceOn)}
        >
          <span className="admin-theme-toggle-track" aria-hidden="true">
            <span className="admin-theme-toggle-thumb" />
          </span>
          Attendance
        </button>
        <Link
          href="/admin/waivers"
          className="admin-action-chip admin-country-matrix-waivers"
        >
          Print waivers
        </Link>
        {attendanceOn && (
          <div className="register-segment" role="group" aria-label="Conference day">
            {ATTENDANCE_DAYS.map((option) => (
              <button
                key={option.day}
                type="button"
                aria-pressed={day === option.day}
                onClick={() => setDay(option.day)}
              >
                {option.label} · {option.date}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={`admin-stat-grid admin-country-matrix-stats${attendanceOn ? " admin-country-matrix-stats-attendance" : ""}`}
      >
        <div className="admin-stat-card admin-stat-card-static">
          <p className="admin-stat-label">Pool countries</p>
          <p className="admin-stat-value">{totals.total}</p>
          <p className="admin-stat-sub">Across {committees.length} committees</p>
        </div>
        <div className="admin-stat-card admin-stat-card-static admin-stat-card-pending">
          <p className="admin-stat-label">Taken</p>
          <p className="admin-stat-value">{totals.taken}</p>
        </div>
        <div className="admin-stat-card admin-stat-card-static admin-stat-card-confirmed">
          <p className="admin-stat-label">Left</p>
          <p className="admin-stat-value">{totals.left}</p>
        </div>
        {attendanceOn && (
          <div className="admin-stat-card admin-stat-card-static admin-stat-card-revenue">
            <p className="admin-stat-label">Present · {dayLabel(day)}</p>
            <p className="admin-stat-value">
              {totalPresence.present}
              <span className="attendance-stat-total">/{totalPresence.seated}</span>
            </p>
            <p className="admin-stat-sub">
              {totalPresence.seated - totalPresence.present} seated delegates not in
            </p>
          </div>
        )}
      </div>

      <div
        className="admin-allotment-segmented admin-allotment-segmented-secondary"
        role="tablist"
        aria-label="Committee"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeId === OVERVIEW}
          className={`admin-allotment-segment${activeId === OVERVIEW ? " admin-allotment-segment-active" : ""}`}
          onClick={() => openCommittee(OVERVIEW)}
        >
          All committees
        </button>
        {committees.map((committee) => (
          <button
            key={committee.id}
            type="button"
            role="tab"
            aria-selected={activeId === committee.id}
            className={`admin-allotment-segment${activeId === committee.id ? " admin-allotment-segment-active" : ""}`}
            onClick={() => openCommittee(committee.id)}
          >
            {committee.name} ({committee.left} left)
          </button>
        ))}
      </div>

      {!active ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Committee</th>
                <th>Pool</th>
                <th>Taken</th>
                <th>Left</th>
                <th>Filled</th>
                {attendanceOn && <th>Present · {dayLabel(day)}</th>}
              </tr>
            </thead>
            <tbody>
              {committees.map((committee) => {
                const percent = committee.total
                  ? Math.round((committee.taken / committee.total) * 100)
                  : 0;
                return (
                  <tr key={committee.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-name-link"
                        onClick={() => openCommittee(committee.id)}
                      >
                        {committee.name}
                      </button>
                      {!committee.isPublished && (
                        <span className="admin-badge admin-country-matrix-tag">
                          Unpublished
                        </span>
                      )}
                      {committee.offPool > 0 && (
                        <span className="admin-badge admin-badge-open admin-country-matrix-tag">
                          {committee.offPool} off pool
                        </span>
                      )}
                    </td>
                    <td className="mono">{committee.total || "—"}</td>
                    <td className="mono">{committee.taken}</td>
                    <td className="mono">{committee.left}</td>
                    <td>
                      {committee.total ? (
                        <div className="admin-country-matrix-meter">
                          <div
                            className="admin-country-matrix-meter-track"
                            role="img"
                            aria-label={`${percent}% of countries taken`}
                          >
                            <div
                              className="admin-country-matrix-meter-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="mono">{percent}%</span>
                        </div>
                      ) : (
                        <span className="admin-field-hint">No pool set</span>
                      )}
                    </td>
                    {attendanceOn && (
                      <td className="mono">
                        {presence(committee).seated
                          ? `${presence(committee).present}/${presence(committee).seated}`
                          : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="admin-country-matrix-head">
            <p className="admin-country-matrix-summary">
              <strong>{active.left}</strong> of {active.total} countries left ·{" "}
              {active.taken} taken
              {active.offPool > 0 && ` · ${active.offPool} assigned off pool`}
              {attendanceOn && activePresence && (
                <>
                  {" · "}
                  <strong>{activePresence.present}</strong>/{activePresence.seated}{" "}
                  present on {dayLabel(day)}
                </>
              )}
            </p>
            <Link
              href={`/admin/roll-call?committee=${active.id}`}
              className="admin-action-chip"
            >
              Print roll call
            </Link>
            <div className="admin-filters admin-country-matrix-filters">
              <div
                className="admin-allotment-segmented"
                role="tablist"
                aria-label="Seat status"
              >
                {(
                  [
                    ["all", `All (${active.seats.length})`],
                    ["taken", `Taken (${active.taken + active.offPool})`],
                    ["left", `Left (${active.left})`],
                    ...(attendanceOn
                      ? ([["absent", `Not in (${absentSeats})`]] as const)
                      : []),
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={seatFilter === value}
                    className={`admin-allotment-segment${seatFilter === value ? " admin-allotment-segment-active" : ""}`}
                    onClick={() => setSeatFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country, delegate, school…"
                aria-label="Search countries and delegates"
              />
            </div>
          </div>

          {attendanceOn && <AttendanceNotice notice={notice} onUndo={undo} />}

          <div className="admin-table-wrap">
            <table
              className={`admin-table${attendanceOn ? " admin-country-matrix-attend" : ""}`}
            >
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Taken by</th>
                  <th>ID</th>
                  <th>School</th>
                  {attendanceOn ? (
                    ATTENDANCE_DAYS.map((option) => (
                      <th
                        key={option.day}
                        className={`register-col-day${option.day === day ? " register-col-active" : ""}`}
                      >
                        {option.label}
                      </th>
                    ))
                  ) : (
                    <th>Allotment</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleSeats.length === 0 ? (
                  <tr>
                    <td colSpan={attendanceOn ? 7 : 6} className="admin-empty">
                      {active.seats.length === 0
                        ? "No country pool set for this committee — add one under Committees."
                        : "No countries match this filter."}
                    </td>
                  </tr>
                ) : (
                  visibleSeats.map((seat) => {
                    const isTaken = seat.holders.length > 0;
                    return (
                      <tr key={seat.country}>
                        <td>
                          {seat.country}
                          {!seat.inPool && (
                            <span className="admin-badge admin-country-matrix-tag">
                              Off pool
                            </span>
                          )}
                          {seat.holders.length > 1 && (
                            <span className="admin-badge admin-badge-open admin-country-matrix-tag">
                              Double allotted
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${isTaken ? "admin-badge-open" : "admin-badge-resolved"}`}
                          >
                            {isTaken ? "Taken" : "Left"}
                          </span>
                        </td>
                        <td>
                          {isTaken
                            ? seat.holders.map((holder) => (
                                <div key={holder.allotmentId}>
                                  <button
                                    type="button"
                                    className="admin-name-link"
                                    onClick={() =>
                                      setProfileTarget({
                                        registrationUuid:
                                          holder.registrationUuid,
                                        focusDelegateId: holder.delegateId,
                                      })
                                    }
                                  >
                                    {holderLabel(holder)}
                                  </button>
                                </div>
                              ))
                            : "—"}
                        </td>
                        <td className="mono">
                          {isTaken
                            ? seat.holders.map((holder) => (
                                <div key={holder.allotmentId}>
                                  {holder.registrationId}
                                </div>
                              ))
                            : "—"}
                        </td>
                        <td>
                          {isTaken
                            ? seat.holders.map((holder) => (
                                <div key={holder.allotmentId}>
                                  {holder.school || "—"}
                                </div>
                              ))
                            : "—"}
                        </td>
                        {attendanceOn ? (
                          ATTENDANCE_DAYS.map((option) => (
                            <td
                              key={option.day}
                              className={`register-col-day${option.day === day ? " register-col-active" : ""}`}
                            >
                              {isTaken
                                ? seat.holders.map((holder) => (
                                    <AttendanceCheck
                                      key={holder.allotmentId}
                                      markedAt={marksFor(holder.delegateId)[dayKey(option.day)]}
                                      busy={isPending(holder.delegateId, option.day)}
                                      label={`${holder.fullName} (${seat.country}) present on ${option.label}`}
                                      onToggle={() =>
                                        toggle(holder.delegateId, holder.fullName, option.day)
                                      }
                                    />
                                  ))
                                : "—"}
                            </td>
                          ))
                        ) : (
                          <td>
                            {isTaken
                              ? seat.holders.map((holder) => (
                                  <div key={holder.allotmentId}>
                                    {holder.status === "issued"
                                      ? "Issued"
                                      : "Pending"}
                                  </div>
                                ))
                              : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <RegistrationProfileDialog
        registrationUuid={profileTarget?.registrationUuid ?? null}
        focusDelegateId={profileTarget?.focusDelegateId ?? null}
        onClose={() => setProfileTarget(null)}
      />
    </div>
  );
}
