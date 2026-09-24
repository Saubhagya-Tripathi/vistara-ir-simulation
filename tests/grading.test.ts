import { describe, expect, it } from "vitest";
import assessment from "../assessment.json";
import type { AnswerValue, ScoringConfig, SupportingStructures, TaskKey } from "../src/types";
import { extractHours, normalizePath, normalizeText, roundToHalf } from "../src/engine/grading/normalize";
import {
  gradeClassificationTable,
  gradeEvidenceSelection,
  gradeExact,
  gradeMatching,
  gradeMultiSelect,
  gradeOrderedSequence,
} from "../src/engine/grading/graders";
import { gradeTask } from "../src/engine/grading/gradeTask";

// ---------------------------------------------------------------------------
// Test helper: convert raw assessment.json into the TaskKey model.
// ---------------------------------------------------------------------------

export const items = assessment.items as unknown as TaskKey[];
export const supporting = assessment.supporting_structures as unknown as SupportingStructures;
export const scoringConfig = assessment.scoring as unknown as ScoringConfig;

export function taskById(id: string): TaskKey {
  const t = items.find((x) => x.id === id);
  if (!t) throw new Error(`unknown task ${id}`);
  return t;
}

/** Fully-correct answers for a task, derived from its grading key. */
export function correctAnswers(task: TaskKey): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const sa of task.sub_answers) {
    switch (sa.answer_type) {
      case "multi_select":
      case "ordered_sequence":
        out[sa.key] = [...(sa.canonical_answer as string[])];
        break;
      case "matching":
      case "classification_table":
        if (sa.canonical_answer !== null && typeof sa.canonical_answer === "object") {
          out[sa.key] = { ...(sa.canonical_answer as Record<string, string>) };
        } else {
          out[sa.key] = sa.canonical_answer as string;
        }
        break;
      case "structured_report":
        out[sa.key] = "Executive summary narrative (rubric-scored).";
        break;
      default: {
        // First listed accepted alias is always gradeable; the canonical string
        // itself is not necessarily an accepted alias (e.g. Q-02-04(b)).
        const accepted = Array.isArray(sa.accepted_answers) ? (sa.accepted_answers as string[]) : [];
        out[sa.key] = typeof accepted[0] === "string" ? accepted[0] : (sa.canonical_answer as string);
      }
    }
  }
  return out;
}

export function correctEvidence(task: TaskKey): string[] {
  return task.evidence_selection?.required_set ?? [];
}

function grade(id: string, answers: Record<string, AnswerValue>, evidence: string[] = []) {
  const task = taskById(id);
  return gradeTask(task, answers, evidence, supporting);
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

describe("normalization", () => {
  it("is case-insensitive and trims/collapses whitespace", () => {
    expect(normalizeText("  SVC_Portal ")).toBe("svc_portal");
    expect(normalizeText("NT   AUTHORITY\\SYSTEM")).toBe("nt authority\\system");
  });

  it("equates path separators", () => {
    expect(normalizePath("C:\\inetpub\\wwwroot\\staging")).toBe("c:/inetpub/wwwroot/staging");
    expect(normalizePath("C:/inetpub/wwwroot/staging")).toBe("c:/inetpub/wwwroot/staging");
  });

  it("extracts hour values for range-accepted fields", () => {
    expect(extractHours("142h")).toBe(142);
    expect(extractHours("140 hours")).toBe(140);
    expect(extractHours("141")).toBe(141);
    expect(extractHours("6 days")).toBeNull();
  });

  it("rounds to nearest 0.5", () => {
    expect(roundToHalf(1.8)).toBe(2);
    expect(roundToHalf(1.2)).toBe(1);
    expect(roundToHalf(2 / 3)).toBe(0.5);
    expect(roundToHalf(5.999999999999999)).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Exact-match graders and aliases (via real items)
// ---------------------------------------------------------------------------

describe("exact-match types and accepted aliases", () => {
  it("accepts asset IP aliases (APP-PRD-01 ≡ 10.10.20.21)", () => {
    expect(grade("Q-00-01", { "(c)": "10.10.20.21" }).breakdown["(c)"]).toBe(1);
    expect(grade("Q-00-01", { "(c)": "app-prd-01" }).breakdown["(c)"]).toBe(1);
    expect(grade("Q-00-01", { "(c)": "WEB-PRD-01" }).breakdown["(c)"]).toBe(0);
  });

  it("accepts domain-prefixed username aliases, case-insensitively", () => {
    expect(grade("Q-02-02", { "(b)": "VISTARA\\svc_portal" }).breakdown["(b)"]).toBe(2);
    expect(grade("Q-02-02", { "(b)": "vistara\\svc_portal" }).breakdown["(b)"]).toBe(2);
    expect(grade("Q-02-02", { "(b)": "  SVC_PORTAL " }).breakdown["(b)"]).toBe(2);
  });

  it("does no fuzzy/semantic matching", () => {
    expect(grade("Q-02-02", { "(b)": "svc portal" }).breakdown["(b)"]).toBe(0);
    expect(grade("Q-02-02", { "(b)": "svc_portal (service account)" }).breakdown["(b)"]).toBe(0);
  });

  it("accepts SYSTEM ≡ NT AUTHORITY\\SYSTEM", () => {
    expect(grade("Q-03-04", { "(c)": "NT AUTHORITY\\SYSTEM" }).breakdown["(c)"]).toBeCloseTo(1.28, 6);
    expect(grade("Q-03-04", { "(c)": "system" }).breakdown["(c)"]).toBeCloseTo(1.28, 6);
  });

  it("accepts both path separator styles", () => {
    const fwd = grade("Q-02-03", { "(a)": "C:/inetpub/wwwroot/staging/assets/upload_2024/img.aspx" });
    expect(fwd.breakdown["(a)"]).toBeCloseTo(1.6, 6);
    const mixed = grade("Q-02-03", { "(a)": "C:\\INETPUB\\WWWROOT\\staging\\assets\\upload_2024\\img.aspx" });
    expect(mixed.breakdown["(a)"]).toBeCloseTo(1.6, 6);
  });

  it("accepts listed timestamp renderings at IST minute precision", () => {
    expect(grade("Q-02-02", { "(c)": "2026-09-03 11:47 IST" }).breakdown["(c)"]).toBe(2);
    expect(grade("Q-02-02", { "(c)": "2026-09-03 11:47:03 ist" }).breakdown["(c)"]).toBe(2);
    expect(grade("Q-02-02", { "(c)": "2026-09-03T11:47+05:30" }).breakdown["(c)"]).toBe(2);
    expect(grade("Q-02-02", { "(c)": "2026-09-03 11:48 IST" }).breakdown["(c)"]).toBe(0);
  });

  it("accepts the UTC equivalent for the IIS-derived item Q-02-03(c)", () => {
    expect(grade("Q-02-03", { "(c)": "2026-09-03 13:02 IST" }).breakdown["(c)"]).toBeCloseTo(1.6, 6);
    expect(grade("Q-02-03", { "(c)": "2026-09-03 07:32 UTC" }).breakdown["(c)"]).toBeCloseTo(1.6, 6);
    expect(grade("Q-02-03", { "(c)": "2026-09-03 07:33 UTC" }).breakdown["(c)"]).toBe(0);
  });

  it("unit: gradeExact is all-or-nothing after normalization", () => {
    expect(gradeExact(2, ["Sev-1"], " sev-1 ")).toBe(2);
    expect(gradeExact(2, ["Sev-1"], "Sev-2")).toBe(0);
    expect(gradeExact(2, ["Sev-1"], "")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Dwell-time range acceptance (Q-07-04(g), accepted_range_hours 140–144)
// ---------------------------------------------------------------------------

describe("dwell-time accepted_range_hours on Q-07-04(g)", () => {
  const g = (v: string) => grade("Q-07-04", { "(g)": v }).breakdown["(g)"];
  it("accepts listed aliases", () => {
    for (const v of ["6 days", "~6 days", "5.9 days", "142 hours", "142h", "140 hours", "140h", "144 hours", "144h"]) {
      expect(g(v), v).toBe(1);
    }
  });
  it("accepts any hour value 140–144 inclusive (142h ±2h)", () => {
    expect(g("141h")).toBe(1);
    expect(g("143 hours")).toBe(1);
  });
  it("rejects values outside the range", () => {
    expect(g("139h")).toBe(0);
    expect(g("145 hours")).toBe(0);
    expect(g("7 days")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// multi_select
// ---------------------------------------------------------------------------

describe("multi_select", () => {
  it("exact accepted-set match earns full component points", () => {
    expect(gradeMultiSelect(2.4, ["A", "B"], [["A", "B"]], ["b", "a"])).toBe(2.4);
  });

  it("false positives cancel true positives; result rounds to nearest 0.5", () => {
    // P=2.4, |C|=4: 4 TP + 1 FP -> 2.4*3/4 = 1.8 -> 2.0
    expect(gradeMultiSelect(2.4, ["a", "b", "c", "d"], [["a", "b", "c", "d"]], ["a", "b", "c", "d", "e"])).toBe(2);
    // 4 TP + 4 FP -> max(0, 0) -> 0
    expect(gradeMultiSelect(2.4, ["a", "b", "c", "d"], [["a", "b", "c", "d"]], ["a", "b", "c", "d", "e", "f", "g", "h"])).toBe(0);
    // 2 TP + 0 FP -> 2.4*2/4 = 1.2 -> 1.0
    expect(gradeMultiSelect(2.4, ["a", "b", "c", "d"], [["a", "b", "c", "d"]], ["a", "b"])).toBe(1);
  });

  it("grades against the item's accepted sets on real data", () => {
    const t = taskById("Q-01-01");
    const all = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DC-01"];
    expect(grade(t.id, { "(a)": all }).breakdown["(a)"]).toBe(2.4);
    expect(grade(t.id, { "(a)": [...all, "DB-PRD-01"] }).breakdown["(a)"]).toBe(2);
  });

  it("Q-07-04(i): dual accepted sets both earn full points; otherwise max over per-set formula", () => {
    const i = (v: string[]) => grade("Q-07-04", { "(i)": v }).breakdown["(i)"];
    expect(i(["W-01", "W-03"])).toBe(1);
    expect(i(["W-01", "W-03", "W-02b"])).toBe(1);
    // vs {W-01,W-03}: TP1 FP1 -> 0; vs {W-01,W-03,W-02b}: TP2 FP0 -> 2/3 -> 0.5
    expect(i(["W-01", "W-02b"])).toBe(0.5);
    expect(i(["W-01"])).toBe(0.5);
    // vs {W-01,W-03,W-02b}: TP1 FP0 -> 1/3 -> 0.5 (max over accepted sets)
    expect(i(["W-02b"])).toBe(0.5);
    expect(i(["W-04"])).toBe(0);
  });

  it("Q-02-02(e): the accepted 5-ID set (required 4 + E-AUTH-012) earns full points", () => {
    const e = (v: string[]) => grade("Q-02-02", { "(e)": v }).breakdown["(e)"];
    const required4 = ["E-AUTH-001", "E-NET-005", "E-NET-001", "E-EDR-001"];
    expect(e(required4)).toBe(2);
    // approved resolution: exact match to the accepted 5-set -> full credit
    expect(e([...required4, "E-AUTH-012"])).toBe(2);
    // otherwise the tier rule applies: superset with <=2 incorrect -> half
    expect(e([...required4, "E-NET-999"])).toBe(1);
    expect(e([...required4, "E-AUTH-012", "E-NET-999"])).toBe(1);
    // superset with 3 incorrect -> 0; missing required -> 0
    expect(e([...required4, "X-1", "X-2", "X-3"])).toBe(0);
    expect(e(["E-AUTH-001", "E-NET-005"])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ordered_sequence (Kendall-tau)
// ---------------------------------------------------------------------------

describe("ordered_sequence", () => {
  it("identity ordering earns full points; reverse earns 0", () => {
    const canon = ["a", "b", "c", "d", "e"];
    expect(gradeOrderedSequence(5, canon, canon)).toBe(5);
    expect(gradeOrderedSequence(5, canon, [...canon].reverse())).toBe(0);
  });

  it("one adjacent swap: 9/10 concordant pairs", () => {
    const canon = ["a", "b", "c", "d", "e"];
    expect(gradeOrderedSequence(5, canon, ["b", "a", "c", "d", "e"])).toBe(4.5);
  });

  it("missing or unknown elements count as discordant", () => {
    const canon = ["a", "b", "c", "d", "e"];
    // only 3 of 5, in order: 3 concordant pairs of 10 -> 5*3/10 = 1.5
    expect(gradeOrderedSequence(5, canon, ["a", "b", "c"])).toBe(1.5);
    expect(gradeOrderedSequence(5, canon, ["x", "y"])).toBe(0);
  });

  it("Q-05-03: 11 timeline keys, canonical order from canonical_position", () => {
    const keys = [...supporting.timeline_items]
      .sort((a, b) => a.canonical_position - b.canonical_position)
      .map((t) => t.key);
    expect(grade("Q-05-03", { "(a)": keys }).breakdown["(a)"]).toBe(10);
    expect(grade("Q-05-03", { "(a)": [...keys].reverse() }).breakdown["(a)"]).toBe(0);
    // candidates may order descriptions instead of internal TL keys
    const descs = [...supporting.timeline_items]
      .sort((a, b) => a.canonical_position - b.canonical_position)
      .map((t) => t.description);
    expect(grade("Q-05-03", { "(a)": descs }).breakdown["(a)"]).toBe(10);
  });

  it("Q-06-02(a): accepted short labels alias the canonical step descriptions", () => {
    const t = taskById("Q-06-02");
    expect(grade(t.id, { "(a)": [...(t.sub_answers[0].canonical_answer as string[])] }).breakdown["(a)"]).toBe(5);
    const labels = ["Containment", "Evidence preservation", "Eradication", "Recovery", "Safe-state validation"];
    expect(grade(t.id, { "(a)": labels }).breakdown["(a)"]).toBe(5);
    expect(grade(t.id, { "(a)": [...labels].reverse() }).breakdown["(a)"]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// matching
// ---------------------------------------------------------------------------

describe("matching", () => {
  it("per-pair all-or-nothing: component_points / number_of_pairs per correct pair", () => {
    const canon = { h1: "v1", h2: "v2", h3: "v3", h4: "v4" };
    expect(gradeMatching(2, canon, { h1: "v1", h2: "v2", h3: "v3", h4: "v4" })).toBe(2);
    expect(gradeMatching(2, canon, { h1: "v1", h2: "v2", h3: "x", h4: "x" })).toBe(1);
    expect(gradeMatching(2, canon, {})).toBe(0);
  });

  it("Q-04-03(c): 2 pairs at 0.8 each, keys/values normalized", () => {
    const t = taskById("Q-04-03");
    const canon = t.sub_answers[2].canonical_answer as Record<string, string>;
    expect(grade(t.id, { "(c)": { ...canon } }).breakdown["(c)"]).toBeCloseTo(1.6, 6);
    const [k1, k2] = Object.keys(canon);
    expect(grade(t.id, { "(c)": { [k1.toUpperCase()]: canon[k1], [k2]: "wrong" } }).breakdown["(c)"]).toBeCloseTo(0.8, 6);
  });

  it("Q-06-04(b): 4 pairs, partial credit", () => {
    const t = taskById("Q-06-04");
    const canon = t.sub_answers[1].canonical_answer as Record<string, string>;
    const entries = Object.entries(canon);
    const half = Object.fromEntries(entries.map(([k, v], i) => [k, i < 2 ? v : "wrong"]));
    expect(grade(t.id, { "(b)": half }).breakdown["(b)"]).toBe(1);
  });

  it("Q-05-04: 15 behavior→technique pairs from supporting_structures.attack_mappings", () => {
    // supporting structure agrees with each sub-answer key
    taskById("Q-05-04").sub_answers.forEach((sa, i) => {
      expect(supporting.attack_mappings[i].canonical_technique).toBe(sa.canonical_answer as string);
    });
    const full: Record<string, AnswerValue> = {};
    taskById("Q-05-04").sub_answers.forEach((sa) => (full[sa.key] = sa.canonical_answer as string));
    expect(grade("Q-05-04", full).earned).toBe(15);
    const oneWrong = { ...full, "(a)": "T9999" };
    expect(grade("Q-05-04", oneWrong).earned).toBe(14);
    // technique IDs are case-insensitive
    const lower = { ...full, "(b)": "t1552" };
    expect(grade("Q-05-04", lower).earned).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// classification_table (Q-05-01): 40-cell math, no 0.5 re-rounding
// ---------------------------------------------------------------------------

describe("classification_table (Q-05-01)", () => {
  const classes = ["Compromised", "Accessed but not compromised", "Probed only", "Benign-unrelated"];
  const canonical = Object.fromEntries(supporting.host_classification.map((h) => [h.host, h.canonical_class]));

  it("unit: one misclassified host = 39/40 cells = 9.75 (SM §10.2 worked example), NOT rounded", () => {
    const cand: Record<string, string[]> = {};
    for (const [host, cls] of Object.entries(canonical)) cand[host] = [cls];
    // K's exact case: DB-PRD-01 marked Compromised (canonical: Accessed)
    cand["DB-PRD-01"] = ["Compromised"];
    const res = gradeClassificationTable(0.25, classes, canonical, cand);
    expect(res.correctCells).toBe(39);
    expect(res.totalCells).toBe(40);
    expect(res.earned).toBe(9.75);
  });

  it("unit: full table = 10; two wrong hosts = 9.5; blank host counts as misclassified", () => {
    const full: Record<string, string[]> = {};
    for (const [host, cls] of Object.entries(canonical)) full[host] = [cls];
    expect(gradeClassificationTable(0.25, classes, canonical, full).earned).toBe(10);

    const twoWrong = { ...full, "MAIL-PRD-01": ["Probed only"], "VPN-GW-01": ["Compromised"] };
    expect(gradeClassificationTable(0.25, classes, canonical, twoWrong).earned).toBe(9.5);

    const blank: Record<string, string[]> = { ...full };
    delete blank["MES-PLC-01"];
    expect(gradeClassificationTable(0.25, classes, canonical, blank).earned).toBe(9.75);
  });

  it("gradeTask applies the rounding exemption to Q-05-01", () => {
    const answers: Record<string, AnswerValue> = { "(a)": { ...canonical, "DB-PRD-01": ["Compromised"] } };
    const res = grade("Q-05-01", answers);
    expect(res.breakdown["(a)"]).toBe(9.75);
    expect(res.earned).toBe(9.75); // exact at 0.25 granularity
    expect(res.breakdown["evidence"]).toBeUndefined(); // earns_points = false
  });
});

// ---------------------------------------------------------------------------
// Evidence selection tier rule
// ---------------------------------------------------------------------------

describe("evidence selection tiers", () => {
  const required = ["E-ALERT-001", "E-TICKET-001"];

  it("full iff superset of required with zero incorrect IDs", () => {
    expect(gradeEvidenceSelection(1, required, required)).toBe(1);
    expect(gradeEvidenceSelection(1, required, [...required].reverse())).toBe(1);
  });

  it("half iff superset with <= 2 incorrect; 3 incorrect = zero", () => {
    expect(gradeEvidenceSelection(1, required, [...required, "E-X-1"])).toBe(0.5);
    expect(gradeEvidenceSelection(1, required, [...required, "E-X-1", "E-X-2"])).toBe(0.5);
    expect(gradeEvidenceSelection(1, required, [...required, "E-X-1", "E-X-2", "E-X-3"])).toBe(0);
  });

  it("missing a required ID = zero", () => {
    expect(gradeEvidenceSelection(1, required, ["E-ALERT-001"])).toBe(0);
    expect(gradeEvidenceSelection(1, required, [])).toBe(0);
  });

  it("applies through gradeTask on Q-00-01 (evidence points 1.0)", () => {
    const answers = correctAnswers(taskById("Q-00-01"));
    expect(grade("Q-00-01", answers, required).breakdown["evidence"]).toBe(1);
    expect(grade("Q-00-01", answers, [...required, "E-NET-001"]).breakdown["evidence"]).toBe(0.5);
    expect(grade("Q-00-01", answers, ["E-ALERT-001"]).breakdown["evidence"]).toBe(0);
  });

  it("Q-02-02: evidence component is sub-answer (e) — no double counting", () => {
    const t = taskById("Q-02-02");
    expect(t.evidence_selection.expressed_as).toBe("sub_answer (e)");
    const res = grade("Q-02-02", correctAnswers(t), correctEvidence(t));
    expect(res.breakdown["evidence"]).toBeUndefined();
    expect(res.breakdown["(e)"]).toBe(2);
    expect(res.earned).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Task-level totals, rounding, structured report
// ---------------------------------------------------------------------------

describe("gradeTask totals", () => {
  it("sums components and rounds the task total to nearest 0.5", () => {
    const t = taskById("Q-03-02");
    const answers = correctAnswers(t);
    answers["(d)"] = "wrong";
    answers["(e)"] = "wrong";
    // 3 x 1.28 correct + full evidence 1.6 = 5.44 -> 5.5
    const res = grade(t.id, answers, correctEvidence(t));
    expect(res.earned).toBe(5.5);
  });

  it("fully correct submission earns the full item points on every task", () => {
    for (const t of items) {
      const res = grade(t.id, correctAnswers(t), correctEvidence(t));
      const deterministicMax = t.sub_answers
        .filter((sa) => sa.answer_type !== "structured_report")
        .reduce((a, sa) => a + sa.points, 0) + (t.evidence_selection.earns_points && !t.evidence_selection.expressed_as ? t.evidence_selection.points : 0);
      expect(res.earned, t.id).toBeCloseTo(deterministicMax, 6);
    }
  });

  it("Q-07-04(k): rubric component is stored, auto-earned 0, flagged rubricPending", () => {
    const t = taskById("Q-07-04");
    const res = grade(t.id, correctAnswers(t), []);
    expect(res.rubricPending).toBe(true);
    expect(res.breakdown["(k)"]).toBe(0);
    expect(res.earned).toBe(10); // 10 deterministic fields; 5-pt rubric stays out of auto totals
  });
});

// ---------------------------------------------------------------------------
// Definition invariants over the real assessment.json
// ---------------------------------------------------------------------------

describe("assessment.json definition invariants", () => {
  it("per-item: Σ sub_answer points + scored evidence points == item.points (all 30 items)", () => {
    expect(items).toHaveLength(30);
    for (const item of items) {
      const subSum = item.sub_answers.reduce((a, sa) => a + sa.points, 0);
      const ev = item.evidence_selection;
      const evPts = ev.earns_points && !ev.expressed_as ? ev.points : 0;
      expect(Math.abs(subSum + evPts - item.points), item.id).toBeLessThan(1e-6);
    }
  });

  it("binary-float component points are definitional and never rounded", () => {
    const q0404 = taskById("Q-04-04");
    expect(q0404.sub_answers[0].points).toBe(1.5999999999999999);
  });
});
