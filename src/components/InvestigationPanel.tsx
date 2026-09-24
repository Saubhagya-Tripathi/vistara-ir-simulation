import { useSimStore } from "../engine/state/store";
import type { CandidateBundle } from "../engine/loader";

/**
 * Right panel: live investigation dashboard. Reflects current run state only —
 * objectives (current task checklist + phase status), collected evidence,
 * findings (completed tasks), and candidate notes.
 */
export function InvestigationPanel({ bundle }: { bundle: CandidateBundle }) {
  const state = useSimStore((s) => s.state);
  const setNote = useSimStore((s) => s.setNote);
  const selectTask = useSimStore((s) => s.selectTask);
  if (!state) return null;

  const currentTask = state.currentTask
    ? bundle.items.find((i) => i.id === state.currentTask)
    : undefined;
  const draft = state.currentTask ? state.drafts[state.currentTask] : undefined;
  const currentSubmitted = state.currentTask
    ? state.taskStatus[state.currentTask] === "submitted"
    : false;

  const completedTasks = bundle.items.filter(
    (i) => state.taskStatus[i.id] === "submitted",
  );

  return (
    <div className="investigation-panel">
      <section className="ip-section">
        <h3>Current objectives</h3>
        {currentTask ? (
          <>
            <div className="ip-task-ref">
              <span className="mono">{currentTask.id}</span> — {currentTask.title}
            </div>
            <ul className="ip-objectives">
              {currentTask.sub_answers.map((sa) => {
                const v = draft?.[sa.key];
                const done =
                  currentSubmitted ||
                  (Array.isArray(v) ? v.length > 0 : typeof v === "object" && v !== null
                    ? Object.keys(v as object).length > 0
                    : typeof v === "string" && v.trim().length > 0);
                const active = !currentSubmitted && !done;
                return (
                  <li
                    key={sa.key}
                    className={`ip-objective ${currentSubmitted || done ? "done" : active ? "active" : "pending"}`}
                  >
                    <span className="ip-obj-icon">
                      {currentSubmitted || done ? "✓" : active ? "◐" : "○"}
                    </span>
                    <span>
                      <span className="mono small">{sa.key}</span> {sa.question}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="muted small">Select a task to see its objectives.</p>
        )}
      </section>

      <section className="ip-section">
        <h3>Collected evidence</h3>
        <p className="ip-count">
          <strong>{state.viewedEvidence.length}</strong> viewed ·{" "}
          <strong>{state.analyzedEvidence.length}</strong> analyzed ·{" "}
          <strong>{state.revealedEvidence.length}</strong> available
        </p>
        {state.bookmarkedEvidence.length > 0 && (
          <p className="muted small">
            Bookmarked: {state.bookmarkedEvidence.join(", ")}
          </p>
        )}
      </section>

      <section className="ip-section">
        <h3>Key findings</h3>
        {completedTasks.length === 0 ? (
          <p className="muted small">No findings recorded yet.</p>
        ) : (
          <ul className="ip-findings">
            {completedTasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="ip-finding-link"
                  onClick={() => selectTask(t.id)}
                >
                  <span className="mono small">{t.id}</span> {t.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ip-section">
        <h3>Investigation notes</h3>
        <textarea
          className="ip-notes"
          placeholder="Your private working notes (not scored)…"
          value={state.notes["scratchpad"] ?? ""}
          onChange={(e) => setNote("scratchpad", e.target.value)}
        />
      </section>
    </div>
  );
}
