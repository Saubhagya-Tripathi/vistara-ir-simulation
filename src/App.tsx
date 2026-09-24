/**
 * Application shell:
 *   entry flow (landing → identify → mission briefing)
 *   → three-zone war-room (mission nav | investigation | dashboard)
 *   → immersive evidence modal → final summary.
 */
import { useEffect, useMemo, useState } from "react";
import type { EvidenceManifest } from "./types";
import {
  candidateDescriptors,
  getCandidateBundle,
  loadEvidenceManifest,
} from "./engine/loader";
import { useSimStore } from "./engine/state/store";
import { Header } from "./components/Header";
import { PhaseNavigator } from "./components/PhaseNavigator";
import { DossierPanel } from "./components/DossierPanel";
import { InvestigationPanel } from "./components/InvestigationPanel";
import { EntryFlow } from "./components/EntryFlow";
import { ResetConfirmDialog } from "./components/ResetControls";
import { TaskPanel } from "./features/investigation/TaskPanel";
import { EvidencePanel } from "./features/evidence/EvidencePanel";
import { EvidenceModal } from "./features/evidence/EvidenceModal";
import { FinalSummary } from "./features/reporting/FinalSummary";
import { ConsequenceBanner } from "./components/ConsequenceBanner";

type CenterTab = "task" | "evidence";
type Density = "comfortable" | "compact";

const DENSITY_KEY = "vistara-ir-sim:density";

function loadDensity(): Density {
  try {
    return localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export default function App() {
  const state = useSimStore((s) => s.state);
  const startSession = useSimStore((s) => s.startSession);
  const resetSession = useSimStore((s) => s.resetSession);
  const bundle = useMemo(() => getCandidateBundle(), []);

  const [manifest, setManifest] = useState<EvidenceManifest | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [tab, setTab] = useState<CenterTab>("task");
  const [dossierOpen, setDossierOpen] = useState(false);
  const [density, setDensity] = useState<Density>(loadDensity);
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const toggleDensity = () => {
    setDensity((d) => {
      const next = d === "comfortable" ? "compact" : "comfortable";
      try {
        localStorage.setItem(DENSITY_KEY, next);
      } catch {
        // non-persistent density is fine
      }
      return next;
    });
  };

  useEffect(() => {
    loadEvidenceManifest()
      .then(setManifest)
      .catch((e) => setBootError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Elapsed clock tick (1s), drives header clock + pacing nudges.
  const tickElapsed = useSimStore((s) => s.tickElapsed);
  const running = !!state && !state.finished;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tickElapsed(1000), 1000);
    return () => clearInterval(t);
  }, [running, tickElapsed]);

  // Keyboard: "d" toggles the dossier drawer (outside text fields), Esc closes
  // the drawer (the evidence modal handles its own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (e.key === "Escape") setDossierOpen(false);
      else if ((e.key === "d" || e.key === "D") && !typing) setDossierOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (bootError) {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <h1 className="entry-title-sm">Simulation failed to load</h1>
          <p className="error-text">{bootError}</p>
          <p>
            Run <code>npm run build:data</code> and reload.
          </p>
        </div>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <p className="muted">Loading case files…</p>
        </div>
      </div>
    );
  }

  const openEvidence = (id: string) => setOpenEvidenceId(id);
  const openDescriptor = openEvidenceId
    ? candidateDescriptors(manifest).find((d) => d.evidence_id === openEvidenceId) ?? null
    : null;

  if (!state) {
    return <EntryFlow bundle={bundle} onBegin={(name, role) => startSession(name, role)} />;
  }

  if (state.finished) {
    return <FinalSummary bundle={bundle} onReset={() => setResetConfirm(true)} />;
  }

  return (
    <div className={`app-shell density-${density}`}>
      <Header
        bundle={bundle}
        onToggleDossier={() => setDossierOpen((o) => !o)}
        dossierOpen={dossierOpen}
        density={density}
        onToggleDensity={toggleDensity}
        onRequestReset={() => setResetConfirm(true)}
      />
      <div className="workspace">
        <aside className="panel-left">
          <PhaseNavigator bundle={bundle} />
        </aside>
        <main className="panel-center">
          <ConsequenceBanner />
          <div className="center-tabs">
            <button
              className={tab === "task" ? "tab active" : "tab"}
              onClick={() => setTab("task")}
            >
              Current task
            </button>
            <button
              className={tab === "evidence" ? "tab active" : "tab"}
              onClick={() => setTab("evidence")}
            >
              Evidence
            </button>
          </div>
          {tab === "task" ? (
            <TaskPanel bundle={bundle} openEvidence={openEvidence} />
          ) : (
            <EvidencePanel manifest={manifest} onOpen={openEvidence} />
          )}
        </main>
        <aside className="panel-right">
          <InvestigationPanel bundle={bundle} />
        </aside>
        <div className={`dossier-drawer${dossierOpen ? " open" : ""}`} aria-hidden={!dossierOpen}>
          <div className="dossier-drawer-head">
            <span>Case dossier</span>
            <button
              type="button"
              className="btn-ghost header-btn"
              onClick={() => setDossierOpen(false)}
            >
              Close (Esc)
            </button>
          </div>
          <DossierPanel dossier={bundle.dossier} />
        </div>
      </div>

      {openDescriptor && (
        <EvidenceModal descriptor={openDescriptor} onClose={() => setOpenEvidenceId(null)} />
      )}
      {resetConfirm && (
        <ResetConfirmDialog
          onCancel={() => setResetConfirm(false)}
          onConfirm={() => {
            setResetConfirm(false);
            setOpenEvidenceId(null);
            resetSession();
          }}
        />
      )}
    </div>
  );
}
