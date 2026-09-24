/**
 * Pure search helpers for the evidence browser. List filtering is
 * synchronous over descriptors; body search uses bodyContains /
 * countOccurrences against loadEvidenceBody() results (cached upstream).
 */
import type { EvidenceCandidateView } from "../../types";

/** Case-insensitive filter over id / title / host / source. */
export function filterDescriptors(
  descriptors: EvidenceCandidateView[],
  query: string,
): EvidenceCandidateView[] {
  const q = query.trim().toLowerCase();
  if (!q) return descriptors;
  return descriptors.filter(
    (d) =>
      d.evidence_id.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.host ?? "").toLowerCase().includes(q) ||
      d.source.toLowerCase().includes(q),
  );
}

/** Case-insensitive substring test against an artifact body. */
export function bodyContains(body: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && body.toLowerCase().includes(q);
}

/** Non-overlapping occurrence count, case-insensitive. */
export function countOccurrences(body: string, query: string): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  const hay = body.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = hay.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/**
 * Split a line into match / non-match parts for the current query
 * (case-insensitive). Returns a single unmatched part when the query is
 * empty or absent from the line.
 */
export function splitHighlight(text: string, query: string): HighlightPart[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [{ text, match: false }];
  const parts: HighlightPart[] = [];
  const lower = text.toLowerCase();
  let cursor = 0;
  let idx = lower.indexOf(needle);
  while (idx !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false });
    parts.push({ text: text.slice(idx, idx + needle.length), match: true });
    cursor = idx + needle.length;
    idx = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length ? parts : [{ text, match: false }];
}
