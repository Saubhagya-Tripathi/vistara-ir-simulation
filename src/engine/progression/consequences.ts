/**
 * Consequence-path evaluation (PROGRESSION_LOGIC.md §4; assessment.json
 * progression.consequence_paths). No dead ends, no new phases: wrong
 * operational decisions set state flags and open narrow recovery loops.
 *
 * Point losses and critical-failure recording (CF-1/CF-2) live in the
 * grading/scoring engine — this module only evaluates triggers, maintains
 * consequence flags, and gates the resubmit/rollback affordances.
 *
 * Canonical comparison sets come from assessment.json
 * supporting_structures (containment_state, eradication_steps). They are
 * grading-side data used here solely for progression gating; never render
 * them in candidate-facing UI.
 */

import type { AnswerValue, CandidateState, ConsequenceState } from "../../types";

// ---------------------------------------------------------------------------
// Canonical reference sets (assessment.json supporting_structures)
// ---------------------------------------------------------------------------

/** containment_state.isolate_hosts — the three proven-compromised hosts. */
export const CANONICAL_ISOLATE_HOSTS: readonly string[] = [
  "WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01",
];

/** containment_state.block_ips — the live C2 that must be blocked. */
export const CANONICAL_C2_IP = "185.220.101.47";

/**
 * eradication_steps (canonical step set), in assessment.json order. The
 * Q-06-03 (a) options label them i–vii in the same order.
 */
export const CANONICAL_ERADICATION_STEPS: readonly string[] = [
  "Remove scheduled task MicrosoftEdgeUpdateTaskMachineCore on APP-PRD-01",
  "Delete web shell img.aspx on WEB-PRD-01",
  "Delete staged artifacts (staging.zip + passwords.txt on WEB-PRD-01; C:\\Windows\\Temp\\collect dir + order_export_2026.zip on FILE-PRD-01)",
  "Delete rogue account svc_mon + audit groups it touched",
  "Credential resets: rajesh.kulkarni, svc_portal, ALL Domain Admin accounts, krbtgt TWICE, plus org-wide user password reset",
  "Remove the FW-01 any->3389 rule (W-01 fix)",
  "Disable/remove /staging/test/upload.aspx and restrict /staging/ (W-02b fix)",
];

const CANONICAL_STEP_NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

// ---------------------------------------------------------------------------
// Consequence events
// ---------------------------------------------------------------------------

export type ConsequenceEvent =
  | { type: "over_containment" }
  | { type: "under_containment" }
  | { type: "containment_remediated" }
  | { type: "eradication_incomplete" }
  | { type: "eradication_complete" }
  | { type: "premature_safe" }
  | { type: "critical_failure"; id: string };

/** Pure reducer: apply an event to the consequence flags. */
export function reduceConsequence(
  consequences: ConsequenceState,
  event: ConsequenceEvent,
): ConsequenceState {
  switch (event.type) {
    case "over_containment":
      return { ...consequences, overContainment: true };
    case "under_containment":
      return {
        ...consequences,
        underContainment: true,
        underContainmentRemediated: false,
      };
    case "containment_remediated":
      return { ...consequences, underContainmentRemediated: true };
    case "eradication_incomplete":
      return { ...consequences, eradicationIncomplete: true };
    case "eradication_complete":
      return { ...consequences, eradicationIncomplete: false };
    case "premature_safe":
      return { ...consequences, prematureSafe: true };
    case "critical_failure":
      return consequences.triggeredCriticalFailures.includes(event.id)
        ? consequences
        : {
            ...consequences,
            triggeredCriticalFailures: [
              ...consequences.triggeredCriticalFailures,
              event.id,
            ],
          };
  }
}

// ---------------------------------------------------------------------------
// Q-06-01 containment evaluation (§4.1 / §4.2)
// ---------------------------------------------------------------------------

export interface ContainmentVerdict {
  over: boolean;
  under: boolean;
  /** Selected isolation targets beyond the canonical three hosts. */
  overAssets: string[];
  /** Canonical isolations/C2 block that are missing. */
  missing: string[];
}

function asStringArray(value: AnswerValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

/** True when the Q-06-01 (c) network action blocks the C2 IP. */
function blocksC2(value: AnswerValue | undefined): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  // Submissions may carry the option key ("A") or the full option text.
  return v === "A" || v.startsWith("A ") || v.startsWith("A -") || v.includes(CANONICAL_C2_IP);
}

/**
 * Evaluate a submitted Q-06-01 containment set.
 *  - Over (§4.1): isolation set includes anything beyond the canonical three
 *    hosts (e.g. DC-01 or the entire Server VLAN).
 *  - Under (§4.2): the C2 block 185.220.101.47 is omitted, or any of the
 *    three host isolations is missing.
 * A set can be both over- and under-contained at once.
 */
export function evaluateContainment(
  answers: Record<string, AnswerValue>,
): ContainmentVerdict {
  const hosts = asStringArray(answers["(a)"]);
  const canonical = new Set(CANONICAL_ISOLATE_HOSTS);
  const overAssets = hosts.filter((h) => !canonical.has(h));
  const missingHosts = CANONICAL_ISOLATE_HOSTS.filter((h) => !hosts.includes(h));
  const missing = [...missingHosts];
  if (!blocksC2(answers["(c)"])) missing.push(`block ${CANONICAL_C2_IP}`);
  return {
    over: overAssets.length > 0,
    under: missing.length > 0,
    overAssets,
    missing,
  };
}

/**
 * Consequence events raised by a Q-06-01 submission (empty when valid).
 * Note: `containment_remediated` is not emitted here — it is raised by the
 * store only when a previously under-contained set is resubmitted valid.
 */
export function containmentConsequences(
  answers: Record<string, AnswerValue>,
): ConsequenceEvent[] {
  const verdict = evaluateContainment(answers);
  const events: ConsequenceEvent[] = [];
  if (verdict.over) events.push({ type: "over_containment" });
  if (verdict.under) events.push({ type: "under_containment" });
  return events;
}

// ---------------------------------------------------------------------------
// Q-06-03 eradication evaluation (§4.3)
// ---------------------------------------------------------------------------

/**
 * Map a submitted Q-06-03 (a) entry to its canonical step numeral.
 * Accepts the bare numeral ("iii"), the option label
 * ("iii - Delete staged artifacts ..."), or a canonical step text.
 */
function normalizeEradicationEntry(entry: string): string | null {
  const trimmed = entry.trim();
  const numeralMatch = /^(vii|vi|iv|v|iii|ii|i|x|ix|viii)\b/i.exec(trimmed);
  if (numeralMatch) return numeralMatch[1].toLowerCase();
  const idx = CANONICAL_ERADICATION_STEPS.findIndex(
    (step) => trimmed === step || trimmed.includes(step) || step.includes(trimmed),
  );
  return idx >= 0 ? CANONICAL_STEP_NUMERALS[idx] : null;
}

/**
 * Set-wise comparison against supporting_structures.eradication_steps:
 * complete iff every canonical step is covered by the Q-06-03 (a) selection.
 * Extra selections (distractors) do not make the plan incomplete — scoring
 * handles those; progression only cares that no mechanism survives.
 */
export function isEradicationComplete(
  answers: Record<string, AnswerValue>,
): boolean {
  const selected = asStringArray(answers["(a)"])
    .map(normalizeEradicationEntry)
    .filter((n): n is string => n !== null);
  const set = new Set(selected);
  return CANONICAL_STEP_NUMERALS.every((n) => set.has(n));
}

// ---------------------------------------------------------------------------
// Resubmit exceptions (answer locking + §4 recovery loops)
// ---------------------------------------------------------------------------

/** Task IDs that may be resubmitted, and only under consequence flags. */
export const RESUBMITTABLE_TASKS: readonly string[] = ["Q-06-01", "Q-06-03"];

/**
 * Answers lock on submission (PROGRESSION_LOGIC.md §7). The only exceptions:
 *  - Q-06-01 while its last submitted set is over- or under-contained
 *    (rollback / remedial containment, §4.1–4.2);
 *  - Q-06-03 while consequences.eradicationIncomplete is true (§4.3 revision
 *    loop).
 */
export function canResubmit(state: CandidateState, taskId: string): boolean {
  if (!isSubmittedTask(state, taskId)) return false;
  if (taskId === "Q-06-01") {
    if (!state.consequences.overContainment && !state.consequences.underContainment) {
      return false;
    }
    const submission = state.submissions[taskId];
    const verdict = evaluateContainment(submission.answers);
    return verdict.over || verdict.under;
  }
  if (taskId === "Q-06-03") {
    return state.consequences.eradicationIncomplete;
  }
  return false;
}

function isSubmittedTask(state: CandidateState, taskId: string): boolean {
  return state.taskStatus[taskId] === "submitted";
}
