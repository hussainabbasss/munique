"use client";

import { useState } from "react";

type Props = {
  name?: string;
  defaultValue?: string[];
};

function normalizeEntry(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function CountryPoolEditor({
  name = "country_pool",
  defaultValue = [],
}: Props) {
  const [entries, setEntries] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  const addEntries = (raw: string) => {
    const candidates = raw
      .split(/[\n,]+/)
      .map(normalizeEntry)
      .filter(Boolean);

    if (candidates.length === 0) return;

    setEntries((current) => {
      const seen = new Set(current.map((entry) => entry.toLowerCase()));
      const next = [...current];

      for (const candidate of candidates) {
        const key = candidate.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(candidate);
      }

      return next;
    });
    setDraft("");
  };

  const remove = (entry: string) => {
    setEntries((current) => current.filter((item) => item !== entry));
  };

  return (
    <div className="admin-field admin-country-pool">
      <input type="hidden" name={name} value={JSON.stringify(entries)} />
      <label className="admin-field-label" htmlFor="country_pool_input">
        Allotment pool
      </label>
      <p className="admin-field-hint">
        Type each country or allotment and add it to the pool. The merit engine
        picks only from this list — P5 is never auto-assigned.
      </p>

      {entries.length > 0 && (
        <div className="admin-country-pool-chips" aria-label="Allotment pool">
          {entries.map((entry) => (
            <button
              key={entry}
              type="button"
              className="admin-country-pool-chip"
              onClick={() => remove(entry)}
              aria-label={`Remove ${entry}`}
            >
              {entry}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="admin-country-pool-add-row">
        <input
          id="country_pool_input"
          type="text"
          className="admin-country-pool-input"
          placeholder="e.g. Pakistan, Germany, Observer…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addEntries(draft);
            }
          }}
        />
        <button
          type="button"
          className="btn-admin-secondary"
          onClick={() => addEntries(draft)}
          disabled={!draft.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}
