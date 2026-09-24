import { useSimStore } from "../engine/state/store";
import type { CandidateBundle } from "../engine/loader";

/**
 * Left panel: case overview + phase/task navigation map.
 * Tasks are selectable per the progression engine (locked ones are disabled).
 */
export function PhaseNavigator({ bundle }: { bundle: CandidateBundle }) {
  const state = useSimStore((s) => s.state);
  const selectTask = useSimStore((s) => s.selectTask);
  if (!state) return null;

  return (
    <nav className="phase-nav">
      <section className="case-overview">
        <h2>Case overview</h2>
        <p>{bundle.dossier.caseSummary}</p>
      </section>
      {bundle.phases.map((phase) => {
        const status = state.phaseStatus[phase.id as keyof typeof state.phaseStatus];
        return (
          <section key={phase.id} className={`phase-block ${status}`}>
            <header className="phase-header">
              <span className={`phase-status status-${status}`} />
              <span className="phase-name">
                {phase.id} — {phase.name}
              </span>
            </header>
            <ul className="task-list">
              {phase.tasks.map((taskId) => {
                const item = bundle.items.find((i) => i.id === taskId);
                const tStatus = state.taskStatus[taskId] ?? "locked";
                const active = state.currentTask === taskId;
                return (
                  <li key={taskId}>
                    <button
                      className={`task-link ${tStatus}${active ? " active" : ""}`}
                      disabled={tStatus === "locked"}
                      onClick={() => selectTask(taskId)}
                      title={item?.title}
                    >
                      <span className="task-id">{taskId}</span>
                      <span className="task-title">{item?.title ?? taskId}</span>
                      {tStatus === "submitted" && <span className="task-done">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
