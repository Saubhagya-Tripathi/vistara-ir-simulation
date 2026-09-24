/**
 * Grades one task submission: every sub-answer plus the evidence selection.
 * Returns the pre-hint earned total and a per-component breakdown.
 *
 * Rules:
 *  - Component points are used verbatim from sub_answers[].points.
 *  - Task total = sum of components, rounded to nearest 0.5 — except
 *    classification_table tasks (Q-05-01), the sole rounding exemption.
 *  - Q-02-02's evidence component IS sub-answer (e) (evidence_selection
 *    .expressed_as): no separate evidence points are added.
 *  - Q-05-01 earns_points=false: selection captured elsewhere (feedback/CF-3),
 *    never scored here.
 *  - structured_report sub-answers (Q-07-04(k)) are rubric-scored by a human:
 *    auto-earned 0, flagged via rubricPending; max stays in task points.
 */
import type { AnswerValue, SubAnswerKey, SupportingStructures, TaskKey } from "../../types";
import { normalizePath, roundToHalf } from "./normalize";
import {
  asCellRecord,
  asString,
  asStringArray,
  asStringRecord,
  gradeClassificationTable,
  gradeEvidenceSelection,
  gradeExact,
  gradeExactWithRange,
  gradeMatching,
  gradeMultiSelect,
  gradeOrderedSequence,
} from "./graders";

export interface TaskGrade {
  /** Pre-hint earned total (task-level 0.5 rounding applied unless exempt). */
  earned: number;
  /** Per-component earned points, keyed by sub-answer key, plus "evidence". */
  breakdown: Record<string, number>;
  /** True when a rubric-scored component exists and is not auto-graded. */
  rubricPending: boolean;
}

function acceptedStringList(accepted: unknown): string[] {
  if (!Array.isArray(accepted)) return [];
  return accepted.filter((x): x is string => typeof x === "string");
}

function acceptedSetList(accepted: unknown): string[][] {
  if (!Array.isArray(accepted)) return [];
  return accepted.filter((x): x is string[] => Array.isArray(x));
}

/** host -> canonical class, from supporting_structures (item canonical is a mirror). */
function hostClassificationMap(
  supporting: SupportingStructures,
  sa: SubAnswerKey
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of supporting.host_classification) map[h.host] = h.canonical_class;
  if (Object.keys(map).length > 0) return map;
  if (sa.canonical_answer !== null && typeof sa.canonical_answer === "object") {
    return sa.canonical_answer as Record<string, string>;
  }
  return {};
}

/**
 * Alternative renderings per canonical position for ordered_sequence items:
 *  - Q-05-03: timeline item descriptions map to TL keys (keys never shown to
 *    the candidate; canonical order comes from canonical_position).
 *  - others: when accepted_answers is an array of one array of the same length
 *    (e.g. Q-06-02's short labels), those labels alias the canonical strings.
 */
function orderedSequenceAliases(task: TaskKey, sa: SubAnswerKey, supporting: SupportingStructures): string[][] {
  const canonical = asStringArray(sa.canonical_answer as AnswerValue);
  const aliases: string[][] = canonical.map(() => []);
  if (task.id === "Q-05-03") {
    const byKey = new Map(supporting.timeline_items.map((t) => [t.key, t]));
    canonical.forEach((key, i) => {
      const item = byKey.get(key);
      if (item) aliases[i].push(item.description);
    });
    return aliases;
  }
  const sets = acceptedSetList(sa.accepted_answers);
  if (sets.length > 0 && sets[0].length === canonical.length) {
    sets[0].forEach((label, i) => aliases[i].push(label));
  }
  return aliases;
}

/** Canonical order for Q-05-03 from supporting_structures.timeline_items. */
function orderedSequenceCanonical(task: TaskKey, sa: SubAnswerKey, supporting: SupportingStructures): string[] {
  if (task.id === "Q-05-03" && supporting.timeline_items.length > 0) {
    return [...supporting.timeline_items]
      .sort((a, b) => a.canonical_position - b.canonical_position)
      .map((t) => t.key);
  }
  return asStringArray(sa.canonical_answer as AnswerValue);
}

export function gradeTask(
  task: TaskKey,
  answers: Record<string, AnswerValue>,
  evidenceSelection: string[],
  supporting: SupportingStructures
): TaskGrade {
  const breakdown: Record<string, number> = {};
  let rubricPending = false;
  let sum = 0;

  // Q-02-02 only: the evidence component IS sub-answer (e) — graded under the
  // evidence-selection tier rule, with the approved override that an exact
  // match to any listed accepted set (incl. the 5-ID set with E-AUTH-012)
  // earns full credit.
  const expressedAsKey = task.evidence_selection?.expressed_as ? "(e)" : null;

  task.sub_answers.forEach((sa, idx) => {
    const value = answers[sa.key];
    let earned = 0;
    switch (sa.answer_type) {
      case "multi_select": {
        if (expressedAsKey === sa.key && task.evidence_selection.required_set) {
          const selection = asStringArray(value);
          const sets = acceptedSetList(sa.accepted_answers);
          const exact = sets.some((s) => {
            const a = new Set(s.map((x) => x.toLowerCase()));
            return a.size === selection.length && selection.every((x) => a.has(x.toLowerCase()));
          });
          earned = exact
            ? sa.points
            : gradeEvidenceSelection(sa.points, task.evidence_selection.required_set, selection);
          break;
        }
        const canonical = asStringArray(sa.canonical_answer as AnswerValue);
        earned = gradeMultiSelect(sa.points, canonical, acceptedSetList(sa.accepted_answers), asStringArray(value));
        break;
      }
      case "ordered_sequence": {
        const canonical = orderedSequenceCanonical(task, sa, supporting);
        earned = gradeOrderedSequence(sa.points, canonical, asStringArray(value), orderedSequenceAliases(task, sa, supporting));
        break;
      }
      case "matching": {
        if (sa.canonical_answer !== null && typeof sa.canonical_answer === "object" && !Array.isArray(sa.canonical_answer)) {
          // Pair map on the sub-answer itself (Q-04-03(c), Q-06-04(b)).
          earned = gradeMatching(sa.points, sa.canonical_answer as Record<string, string>, asStringRecord(value));
        } else {
          // Q-05-04: the 15 behavior -> technique pairs live in
          // supporting_structures.attack_mappings; one pair per sub-answer.
          const mapping = supporting.attack_mappings[idx];
          const technique = mapping?.canonical_technique ?? asString(sa.canonical_answer as AnswerValue);
          const pairKey = mapping?.behavior ?? sa.key;
          earned = gradeMatching(sa.points, { [pairKey]: technique }, { [pairKey]: asString(value) });
        }
        break;
      }
      case "classification_table": {
        const canonical = hostClassificationMap(supporting, sa);
        const classes = sa.options ?? [];
        earned = gradeClassificationTable(sa.cell_points ?? 0, classes, canonical, asCellRecord(value)).earned;
        break;
      }
      case "structured_report": {
        // Human rubric-scored (Q-07-04(k), 5 pts): stored, never auto-graded.
        rubricPending = true;
        earned = 0;
        break;
      }
      case "path": {
        earned = gradeExact(sa.points, acceptedStringList(sa.accepted_answers), asString(value), normalizePath);
        break;
      }
      case "string": {
        earned = gradeExactWithRange(sa.points, acceptedStringList(sa.accepted_answers), asString(value), sa.accepted_range_hours);
        break;
      }
      default: {
        // single_choice, asset, ip, username, account, filename, yes_no,
        // attack_technique, timestamp — all-or-nothing vs accepted aliases.
        earned = gradeExact(sa.points, acceptedStringList(sa.accepted_answers), asString(value));
        break;
      }
    }
    breakdown[sa.key] = earned;
    sum += earned;
  });

  const ev = task.evidence_selection;
  if (ev && ev.earns_points && !ev.expressed_as && ev.required_set) {
    const evEarned = gradeEvidenceSelection(ev.points, ev.required_set, evidenceSelection);
    breakdown["evidence"] = evEarned;
    sum += evEarned;
  }

  const exempt = task.answer_type === "classification_table";
  return { earned: exempt ? sum : roundToHalf(sum), breakdown, rubricPending };
}
