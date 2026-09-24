/**
 * Post-run review summary (rendered when state.finished). This is the ONLY
 * candidate-facing surface permitted to read the grading bundle: scores,
 * dimensions, bands, critical-failure list, and the executive-summary rubric
 * criteria (presented as a local-only reviewer checklist — Q-07-04(k) stays
 * rubric-pending in the automated total).
 */
import { useState } from "react";
import type { CandidateBundle } from "../../engine/loader";
import { getGradingBundle } from "../../engine/loader";
import { useSimStore } from "../../engine/state/store";
import { scoreRun, type FullScoreReport } from "../../engine/scoring/scoreRun";

const BAND_CLASS: Record<string, string> = {
  Distinction: "band-Distinction",
  Pass: "band-Pass",
  "Near miss": "band-Near",
  Fail: "band-Fail",
};

const CF_LABELS: Record<string, string> = {
  "CF-1": "Unsafe safe-state declaration — Q-07-02 stage 1 declared SAFE.",
  "CF-2":
    "Incomplete containment — Q-06-01 left attacker infrastructure reachable or a compromised host un-isolated.",
  "CF-3": "Missed major compromise — Q-05-01 misclassified a compromised host.",
};

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function fmtElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

export function FinalSummary({
  bundle,
  onReset,
}: {
  bundle: CandidateBundle;
  onReset: () => void;
}) {
  const state = useSimStore((s) => s.state);
  const grading = getGradingBundle();
  const rubric = grading.supporting_structures.exec_summary_rubric;
  const [rubricChecks, setRubricChecks] = useState<boolean[]>(() =>
    rubric.map(() => false),
  );
  if (!state) return null;

  const report: FullScoreReport = scoreRun(
    grading.items,
    grading.supporting_structures,
    grading.scoring,
    state.submissions,
    state.hintsUsed,
    { priorCriticalFailures: state.consequences.triggeredCriticalFailures },
  );

  const kAnswer = state.submissions["Q-07-04"]?.answers["(k)"];
  const execText =
    typeof kAnswer === "string" && kAnswer.trim().length > 0
      ? kAnswer
      : state.execSummary;

  const taskById = new Map(bundle.items.map((i) => [i.id, i]));

  return (
    <div className="summary-wrap">
      <h1>Session review — {bundle.metadata.incident}</h1>
      <p className="muted">
        Candidate: {state.candidateName} · Case:{" "}
        <span className="mono">{bundle.metadata.incident}</span> · Started:{" "}
        {new Date(state.startedAt).toLocaleString()} · Elapsed:{" "}
        {fmtElapsed(state.elapsedBeforePauseMs)}
      </p>

      <h2>
        Final score: {fmt(report.finalPct)}%{" "}
        <span className={`band-badge ${BAND_CLASS[report.band] ?? "band-Fail"}`}>
          {report.band}
        </span>
      </h2>
      <p>
        Result: <strong>{report.passed ? "PASS" : "FAIL"}</strong>{" "}
        <span className="muted small">(pass rule: {grading.scoring.pass_rule})</span>
      </p>
      <p className="muted small">
        Raw points: {fmt(report.rawTotal)} / {fmt(report.rawMax)}
        {report.capped && " — capped at 49% due to critical failure(s)."}
        {report.rubricPending &&
          " — automated total excludes the rubric-scored executive summary (pending reviewer)."}
      </p>

      {report.criticalFailures.length > 0 && (
        <section>
          <h3>Critical failures</h3>
          <ul>
            {report.criticalFailures.map((cf) => (
              <li key={cf}>
                <span className="mono">{cf}</span> —{" "}
                {CF_LABELS[cf] ?? "Critical failure recorded."}{" "}
                <span className="muted small">
                  {grading.scoring.critical_failures.find((s) => s.id === cf)?.effect ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>Score by dimension</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Earned / Max</th>
              <th>Weight</th>
              <th>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {report.dimensionScores.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>
                  {fmt(d.earned)} / {fmt(d.max)}
                </td>
                <td>{d.weightPct}%</td>
                <td>{d.weighted.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Score by phase</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Title</th>
              <th>Score</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {bundle.phases.map((phase) => {
              const phaseMax = grading.scoring.raw_points_by_phase[phase.id] ?? 0;
              const phaseEarned = phase.tasks.reduce(
                (sum, id) => sum + (report.taskScores[id] ?? 0),
                0,
              );
              return [
                <tr key={`${phase.id}-head`}>
                  <td colSpan={4}>
                    <strong>
                      {phase.id} — {phase.name}
                    </strong>{" "}
                    <span className="muted small">
                      ({fmt(Math.round(phaseEarned * 100) / 100)} / {fmt(phaseMax)} pts)
                    </span>
                  </td>
                </tr>,
                ...phase.tasks.map((id) => {
                  const item = taskById.get(id);
                  return (
                    <tr key={id}>
                      <td className="mono">{id}</td>
                      <td>{item?.title ?? id}</td>
                      <td>{fmt(report.taskScores[id] ?? 0)}</td>
                      <td>{fmt(item?.points ?? 0)}</td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </section>

      {report.reportVoidedFields.length > 0 && (
        <section>
          <h3>Report consistency rule</h3>
          <p className="muted">
            The following Q-07-04 fields were voided for inconsistency with earlier
            answers: {report.reportVoidedFields.join(", ")}
          </p>
        </section>
      )}

      {report.rubricPending && rubric.length > 0 && (
        <section>
          <h3>Executive summary — pending rubric review</h3>
          <p className="muted small">
            The executive summary (Q-07-04(k), 5 pts) is scored by a human reviewer
            against the criteria below. Checklist state is local to this screen and is
            not recorded.
          </p>
          {execText && (
            <div className="task-instructions">
              <strong>Submitted executive summary</strong>
              <p style={{ whiteSpace: "pre-wrap" }}>{execText}</p>
            </div>
          )}
          {rubric.map((criterion, i) => (
            <label key={i} className="option-row">
              <input
                type="checkbox"
                checked={rubricChecks[i] ?? false}
                onChange={() =>
                  setRubricChecks((prev) =>
                    prev.map((c, j) => (j === i ? !c : c)),
                  )
                }
              />
              <span>{criterion}</span>
            </label>
          ))}
        </section>
      )}

      {report.hintLog.length > 0 && (
        <section>
          <h3>Hint log</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Hint #</th>
                <th>Penalty</th>
                <th>Requested at</th>
              </tr>
            </thead>
            <tbody>
              {report.hintLog.map((h, i) => (
                <tr key={i}>
                  <td className="mono">{h.taskId}</td>
                  <td>{h.hintIndex + 1}</td>
                  <td>−{h.penalty} pts</td>
                  <td>{new Date(h.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="submit-row">
        <button type="button" className="btn-ghost" onClick={onReset}>
          Start new session
        </button>
      </div>
    </div>
  );
}
