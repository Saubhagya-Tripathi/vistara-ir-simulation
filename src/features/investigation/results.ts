/**
 * Per-submission result computation for the post-submit review.
 * OWNER-DIRECTED DEVIATION (docs/DESIGN_RECONCILIATION_LOG.md R8): the
 * validated design withholds correctness until assessment end; the owner
 * explicitly requested immediate per-sub-answer feedback. Answers lock on
 * submit, so no in-run retry is possible; resubmit loops (Q-06-01/Q-06-03)
 * only reopen under consequence paths, which is the intended remediation.
 */
import type { AnswerValue } from "../../types";
import { getGradingBundle } from "../../engine/loader";
import { gradeTask } from "../../engine/grading/gradeTask";
import { applyReportConsistency } from "../../engine/scoring/consistency";
import type { TaskSubmission } from "../../types";

export type ComponentStatus = "correct" | "partial" | "incorrect" | "voided" | "pending";

export interface ComponentResult {
  key: string;
  earned: number;
  points: number;
  status: ComponentStatus;
}

export interface TaskResult {
  components: ComponentResult[];
  evidence: ComponentResult | null;
  earned: number; // after rounding, before hint penalty
  hintPenalty: number;
  score: number; // final task score (rubric excluded while pending)
  max: number;
  rubricPending: boolean;
}

function statusFor(earned: number, points: number): ComponentStatus {
  if (earned >= points - 1e-9) return "correct";
  if (earned > 1e-9) return "partial";
  return "incorrect";
}

/**
 * Compute the result view for one submitted task. `allSubmissions` is needed
 * only for Q-07-04 (report-consistency voiding looks at earlier answers).
 */
export function computeTaskResult(
  taskId: string,
  submission: TaskSubmission,
  allSubmissions: Record<string, TaskSubmission>,
): TaskResult | null {
  const g = getGradingBundle();
  const task = g.items.find((i) => i.id === taskId);
  if (!task) return null;

  const grade = gradeTask(task, submission.answers, submission.evidenceSelection, g.supporting_structures);

  // Q-07-04 consistency voiding needs grades for the referenced earlier tasks.
  let voided: string[] = [];
  let earned = grade.earned;
  if (taskId === "Q-07-04") {
    const grades: Record<string, typeof grade> = {};
    for (const [id, sub] of Object.entries(allSubmissions)) {
      const key = g.items.find((i) => i.id === id);
      if (key) grades[id] = gradeTask(key, sub.answers, sub.evidenceSelection, g.supporting_structures);
    }
    const rawSubs: Record<string, { answers: Record<string, AnswerValue> }> = {};
    for (const [id, sub] of Object.entries(allSubmissions)) rawSubs[id] = { answers: sub.answers };
    const consistency = applyReportConsistency(g.items, grades, rawSubs);
    if (consistency) {
      voided = consistency.voided;
      earned = consistency.adjustedEarned;
    }
  }

  const components: ComponentResult[] = task.sub_answers.map((sa) => {
    if (sa.answer_type === "structured_report") {
      return { key: sa.key, earned: 0, points: sa.points, status: "pending" };
    }
    const e = grade.breakdown[sa.key] ?? 0;
    const isVoided = voided.includes(sa.key);
    return {
      key: sa.key,
      earned: isVoided ? 0 : e,
      points: sa.points,
      status: isVoided ? "voided" : statusFor(e, sa.points),
    };
  });

  let evidence: ComponentResult | null = null;
  if (task.evidence_selection?.earns_points && !task.evidence_selection.expressed_as) {
    const pts = task.evidence_selection.points;
    const e = grade.breakdown["evidence"] ?? 0;
    evidence = { key: "evidence", earned: e, points: pts, status: statusFor(e, pts) };
  }

  const hintPenalty = submission.hintPenalty;
  const score = Math.max(0, earned - hintPenalty);

  return {
    components,
    evidence,
    earned,
    hintPenalty,
    score,
    max: task.points,
    rubricPending: grade.rubricPending,
  };
}
