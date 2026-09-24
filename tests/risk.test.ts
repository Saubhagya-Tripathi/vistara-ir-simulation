import { describe, expect, it } from "vitest";
import type { CandidateState } from "../src/types";
import { assessRisk } from "../src/engine/state/risk";
import { createInitialCandidateState } from "../src/engine/state/store";
import { createMemoryStorage } from "../src/engine/state/persistence";
import { createSimStore } from "../src/engine/state/store";

function withSubs(ids: string[], patch: Partial<CandidateState> = {}): CandidateState {
  const base = createInitialCandidateState("Risk Tester");
  const subs = { ...base.submissions };
  for (const id of ids) {
    subs[id] = {
      taskId: id, answers: {}, evidenceSelection: [],
      submittedAt: "2026-09-15T10:00:00.000Z", earned: 0, hintPenalty: 0, score: 0, breakdown: {},
    };
  }
  return { ...base, ...patch, submissions: subs };
}

describe("risk exposure gauge", () => {
  it("starts critical before triage, stays critical during investigation", () => {
    expect(assessRisk(withSubs([])).score).toBe(85);
    expect(assessRisk(withSubs(["Q-00-01"])).score).toBe(80);
    expect(assessRisk(withSubs(["Q-00-01", "Q-01-01", "Q-01-02"])).label).toBe("Critical");
  });

  it("clean containment lowers risk; under-containment spikes it; remediation recovers", () => {
    const clean = assessRisk(withSubs(["Q-06-01"]));
    expect(clean.score).toBe(45);

    const base = withSubs(["Q-06-01"]);
    const under = assessRisk({
      ...base,
      consequences: { ...base.consequences, underContainment: true },
    });
    expect(under.score).toBe(90);
    expect(under.label).toBe("Critical");

    const remediated = assessRisk({
      ...base,
      consequences: { ...base.consequences, underContainment: true, underContainmentRemediated: true },
    });
    expect(remediated.score).toBe(45);
  });

  it("over-containment stays elevated with a business-impact driver", () => {
    const base = withSubs(["Q-06-01"]);
    const over = assessRisk({ ...base, consequences: { ...base.consequences, overContainment: true } });
    expect(over.score).toBe(55);
    expect(over.drivers.join(" ")).toMatch(/business impact/i);
  });

  it("eradication and recovery step the risk down; surviving persistence raises it", () => {
    expect(assessRisk(withSubs(["Q-06-01", "Q-06-02", "Q-06-03"])).score).toBe(30);
    const base = withSubs(["Q-06-01", "Q-06-02", "Q-06-03"]);
    const incomplete = assessRisk({
      ...base,
      consequences: { ...base.consequences, eradicationIncomplete: true },
    });
    expect(incomplete.score).toBe(65);
    expect(assessRisk(withSubs(["Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04"])).score).toBe(20);
  });

  it("premature SAFE spikes risk until stage 2; validated safe state is minimal", () => {
    const store = createSimStore(createMemoryStorage());
    store.getState().startSession("Risk Tester");
    const order = [
      "Q-00-01", "Q-01-01", "Q-01-02",
      "Q-02-01", "Q-02-02", "Q-02-03", "Q-02-04",
      "Q-03-01", "Q-03-02", "Q-03-03", "Q-03-04", "Q-03-05", "Q-03-06",
      "Q-04-01", "Q-04-02", "Q-04-03", "Q-04-04",
      "Q-05-01", "Q-05-02", "Q-05-03", "Q-05-04", "Q-05-05",
      "Q-06-01", "Q-06-02", "Q-06-03", "Q-06-04", "Q-07-01",
    ];
    for (const id of order) store.getState().submitTask(id, { "(a)": ["i", "ii", "iii", "iv", "v", "vi", "vii"] });
    const st = () => {
      const s = store.getState().state;
      if (!s) throw new Error("no session");
      return s;
    };
    expect(assessRisk(st()).score).toBe(20); // recovered, awaiting validation

    store.getState().advanceSafeState({ kind: "review_interim" });
    store.getState().advanceSafeState({ kind: "declare_stage1", declaration: "SAFE" });
    expect(assessRisk(st()).score).toBe(70); // premature SAFE spike

    store.getState().advanceSafeState({ kind: "declare_stage2", declaration: "SAFE" });
    expect(assessRisk(st()).score).toBe(10); // validated
  });

  it("finishing the run closes the incident", () => {
    const done = assessRisk(withSubs([], { finished: true }));
    expect(done.score).toBe(5);
    expect(done.label).toBe("Minimal");
  });
});
