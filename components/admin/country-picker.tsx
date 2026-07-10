"use client";

import { P5_COUNTRIES, STANDARD_COUNTRIES } from "@/lib/allotments/countries";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
};

export function CountryPicker({
  id = "country",
  name = "country",
  defaultValue = "",
  required = false,
}: Props) {
  return (
    <select id={id} name={name} defaultValue={defaultValue} required={required}>
      <option value="">Select country…</option>
      <optgroup label="Standard (merit engine)">
        {STANDARD_COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </optgroup>
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
