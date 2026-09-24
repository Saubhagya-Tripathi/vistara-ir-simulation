import { describe, expect, it } from "vitest";
import type { AnswerValue, HintUse } from "../src/types";
import {
  correctAnswers,
  correctEvidence,
  items,
  scoringConfig,
  supporting,
  taskById,
} from "./grading.test";
import { detectCriticalFailures, scoreRun, type RunSubmission } from "../src/engine/scoring/scoreRun";
import { validateAssessment } from "../src/engine/scoring/selfCheck";

function sub(id: string, answers?: Record<string, AnswerValue>, evidence?: string[]): RunSubmission {
  const task = taskById(id);
  return {
    answers: answers ?? correctAnswers(task),
    evidenceSelection: evidence ?? correctEvidence(task),
  };
}

function hint(taskId: string, hintIndex: number, penalty: number): HintUse {
  return { taskId, hintIndex, penalty, at: "2026-09-15T10:00:00.000Z" };
}

const ALL_IDS = items.map((i) => i.id);

function fullSubmissions(): Record<string, RunSubmission> {
  const out: Record<string, RunSubmission> = {};
  for (const id of ALL_IDS) out[id] = sub(id);
  return out;
}

// ---------------------------------------------------------------------------
// Assessment self-check (load-time invariants on the real assessment.json)
// ---------------------------------------------------------------------------

describe("assessment self-check", () => {
  it("the real assessment.json satisfies every scoring invariant", () => {
    expect(validateAssessment(items, scoringConfig)).toEqual([]);
  });

  it("has exactly 30 tasks and 255 points", () => {
    expect(items).toHaveLength(30);
    expect(items.reduce((a, i) => a + i.points, 0)).toBe(255);
  });
});

// ---------------------------------------------------------------------------
// Fully correct run
// ---------------------------------------------------------------------------

describe("fully correct run", () => {
  const report = scoreRun(items, supporting, scoringConfig, fullSubmissions(), [], {
    rubricScores: { "Q-07-04": 5 },
  });

  it("every task earns full marks; raw total 255", () => {
    for (const id of ALL_IDS) expect(report.taskScores[id]).toBe(taskById(id).points);
    expect(report.rawTotal).toBe(255);
    expect(report.rawMax).toBe(255);
  });

  it("scores 100%, Distinction, passes, no CFs, nothing voided", () => {
    expect(report.finalPct).toBe(100);
    expect(report.band).toBe("Distinction");
    expect(report.passed).toBe(true);
    expect(report.criticalFailures).toEqual([]);
    expect(report.reportVoidedFields).toEqual([]);
  });

  it("flags the rubric as pending when no rubric score is supplied", () => {
    const pending = scoreRun(items, supporting, scoringConfig, fullSubmissions(), []);
    expect(pending.rubricPending).toBe(true);
    expect(pending.rubricPendingTasks).toEqual(["Q-07-04"]);
    expect(pending.taskScores["Q-07-04"]).toBe(10); // deterministic fields only
  });
});

// ---------------------------------------------------------------------------
// Partial run — every value below is fully decomposed in SCORING_MODEL.md §10
// (candidate K). Q-05-02 is 6.5 here (SM does not decompose K's 6.0).
// ---------------------------------------------------------------------------

describe("candidate K partial run (SM §10 derived values)", () => {
  const subs = fullSubmissions();

  // Q-01-01 = 5.5: (a) 4 correct + 1 FP -> 2.0; (b) correct 2.4; evidence full 1.2
  const q0101 = correctAnswers(taskById("Q-01-01"));
  q0101["(a)"] = [...(taskById("Q-01-01").sub_answers[0].canonical_answer as string[]), "ERP-APP-01"];
  subs["Q-01-01"] = sub("Q-01-01", q0101);

  // Q-02-02 = 5.0: (d) wrong (B); (e) required 4 + 1 incorrect -> half 1.0; hint 1 (-2)
  const q0202 = correctAnswers(taskById("Q-02-02"));
  q0202["(d)"] = "B";
  q0202["(e)"] = [...(taskById("Q-02-02").evidence_selection.required_set ?? []), "E-NET-999"];
  subs["Q-02-02"] = sub("Q-02-02", q0202, []);

  // Q-02-04 = 5.0: (a) canonical 3 + W-08 -> 1.5; (b) correct 2.4; evidence full 1.2
  const q0204 = correctAnswers(taskById("Q-02-04"));
  q0204["(a)"] = ["W-01", "W-02b", "W-03", "W-08"];
  subs["Q-02-04"] = sub("Q-02-04", q0204);

  // Q-03-04 = 6.5: (d) interval wrong
  const q0304 = correctAnswers(taskById("Q-03-04"));
  q0304["(d)"] = "B";
  subs["Q-03-04"] = sub("Q-03-04", q0304);

  // Q-03-05 = 6.5: (f) krbtgt missed; hint (-2)
  const q0305 = correctAnswers(taskById("Q-03-05"));
  q0305["(f)"] = "nobody";
  subs["Q-03-05"] = sub("Q-03-05", q0305);

  // Q-04-03 = 6.5: (d) wrong
  const q0403 = correctAnswers(taskById("Q-04-03"));
  q0403["(d)"] = "B";
  subs["Q-04-03"] = sub("Q-04-03", q0403);

  // Q-05-01 = 9.75: DB-PRD-01 misclassified (core four still Compromised)
  const q0501 = correctAnswers(taskById("Q-05-01"));
  (q0501["(a)"] as Record<string, string>)["DB-PRD-01"] = "Compromised";
  subs["Q-05-01"] = sub("Q-05-01", q0501);

  // Q-05-02 = 6.5: (b) yes/no wrong
  const q0502 = correctAnswers(taskById("Q-05-02"));
  q0502["(b)"] = "No";
  subs["Q-05-02"] = sub("Q-05-02", q0502);

  // Q-05-03 = 9.0: exactly 5 discordant pairs (TL-11 moved 5 slots earlier)
  const tl = [...(taskById("Q-05-03").sub_answers[0].canonical_answer as string[])];
  const moved = tl.pop() as string;
  tl.splice(5, 0, moved);
  subs["Q-05-03"] = sub("Q-05-03", { "(a)": tl });

  // Q-05-04 = 10.0: 13/15 mappings, hint (-3)
  const q0504 = correctAnswers(taskById("Q-05-04"));
  q0504["(a)"] = "T9999";
  q0504["(b)"] = "T9999";
  subs["Q-05-04"] = sub("Q-05-04", q0504);

  // Q-06-01 = 11.5: (a) 3 canonical + DB-PRD-01 -> 1.5; rest correct; evidence full
  const q0601 = correctAnswers(taskById("Q-06-01"));
  q0601["(a)"] = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DB-PRD-01"];
  subs["Q-06-01"] = sub("Q-06-01", q0601);

  // Q-06-03 = 11.0: (a) canonical 7 + distractor ix -> 4.0; (b) one swapped pair -> 4.5; evidence full
  const q0603 = correctAnswers(taskById("Q-06-03"));
  q0603["(a)"] = ["i", "ii", "iii", "iv", "v", "vi", "vii", "ix"];
  const steps = [...(taskById("Q-06-03").sub_answers[1].canonical_answer as string[])];
  [steps[5], steps[6]] = [steps[6], steps[5]];
  q0603["(b)"] = steps;
  subs["Q-06-03"] = sub("Q-06-03", q0603);

  // Q-06-04 = 8.0: (c) chose the 09-04 backup
  const q0604 = correctAnswers(taskById("Q-06-04"));
  q0604["(c)"] = "B";
  subs["Q-06-04"] = sub("Q-06-04", q0604);

  // Q-07-01 = 6.5: (a) 9 correct + 1 distractor -> 5.5; evidence half -> 0.8
  const q0701 = correctAnswers(taskById("Q-07-01"));
  q0701["(a)"] = [...(taskById("Q-07-01").sub_answers[0].canonical_answer as string[]), "x"];
  subs["Q-07-01"] = sub("Q-07-01", q0701, ["E-VALID-002", "E-AD-003", "E-VALID-001", "E-NET-999"]);

  const hints: HintUse[] = [
    hint("Q-02-02", 0, 2),
    hint("Q-03-05", 0, 2),
    hint("Q-05-04", 0, 3),
  ];

  const report = scoreRun(items, supporting, scoringConfig, subs, hints, {
    rubricScores: { "Q-07-04": 4 },
  });

  it("task scores match the decomposed values", () => {
    const expected: Record<string, number> = {
      "Q-00-01": 5, "Q-01-01": 5.5, "Q-01-02": 5,
      "Q-02-01": 6, "Q-02-02": 5, "Q-02-03": 8, "Q-02-04": 5,
      "Q-03-01": 10, "Q-03-02": 8, "Q-03-03": 8, "Q-03-04": 6.5, "Q-03-05": 6.5, "Q-03-06": 6,
      "Q-04-01": 6, "Q-04-02": 8, "Q-04-03": 6.5, "Q-04-04": 6,
      "Q-05-01": 9.75, "Q-05-02": 6.5, "Q-05-03": 9, "Q-05-04": 10, "Q-05-05": 8,
      "Q-06-01": 11.5, "Q-06-02": 5, "Q-06-03": 11, "Q-06-04": 8,
      "Q-07-01": 6.5, "Q-07-02": 10, "Q-07-03": 8, "Q-07-04": 12,
    };
    for (const [id, score] of Object.entries(expected)) {
      expect(report.taskScores[id], id).toBe(score);
    }
  });

  it("Q-07-04 voids exactly the contradicted fields (c) and (i)", () => {
    // (c) contradicts Q-02-02(d)="B"; (i) contradicts Q-02-04(a) partial credit.
    expect(report.reportVoidedFields.sort()).toEqual(["(c)", "(i)"]);
    // 8 correct deterministic fields + 4 rubric = 12
    expect(report.taskScores["Q-07-04"]).toBe(12);
  });

  it("dimension roll-up matches the weighted model", () => {
    const dims = Object.fromEntries(report.dimensionScores.map((d) => [d.id, d]));
    expect(dims.D1.earned).toBe(111);
    expect(dims.D1.weighted).toBeCloseTo((111 / 124) * 40, 4);
    expect(dims.D2.earned).toBe(43.25);
    expect(dims.D2.weighted).toBeCloseTo((43.25 / 51) * 15, 4);
    expect(dims.D3.weighted).toBeCloseTo((16.5 / 17) * 10, 4);
    expect(dims.D4.weighted).toBeCloseTo((11 / 12) * 10, 4);
    expect(dims.D5.weighted).toBeCloseTo(6.4, 4);
    expect(dims.D6.weighted).toBeCloseTo(11, 4);
    expect(dims.D7.weighted).toBeCloseTo((20 / 23) * 5, 4);
    expect(report.finalPct).toBeCloseTo(89.15, 2);
    expect(report.band).toBe("Pass");
    expect(report.passed).toBe(true);
    expect(report.criticalFailures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Critical failures
// ---------------------------------------------------------------------------

describe("critical failures", () => {
  it("CF-1: Q-07-02 stage-1 SAFE caps the run at 49% and forces Fail", () => {
    const subs = fullSubmissions();
    const q = correctAnswers(taskById("Q-07-02"));
    q["(a)"] = "SAFE";
    subs["Q-07-02"] = sub("Q-07-02", q);
    const report = scoreRun(items, supporting, scoringConfig, subs, [], {
      rubricScores: { "Q-07-04": 5 },
    });
    expect(report.criticalFailures).toContain("CF-1");
    expect(report.finalPct).toBe(49);
    expect(report.band).toBe("Fail");
    expect(report.passed).toBe(false);
  });

  it("CF-2: missing the C2 block OR any required isolation", () => {
    const byBlock = fullSubmissions();
    const q1 = correctAnswers(taskById("Q-06-01"));
    q1["(c)"] = "B";
    byBlock["Q-06-01"] = sub("Q-06-01", q1);
    expect(detectCriticalFailures(byBlock)).toContain("CF-2");

    const byHost = fullSubmissions();
    const q2 = correctAnswers(taskById("Q-06-01"));
    q2["(a)"] = ["WEB-PRD-01", "APP-PRD-01"];
    byHost["Q-06-01"] = sub("Q-06-01", q2);
    expect(detectCriticalFailures(byHost)).toContain("CF-2");

    // over-containment alone is NOT a CF
    const over = fullSubmissions();
    const q3 = correctAnswers(taskById("Q-06-01"));
    q3["(a)"] = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DC-01"];
    over["Q-06-01"] = sub("Q-06-01", q3);
    expect(detectCriticalFailures(over)).toEqual([]);
  });

  it("CF-2 persists after remedial containment (priorCriticalFailures)", () => {
    const subs = fullSubmissions(); // remediated, clean submission
    const report = scoreRun(items, supporting, scoringConfig, subs, [], {
      rubricScores: { "Q-07-04": 5 },
      priorCriticalFailures: ["CF-2"],
    });
    expect(report.criticalFailures).toContain("CF-2");
    expect(report.finalPct).toBe(49);
    expect(report.band).toBe("Fail");
  });

  it("CF-3: any core host not classified Compromised", () => {
    const subs = fullSubmissions();
    const q = correctAnswers(taskById("Q-05-01"));
    (q["(a)"] as Record<string, string>)["DC-01"] = "Accessed but not compromised";
    subs["Q-05-01"] = sub("Q-05-01", q);
    expect(detectCriticalFailures(subs)).toContain("CF-3");
  });
});

// ---------------------------------------------------------------------------
// Hint penalties
// ---------------------------------------------------------------------------

describe("hint penalties", () => {
  it("floor is 0 per task and never touches other tasks", () => {
    const subs: Record<string, RunSubmission> = {
      "Q-00-01": sub("Q-00-01", { "(a)": "B", "(b)": "Sev-3", "(c)": "wrong", "(d)": "wrong" }, ["E-ALERT-001"]),
    };
    // earned = 1.0 (evidence full); two hints would overdraw -> floor 0
    const report = scoreRun(items, supporting, scoringConfig, subs, [
      hint("Q-00-01", 0, 1),
      hint("Q-00-01", 1, 1),
    ]);
    expect(report.taskScores["Q-00-01"]).toBe(0);
    expect(report.taskScores["Q-01-01"]).toBe(0); // untouched, simply unsubmitted
  });

  it("Q-07-04 penalty applies to deterministic fields only, never the rubric", () => {
    const subs = fullSubmissions();
    const report = scoreRun(items, supporting, scoringConfig, subs, [hint("Q-07-04", 0, 3)], {
      rubricScores: { "Q-07-04": 5 },
    });
    // 10 deterministic - 3 hint + 5 rubric = 12
    expect(report.taskScores["Q-07-04"]).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

describe("bands", () => {
  it("empty run fails at 0%", () => {
    const report = scoreRun(items, supporting, scoringConfig, {}, []);
    expect(report.finalPct).toBe(0);
    expect(report.band).toBe("Fail");
    expect(report.passed).toBe(false);
  });
});
