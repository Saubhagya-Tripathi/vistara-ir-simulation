import { useSimStore } from "../engine/state/store";
import { PHASE_ORDER } from "../engine/progression/phases";
import type { CandidateBundle } from "../engine/loader";
import { RiskGauge } from "./RiskGauge";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function Header({
  bundle,
  onToggleDossier,
  dossierOpen,
  density,
  onToggleDensity,
  onRequestReset,
}: {
  bundle: CandidateBundle;
  onToggleDossier: () => void;
  dossierOpen: boolean;
  density: "comfortable" | "compact";
  onToggleDensity: () => void;
  onRequestReset: () => void;
}) {
  const state = useSimStore((s) => s.state);
  if (!state) return null;
  const submitted = Object.keys(state.submissions).length;
  const total = bundle.metadata.task_count;
  const phaseName =
    bundle.phases.find((p) => p.id === state.currentPhase)?.name ?? state.currentPhase;

  return (
    <header className="app-header">
      <div className="header-block header-case">
        <span className="case-id">{bundle.metadata.incident}</span>
        <span className="case-title">{bundle.metadata.title}</span>
      </div>
      <div className="header-block header-identity">
        <span className="header-name">{state.candidateName}</span>
        <span className="header-role">{state.candidateRole}</span>
      </div>
      <div className="header-block">
        <span className="label">Phase</span>
        <span>
          {state.currentPhase} — {phaseName}
        </span>
      </div>
      <div className="header-block">
        <span className="label">Progress</span>
        <span>
          {submitted} / {total} tasks
        </span>
        <span className="progress-track">
          <span
            className="progress-fill"
            style={{ width: `${(submitted / total) * 100}%` }}
          />
        </span>
      </div>
      <div className="header-block">
        <span className="label">Elapsed</span>
        <span className="mono">{formatElapsed(state.elapsedBeforePauseMs)}</span>
      </div>
      <RiskGauge />
      <div className="header-block header-actions">
        <div className="header-phase-dots">
          {PHASE_ORDER.map((p) => (
            <span
              key={p}
              className={`phase-dot ${state.phaseStatus[p]}`}
              title={`${p} ${state.phaseStatus[p]}`}
            >
              {p}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost header-btn"
          onClick={onToggleDensity}
          title="Toggle information density"
        >
          {density === "comfortable" ? "Compact" : "Comfortable"}
        </button>
        <button
          type="button"
          className={`btn-ghost header-btn${dossierOpen ? " active" : ""}`}
          onClick={onToggleDossier}
          title="Toggle the case dossier (D)"
        >
          Dossier
        </button>
        <button
          type="button"
          className="btn-ghost header-btn header-btn-danger"
          onClick={onRequestReset}
          title="Reset simulation progress"
        >
          Reset
        </button>
      </div>
    </header>
  );
}
