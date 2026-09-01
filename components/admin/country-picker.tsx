"use client";

import { P5_COUNTRIES } from "@/lib/allotments/countries";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  committeePool?: string[];
  required?: boolean;
  onChange?: (value: string) => void;
};

export function CountryPicker({
  id = "country",
  name = "country",
  value,
  defaultValue = "",
  committeePool = [],
  required = false,
  onChange,
}: Props) {
  const isControlled = value !== undefined;

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
          {committeePool.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="P5 — EB manual only">
        {P5_COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
