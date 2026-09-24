import { useEffect, useRef, useState } from "react";
import { useSimStore } from "../engine/state/store";
import { assessRisk } from "../engine/state/risk";

/**
 * Header gauge: live organizational risk exposure, driven by operational state
 * (never by answer correctness). Click opens the active driver list.
 */
export function RiskGauge() {
  const state = useSimStore((s) => s.state);
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState<"up" | "down" | null>(null);
  const prevScore = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const risk = state ? assessRisk(state) : null;

  useEffect(() => {
    if (!risk) return;
    const prev = prevScore.current;
    prevScore.current = risk.score;
    if (prev !== null && prev !== risk.score) {
      setDelta(risk.score > prev ? "up" : "down");
      const t = setTimeout(() => setDelta(null), 2400);
      return () => clearTimeout(t);
    }
  }, [risk?.score]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!risk) return null;

  return (
    <div className="risk-gauge" ref={ref}>
      <button
        type="button"
        className="risk-gauge-btn"
        onClick={() => setOpen(!open)}
        title="Organizational risk exposure — driven by operational state"
      >
        <span className="label">Risk</span>
        <span className="risk-track">
          <span
            className={`risk-fill risk-${risk.label.toLowerCase()}`}
            style={{ width: `${risk.score}%` }}
          />
        </span>
        <span className={`risk-value risk-text-${risk.label.toLowerCase()}`}>
          {risk.score} {risk.label}
        </span>
        {delta && (
          <span className={`risk-delta ${delta === "up" ? "risk-up" : "risk-down"}`}>
            {delta === "up" ? "▲" : "▼"}
          </span>
        )}
      </button>
      {open && (
        <div className="risk-popover">
          <h3>Risk drivers</h3>
          <ul>
            {risk.drivers.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          <p className="muted small">
            Exposure reflects the incident's operational state — containment,
            eradication, recovery, and validation outcomes as they execute.
          </p>
        </div>
      )}
    </div>
  );
}
