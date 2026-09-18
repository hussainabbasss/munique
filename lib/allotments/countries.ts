/** UN Security Council permanent members — EB assigns manually, never auto-allotted. */
export const P5_COUNTRIES = [
  "USA",
  "United Kingdom",
  "France",
  "Russia",
  "China",
] as const;

/** Standard country pool for merit-engine auto-allocation. */
export const STANDARD_COUNTRIES = [
  "Pakistan",
  "India",
  "Germany",
  "Japan",
  "Brazil",
  "South Africa",
  "Canada",
  "Australia",
  "Mexico",
  "Turkey",
  "Egypt",
  "Nigeria",
  "Indonesia",
  "Italy",
  "Spain",
  "Poland",
  "Sweden",
  "Norway",
  "Argentina",
  "Colombia",
  "Kenya",
  "Malaysia",
  "Philippines",
  "Vietnam",
  "South Korea",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Iran",
  "Israel",
  "Ukraine",
  "Ethiopia",
  "Ghana",
  "Morocco",
  "Bangladesh",
  "Thailand",
  "Singapore",
  "New Zealand",
  "Ireland",
  "Belgium",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Portugal",
  "Greece",
  "Chile",
  "Peru",
  "Venezuela",
  "Cuba",
  "Jamaica",
] as const;

export function isP5Country(country: string) {
  const normalized = country.trim().toLowerCase();
  const p5Names = new Set([
    "usa",
    "united states",
    "united states of america",
    "u.s.a.",
    "united kingdom",
    "uk",
    "great britain",
    "france",
    "russia",
    "russian federation",
    "china",
    "people's republic of china",
  ]);

  return p5Names.has(normalized);
}

export const ALL_COUNTRIES = [...P5_COUNTRIES, ...STANDARD_COUNTRIES] as const;

export type CountryName = (typeof ALL_COUNTRIES)[number];

/** Return the committee's allotment pool as configured — empty when none set. */
export function resolveCommitteePool(pool: string[] | null | undefined) {
  if (!pool?.length) return [];
  return pool;
}

export function isCountryInPool(country: string, pool: readonly string[]) {
  const normalized = country.trim().toLowerCase();
  return pool.some((entry) => entry.trim().toLowerCase() === normalized);
}

/** Seat identity — a country is only taken within its own committee. */
export function seatKey(committeeId: string, country: string) {
  return `${committeeId}:${country.trim().toLowerCase()}`;
}

/** Pool seats the merit engine may still hand out in a committee (never P5). */
export function freeCommitteeSeats(
  committeeId: string,
  pool: string[] | null | undefined,
  takenSeats: ReadonlySet<string>,
) {
  const seen = new Set<string>();
  return resolveCommitteePool(pool).filter((country) => {
    const key = seatKey(committeeId, country);
    if (seen.has(key)) return false;
    seen.add(key);
    return !isP5Country(country) && !takenSeats.has(key);
  });
}
