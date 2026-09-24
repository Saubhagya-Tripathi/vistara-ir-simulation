/**
 * Scripted end-to-end candidate runs through the real store + scoring engine.
 * Verifies the case is completable, progression order holds, the safe-state
 * trap works both honestly and prematurely, and consequence paths never
 * dead-end the run.
 */
import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "../src/engine/state/persistence";
import { createSimStore } from "../src/engine/state/store";
import { scoreRun, type RunSubmission } from "../src/engine/scoring/scoreRun";
import {
  correctAnswers,
  correctEvidence,
  items,
  scoringConfig,
  supporting,
  taskById,
} from "./grading.test";

const TASK_ORDER = [
  "Q-00-01",
  "Q-01-01", "Q-01-02",
  "Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04",
  "Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06",
  "Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04",
  "Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05",
  "Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04",
  "Q-07-01", "Q-07-02", "Q-07-03", "Q-07-04",
];

function state(store: ReturnType<typeof createSimStore>) {
  const s = store.getState().state;
  if (!s) throw new Error("no session");
  return s;
}

function scoreFromState(s: ReturnType<typeof state>, rubric = 5) {
  const subs: Record<string, RunSubmission> = {};
  for (const [id, sub] of Object.entries(s.submissions)) {
    subs[id] = { answers: sub.answers, evidenceSelection: sub.evidenceSelection };
  }
  return scoreRun(items, supporting, scoringConfig, subs, s.hintsUsed, {
    rubricScores: { "Q-07-04": rubric },
    priorCriticalFailures: s.consequences.triggeredCriticalFailures,
  });
}

describe("walkthrough: clean canonical run", () => {
  const store = createSimStore(createMemoryStorage());
  store.getState().startSession("Walkthrough Candidate");

  it("completes all 30 tasks in order with reveal checks along the way", () => {
    for (const id of TASK_ORDER) {
      if (id === "Q-07-02") {
        // Honest safe-state path: review the interim packet, declare NOT SAFE,
        // the 16:55 re-run appears, then submit the two-stage answer.
        expect(state(store).revealedEvidence).toContain("E-VALID-002");
        expect(state(store).revealedEvidence).not.toContain("E-REPORT-001");
        expect(store.getState().advanceSafeState({ kind: "review_interim" })).toBe(true);
        expect(store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "NOT SAFE" })).toBe(true);
        expect(state(store).revealedEvidence).toContain("E-REPORT-001");
      }
      const task = taskById(id);
      expect(store.getState().selectTask(id), `select ${id}`).toBe(true);
      const ok = store
        .getState()
        .submitTask(id, correctAnswers(task), correctEvidence(task));
      expect(ok, `submit ${id}`).toBe(true);
    }
    expect(state(store).finished).toBe(true);
    // every artifact in the schedule ended up revealed (2 + 58 + 6 + 2 = 68)
    expect(state(store).revealedEvidence.length).toBe(2 + 58 + 6 + 2);
  });

  it("scores 255/255 at 100% Distinction with zero CFs and no voided fields", () => {
    const report = scoreFromState(state(store));
    expect(report.rawTotal).toBe(255);
    expect(report.finalPct).toBe(100);
    expect(report.band).toBe("Distinction");
    expect(report.passed).toBe(true);
    expect(report.criticalFailures).toEqual([]);
    expect(report.reportVoidedFields).toEqual([]);
  });
});

describe("walkthrough: wrong-path run (consequence paths, no dead ends)", () => {
  it("under-containment + premature SAFE still finish, capped at 49%", () => {
    const store = createSimStore(createMemoryStorage());
    store.getState().startSession("Messy Candidate");

    for (const id of TASK_ORDER) {
      const task = taskById(id);
      if (id === "Q-06-01") {
        // Under-contain: no C2 block, FILE-PRD-01 not isolated.
        const bad = correctAnswers(task);
        bad["(a)"] = ["WEB-PRD-01", "APP-PRD-01"];
        bad["(c)"] = "B";
        expect(store.getState().submitTask(id, bad, correctEvidence(task))).toBe(true);
        expect(state(store).consequences.underContainment).toBe(true);
        // Remedial containment (§4.2): resubmission allowed, CF-2 stays.
        expect(
          store.getState().submitTask(id, correctAnswers(task), correctEvidence(task)),
        ).toBe(true);
        expect(state(store).consequences.underContainmentRemediated).toBe(true);
        expect(state(store).consequences.triggeredCriticalFailures).toContain("CF-2");
        continue;
      }
      if (id === "Q-07-02") {
        // Premature SAFE at stage 1 (CF-1), then the remediation loop.
        expect(store.getState().advanceSafeState({ kind: "review_interim" })).toBe(true);
        expect(
          store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "SAFE" }),
        ).toBe(true);
        expect(state(store).consequences.prematureSafe).toBe(true);
        expect(state(store).consequences.triggeredCriticalFailures).toContain("CF-1");
        expect(state(store).safeState.rerunRevealed).toBe(true);
        const wrong = correctAnswers(task);
        wrong["(a)"] = "SAFE"; // the submitted record keeps the unsafe declaration
        expect(store.getState().submitTask(id, wrong, correctEvidence(task))).toBe(true);
        continue;
      }
      expect(
        store.getState().submitTask(id, correctAnswers(task), correctEvidence(task)),
        `submit ${id}`,
      ).toBe(true);
    }

    expect(state(store).finished).toBe(true);
    const report = scoreFromState(state(store));
    expect(report.criticalFailures).toEqual(expect.arrayContaining(["CF-1", "CF-2"]));
    expect(report.finalPct).toBe(49);
    expect(report.band).toBe("Fail");
    expect(report.passed).toBe(false);
  });

  it("incomplete eradication blocks Q-07-02 until revised (§4.3)", () => {
    const store = createSimStore(createMemoryStorage());
    store.getState().startSession("Sloppy Candidate");
    for (const id of TASK_ORDER) {
      if (id === "Q-07-02" || id === "Q-07-03" || id === "Q-07-04") continue;
      const task = taskById(id);
      const answers =
        id === "Q-06-03"
          ? { "(a)": ["i", "ii", "iii"] } // missing steps -> persistence survives
          : correctAnswers(task);
      expect(store.getState().submitTask(id, answers, correctEvidence(task)), id).toBe(true);
    }
    expect(state(store).consequences.eradicationIncomplete).toBe(true);
    expect(state(store).taskStatus["Q-07-01"]).toBe("submitted"); // submitted in the loop above
    // Q-07-02 blocked while persistence survives
    expect(store.getState().selectTask("Q-07-02")).toBe(false);
    expect(
      store.getState().submitTask("Q-07-02", correctAnswers(taskById("Q-07-02"))),
    ).toBe(false);
    // Revision loop
    expect(
      store.getState().submitTask("Q-06-03", correctAnswers(taskById("Q-06-03")), correctEvidence(taskById("Q-06-03"))),
    ).toBe(true);
    expect(state(store).consequences.eradicationIncomplete).toBe(false);
    expect(store.getState().advanceSafeState({ kind: "review_interim" })).toBe(true);
    expect(store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "NOT SAFE" })).toBe(true);
    expect(
      store.getState().submitTask("Q-07-02", correctAnswers(taskById("Q-07-02")), correctEvidence(taskById("Q-07-02"))),
    ).toBe(true);
  });
});
