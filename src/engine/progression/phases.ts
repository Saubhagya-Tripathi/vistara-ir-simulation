/**
 * Phase-gate and task-unlock evaluation.
 *
 * Semantics (PROGRESSION_LOGIC.md §1–3, §6; assessment.json phases/progression):
 *  - 8 phases P0–P7, strictly sequential. A phase opens when the previous
 *    phase's gate is met; a gate requires ALL tasks in that phase SUBMITTED,
 *    regardless of correctness.
 *  - Within an open phase tasks are freely navigable EXCEPT the intra-phase
 *    chains P6 (Q-06-01→…→Q-06-04) and P7 (Q-07-01→…→Q-07-04), where each
 *    task unlocks when its predecessor is submitted.
 *  - Q-07-02 additionally stays blocked while consequences.eradicationIncomplete
 *    is true (persistence rediscovered at validation; §4.3).
 *  - Submitting Q-07-04 ends the run (finished = true).
 *  - Completed phases and their evidence stay open; submitted answers lock.
 *
 * All functions here are pure: they read CandidateState and never mutate it.
 */

import type { CandidateState, PhaseId } from "../../types";

export const PHASE_ORDER: readonly PhaseId[] = [
  "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7",
];

/** Task membership per phase, from assessment.json `phases`. */
export const PHASE_TASKS: Record<PhaseId, readonly string[]> = {
  P0: ["Q-00-01"],
  P1: ["Q-01-01", "Q-01-02"],
  P2: ["Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04"],
  P3: ["Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06"],
  P4: ["Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04"],
  P5: ["Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05"],
  P6: ["Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04"],
  P7: ["Q-07-01", "Q-07-02", "Q-07-03", "Q-07-04"],
};

/** Per-phase guidance budgets (minutes), from assessment.json `phases`. */
export const PHASE_TIME_BUDGET_MINUTES: Record<PhaseId, number> = {
  P0: 15, P1: 30, P2: 45, P3: 60, P4: 45, P5: 30, P6: 45, P7: 30,
};

/** Soft nudge fires when phase elapsed exceeds 120% of its budget (once per phase). */
export const PACING_NUDGE_FACTOR = 1.2;

/** Intra-phase causal chains (PROGRESSION_LOGIC.md §2). */
export const INTRA_PHASE_CHAINS: readonly (readonly string[])[] = [
  ["Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04"],
  ["Q-07-01", "Q-07-02", "Q-07-03", "Q-07-04"],
];

/** Submitting this task ends the run. */
export const FINAL_TASK_ID = "Q-07-04";

export const ALL_TASK_IDS: readonly string[] = PHASE_ORDER.flatMap(
  (p) => PHASE_TASKS[p],
);

const TASK_PHASE = new Map<string, PhaseId>();
for (const p of PHASE_ORDER) for (const t of PHASE_TASKS[p]) TASK_PHASE.set(t, p);

/** Predecessor within an intra-phase chain, or null if not chain-gated. */
const CHAIN_PREDECESSOR = new Map<string, string>();
for (const chain of INTRA_PHASE_CHAINS) {
  for (let i = 1; i < chain.length; i++) CHAIN_PREDECESSOR.set(chain[i], chain[i - 1]);
}

export function phaseOfTask(taskId: string): PhaseId | null {
  return TASK_PHASE.get(taskId) ?? null;
}

export function isSubmitted(state: CandidateState, taskId: string): boolean {
  // The submissions record is the ground truth; taskStatus is derived from it.
  return state.submissions[taskId] !== undefined || state.taskStatus[taskId] === "submitted";
}

/** Gate met = every task in the phase submitted, regardless of correctness. */
export function isPhaseGateMet(state: CandidateState, phase: PhaseId): boolean {
  return PHASE_TASKS[phase].every((t) => isSubmitted(state, t));
}

export function isPhaseOpen(state: CandidateState, phase: PhaseId): boolean {
  const idx = PHASE_ORDER.indexOf(phase);
  if (idx < 0) return false;
  if (idx === 0) return true; // P0 opens at assessment start
  return isPhaseGateMet(state, PHASE_ORDER[idx - 1]);
}

export function isPhaseComplete(state: CandidateState, phase: PhaseId): boolean {
  return isPhaseGateMet(state, phase);
}

export function openPhases(state: CandidateState): PhaseId[] {
  return PHASE_ORDER.filter((p) => isPhaseOpen(state, p));
}

/**
 * Q-07-02 (the safe-state gate) cannot be reached with live persistence:
 * while eradication is incomplete it stays blocked even if Q-07-01 is done.
 */
export function isQ0702Blocked(state: CandidateState): boolean {
  return state.consequences.eradicationIncomplete;
}

/**
 * A task is selectable (available or read-only review once submitted) when:
 *  - its phase is open, and
 *  - if it sits in an intra-phase chain, its chain predecessor is submitted, and
 *  - for Q-07-02, eradication is not flagged incomplete.
 */
export function isTaskUnlocked(state: CandidateState, taskId: string): boolean {
  const phase = phaseOfTask(taskId);
  if (!phase || !isPhaseOpen(state, phase)) return false;
  const pred = CHAIN_PREDECESSOR.get(taskId);
  if (pred && !isSubmitted(state, pred)) return false;
  if (taskId === "Q-07-02" && isQ0702Blocked(state)) return false;
  return true;
}

export function unlockedTasks(state: CandidateState): string[] {
  return ALL_TASK_IDS.filter((t) => isTaskUnlocked(state, t));
}

/**
 * Derive the full phase/task status maps from the submission record.
 * Used to (re)build CandidateState.phaseStatus / taskStatus consistently.
 */
export function deriveStatuses(state: CandidateState): {
  phaseStatus: CandidateState["phaseStatus"];
  taskStatus: CandidateState["taskStatus"];
} {
  const phaseStatus = {} as CandidateState["phaseStatus"];
  for (const p of PHASE_ORDER) {
    phaseStatus[p] = !isPhaseOpen(state, p)
      ? "locked"
      : isPhaseComplete(state, p)
        ? "complete"
        : "open";
  }
  const taskStatus: CandidateState["taskStatus"] = {};
  for (const t of ALL_TASK_IDS) {
    taskStatus[t] = isSubmitted(state, t)
      ? "submitted"
      : isTaskUnlocked(state, t)
        ? "available"
        : "locked";
  }
  return { phaseStatus, taskStatus };
}
