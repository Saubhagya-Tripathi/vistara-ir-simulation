import { describe, expect, it } from "vitest";
import type { CandidateState } from "../src/types";
import {
  ALL_TASK_IDS,
  isPhaseOpen,
  isTaskUnlocked,
  phaseOfTask,
} from "../src/engine/progression/phases";
import {
  EVIDENCE_PATH_INTERIM,
  EVIDENCE_PATH_RERUN,
  REVEAL_PHASE_1,
  evidenceFileFor,
  revealedEvidence,
} from "../src/engine/progression/reveal";
import {
  canResubmit,
  evaluateContainment,
  isEradicationComplete,
} from "../src/engine/progression/consequences";
import { createInitialCandidateState } from "../src/engine/state/store";

function stateWith(submitted: string[], patch: Partial<CandidateState> = {}): CandidateState {
  const base = createInitialCandidateState("Test Candidate", "Test Role", new Date("2026-09-15T09:00:00Z"));
  const s: CandidateState = { ...base, ...patch, submissions: { ...base.submissions } };
  for (const id of submitted) {
    s.submissions[id] = {
      taskId: id,
      answers: {},
      evidenceSelection: [],
      submittedAt: "2026-09-15T10:00:00.000Z",
      earned: 0,
      hintPenalty: 0,
      score: 0,
      breakdown: {},
    };
    s.taskStatus[id] = "submitted";
  }
  return s;
}

const P0_TASKS = ["Q-00-01"];
const P1_TASKS = ["Q-01-01", "Q-01-02"];
const P2_TASKS = ["Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04"];
const P3_TASKS = ["Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06"];
const P4_TASKS = ["Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04"];
const P5_TASKS = ["Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05"];
const P6_TASKS = ["Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04"];

describe("phase gates", () => {
  it("P0 is open at start; everything else locked", () => {
    const s = stateWith([]);
    expect(isPhaseOpen(s, "P0")).toBe(true);
    expect(isPhaseOpen(s, "P1")).toBe(false);
    expect(isTaskUnlocked(s, "Q-00-01")).toBe(true);
    expect(isTaskUnlocked(s, "Q-01-01")).toBe(false);
  });

  it("gates open on submission regardless of correctness (empty answers count)", () => {
    const s = stateWith([...P0_TASKS]); // Q-00-01 "submitted" with empty answers
    expect(isPhaseOpen(s, "P1")).toBe(true);
    expect(isPhaseOpen(s, "P2")).toBe(false);
  });

  it("P2 requires BOTH P1 tasks; free navigation inside an open phase", () => {
    const half = stateWith([...P0_TASKS, "Q-01-01"]);
    expect(isPhaseOpen(half, "P2")).toBe(false);
    const full = stateWith([...P0_TASKS, ...P1_TASKS]);
    expect(isPhaseOpen(full, "P2")).toBe(true);
    // free navigation: Q-02-04 reachable before Q-02-01 is done
    expect(isTaskUnlocked(full, "Q-02-04")).toBe(true);
  });

  it("every one of the 30 tasks is reachable in order", () => {
    let submitted: string[] = [];
    const unreachable: string[] = [];
    for (const t of ALL_TASK_IDS) {
      const s = stateWith(submitted);
      if (!isTaskUnlocked(s, t)) unreachable.push(t);
      submitted = [...submitted, t];
    }
    expect(unreachable).toEqual([]);
  });

  it("P6 and P7 intra-phase chains gate each successor", () => {
    const through = (extra: string[]) =>
      stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, ...extra]);
    expect(isTaskUnlocked(through([]), "Q-06-01")).toBe(true);
    expect(isTaskUnlocked(through([]), "Q-06-02")).toBe(false);
    expect(isTaskUnlocked(through(["Q-06-01"]), "Q-06-02")).toBe(true);
    expect(isTaskUnlocked(through(["Q-06-01"]), "Q-06-03")).toBe(false);
    expect(isTaskUnlocked(through(["Q-06-01", "Q-06-02", "Q-06-03"]), "Q-06-04")).toBe(true);

    const p7 = (extra: string[]) => through([...P6_TASKS, ...extra]);
    expect(isTaskUnlocked(p7([]), "Q-07-01")).toBe(true);
    expect(isTaskUnlocked(p7([]), "Q-07-02")).toBe(false);
    expect(isTaskUnlocked(p7(["Q-07-01"]), "Q-07-02")).toBe(true);
    expect(isTaskUnlocked(p7(["Q-07-01", "Q-07-02"]), "Q-07-03")).toBe(true);
    expect(isTaskUnlocked(p7(["Q-07-01", "Q-07-02", "Q-07-03"]), "Q-07-04")).toBe(true);
  });

  it("Q-07-02 stays blocked while eradication is incomplete", () => {
    const s = stateWith(
      [...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, ...P6_TASKS, "Q-07-01"],
      {
        consequences: {
          overContainment: false,
          underContainment: false,
          underContainmentRemediated: false,
          eradicationIncomplete: true,
          prematureSafe: false,
          triggeredCriticalFailures: [],
        },
      },
    );
    expect(isTaskUnlocked(s, "Q-07-02")).toBe(false);
  });
});

describe("evidence reveal", () => {
  it("P0 reveals only the alert and ticket", () => {
    const s = stateWith([]);
    expect(revealedEvidence(s)).toEqual(["E-ALERT-001", "E-TICKET-001"]);
  });

  it("P1 entry reveals the full investigation set (57 artifacts) and nothing later", () => {
    const s = stateWith([...P0_TASKS]);
    const ids = revealedEvidence(s);
    expect(ids).toContain("E-WEB-003");
    expect(ids).toContain("E-AUTH-012");
    expect(ids.length).toBe(2 + REVEAL_PHASE_1.length);
    expect(ids).not.toContain("E-RESP-001");
    expect(ids).not.toContain("E-VALID-002");
  });

  it("P6 records materialize per executed decision, not at phase open", () => {
    const before = stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS]);
    expect(revealedEvidence(before)).not.toContain("E-RESP-001");
    const after1 = stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, "Q-06-01"]);
    expect(revealedEvidence(after1)).toEqual(expect.arrayContaining(["E-RESP-001", "E-AD-004"]));
    expect(revealedEvidence(after1)).not.toContain("E-RESP-002");
    const after4 = stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, ...P6_TASKS]);
    expect(revealedEvidence(after4)).toEqual(
      expect.arrayContaining(["E-RESP-002", "E-RESP-003", "E-RESP-004", "E-VALID-001"]),
    );
  });

  it("interim E-VALID-002 reveals at P7 entry (approved resolution); E-REPORT-001 waits for the re-run", () => {
    const atP7 = stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, ...P6_TASKS]);
    expect(revealedEvidence(atP7)).toContain("E-VALID-002");
    expect(revealedEvidence(atP7)).not.toContain("E-REPORT-001");
    expect(evidenceFileFor("E-VALID-002", atP7)).toBe(EVIDENCE_PATH_INTERIM);

    const rerun = stateWith([...P0_TASKS, ...P1_TASKS, ...P2_TASKS, ...P3_TASKS, ...P4_TASKS, ...P5_TASKS, ...P6_TASKS], {
      safeState: { stage: 2, interimReviewed: true, stage1Declaration: "NOT SAFE", rerunRevealed: true, remediationLoopUsed: false },
    });
    expect(revealedEvidence(rerun)).toContain("E-REPORT-001");
    expect(evidenceFileFor("E-VALID-002", rerun)).toBe(EVIDENCE_PATH_RERUN);
  });
});

describe("consequence evaluation", () => {
  it("containment verdicts: over, under, both, clean", () => {
    const clean = evaluateContainment({
      "(a)": ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01"],
      "(c)": "A",
    });
    expect(clean).toMatchObject({ over: false, under: false });

    const over = evaluateContainment({ "(a)": ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DC-01"], "(c)": "A" });
    expect(over.over).toBe(true);
    expect(over.under).toBe(false);

    const under = evaluateContainment({ "(a)": ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01"], "(c)": "B" });
    expect(under.under).toBe(true);
    expect(under.missing).toContain("block 185.220.101.47");

    const both = evaluateContainment({ "(a)": ["WEB-PRD-01", "entire Server VLAN"], "(c)": "D" });
    expect(both.over && both.under).toBe(true);
  });

  it("eradication completeness is set-wise over the canonical step numerals", () => {
    expect(isEradicationComplete({ "(a)": ["i", "ii", "iii", "iv", "v", "vi", "vii"] })).toBe(true);
    expect(isEradicationComplete({ "(a)": ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"] })).toBe(true); // distractor extra OK
    expect(isEradicationComplete({ "(a)": ["i", "ii", "iii", "iv", "v", "vi"] })).toBe(false); // missing W-02b fix
    expect(isEradicationComplete({ "(a)": ["viii"] })).toBe(false); // the backup trap
  });

  it("resubmit allowed only for Q-06-01/Q-06-03 under consequence flags", () => {
    const cleanRun = stateWith(["Q-06-01", "Q-06-03"]);
    expect(canResubmit(cleanRun, "Q-06-01")).toBe(false);
    expect(canResubmit(cleanRun, "Q-06-03")).toBe(false);
    expect(canResubmit(cleanRun, "Q-00-01")).toBe(false);

    const flagged = stateWith(["Q-06-03"], {
      consequences: {
        overContainment: false,
        underContainment: false,
        underContainmentRemediated: false,
        eradicationIncomplete: true,
        prematureSafe: false,
        triggeredCriticalFailures: [],
      },
    });
    expect(canResubmit(flagged, "Q-06-03")).toBe(true);
  });
});

describe("task metadata sanity", () => {
  it("all 30 task IDs map to phases", () => {
    expect(ALL_TASK_IDS).toHaveLength(30);
    for (const t of ALL_TASK_IDS) expect(phaseOfTask(t)).not.toBeNull();
  });
});
