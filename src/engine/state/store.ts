/**
 * Candidate-state store (zustand). Holds the single CandidateState plus all
 * run actions. Autosaves to the injected Persistence after every mutation
 * (PROGRESSION_LOGIC.md §7). All illegal transitions are no-ops that return
 * false — the store never throws into the UI.
 *
 * Scoring note: TaskSubmission.earned / score / breakdown are grading-engine
 * outputs. This store records the submission with placeholder zeros; the
 * grading/scoring engine (separate module) computes points post-run.
 */

import { create } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  AnswerValue,
  CandidateState,
  ConsequenceState,
  HintUse,
  PhaseId,
  SafeStateProgress,
  TaskSubmission,
} from "../../types";
import {
  ALL_TASK_IDS,
  FINAL_TASK_ID,
  PHASE_ORDER,
  PHASE_TASKS,
  PHASE_TIME_BUDGET_MINUTES,
  PACING_NUDGE_FACTOR,
  deriveStatuses,
  isTaskUnlocked,
  phaseOfTask,
} from "../progression/phases";
import { revealedEvidence } from "../progression/reveal";
import {
  canResubmit,
  containmentConsequences,
  evaluateContainment,
  isEradicationComplete,
  reduceConsequence,
  type ConsequenceEvent,
} from "../progression/consequences";
import {
  Persistence,
  STATE_VERSION,
  type StorageAdapter,
} from "./persistence";

/** Hint penalties per task (assessment.json items[].hints[].penalty). */
export const HINT_PENALTIES: Record<string, readonly number[]> = {
  "Q-00-01": [1],
  "Q-01-01": [1],
  "Q-01-02": [1],
  "Q-02-01": [1],
  "Q-02-02": [2, 2],
  "Q-02-03": [2],
  "Q-02-04": [1],
  "Q-03-01": [2],
  "Q-03-02": [2],
  "Q-03-03": [2],
  "Q-03-04": [2],
  "Q-03-05": [2],
  "Q-03-06": [1],
  "Q-04-01": [1],
  "Q-04-02": [2],
  "Q-04-03": [2],
  "Q-04-04": [1],
  "Q-05-01": [2],
  "Q-05-02": [2],
  "Q-05-03": [2],
  "Q-05-04": [3],
  "Q-05-05": [2],
  "Q-06-01": [2],
  "Q-06-02": [1],
  "Q-06-03": [2],
  "Q-06-04": [2],
  "Q-07-01": [2],
  "Q-07-02": [2],
  "Q-07-03": [2],
  "Q-07-04": [3],
};

/** Max hints per task (PROGRESSION_LOGIC.md §7). */
export const MAX_HINTS_PER_TASK = 2;

export type SafeStateAction =
  | { kind: "review_interim" }
  | { kind: "declare_stage1"; declaration: "SAFE" | "NOT SAFE" }
  | { kind: "declare_stage2"; declaration: "SAFE" | "NOT SAFE" };

export interface SimStore {
  state: CandidateState | null;
  startSession(candidateName: string, candidateRole?: string): void;
  selectTask(taskId: string): boolean;
  saveDraft(
    taskId: string,
    answers: Record<string, AnswerValue>,
    evidenceSelection?: string[],
  ): boolean;
  submitTask(
    taskId: string,
    answers?: Record<string, AnswerValue>,
    evidenceSelection?: string[],
  ): boolean;
  useHint(taskId: string, hintIndex: number): boolean;
  markEvidenceViewed(evidenceId: string): void;
  markEvidenceAnalyzed(evidenceId: string): void;
  toggleBookmark(evidenceId: string): void;
  setNote(key: string, text: string): void;
  applyConsequence(event: ConsequenceEvent): void;
  advanceSafeState(action: SafeStateAction): boolean;
  setReportField(field: string, value: AnswerValue): void;
  /** Accumulate elapsed ms; returns the phase id when a nudge newly fires. */
  tickElapsed(deltaMs: number): PhaseId | null;
  resetSession(): void;
}

export function createInitialCandidateState(
  candidateName: string,
  candidateRole: string = "Senior IR Analyst",
  now: Date = new Date(),
): CandidateState {
  const base: CandidateState = {
    version: STATE_VERSION,
    candidateName,
    candidateRole,
    startedAt: now.toISOString(),
    elapsedBeforePauseMs: 0,
    currentPhase: "P0",
    currentTask: null,
    phaseStatus: {
      P0: "open", P1: "locked", P2: "locked", P3: "locked",
      P4: "locked", P5: "locked", P6: "locked", P7: "locked",
    },
    taskStatus: {},
    drafts: {},
    evidenceDrafts: {},
    submissions: {},
    revealedEvidence: [],
    viewedEvidence: [],
    analyzedEvidence: [],
    bookmarkedEvidence: [],
    hintsUsed: [],
    notes: {},
    safeState: {
      stage: 1,
      interimReviewed: false,
      stage1Declaration: null,
      rerunRevealed: false,
      remediationLoopUsed: false,
    },
    consequences: {
      overContainment: false,
      underContainment: false,
      underContainmentRemediated: false,
      eradicationIncomplete: false,
      prematureSafe: false,
      triggeredCriticalFailures: [],
    },
    reportFields: {},
    execSummary: "",
    phaseElapsedMs: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0, P7: 0 },
    nudgedPhases: [],
    finished: false,
  };
  const { phaseStatus, taskStatus } = deriveStatuses(base);
  return {
    ...base,
    phaseStatus,
    taskStatus,
    revealedEvidence: revealedEvidence(base),
  };
}

function syncDerived(state: CandidateState): CandidateState {
  const { phaseStatus, taskStatus } = deriveStatuses(state);
  return {
    ...state,
    phaseStatus,
    taskStatus,
    revealedEvidence: revealedEvidence(state),
  };
}

/** Sync safeState from a Q-07-02 submission's answers. */
function applyQ0702Answers(
  safeState: SafeStateProgress,
  consequences: ConsequenceState,
  answers: Record<string, AnswerValue>,
): { safeState: SafeStateProgress; consequences: ConsequenceState } {
  let ss = safeState;
  let cs = consequences;
  const stage1 = answers["(a)"];
  if (typeof stage1 === "string" && ss.stage1Declaration === null) {
    ss = { ...ss, interimReviewed: true, stage1Declaration: stage1 as "SAFE" | "NOT SAFE" };
    if (stage1 === "NOT SAFE") {
      ss = { ...ss, rerunRevealed: true };
    } else if (stage1 === "SAFE") {
      // §4.4: premature SAFE — narrative override runs the missing checks
      // (remediation loop) and the 16:55 re-run becomes available. CF-1 is
      // recorded on the unsafe declaration (SCORING_MODEL.md §7).
      ss = { ...ss, rerunRevealed: true, remediationLoopUsed: true };
      cs = reduceConsequence(cs, { type: "premature_safe" });
      cs = reduceConsequence(cs, { type: "critical_failure", id: "CF-1" });
    }
  }
  if (typeof answers["(c)"] === "string" && ss.rerunRevealed) {
    ss = { ...ss, stage: 2 };
  }
  return { safeState: ss, consequences: cs };
}

type Set = (partial: Partial<SimStore>) => void;
type Get = () => SimStore;

function buildInitializer(persistence: Persistence) {
  const commit = (set: Set, next: CandidateState) => {
    persistence.save(next);
    set({ state: next });
  };

  return (set: Set, get: Get): SimStore => ({
    state: persistence.load(),

    startSession(candidateName: string, candidateRole?: string) {
      commit(set, createInitialCandidateState(candidateName, candidateRole));
    },

    selectTask(taskId: string) {
      const state = get().state;
      if (!state || state.finished) return false;
      const phase = phaseOfTask(taskId);
      if (!phase || !isTaskUnlocked(state, taskId)) return false;
      commit(set, { ...state, currentTask: taskId, currentPhase: phase });
      return true;
    },

    saveDraft(taskId, answers, evidenceSelection) {
      const state = get().state;
      if (!state || state.finished) return false;
      if (!phaseOfTask(taskId)) return false;
      const submitted = state.taskStatus[taskId] === "submitted";
      // Drafts are writable only while unsubmitted, or during a §4 resubmit loop.
      if (submitted && !canResubmit(state, taskId)) return false;
      if (!submitted && !isTaskUnlocked(state, taskId)) return false;
      commit(set, {
        ...state,
        drafts: { ...state.drafts, [taskId]: answers },
        evidenceDrafts: evidenceSelection
          ? { ...state.evidenceDrafts, [taskId]: evidenceSelection }
          : state.evidenceDrafts,
      });
      return true;
    },

    submitTask(taskId, answers, evidenceSelection) {
      const state = get().state;
      if (!state || state.finished) return false;
      if (!ALL_TASK_IDS.includes(taskId)) return false;
      const submitted = state.taskStatus[taskId] === "submitted";
      // Answer locking: resubmission only via the narrow §4 exceptions.
      if (submitted && !canResubmit(state, taskId)) return false;
      if (!submitted && !isTaskUnlocked(state, taskId)) return false;

      const finalAnswers =
        answers ?? state.drafts[taskId] ?? {};
      const finalEvidence =
        evidenceSelection ?? state.evidenceDrafts[taskId] ?? [];

      const hintPenalty = state.hintsUsed
        .filter((h) => h.taskId === taskId)
        .reduce((sum, h) => sum + h.penalty, 0);

      const submission: TaskSubmission = {
        taskId,
        answers: finalAnswers,
        evidenceSelection: finalEvidence,
        submittedAt: new Date().toISOString(),
        earned: 0, // computed by the grading engine
        hintPenalty,
        score: 0, // computed by the scoring engine
        breakdown: {},
      };

      let consequences = state.consequences;
      let safeState = state.safeState;

      if (taskId === "Q-06-01") {
        const verdict = evaluateContainment(finalAnswers);
        for (const event of containmentConsequences(finalAnswers)) {
          consequences = reduceConsequence(consequences, event);
        }
        if (verdict.under) {
          // CF-2 is recorded on the omitting submission and survives the
          // §4.2 remedial loop (SCORING_MODEL.md §7 note).
          consequences = reduceConsequence(consequences, {
            type: "critical_failure",
            id: "CF-2",
          });
        }
        if (!verdict.under && state.consequences.underContainment) {
          // Remedial containment executed — the SIEM escalation clears (§4.2).
          consequences = reduceConsequence(consequences, {
            type: "containment_remediated",
          });
        }
      } else if (taskId === "Q-06-03") {
        consequences = reduceConsequence(
          consequences,
          isEradicationComplete(finalAnswers)
            ? { type: "eradication_complete" }
            : { type: "eradication_incomplete" },
        );
      } else if (taskId === "Q-07-02") {
        const synced = applyQ0702Answers(safeState, consequences, finalAnswers);
        safeState = synced.safeState;
        consequences = synced.consequences;
      }

      const next: CandidateState = syncDerived({
        ...state,
        submissions: { ...state.submissions, [taskId]: submission },
        consequences,
        safeState,
        finished: taskId === FINAL_TASK_ID ? true : state.finished,
      });
      commit(set, next);
      return true;
    },

    useHint(taskId, hintIndex) {
      const state = get().state;
      if (!state || state.finished) return false;
      const penalties = HINT_PENALTIES[taskId];
      if (!penalties || hintIndex < 0 || hintIndex >= penalties.length) return false;
      if (state.taskStatus[taskId] === "submitted") return false;
      if (!isTaskUnlocked(state, taskId)) return false;
      const used = state.hintsUsed.filter((h) => h.taskId === taskId);
      if (used.length >= MAX_HINTS_PER_TASK) return false;
      if (used.some((h) => h.hintIndex === hintIndex)) return false;
      const hint: HintUse = {
        taskId,
        hintIndex,
        at: new Date().toISOString(),
        penalty: penalties[hintIndex],
      };
      commit(set, { ...state, hintsUsed: [...state.hintsUsed, hint] });
      return true;
    },

    markEvidenceViewed(evidenceId: string) {
      const state = get().state;
      if (!state) return;
      if (!state.revealedEvidence.includes(evidenceId)) return;
      if (state.viewedEvidence.includes(evidenceId)) return;
      commit(set, {
        ...state,
        viewedEvidence: [...state.viewedEvidence, evidenceId],
      });
    },

    markEvidenceAnalyzed(evidenceId: string) {
      const state = get().state;
      if (!state) return;
      if (!state.revealedEvidence.includes(evidenceId)) return;
      if (state.analyzedEvidence.includes(evidenceId)) return;
      // Analyzed implies viewed.
      const viewed = state.viewedEvidence.includes(evidenceId)
        ? state.viewedEvidence
        : [...state.viewedEvidence, evidenceId];
      commit(set, {
        ...state,
        viewedEvidence: viewed,
        analyzedEvidence: [...state.analyzedEvidence, evidenceId],
      });
    },

    toggleBookmark(evidenceId: string) {
      const state = get().state;
      if (!state) return;
      if (!state.revealedEvidence.includes(evidenceId)) return;
      const bookmarked = state.bookmarkedEvidence.includes(evidenceId)
        ? state.bookmarkedEvidence.filter((id) => id !== evidenceId)
        : [...state.bookmarkedEvidence, evidenceId];
      commit(set, { ...state, bookmarkedEvidence: bookmarked });
    },

    setNote(key: string, text: string) {
      const state = get().state;
      if (!state || state.finished) return;
      commit(set, { ...state, notes: { ...state.notes, [key]: text } });
    },

    applyConsequence(event: ConsequenceEvent) {
      const state = get().state;
      if (!state) return;
      commit(set, syncDerived({
        ...state,
        consequences: reduceConsequence(state.consequences, event),
      }));
    },

    advanceSafeState(action: SafeStateAction) {
      const state = get().state;
      if (!state || state.finished) return false;
      const ss = state.safeState;
      let next: CandidateState | null = null;
      switch (action.kind) {
        case "review_interim":
          // The interim packet is revealed at P7 entry; stage 1 only.
          if (ss.stage !== 1) return false;
          if (!state.revealedEvidence.includes("E-VALID-002")) return false;
          next = { ...state, safeState: { ...ss, interimReviewed: true } };
          break;
        case "declare_stage1":
          if (ss.stage !== 1 || !ss.interimReviewed || ss.stage1Declaration !== null) {
            return false;
          }
          if (action.declaration === "NOT SAFE") {
            next = {
              ...state,
              safeState: { ...ss, stage1Declaration: "NOT SAFE", rerunRevealed: true },
            };
          } else {
            // §4.4: premature SAFE — remediation loop makes the re-run available.
            // CF-1 is recorded on the unsafe declaration (SCORING_MODEL.md §7).
            let cs = reduceConsequence(state.consequences, {
              type: "premature_safe",
            });
            cs = reduceConsequence(cs, { type: "critical_failure", id: "CF-1" });
            next = {
              ...state,
              safeState: {
                ...ss,
                stage1Declaration: "SAFE",
                rerunRevealed: true,
                remediationLoopUsed: true,
              },
              consequences: cs,
            };
          }
          break;
        case "declare_stage2":
          // Stage-2 actions are impossible before the re-run is revealed.
          if (!ss.rerunRevealed) return false;
          next = { ...state, safeState: { ...ss, stage: 2 } };
          break;
      }
      commit(set, syncDerived(next));
      return true;
    },

    setReportField(field: string, value: AnswerValue) {
      const state = get().state;
      if (!state || state.finished) return;
      commit(set, {
        ...state,
        reportFields: { ...state.reportFields, [field]: value },
        execSummary: field === "execSummary" ? String(value) : state.execSummary,
      });
    },

    tickElapsed(deltaMs: number) {
      const state = get().state;
      if (!state || state.finished || deltaMs <= 0) return null;
      const phase = state.currentPhase;
      const phaseElapsedMs = {
        ...state.phaseElapsedMs,
        [phase]: state.phaseElapsedMs[phase] + deltaMs,
      };
      const threshold =
        PHASE_TIME_BUDGET_MINUTES[phase] * 60_000 * PACING_NUDGE_FACTOR;
      const shouldNudge =
        phaseElapsedMs[phase] > threshold && !state.nudgedPhases.includes(phase);
      commit(set, {
        ...state,
        elapsedBeforePauseMs: state.elapsedBeforePauseMs + deltaMs,
        phaseElapsedMs,
        nudgedPhases: shouldNudge
          ? [...state.nudgedPhases, phase]
          : state.nudgedPhases,
      });
      return shouldNudge ? phase : null;
    },

    resetSession() {
      persistence.clear();
      set({ state: null });
    },
  });
}

/** Framework-agnostic store factory (used by tests with in-memory storage). */
export function createSimStore(storage?: StorageAdapter) {
  return createStore<SimStore>()(buildInitializer(new Persistence(storage)));
}

/** React hook store for the browser app (localStorage autosave). */
export const useSimStore = create<SimStore>()(buildInitializer(new Persistence()));

// Re-exported for convenience so UI code imports from one place.
export { PHASE_ORDER, PHASE_TASKS };
