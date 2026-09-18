"use client";

import { P5_COUNTRIES } from "@/lib/allotments/countries";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  committeePool?: string[];
  /** Lowercased country → holder name, for seats already taken in this committee. */
  takenBy?: ReadonlyMap<string, string>;
  required?: boolean;
  onChange?: (value: string) => void;
};

export function CountryPicker({
  id = "country",
  name = "country",
  value,
  defaultValue = "",
  committeePool = [],
  takenBy,
  required = false,
  onChange,
}: Props) {
  const isControlled = value !== undefined;

  const renderOption = (country: string) => {
    const holder = takenBy?.get(country.trim().toLowerCase());
    return (
      <option key={country} value={country} disabled={Boolean(holder)}>
        {holder ? `${country} — taken by ${holder}` : country}
      </option>
    );
  };

  return (
    <select
      id={id}
      name={name}
      value={isControlled ? value : undefined}
      defaultValue={isControlled ? undefined : defaultValue}
      required={required}
      onChange={(event) => onChange?.(event.target.value)}
    >
      <option value="">Select country…</option>
      {committeePool.length > 0 && (
        <optgroup label="Committee pool">
          {committeePool.map(renderOption)}
        </optgroup>
      )}
      <optgroup label="P5 — EB manual only">
        {P5_COUNTRIES.map(renderOption)}
      </optgroup>
    </select>
  );
}
