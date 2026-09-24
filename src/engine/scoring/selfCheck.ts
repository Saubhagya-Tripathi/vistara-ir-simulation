/**
 * Load-time validation of the assessment definition against the scoring model.
 * Checks (ASSESSMENT_FINAL_VERIFICATION.md / SCORING_RECONCILIATION.md):
 *  1. Per-item invariant: Σ sub_answer points + (evidence_selection.points when
 *     earns_points and not expressed as a sub-answer) == item.points, all 30 items.
 *  2. classification_table cell math: cell_count x cell_points == points.
 *  3. Phase raw totals equal scoring.raw_points_by_phase (P0 5 / P1 11 / P2 30 /
 *     P3 50 / P4 28 / P5 51 / P6 39 / P7 41 = 255).
 *  4. Dimensions: each dimension's raw_points == sum of its tasks' points;
 *     dimension raw points sum to the total; weights sum to 100.
 * Binary-float component points (e.g. 1.5999999999999999) are definitional:
 * comparisons use a small tolerance, definitions are never rounded.
 */
import type { ScoringConfig, TaskKey } from "../../types";

const TOL = 1e-6;

export function validateAssessment(items: TaskKey[], scoring: ScoringConfig): string[] {
  const errors: string[] = [];

  for (const item of items) {
    const subSum = item.sub_answers.reduce((acc, sa) => acc + sa.points, 0);
    const ev = item.evidence_selection;
    const evPoints = ev && ev.earns_points && !ev.expressed_as ? ev.points : 0;
    if (Math.abs(subSum + evPoints - item.points) > TOL) {
      errors.push(
        `${item.id}: sub-answer points (${subSum}) + evidence points (${evPoints}) != item.points (${item.points})`
      );
    }
    for (const sa of item.sub_answers) {
      if (sa.answer_type === "classification_table") {
        const cellTotal = (sa.cell_count ?? 0) * (sa.cell_points ?? 0);
        if (Math.abs(cellTotal - sa.points) > TOL) {
          errors.push(
            `${item.id} ${sa.key}: cell_count x cell_points (${cellTotal}) != points (${sa.points})`
          );
        }
      }
    }
  }

  const byPhase = new Map<string, number>();
  for (const item of items) {
    byPhase.set(item.phase, (byPhase.get(item.phase) ?? 0) + item.points);
  }
  for (const [phase, expected] of Object.entries(scoring.raw_points_by_phase)) {
    if (phase === "total") continue;
    const actual = byPhase.get(phase) ?? 0;
    if (Math.abs(actual - expected) > TOL) {
      errors.push(`phase ${phase}: summed item points (${actual}) != raw_points_by_phase (${expected})`);
    }
  }

  const total = items.reduce((acc, i) => acc + i.points, 0);
  const expectedTotal = scoring.raw_points_by_phase["total"];
  if (typeof expectedTotal === "number" && Math.abs(total - expectedTotal) > TOL) {
    errors.push(`total: summed item points (${total}) != raw_points_by_phase.total (${expectedTotal})`);
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  let dimRawSum = 0;
  let weightSum = 0;
  for (const dim of scoring.dimensions) {
    const taskSum = dim.tasks.reduce((acc, id) => {
      const t = byId.get(id);
      if (!t) {
        errors.push(`dimension ${dim.id}: unknown task ${id}`);
        return acc;
      }
      return acc + t.points;
    }, 0);
    if (Math.abs(taskSum - dim.raw_points) > TOL) {
      errors.push(`dimension ${dim.id}: task points (${taskSum}) != raw_points (${dim.raw_points})`);
    }
    dimRawSum += dim.raw_points;
    weightSum += dim.weight_pct;
  }
  if (Math.abs(dimRawSum - total) > TOL) {
    errors.push(`dimensions: raw_points sum (${dimRawSum}) != item total (${total})`);
  }
  if (Math.abs(weightSum - 100) > TOL) {
    errors.push(`dimensions: weight_pct sums to ${weightSum}, expected 100`);
  }

  return errors;
}

/** Throws when the assessment definition violates any scoring invariant. */
export function assertAssessmentValid(items: TaskKey[], scoring: ScoringConfig): void {
  const errors = validateAssessment(items, scoring);
  if (errors.length > 0) {
    throw new Error(`assessment definition failed self-check:\n${errors.join("\n")}`);
  }
}
