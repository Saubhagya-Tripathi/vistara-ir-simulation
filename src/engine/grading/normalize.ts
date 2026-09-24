/**
 * Deterministic answer normalization.
 * Rules (SCORING_MODEL.md / assessment.json metadata):
 *  - case-insensitive, trim, collapse internal whitespace
 *  - paths treat `/` and `\` as equivalent separators
 *  - no fuzzy / semantic matching anywhere
 */

/** Trim, collapse internal whitespace to single spaces, lowercase. */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Text normalization plus unified path separators (`\` -> `/`). */
export function normalizePath(value: string): string {
  return normalizeText(value).replace(/\\/g, "/");
}

/**
 * Extract an explicit hour value from free text, e.g. "142h", "142 hours".
 * Bare numbers are treated as hours. Returns null when no hour value is present.
 * Used only for sub-answers carrying `accepted_range_hours` (dwell-time tolerance).
 */
export function extractHours(value: string): number | null {
  const trimmed = value.trim();
  const withUnit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)$/i);
  if (withUnit) return Number(withUnit[1]);
  const bare = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return Number(bare[1]);
  return null;
}

/** Round to the nearest 0.5 (half up), tolerant of binary-float noise. */
export function roundToHalf(x: number): number {
  return Math.round(x * 2 + 1e-9) / 2;
}
