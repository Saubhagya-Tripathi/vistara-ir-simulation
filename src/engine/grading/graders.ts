/**
 * Per-answer-type deterministic grading functions.
 * All functions are pure; component points come verbatim from assessment.json
 * sub_answers[].points (never recomputed, never re-rounded at definition time).
 */
import type { AnswerValue } from "../../types";
import { extractHours, normalizeText, roundToHalf } from "./normalize";

export type NormalizeFn = (s: string) => string;

// ---------------------------------------------------------------------------
// Candidate value coercion (AnswerValue is a union; graders need concrete shapes)
// ---------------------------------------------------------------------------

export function asString(v: AnswerValue | undefined | null): string {
  return typeof v === "string" ? v : "";
}

export function asStringArray(v: AnswerValue | undefined | null): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

export function asStringRecord(v: AnswerValue | undefined | null): Record<string, string> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string") out[k] = val;
    else if (Array.isArray(val)) out[k] = val.join(" / ");
  }
  return out;
}

/** Like asStringRecord but keeps multi-value cells as arrays (classification_table). */
export function asCellRecord(v: AnswerValue | undefined | null): Record<string, string[]> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string") out[k] = [val];
    else if (Array.isArray(val)) out[k] = val.filter((x): x is string => typeof x === "string");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Exact-match types: single_choice, asset, ip, username, account, filename,
// path, string, yes_no, attack_technique, timestamp — all-or-nothing.
// ---------------------------------------------------------------------------

export function gradeExact(
  points: number,
  accepted: string[],
  candidate: string,
  normalize: NormalizeFn = normalizeText
): number {
  if (!candidate || !candidate.trim()) return 0;
  const c = normalize(candidate);
  return accepted.some((a) => normalize(a) === c) ? points : 0;
}

/**
 * Exact match with an optional numeric hour-range fallback
 * (Q-07-04(g) dwell time: any hour value 140–144 inclusive per accepted_range_hours).
 */
export function gradeExactWithRange(
  points: number,
  accepted: string[],
  candidate: string,
  range?: { min: number; max: number }
): number {
  if (gradeExact(points, accepted, candidate) === points) return points;
  if (range) {
    const hours = extractHours(candidate);
    if (hours !== null && hours >= range.min && hours <= range.max) return points;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// multi_select: exact accepted-set match -> full points. Otherwise
// earned = P x max(0, TP - FP) / |C|, rounded to nearest 0.5, computed against
// EACH accepted set (that set acting as C for the attempt); the max is taken.
// Covers Q-07-04(i) dual accepted sets and Q-02-02(e) 4-set/5-set resolution.
// ---------------------------------------------------------------------------

export function gradeMultiSelect(
  points: number,
  canonical: string[],
  acceptedSets: string[][],
  candidate: string[]
): number {
  const sel = new Set(candidate.map(normalizeText));
  const sets = acceptedSets.length > 0 ? acceptedSets : [canonical];
  if (sets.length === 0 || sets.every((s) => s.length === 0)) return 0;

  for (const s of sets) {
    const ref = new Set(s.map(normalizeText));
    if (ref.size === sel.size && [...ref].every((x) => sel.has(x))) return points;
  }
  let best = 0;
  for (const s of sets) {
    const ref = new Set(s.map(normalizeText));
    let tp = 0;
    let fp = 0;
    for (const x of sel) {
      if (ref.has(x)) tp++;
      else fp++;
    }
    const score = roundToHalf((points * Math.max(0, tp - fp)) / ref.size);
    if (score > best) best = score;
  }
  return best;
}

// ---------------------------------------------------------------------------
// ordered_sequence: Kendall-tau concordance against the canonical order.
// earned = P x concordant_pairs / (n(n-1)/2), rounded to nearest 0.5.
// accepted_answers prose for these items is ignored; `aliases[i]` may carry
// alternative renderings of canonical element i (e.g. timeline descriptions
// for TL keys, or the short labels listed as an accepted array).
// ---------------------------------------------------------------------------

export function gradeOrderedSequence(
  points: number,
  canonical: string[],
  candidate: string[],
  aliases?: string[][]
): number {
  const n = canonical.length;
  if (n < 2) return 0;

  const indexOf = new Map<string, number>();
  canonical.forEach((c, i) => indexOf.set(normalizeText(c), i));
  aliases?.forEach((group, i) => {
    for (const a of group) {
      const key = normalizeText(a);
      if (!indexOf.has(key)) indexOf.set(key, i);
    }
  });

  const position = new Array<number>(n).fill(-1);
  candidate.forEach((el, p) => {
    const idx = indexOf.get(normalizeText(el));
    if (idx !== undefined && position[idx] === -1) position[idx] = p;
  });

  let concordant = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (position[i] !== -1 && position[j] !== -1 && position[i] < position[j]) concordant++;
    }
  }
  const totalPairs = (n * (n - 1)) / 2;
  return roundToHalf((points * concordant) / totalPairs);
}

// ---------------------------------------------------------------------------
// matching: per-pair all-or-nothing; each correct pair earns
// component_points / number_of_pairs. Keys and values normalized as text.
// ---------------------------------------------------------------------------

export function gradeMatching(
  points: number,
  canonical: Record<string, string>,
  candidate: Record<string, string>
): number {
  const keys = Object.keys(canonical);
  if (keys.length === 0) return 0;
  const perPair = points / keys.length;
  const cand = new Map<string, string>();
  for (const [k, v] of Object.entries(candidate)) cand.set(normalizeText(k), normalizeText(v));
  let correct = 0;
  for (const k of keys) {
    if (cand.get(normalizeText(k)) === normalizeText(canonical[k])) correct++;
  }
  return perPair * correct;
}

// ---------------------------------------------------------------------------
// classification_table (Q-05-01 only): 10 hosts x 4 classes = 40 cells at
// cell_points each. Each host is classified into exactly one class (the UI is
// a per-host radio row). Per the binding worked example (SCORING_MODEL.md
// §10.2: candidate K misclassifies ONE host and earns 39/40 cells = 9.75),
// a host contributes all 4 cells when the chosen class is canonical and loses
// exactly 1 cell (3/4) otherwise. earned = correctCells x cellPoints.
// NOT re-rounded to 0.5 (sole rounding exemption).
// ---------------------------------------------------------------------------

export interface ClassificationGrade {
  earned: number;
  correctCells: number;
  totalCells: number;
}

export function gradeClassificationTable(
  cellPoints: number,
  classes: string[],
  canonical: Record<string, string>,
  candidate: Record<string, string[]>
): ClassificationGrade {
  const cellsPerHost = classes.length;
  const candByHost = new Map<string, Set<string>>();
  for (const [host, sel] of Object.entries(candidate)) {
    candByHost.set(normalizeText(host), new Set(sel.map(normalizeText)));
  }
  let correctCells = 0;
  const hosts = Object.keys(canonical);
  for (const host of hosts) {
    const sel = candByHost.get(normalizeText(host)) ?? new Set<string>();
    const canonCls = normalizeText(canonical[host]);
    const hostCorrect = sel.size === 1 && sel.has(canonCls);
    correctCells += hostCorrect ? cellsPerHost : cellsPerHost - 1;
  }
  return {
    earned: correctCells * cellPoints,
    correctCells,
    totalCells: hosts.length * cellsPerHost,
  };
}

// ---------------------------------------------------------------------------
// Evidence selection tier rule (25 scored evidence-linked tasks):
// full iff selection superset of required with zero incorrect IDs;
// half iff superset with <= 2 incorrect; else 0.
// ---------------------------------------------------------------------------

export function gradeEvidenceSelection(
  points: number,
  required: string[],
  selection: string[]
): number {
  const req = new Set(required.map(normalizeText));
  const sel = new Set(selection.map(normalizeText));
  for (const r of req) {
    if (!sel.has(r)) return 0;
  }
  let incorrect = 0;
  for (const s of sel) {
    if (!req.has(s)) incorrect++;
  }
  if (incorrect === 0) return points;
  if (incorrect <= 2) return points / 2;
  return 0;
}
