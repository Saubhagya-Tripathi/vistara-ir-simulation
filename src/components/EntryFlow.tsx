import { useState } from "react";
import type { CandidateBundle } from "../engine/loader";

type BootStep = "landing" | "identify" | "briefing";

/**
 * Entry flow: WELCOME → IDENTIFY → MISSION BRIEFING → investigation.
 * Identity is collected here and passed to startSession at "Begin investigation".
 */
export function EntryFlow({
  bundle,
  onBegin,
}: {
  bundle: CandidateBundle;
  onBegin: (name: string, role: string) => void;
}) {
  const [step, setStep] = useState<BootStep>("landing");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Senior IR Analyst");

  if (step === "landing") {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <div className="entry-classification">
            TRAINING SIMULATION — SYNTHETIC DATA — NO REAL SYSTEMS
          </div>
          <h1 className="entry-title">{bundle.metadata.title}</h1>
          <p className="entry-subtitle">
            Cyber-incident investigation &amp; response exercise — case{" "}
            {bundle.metadata.incident}
          </p>
          <p className="entry-desc">
            A structured, evidence-driven incident-response assessment:{" "}
            {bundle.metadata.task_count} investigative and response tasks across 8
            phases. Approximately {Math.round(bundle.metadata.duration_minutes / 60)} hours.
            All artifacts are synthetic training data.
          </p>
          <button className="btn-primary btn-xl" onClick={() => setStep("identify")}>
            Begin simulation
          </button>
        </div>
      </div>
    );
  }

  if (step === "identify") {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <div className="entry-step-label">Identification</div>
          <h1 className="entry-title-sm">Identify yourself</h1>
          <form
            className="entry-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim() && role.trim()) setStep("briefing");
            }}
          >
            <label className="entry-field">
              <span>Candidate name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </label>
            <label className="entry-field">
              <span>Role</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior IR Analyst"
              />
            </label>
            <div className="entry-actions">
              <button type="button" className="btn-ghost" onClick={() => setStep("landing")}>
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!name.trim() || !role.trim()}
              >
                Continue to briefing
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-screen">
      <div className="entry-card entry-card-wide">
        <div className="entry-step-label">Mission briefing</div>
        <h1 className="entry-title-sm">
          {bundle.metadata.incident} — operational briefing
        </h1>
        <div className="briefing-grid">
          <section>
            <h3>Situation</h3>
            <p>{bundle.dossier.caseSummary}</p>
          </section>
          <section>
            <h3>Your role</h3>
            <p>
              <strong>{name}</strong> — {role}. You are the assigned investigator for
              this incident.
            </p>
          </section>
          <section>
            <h3>Rules of engagement</h3>
            <p>{bundle.metadata.timezone_convention}</p>
            <p>
              Submitted answers are final and lock the task. Wrong operational
              decisions have in-simulation consequences, never dead ends.
            </p>
          </section>
          <section>
            <h3>Initial objective</h3>
            <p>{bundle.items.find((i) => i.id === "Q-00-01")?.instructions}</p>
          </section>
        </div>
        <div className="entry-actions">
          <button type="button" className="btn-ghost" onClick={() => setStep("identify")}>
            Back
          </button>
          <button
            className="btn-primary btn-xl"
            onClick={() => onBegin(name.trim(), role.trim())}
          >
            Begin investigation
          </button>
        </div>
      </div>
    </div>
  );
}
