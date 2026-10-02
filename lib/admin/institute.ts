/**
 * The delegate's institute for printouts. Google Form imports are the AMHSS
 * batch and their `school` holds the class and section, so it is shown
 * beside the school name instead of as the school.
 */
export function instituteLabel(
  source: string | null | undefined,
  school: string | null | undefined,
) {
  const value = (school ?? "").trim();
  if (source === "form_import") return value ? `AMHSS · ${value}` : "AMHSS";
  return value;
}
