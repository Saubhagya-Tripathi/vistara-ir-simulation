/**
 * Center-panel task workspace: header, instructions, related-evidence links,
 * per-sub-answer controls, evidence picker, hints, and submit/resubmit.
 * Q-07-02 delegates its sub-answers to the two-stage SafeStateGate.
 *
 * Read-only review: once submitted (and no §4 resubmit loop is open), the
 * submitted answers render in disabled controls. While a consequence loop is
 * open (canResubmit), the form stays editable, pre-filled from the
 * submission, with a Resubmit action.
 *
 * No grading internals (canonical answers, required evidence sets) are
 * rendered here.
 */
import { useState } from "react";
import type { CandidateState, PhaseId, AnswerValue } from "../../types";
import type { CandidateBundle, CandidateItem } from "../../engine/loader";
import { useSimStore } from "../../engine/state/store";
import { canResubmit } from "../../engine/progression/consequences";
import { isSubComplete, SubAnswerControl } from "./controls";
import { EvidencePicker } from "./EvidencePicker";
import { SafeStateGate } from "./SafeStateGate";
import { computeTaskResult, type ComponentResult } from "./results";

const STATUS_LABEL: Record<ComponentResult["status"], string> = {
  correct: "Correct",
  partial: "Partial",
  incorrect: "Incorrect",
  voided: "Voided — inconsistent with earlier answers",
  pending: "Pending reviewer",
};

function ResultBadge({ result }: { result: ComponentResult }) {
  return (
    <span className={`result-badge result-${result.status}`}>
      {STATUS_LABEL[result.status]} · {result.earned}/{result.points}
    </span>
  );
}

export function TaskPanel({
  bundle,
  openEvidence,
}: {
  bundle: CandidateBundle;
  openEvidence: (id: string) => void;
}) {
  const state = useSimStore((s) => s.state);
  const taskId = state?.currentTask ?? null;
  const task = taskId ? bundle.items.find((i) => i.id === taskId) : undefined;

  if (!state || !taskId || !task) {
    return <p className="task-locked-note">Select a task from the navigator.</p>;
  }
  if ((state.taskStatus[taskId] ?? "locked") === "locked") {
    return (
      <p className="task-locked-note">
        This task is locked. Complete the preceding work to unlock it.
      </p>
    );
  }
  // Keyed by task id: switching tasks resets the transient submit notice.
  return (
    <TaskView
      key={taskId}
      bundle={bundle}
      task={task}
      state={state}
      openEvidence={openEvidence}
    />
  );
}

interface UnlockNotice {
  unlocked: { id: string; name: string }[];
}

function TaskView({
  bundle,
  task,
  state,
  openEvidence,
}: {
  bundle: CandidateBundle;
  task: CandidateItem;
  state: CandidateState;
  openEvidence: (id: string) => void;
}) {
  const saveDraft = useSimStore((s) => s.saveDraft);
  const submitTask = useSimStore((s) => s.submitTask);
  const useHint = useSimStore((s) => s.useHint);
  const setReportField = useSimStore((s) => s.setReportField);
  const [notice, setNotice] = useState<UnlockNotice | null>(null);

  const submitted = state.taskStatus[task.id] === "submitted";
  const resubmitting = submitted && canResubmit(state, task.id);
  const readOnly = submitted && !resubmitting;
  const submission = state.submissions[task.id];
  const result = submission ? computeTaskResult(task.id, submission, state.submissions) : null;
  const resultByKey = new Map(result?.components.map((c) => [c.key, c]));

  const answers: Record<string, AnswerValue | undefined> = readOnly
    ? submission?.answers ?? {}
    : state.drafts[task.id] ?? (resubmitting ? submission?.answers : undefined) ?? {};
  const evidenceSel: string[] = readOnly
    ? submission?.evidenceSelection ?? []
    : state.evidenceDrafts[task.id] ??
      (resubmitting ? submission?.evidenceSelection : undefined) ??
      [];

  const phase = bundle.phases.find((p) => p.id === task.phase);
  const subE = task.sub_answers.find((s) => s.key === "(e)");
  const isQ0202 = task.id === "Q-02-02";

  const setAnswer = (key: string, value: AnswerValue) => {
    const next = { ...answers, [key]: value } as Record<string, AnswerValue>;
    saveDraft(task.id, next);
    if (task.id === "Q-07-04" && key === "(k)") setReportField("execSummary", String(value));
  };

  const setEvidence = (sel: string[]) => {
    if (isQ0202) {
      // Q-02-02: the picker value IS sub-answer (e).
      saveDraft(task.id, { ...answers, "(e)": sel } as Record<string, AnswerValue>, sel);
    } else {
      saveDraft(task.id, answers as Record<string, AnswerValue>, sel);
    }
  };

  const complete = task.sub_answers.every((sa) => isSubComplete(bundle, task, sa, answers));

  const onSubmit = () => {
    const before = state.phaseStatus;
    const finalEvidence = isQ0202
      ? (Array.isArray(answers["(e)"]) ? (answers["(e)"] as string[]) : [])
      : evidenceSel;
    const ok = submitTask(task.id, answers as Record<string, AnswerValue>, finalEvidence);
    if (!ok) return;
    const after = useSimStore.getState().state;
    const unlocked = after
      ? bundle.phases
          .filter(
            (p) =>
              before[p.id as PhaseId] !== "open" &&
              after.phaseStatus[p.id as PhaseId] === "open",
          )
          .map((p) => ({ id: p.id, name: p.name }))
      : [];
    setNotice({ unlocked });
  };

  const usedHints = state.hintsUsed.filter((h) => h.taskId === task.id);
  const hintPenaltyTotal = usedHints.reduce((sum, h) => sum + h.penalty, 0);

  return (
    <div>
      <header className="task-head">
        <h2>
          {task.id} — {task.title}
        </h2>
        <div className="task-meta">
          <span>
            Phase {task.phase}
            {phase ? ` — ${phase.name}` : ""}
          </span>
          <span>{task.points} pts</span>
          <span>Difficulty: {task.difficulty}</span>
        </div>
      </header>

      <div className="task-instructions">{task.instructions}</div>

      {task.required_evidence.length > 0 && (
        <div className="related-evidence">
          <span className="muted small">Evidence relevant to this task:</span>
          {task.required_evidence
            .filter((id) => state.revealedEvidence.includes(id))
            .map((id) => (
              <button
                key={id}
                type="button"
                className="ev-chip"
                onClick={() => openEvidence(id)}
                title="Open artifact"
              >
                {id}
              </button>
            ))}
        </div>
      )}

      {task.id === "Q-07-02" && !readOnly ? (
        <SafeStateGate
          bundle={bundle}
          task={task}
          answers={answers}
          onAnswer={setAnswer}
          openEvidence={openEvidence}
        />
      ) : (
        task.sub_answers.map((sa) => {
          if (isQ0202 && sa.key === "(e)") return null; // rendered as the picker below
          const techniqueMatch = sa.answer_type === "matching" && !!sa.options?.length;
          const comp = submission ? resultByKey.get(sa.key) : undefined;
          return (
            <div className="sub-answer" key={sa.key}>
              {!techniqueMatch && (
                <div className="q">
                  <span className="key">{sa.key}</span>
                  {sa.question}
                  {comp && <ResultBadge result={comp} />}
                </div>
              )}
              {techniqueMatch && comp && (
                <div className="q">
                  <span className="key">{sa.key}</span>
                  <ResultBadge result={comp} />
                </div>
              )}
              <SubAnswerControl
                bundle={bundle}
                task={task}
                sub={sa}
                value={answers[sa.key]}
                answers={answers}
                disabled={readOnly}
                onChange={(v) => setAnswer(sa.key, v)}
              />
            </div>
          );
        })
      )}

      {task.evidence_selection.is_candidate_action && (
        <div className="sub-answer">
          <div className="q">
            {isQ0202 && subE ? (
              <>
                <span className="key">(e)</span>
                {subE.question}
                {submission && resultByKey.get("(e)") && (
                  <ResultBadge result={resultByKey.get("(e)")!} />
                )}
              </>
            ) : (
              <>
                Supporting evidence (select the artifacts your answer relies on)
                {submission && result?.evidence && <ResultBadge result={result.evidence} />}
              </>
            )}
          </div>
          <EvidencePicker
            ids={state.revealedEvidence}
            relatedIds={task.required_evidence}
            value={
              isQ0202
                ? Array.isArray(answers["(e)"])
                  ? (answers["(e)"] as string[])
                  : []
                : evidenceSel
            }
            disabled={readOnly}
            onChange={setEvidence}
          />
        </div>
      )}

      {task.hints.length > 0 && (
        <div className="hint-box">
          {task.hints.map((hint, i) => {
            const used = usedHints.some((u) => u.hintIndex === i);
            if (used) {
              return (
                <div className="hint-text" key={i}>
                  {hint.text}
                </div>
              );
            }
            // The store records hints only pre-submission (locks afterwards).
            if (submitted) return null;
            return (
              <button
                key={i}
                type="button"
                className="btn-ghost"
                onClick={() => useHint(task.id, i)}
              >
                Request hint (−{hint.penalty} pts on this task)
              </button>
            );
          })}
          {hintPenaltyTotal > 0 && (
            <div className="hint-penalty-note">
              Hint penalties on this task: −{hintPenaltyTotal} pts
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="submit-row">
          <button
            type="button"
            className="btn-primary"
            disabled={!complete}
            onClick={onSubmit}
          >
            {resubmitting ? "Resubmit answers" : "Submit answers"}
          </button>
        </div>
      )}

      {(readOnly || notice) && (
        <div className="submit-row">
          <span className="task-submitted-note">
            Task completed.
            {result && (
              <>
                {" "}Score: <strong>{result.score} / {result.max}</strong>
                {result.hintPenalty > 0 && ` (hint penalty −${result.hintPenalty})`}
                {result.rubricPending && " — executive summary pending reviewer rubric"}
              </>
            )}
          </span>
          {notice?.unlocked.map((p) => (
            <span key={p.id} className="task-submitted-note">
              Phase unlocked: {p.id} — {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
