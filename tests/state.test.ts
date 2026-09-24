import { describe, expect, it } from "vitest";
import { createMemoryStorage, Persistence } from "../src/engine/state/persistence";
import { createSimStore } from "../src/engine/state/store";

function newStore() {
  const storage = createMemoryStorage();
  const store = createSimStore(storage);
  store.getState().startSession("Test Candidate");
  return { store, storage };
}

const s = (store: ReturnType<typeof newStore>["store"]) => {
  const state = store.getState().state;
  if (!state) throw new Error("no session");
  return state;
};

describe("store: session + task flow", () => {
  it("starts a session with P0 open and the two briefing artifacts revealed", () => {
    const { store } = newStore();
    expect(s(store).currentPhase).toBe("P0");
    expect(s(store).phaseStatus.P0).toBe("open");
    expect(s(store).revealedEvidence).toEqual(["E-ALERT-001", "E-TICKET-001"]);
  });

  it("submitting Q-00-01 opens P1 and reveals the investigation evidence", () => {
    const { store } = newStore();
    expect(store.getState().selectTask("Q-00-01")).toBe(true);
    expect(store.getState().submitTask("Q-00-01", { "(a)": "A" }, ["E-ALERT-001"])).toBe(true);
    expect(s(store).phaseStatus.P1).toBe("open");
    expect(s(store).taskStatus["Q-00-01"]).toBe("submitted");
    expect(s(store).revealedEvidence).toContain("E-WEB-003");
  });

  it("locked tasks cannot be selected or submitted", () => {
    const { store } = newStore();
    expect(store.getState().selectTask("Q-05-01")).toBe(false);
    expect(store.getState().submitTask("Q-05-01", {})).toBe(false);
  });

  it("submitted answers lock; no resubmission outside consequence loops", () => {
    const { store } = newStore();
    store.getState().submitTask("Q-00-01", { "(a)": "A" });
    expect(store.getState().submitTask("Q-00-01", { "(a)": "B" })).toBe(false);
    expect(s(store).submissions["Q-00-01"].answers["(a)"]).toBe("A");
  });

  it("submitting Q-07-04 finishes the run", () => {
    const { store } = newStore();
    // Walk the whole chain with placeholder answers.
    const order = [
      "Q-00-01", "Q-01-01", "Q-01-02",
      "Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04",
      "Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06",
      "Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04",
      "Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05",
      "Q-06-01", "Q-06-02",
    ];
    for (const id of order) store.getState().submitTask(id, {});
    // Q-06-03 with empty answers is incomplete -> Q-07-02 must stay blocked later
    store.getState().submitTask("Q-06-03", {});
    expect(s(store).consequences.eradicationIncomplete).toBe(true);
    store.getState().submitTask("Q-06-04", {});
    store.getState().submitTask("Q-07-01", {});
    expect(store.getState().submitTask("Q-07-02", {})).toBe(false); // blocked
    // Revise eradication (resubmit exception) then continue.
    expect(
      store.getState().submitTask("Q-06-03", { "(a)": ["i", "ii", "iii", "iv", "v", "vi", "vii"] }),
    ).toBe(true);
    expect(s(store).consequences.eradicationIncomplete).toBe(false);
    expect(store.getState().submitTask("Q-07-02", { "(a)": "NOT SAFE" })).toBe(true);
    expect(s(store).safeState.rerunRevealed).toBe(true);
    expect(s(store).revealedEvidence).toContain("E-REPORT-001");
    store.getState().submitTask("Q-07-03", {});
    expect(store.getState().submitTask("Q-07-04", {})).toBe(true);
    expect(s(store).finished).toBe(true);
    // The run is closed now.
    expect(store.getState().submitTask("Q-07-04", {})).toBe(false);
  });
});

describe("store: containment consequence loop", () => {
  it("under-containment flags CF-2, allows remedial resubmit, keeps the CF on record", () => {
    const { store } = newStore();
    const order = [
      "Q-00-01", "Q-01-01", "Q-01-02",
      "Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04",
      "Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06",
      "Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04",
      "Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05",
    ];
    for (const id of order) store.getState().submitTask(id, {});

    store.getState().submitTask("Q-06-01", {
      "(a)": ["WEB-PRD-01", "APP-PRD-01"], // FILE-PRD-01 missing
      "(c)": "B", // C2 not blocked
    });
    expect(s(store).consequences.underContainment).toBe(true);
    expect(s(store).consequences.triggeredCriticalFailures).toContain("CF-2");

    // Remedial containment
    expect(
      store.getState().submitTask("Q-06-01", {
        "(a)": ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01"],
        "(c)": "A",
      }),
    ).toBe(true);
    expect(s(store).consequences.underContainmentRemediated).toBe(true);
    // CF-2 remains on record (scoring cap applies at final scoring).
    expect(s(store).consequences.triggeredCriticalFailures).toContain("CF-2");
  });
});

describe("store: safe-state machine", () => {
  function storeAtP7() {
    const ctx = newStore();
    const order = [
      "Q-00-01", "Q-01-01", "Q-01-02",
      "Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04",
      "Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06",
      "Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04",
      "Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05",
      "Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04",
    ];
    for (const id of order) ctx.store.getState().submitTask(id, { "(a)": ["i", "ii", "iii", "iv", "v", "vi", "vii"] });
    ctx.store.getState().submitTask("Q-07-01", {});
    return ctx;
  }

  it("interim review -> NOT SAFE -> re-run -> stage 2", () => {
    const { store } = storeAtP7();
    expect(s(store).revealedEvidence).toContain("E-VALID-002"); // interim at P7 entry
    expect(store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "NOT SAFE" })).toBe(false); // must review first
    expect(store.getState().advanceSafeState({ kind: "review_interim" })).toBe(true);
    expect(store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "NOT SAFE" })).toBe(true);
    expect(s(store).safeState.rerunRevealed).toBe(true);
    expect(s(store).safeState.remediationLoopUsed).toBe(false);
    expect(store.getState().advanceSafeState({ kind: "declare_stage2", declaration: "SAFE" })).toBe(true);
    expect(s(store).safeState.stage).toBe(2);
    expect(s(store).consequences.prematureSafe).toBe(false);
  });

  it("premature SAFE records CF-1 and uses the remediation loop", () => {
    const { store } = storeAtP7();
    store.getState().advanceSafeState({ kind: "review_interim" });
    expect(store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "SAFE" })).toBe(true);
    expect(s(store).consequences.prematureSafe).toBe(true);
    expect(s(store).consequences.triggeredCriticalFailures).toContain("CF-1");
    expect(s(store).safeState.rerunRevealed).toBe(true); // no dead end
  });

  it("stage-2 declaration is impossible before the re-run", () => {
    const { store } = storeAtP7();
    expect(store.getState().advanceSafeState({ kind: "declare_stage2", declaration: "SAFE" })).toBe(false);
  });
});

describe("store: hints", () => {
  it("applies per-task penalties, blocks duplicates, caps at 2, locks after submit", () => {
    const { store } = newStore();
    expect(store.getState().useHint("Q-00-01", 0)).toBe(true);
    expect(store.getState().useHint("Q-00-01", 0)).toBe(false); // duplicate
    expect(s(store).hintsUsed[0]).toMatchObject({ taskId: "Q-00-01", penalty: 1 });
    // Q-00-01 defines only one hint slot
    expect(store.getState().useHint("Q-00-01", 1)).toBe(false);
    // Q-02-02 defines two; still locked while P2 is locked
    expect(store.getState().useHint("Q-02-02", 0)).toBe(false);
    store.getState().submitTask("Q-00-01", { "(a)": "A" });
    expect(store.getState().useHint("Q-00-01", 0)).toBe(false); // submitted
  });
});

describe("store: pacing nudge", () => {
  it("nudges once per phase past 120% of budget, never again", () => {
    const { store } = newStore();
    store.getState().selectTask("Q-00-01");
    const over = 15 * 60_000 * 1.2 + 1; // P0 budget 15 min
    expect(store.getState().tickElapsed(over)).toBe("P0");
    expect(store.getState().tickElapsed(60_000)).toBeNull();
    expect(s(store).nudgedPhases).toEqual(["P0"]);
  });
});

describe("persistence", () => {
  it("round-trips state through the storage adapter", () => {
    const storage = createMemoryStorage();
    const store = createSimStore(storage);
    store.getState().startSession("Round Trip");
    store.getState().submitTask("Q-00-01", { "(a)": "A" }, ["E-ALERT-001"]);

    const reloaded = createSimStore(storage);
    expect(reloaded.getState().state?.candidateName).toBe("Round Trip");
    expect(reloaded.getState().state?.taskStatus["Q-00-01"]).toBe("submitted");
  });

  it("returns null for corrupt JSON and version mismatches", () => {
    const storage = createMemoryStorage();
    const p = new Persistence(storage);
    storage.setItem("vistara-ir-sim:v1", "{not json");
    expect(p.load()).toBeNull();
    storage.setItem("vistara-ir-sim:v1", JSON.stringify({ version: 999 }));
    expect(p.load()).toBeNull();
  });
});
