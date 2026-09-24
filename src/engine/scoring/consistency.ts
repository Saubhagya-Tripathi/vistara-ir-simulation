/**
 * Q-07-04 report-consistency rule (SCORING_MODEL.md §6; assessment.json
 * Q-07-04 accepted_answers note): the 10 deterministic report fields are
 * cross-checked against the candidate's OWN earlier phase answers; each
 * contradiction voids that field's 1.0 even when the field matches canon.
 *
 * Approved deterministic mapping (component-level; user-approved):
 *   (a) classification      <- Q-00-01 (b) severity
 *   (b) detection/ticket    <- exempt (provenance fact, not an earlier answer)
 *   (c) access vector       <- Q-02-02 (d) method choice
 *   (d) first asset         <- Q-05-01 cell WEB-PRD-01 == Compromised
 *   (e) accounts            <- Q-05-02 (a) full credit
 *   (f) hosts               <- Q-05-01 cells WEB/APP/FILE/DC-01 all Compromised
 *   (g) dwell time          <- Q-02-02 (c) initial-access timestamp
 *   (h) exfil volume        <- Q-04-03 (c) event/volume matching
 *   (i) root cause          <- Q-02-01 (a) AND Q-02-04 (a) full credit
 *   (j) priv-esc enabler    <- Q-03-02 (e) DA discovery
 * A contradiction exists when the report field earned points but the mapped
 * earlier component did not earn full credit. (Report wrong + earlier right
 * is already 0 via grading, so nothing further is voided.)
 */
import type { AnswerValue, TaskKey } from "../../types";
import type { TaskGrade } from "../grading/gradeTask";
import { asCellRecord } from "../grading/graders";
import { normalizeText, roundToHalf } from "../grading/normalize";

export const REPORT_TASK_ID = "Q-07-04";
export const REPORT_DETERMINISTIC_KEYS = [
  "(a)", "(b)", "(c)", "(d)", "(e)", "(f)", "(g)", "(h)", "(i)", "(j)",
];

/** Earlier-answer satisfaction checks. Each returns true when consistent. */
function componentFull(
  grades: Record<string, TaskGrade>,
  items: Map<string, TaskKey>,
  taskId: string,
  key: string,
): boolean {
  const task = items.get(taskId);
  const grade = grades[taskId];
  if (!task || !grade) return false;
  const sub = task.sub_answers.find((sa) => sa.key === key);
  if (!sub) return false;
  return Math.abs((grade.breakdown[key] ?? 0) - sub.points) < 1e-9;
}

function classificationCellsAllCompromised(
  submissions: Record<string, { answers: Record<string, AnswerValue> }>,
  hosts: string[],
): boolean {
  const q501 = submissions["Q-05-01"];
  if (!q501) return false;
  const cells = asCellRecord(q501.answers["(a)"]);
  const byHost = new Map<string, Set<string>>();
  for (const [host, sel] of Object.entries(cells)) {
    byHost.set(normalizeText(host), new Set(sel.map(normalizeText)));
  }
  return hosts.every((h) => {
    const sel = byHost.get(normalizeText(h));
    return !!sel && sel.size === 1 && sel.has("compromised");
  });
}

const CORE_HOSTS = ["WEB-PRD-01", "APP-PRD-01", "FILE-PRD-01", "DC-01"];

/**
 * Returns the list of voided report-field keys and the adjusted deterministic
 * subtotal (pre-hint, 0.5-rounded) for Q-07-04, or null when no voiding applies.
 */
export function applyReportConsistency(
  items: TaskKey[],
  grades: Record<string, TaskGrade>,
  submissions: Record<string, { answers: Record<string, AnswerValue> }>,
): { voided: string[]; adjustedEarned: number } | null {
  const reportGrade = grades[REPORT_TASK_ID];
  if (!reportGrade) return null;
  const byId = new Map(items.map((i) => [i.id, i]));

  const consistent: Record<string, boolean> = {
    "(a)": componentFull(grades, byId, "Q-00-01", "(b)"),
    "(b)": true, // provenance: not cross-checked
    "(c)": componentFull(grades, byId, "Q-02-02", "(d)"),
    "(d)": classificationCellsAllCompromised(submissions, ["WEB-PRD-01"]),
    "(e)": componentFull(grades, byId, "Q-05-02", "(a)"),
    "(f)": classificationCellsAllCompromised(submissions, CORE_HOSTS),
    "(g)": componentFull(grades, byId, "Q-02-02", "(c)"),
    "(h)": componentFull(grades, byId, "Q-04-03", "(c)"),
    "(i)":
      componentFull(grades, byId, "Q-02-01", "(a)") &&
      componentFull(grades, byId, "Q-02-04", "(a)"),
    "(j)": componentFull(grades, byId, "Q-03-02", "(e)"),
  };

  const voided: string[] = [];
  let detSum = 0;
  for (const key of REPORT_DETERMINISTIC_KEYS) {
    const earned = reportGrade.breakdown[key] ?? 0;
    if (earned > 0 && !consistent[key]) {
      voided.push(key);
    } else {
      detSum += earned;
    }
  }
  return { voided, adjustedEarned: roundToHalf(detSum) };
}
