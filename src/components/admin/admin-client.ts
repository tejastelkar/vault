export function normalizeAdminSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9@._+ -]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
