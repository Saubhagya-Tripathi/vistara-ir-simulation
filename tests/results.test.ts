import { describe, expect, it } from "vitest";
import type { TaskSubmission } from "../src/types";
import { computeTaskResult } from "../src/features/investigation/results";
import {
  correctAnswers,
  correctEvidence,
  taskById,
} from "./grading.test";

function submissionFor(
  id: string,
  answers?: Record<string, never> | ReturnType<typeof correctAnswers>,
  evidence?: string[],
  hintPenalty = 0,
): TaskSubmission {
  const task = taskById(id);
  return {
    taskId: id,
    answers: answers ?? correctAnswers(task),
    evidenceSelection: evidence ?? correctEvidence(task),
    submittedAt: "2026-09-15T10:00:00.000Z",
    earned: 0,
    hintPenalty,
    score: 0,
    breakdown: {},
  };
}

describe("post-submit result feedback", () => {
  it("fully correct task: every component correct, full score", () => {
    const sub = submissionFor("Q-00-01");
    const result = computeTaskResult("Q-00-01", sub, { "Q-00-01": sub });
    expect(result).not.toBeNull();
    expect(result!.score).toBe(5);
    expect(result!.components.every((c) => c.status === "correct")).toBe(true);
    expect(result!.evidence?.status).toBe("correct");
  });

  it("wrong sub-answer is flagged incorrect; evidence half-credit is partial", () => {
    const task = taskById("Q-02-01");
    const answers = correctAnswers(task);
    answers["(a)"] = "B"; // wrong
    const sub = submissionFor("Q-02-01", answers, [
      ...(task.evidence_selection.required_set ?? []),
      "E-NET-999", // 1 incorrect ID -> half
    ]);
    const result = computeTaskResult("Q-02-01", sub, { "Q-02-01": sub })!;
    const a = result.components.find((c) => c.key === "(a)")!;
    const b = result.components.find((c) => c.key === "(b)")!;
    expect(a.status).toBe("incorrect");
    expect(a.earned).toBe(0);
    expect(b.status).toBe("correct");
    expect(result.evidence?.status).toBe("partial");
    expect(result.evidence?.earned).toBe(task.evidence_selection.points / 2);
    // 2.4 (b) + 0.6 evidence = 3.0
    expect(result.score).toBe(3);
  });

  it("hint penalty lowers the score line without touching other tasks", () => {
    const sub = submissionFor("Q-02-01", undefined, undefined, 1);
    const result = computeTaskResult("Q-02-01", sub, { "Q-02-01": sub })!;
    expect(result.earned).toBe(6);
    expect(result.hintPenalty).toBe(1);
    expect(result.score).toBe(5);
  });

  it("Q-07-04: contradicted fields are voided, rubric stays pending", () => {
    const subs: Record<string, TaskSubmission> = {};
    // earlier answers: Q-02-02(d) wrong so report (c) is a contradiction
    const q0202 = correctAnswers(taskById("Q-02-02"));
    q0202["(d)"] = "B";
    subs["Q-02-02"] = submissionFor("Q-02-02", q0202, []);
    subs["Q-00-01"] = submissionFor("Q-00-01");
    const q0201 = correctAnswers(taskById("Q-02-01"));
    subs["Q-02-01"] = submissionFor("Q-02-01", q0201);
    const q0204 = correctAnswers(taskById("Q-02-04"));
    subs["Q-02-04"] = submissionFor("Q-02-04", q0204);
    subs["Q-05-01"] = submissionFor("Q-05-01");
    subs["Q-05-02"] = submissionFor("Q-05-02");
    subs["Q-04-03"] = submissionFor("Q-04-03");
    subs["Q-03-02"] = submissionFor("Q-03-02");

    const reportSub = submissionFor("Q-07-04");
    subs["Q-07-04"] = reportSub;
    const result = computeTaskResult("Q-07-04", reportSub, subs)!;
    const c = result.components.find((x) => x.key === "(c)")!;
    const k = result.components.find((x) => x.key === "(k)")!;
    expect(c.status).toBe("voided");
    expect(c.earned).toBe(0);
    expect(k.status).toBe("pending");
    // 9 deterministic fields correct + (c) voided = 9
    expect(result.score).toBe(9);
  });

  it("unknown task returns null rather than throwing", () => {
    expect(computeTaskResult("Q-99-99", submissionFor("Q-00-01"), {})).toBeNull();
  });
});
