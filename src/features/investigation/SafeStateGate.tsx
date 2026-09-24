/**
 * Two-stage safe-state gate for Q-07-02 (PROGRESSION_LOGIC.md §4.4).
 *
 * Stage 1: the interim validation packet (E-VALID-002) must be reviewed
 * before sub-answers (a) and (b) unlock. The stage-1 declaration (a) is
 * recorded via advanceSafeState the moment it is picked — both SAFE and
 * NOT SAFE reveal the 16:55 re-run packet (no dead end).
 *
 * Stage 2: once state.safeState.rerunRevealed, sub-answer (c) unlocks.
 */
import type { CandidateItem } from "../../engine/loader";
import { useSimStore } from "../../engine/state/store";
import type { AnswerValue } from "../../types";
import { SubAnswerControl } from "./controls";
import type { CandidateBundle } from "../../engine/loader";

export function SafeStateGate({
  bundle,
  task,
  answers,
  onAnswer,
  openEvidence,
}: {
  bundle: CandidateBundle;
  task: CandidateItem;
  answers: Record<string, AnswerValue | undefined>;
  onAnswer: (key: string, value: AnswerValue) => void;
  openEvidence: (id: string) => void;
}) {
  const state = useSimStore((s) => s.state);
  const advanceSafeState = useSimStore((s) => s.advanceSafeState);
  if (!state) return null;
  const ss = state.safeState;

  const subA = task.sub_answers.find((s) => s.key === "(a)");
  const subB = task.sub_answers.find((s) => s.key === "(b)");
  const subC = task.sub_answers.find((s) => s.key === "(c)");
  if (!subA || !subB || !subC) return null;

  // The declaration locks the moment it is made (store records consequences);
  // the (a) radios then show the recorded declaration, no further changes.
  const declaredA = ss.stage1Declaration;
  const valueA =
    typeof answers["(a)"] === "string" ? (answers["(a)"] as string) : declaredA ?? undefined;

  const pickA = (value: AnswerValue) => {
    onAnswer("(a)", value);
    if (declaredA === null && (value === "SAFE" || value === "NOT SAFE")) {
      advanceSafeState({ kind: "declare_stage1", declaration: value });
    }
  };

  return (
    <div>
      <div className="task-instructions">
        <p>
          An interim validation packet (E-VALID-002) is on file. Stage-1 requires you to
          review it before making a safe-state declaration.
        </p>
        {!ss.interimReviewed ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              advanceSafeState({ kind: "review_interim" });
              openEvidence("E-VALID-002");
            }}
          >
            Review interim validation packet (E-VALID-002)
          </button>
        ) : (
          <p className="muted small">
            Interim packet reviewed — make your stage-1 declaration below.
          </p>
        )}
      </div>

      <div className="sub-answer">
        <div className="q">
          <span className="key">(a)</span>
          {subA.question}
        </div>
        <SubAnswerControl
          bundle={bundle}
          task={task}
          sub={subA}
          value={valueA}
          answers={answers}
          disabled={!ss.interimReviewed || declaredA !== null}
          onChange={pickA}
        />
      </div>

      <div className="sub-answer">
        <div className="q">
          <span className="key">(b)</span>
          {subB.question}
        </div>
        <SubAnswerControl
          bundle={bundle}
          task={task}
          sub={subB}
          value={answers["(b)"]}
          answers={answers}
          disabled={!ss.interimReviewed}
          onChange={(v) => onAnswer("(b)", v)}
        />
      </div>

      <div className="sub-answer">
        <div className="q">
          <span className="key">(c)</span>
          {subC.question}
        </div>
        {ss.rerunRevealed ? (
          <p className="muted small">
            Re-run validation packet (16:55 IST) available in Evidence.{" "}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => openEvidence("E-VALID-002")}
            >
              Open validation packet
            </button>
          </p>
        ) : (
          <p className="muted small">
            Stage 2 unlocks once the re-run validation packet is available.
          </p>
        )}
        <SubAnswerControl
          bundle={bundle}
          task={task}
          sub={subC}
          value={answers["(c)"]}
          answers={answers}
          disabled={!ss.rerunRevealed}
          onChange={(v) => onAnswer("(c)", v)}
        />
      </div>
    </div>
  );
}
