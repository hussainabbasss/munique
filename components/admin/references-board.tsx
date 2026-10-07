"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RegistrationProfileDialog } from "@/components/admin/registration-profile-dialog";
import { formatDate } from "@/lib/utils/format";

export type ReferenceRegistration = {
  id: string;
  registration_id: string;
  type: string;
  school: string | null;
  source: string | null;
  payment_status: string;
  brand_ambassador_name: string | null;
  created_at: string;
  delegates: { full_name: string; is_head_delegate: boolean }[] | null;
};

type SourceTab = "all" | "portal" | "form_import";

type ReferenceGroup = {
  key: string;
  label: string;
  total: number;
  portal: number;
  form: number;
};

/** Colored slices; everything past these folds into "Other". */
const SLICE_COLORS = 7;
const NONE_KEY = "__none";
const OTHER_KEY = "__other";

const SOURCE_TABS: { value: SourceTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "portal", label: "Website" },
  { value: "form_import", label: "Google Form" },
];

/** Same person typed differently ("Ali Khan", "ali khan ") counts once. */
function referenceKey(name: string | null) {
  const clean = (name ?? "").trim().replace(/\s+/g, " ");
  return clean ? clean.toLowerCase() : NONE_KEY;
}

function isForm(r: ReferenceRegistration) {
  return r.source === "form_import";
}

function groupReferences(rows: ReferenceRegistration[]) {
  const groups = new Map<string, ReferenceGroup>();
  for (const r of rows) {
    const key = referenceKey(r.brand_ambassador_name);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        label:
          key === NONE_KEY
            ? "No reference"
            : (r.brand_ambassador_name ?? "").trim().replace(/\s+/g, " "),
        total: 0,
        portal: 0,
        form: 0,
      };
      groups.set(key, g);
    }
    g.total += 1;
    if (isForm(r)) g.form += 1;
    else g.portal += 1;
  }

  // Biggest first; "No reference" always last
  return [...groups.values()].sort((a, b) => {
    if (a.key === NONE_KEY) return 1;
    if (b.key === NONE_KEY) return -1;
    return b.total - a.total || a.label.localeCompare(b.label);
  });
}

function headName(r: ReferenceRegistration) {
  const head =
    r.delegates?.find((d) => d.is_head_delegate)?.full_name ??
    r.delegates?.[0]?.full_name ??
    "—";
  if (r.type === "delegation") {
    return `${r.school || head} (${r.delegates?.length ?? 0})`;
  }
  return head;
}

function paymentClass(status: string) {
  if (status === "confirmed") return "payment-confirmed";
  if (status === "rejected") return "payment-rejected";
  return "payment-pending";
}

function paymentLabel(status: string) {
  if (status === "confirmed") return "● Conf";
  if (status === "rejected") return "✕ Rej";
  return "◐ Pend";
}

function percent(part: number, whole: number) {
  if (whole === 0) return "0%";
  const p = (part / whole) * 100;
  return `${p < 10 && p % 1 !== 0 ? p.toFixed(1) : Math.round(p)}%`;
}

export function ReferencesBoard({ registrations }: { registrations: ReferenceRegistration[] }) {
  const [source, setSource] = useState<SourceTab>("all");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Colors are assigned once from the full set so switching source never
  // repaints a reference.
  const colorByKey = useMemo(() => {
    const map = new Map<string, string>();
    groupReferences(registrations)
      .filter((g) => g.key !== NONE_KEY)
      .slice(0, SLICE_COLORS)
      .forEach((g, i) => map.set(g.key, `var(--admin-ref-${i + 1})`));
    return map;
  }, [registrations]);

  const colorFor = (key: string) =>
    key === NONE_KEY
      ? "var(--admin-ref-none)"
      : colorByKey.get(key) ?? "var(--admin-ref-other)";

  const counts = useMemo(() => {
    const form = registrations.filter(isForm).length;
    return { all: registrations.length, form_import: form, portal: registrations.length - form };
  }, [registrations]);

  const sourceRows = useMemo(
    () =>
      source === "all"
        ? registrations
        : registrations.filter((r) => (source === "form_import") === isForm(r)),
    [registrations, source],
  );

  const groups = useMemo(() => groupReferences(sourceRows), [sourceRows]);

  const slices = useMemo(() => {
    const named: { key: string; label: string; value: number }[] = [];
    let other = 0;
    let none = 0;
    for (const g of groups) {
      if (g.key === NONE_KEY) none = g.total;
      else if (colorByKey.has(g.key)) named.push({ key: g.key, label: g.label, value: g.total });
      else other += g.total;
    }
    if (other > 0) named.push({ key: OTHER_KEY, label: "Other references", value: other });
    if (none > 0) named.push({ key: NONE_KEY, label: "No reference", value: none });
    return named;
  }, [groups, colorByKey]);

  const tableRows = useMemo(() => {
    if (!selectedRef) return sourceRows;
    if (selectedRef === OTHER_KEY) {
      return sourceRows.filter((r) => {
        const key = referenceKey(r.brand_ambassador_name);
        return key !== NONE_KEY && !colorByKey.has(key);
      });
    }
    return sourceRows.filter((r) => referenceKey(r.brand_ambassador_name) === selectedRef);
  }, [sourceRows, selectedRef, colorByKey]);

  const selectedLabel =
    selectedRef === OTHER_KEY
      ? "Other references"
      : groups.find((g) => g.key === selectedRef)?.label ?? null;

  const total = sourceRows.length;
  const referred = total - (groups.find((g) => g.key === NONE_KEY)?.total ?? 0);
  const namedRefs = groups.filter((g) => g.key !== NONE_KEY).length;

  function toggleRef(key: string) {
    setSelectedRef((prev) => (prev === key ? null : key));
  }

  function changeSource(next: SourceTab) {
    setSource(next);
    setSelectedRef(null);
  }

  return (
    <>
      <div className="admin-allotment-tabs" role="tablist" aria-label="Registration source">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={source === tab.value}
            className={`admin-allotment-tab${source === tab.value ? " admin-allotment-tab-active" : ""}`}
            onClick={() => changeSource(tab.value)}
          >
            {tab.label}
            <span className="admin-ref-tab-count">{counts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="admin-metrics">
        <div className="admin-metric admin-metric-static">
          <p className="admin-metric-label">Registrations</p>
          <p className="admin-metric-value">{total}</p>
        </div>
        <div className="admin-metric admin-metric-static">
          <p className="admin-metric-label">With a reference</p>
          <p className="admin-metric-value">{referred}</p>
          <p className="admin-metric-sub">{percent(referred, total)} of registrations</p>
        </div>
        <div className="admin-metric admin-metric-static">
          <p className="admin-metric-label">References</p>
          <p className="admin-metric-value">{namedRefs}</p>
          <p className="admin-metric-sub">Distinct names</p>
        </div>
      </div>

      <section className="admin-panel admin-ref-panel">
        <h2 className="admin-panel-title">Registrations by reference</h2>
        {total === 0 ? (
          <p className="admin-empty">No registrations from this source yet</p>
        ) : (
          <div className="admin-ref-split">
            <div className="admin-ref-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="92%"
                    stroke="var(--admin-surface)"
                    strokeWidth={2}
                    isAnimationActive={false}
                    onClick={(slice) => {
                      const key = (slice as unknown as { key?: string }).key;
                      if (key) toggleRef(key);
                    }}
                  >
                    {slices.map((s) => (
                      <Cell
                        key={s.key}
                        fill={s.key === OTHER_KEY ? "var(--admin-ref-other)" : colorFor(s.key)}
                        fillOpacity={selectedRef && selectedRef !== s.key ? 0.3 : 1}
                        style={{ cursor: "pointer", outline: "none" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 4,
                      border: "1px solid var(--admin-border-strong)",
                      background: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      boxShadow: "var(--admin-shadow-md)",
                    }}
                    itemStyle={{ color: "var(--admin-text)" }}
                    formatter={(value, name) => [
                      `${value} (${percent(Number(value), total)})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="admin-ref-chart-center" aria-hidden>
                <span className="admin-ref-chart-total">{total}</span>
                <span className="admin-ref-chart-caption">registrations</span>
              </div>
            </div>

            <div className="admin-table-wrap admin-ref-legend">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th className="admin-ref-num">Total</th>
                    {source === "all" && (
                      <>
                        <th className="admin-ref-num">Website</th>
                        <th className="admin-ref-num">Form</th>
                      </>
                    )}
                    <th className="admin-ref-num">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr
                      key={g.key}
                      className={selectedRef === g.key ? "admin-ref-row-active" : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="admin-ref-name"
                          aria-pressed={selectedRef === g.key}
                          onClick={() => toggleRef(g.key)}
                        >
                          <span
                            className="admin-ref-swatch"
                            style={{ background: colorFor(g.key) }}
                            aria-hidden
                          />
                          {g.label}
                        </button>
                      </td>
                      <td className="admin-ref-num">{g.total}</td>
                      {source === "all" && (
                        <>
                          <td className="admin-ref-num">{g.portal}</td>
                          <td className="admin-ref-num">{g.form}</td>
                        </>
                      )}
                      <td className="admin-ref-num">{percent(g.total, total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="admin-panel admin-ref-panel">
        <div className="admin-ref-list-head">
          <h2 className="admin-panel-title">
            {selectedLabel ? `Registrations — ${selectedLabel}` : "All registrations"}
          </h2>
          {selectedRef && (
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => setSelectedRef(null)}
            >
              Show all references
            </button>
          )}
        </div>
        <p className="admin-field-hint">
          Pick a reference in the chart or the list above to see only its registrations.
        </p>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>School</th>
                <th>Reference</th>
                <th>Source</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    No registrations
                  </td>
                </tr>
              ) : (
                tableRows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.registration_id}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-name-link"
                        onClick={() => setProfileId(r.id)}
                      >
                        {headName(r)}
                      </button>
                    </td>
                    <td>{r.school || "—"}</td>
                    <td>{r.brand_ambassador_name?.trim() || "—"}</td>
                    <td>
                      <span className={`admin-badge${isForm(r) ? " admin-badge-open" : " admin-badge-resolved"}`}>
                        {isForm(r) ? "Google Form" : "Website"}
                      </span>
                    </td>
                    <td>{r.type === "delegation" ? "Delegation" : "Delegate"}</td>
                    <td className={paymentClass(r.payment_status)}>
                      {paymentLabel(r.payment_status)}
                    </td>
                    <td>{formatDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <RegistrationProfileDialog
        registrationUuid={profileId}
        onClose={() => setProfileId(null)}
      />
    </>
  );
}
