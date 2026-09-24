/**
 * Full-run scoring: grades every submission, applies hint penalties and
 * critical-failure rules, then aggregates dimensions, bands, and the report.
 *
 * Semantics (SCORING_MODEL.md / scoring section of assessment.json):
 *  - Hint penalty: task_score = max(0, earned - Σ penalties of hints used on
 *    that task). Q-07-04's 3-pt penalty applies only to deterministic fields
 *    (a)–(j): the rubric component is added after the penalty is applied.
 *  - Critical failures (any CF -> finalPct = min(computed, 49), band = Fail):
 *      CF-1: Q-07-02 (a) answered "SAFE"
 *      CF-2: Q-06-01 (c) ≠ "A" OR (a) omits any of WEB-PRD-01/APP-PRD-01/FILE-PRD-01
 *            (recorded on the omitting submission; persists after remediation
 *            via options.priorCriticalFailures)
 *      CF-3: Q-05-01 classifies any of WEB-PRD-01/APP-PRD-01/FILE-PRD-01/DC-01
 *            as anything other than exactly "Compromised"
 *  - Dimensions: final% = Σ (earned_dim / max_dim) × weight_pct.
 *  - Bands: Distinction ≥ 90, Pass 70–<90, Near miss 50–<70, Fail <50 or any CF.
 *    Pass requires ≥ 70% AND zero CFs.
 *  - Q-07-04(k) executive summary is human rubric-scored: auto-earned 0, max
 *    retained in totals, reported via rubricPending until a rubric score is
 *    supplied through options.rubricScores.
 */
import type {
  AnswerValue,
  HintUse,
  ScoreReport,
  ScoringConfig,
  SupportingStructures,
  TaskKey,
} from "../../types";
import { gradeTask, type TaskGrade } from "../grading/gradeTask";
import { asCellRecord, asString, asStringArray } from "../grading/graders";
import { normalizeText } from "../grading/normalize";
import { applyReportConsistency, REPORT_TASK_ID } from "./consistency";

export interface RunSubmission {
  answers: Record<string, AnswerValue>;
  evidenceSelection: string[];
}

export interface ScoreRunOptions {
  /** Human rubric scores by task id (Q-07-04 executive summary), 0–5. */
  rubricScores?: Record<string, number>;
  /** Critical failures recorded on earlier submissions (CF-2 persistence). */
  priorCriticalFailures?: string[];
}

export interface FullScoreReport extends ScoreReport {
  rubricPending: boolean;
  rubricPendingTasks: string[];
  /** Q-07-04 deterministic fields voided by the §6 consistency rule. */
  reportVoidedFields: string[];
}

const CF2_HOSTS = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01"];
const CF3_HOSTS = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DC-01"];

/** Detect critical failures from the current submissions (stateless part). */
export function detectCriticalFailures(submissions: Record<string, RunSubmission>): string[] {
  const failures: string[] = [];

  const q702 = submissions["Q-07-02"];
  if (q702 && normalizeText(asString(q702.answers["(a)"])) === "safe") {
    failures.push("CF-1");
  }

  const q601 = submissions["Q-06-01"];
  if (q601) {
    const c = normalizeText(asString(q601.answers["(c)"]));
    const isolated = new Set(asStringArray(q601.answers["(a)"]).map(normalizeText));
    const missingHost = CF2_HOSTS.some((h) => !isolated.has(normalizeText(h)));
    if (c !== "a" || missingHost) failures.push("CF-2");
  }

  const q501 = submissions["Q-05-01"];
  if (q501) {
    const cells = asCellRecord(q501.answers["(a)"]);
    const byHost = new Map<string, Set<string>>();
    for (const [host, sel] of Object.entries(cells)) {
      byHost.set(normalizeText(host), new Set(sel.map(normalizeText)));
    }
    const missed = CF3_HOSTS.some((h) => {
      const sel = byHost.get(normalizeText(h));
      return !sel || sel.size !== 1 || !sel.has("compromised");
    });
    if (missed) failures.push("CF-3");
  }

  return failures;
}

function bandFor(finalPct: number, hasCriticalFailure: boolean): string {
  if (hasCriticalFailure || finalPct < 50) return "Fail";
  if (finalPct >= 90) return "Distinction";
  if (finalPct >= 70) return "Pass";
  return "Near miss";
}

export function scoreRun(
  items: TaskKey[],
  supporting: SupportingStructures,
  scoring: ScoringConfig,
  submissions: Record<string, RunSubmission>,
  hintsUsed: HintUse[],
  options: ScoreRunOptions = {}
): FullScoreReport {
  const taskScores: Record<string, number> = {};
  const rubricPendingTasks: string[] = [];
  const grades: Record<string, TaskGrade> = {};

  for (const item of items) {
    const sub = submissions[item.id];
    if (sub) grades[item.id] = gradeTask(item, sub.answers, sub.evidenceSelection, supporting);
  }

  // Q-07-04 report-consistency voiding (SCORING_MODEL.md §6) adjusts the
  // deterministic subtotal before hint penalties are applied.
  const consistency = applyReportConsistency(items, grades, submissions);

  for (const item of items) {
    const sub = submissions[item.id];
    if (!sub) {
      taskScores[item.id] = 0;
      continue;
    }
    const grade = grades[item.id];
    let earned = grade.earned;
    if (item.id === REPORT_TASK_ID && consistency) {
      earned = consistency.adjustedEarned;
    }
    const penalty = hintsUsed
      .filter((h) => h.taskId === item.id)
      .reduce((acc, h) => acc + h.penalty, 0);
    // grade.earned already excludes any rubric component (auto-earned 0), so
    // the hint penalty can never touch the rubric (Q-07-04 exemption).
    let score = Math.max(0, earned - penalty);

    const rubricSub = item.sub_answers.find((sa) => sa.answer_type === "structured_report");
    if (rubricSub) {
      const awarded = options.rubricScores?.[item.id];
      if (awarded !== undefined) {
        score += Math.min(Math.max(awarded, 0), rubricSub.points);
      } else {
        rubricPendingTasks.push(item.id);
      }
    }
    taskScores[item.id] = score;
  }

  const criticalFailures = [
    ...new Set([...(options.priorCriticalFailures ?? []), ...detectCriticalFailures(submissions)]),
  ];
  const hasCF = criticalFailures.length > 0;

  const dimensionScores = scoring.dimensions.map((dim) => {
    const earned = dim.tasks.reduce((acc, id) => acc + (taskScores[id] ?? 0), 0);
    const weighted = dim.raw_points > 0 ? (earned / dim.raw_points) * dim.weight_pct : 0;
    return {
      id: dim.id,
      name: dim.name,
      earned,
      max: dim.raw_points,
      weightPct: dim.weight_pct,
      weighted,
    };
  });

  const computed = dimensionScores.reduce((acc, d) => acc + d.weighted, 0);
  const finalPct = Math.round((hasCF ? Math.min(computed, 49) : computed) * 100) / 100;
  const rawTotal = Math.round(Object.values(taskScores).reduce((a, b) => a + b, 0) * 100) / 100;
  const rawMax = items.reduce((acc, i) => acc + i.points, 0);

  return {
    taskScores,
    rawTotal,
    rawMax,
    dimensionScores,
    finalPct,
    capped: hasCF,
    criticalFailures,
    band: bandFor(finalPct, hasCF),
    passed: finalPct >= scoring.pass_threshold_pct && !hasCF,
    hintLog: hintsUsed,
    rubricPending: rubricPendingTasks.length > 0,
    rubricPendingTasks,
    reportVoidedFields: consistency?.voided ?? [],
  };
}
