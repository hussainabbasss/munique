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

export const ALL_COUNTRIES = [...P5_COUNTRIES, ...STANDARD_COUNTRIES] as const;

export type CountryName = (typeof ALL_COUNTRIES)[number];

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
