/**
 * Immersive evidence viewer (modal): dims the workspace and presents the
 * artifact like a forensic workstation — strong header (type, id, title,
 * classification, host/source, window), toolbar (zoom, in-document search,
 * drill-down), bookmark and mark-as-analyzed actions, clear close control.
 */
import { useEffect } from "react";
import type { EvidenceCandidateView } from "../../types";
import { useSimStore } from "../../engine/state/store";
import { EvidenceViewer, TYPE_LABELS } from "./EvidenceViewer";

export function EvidenceModal({
  descriptor,
  onClose,
}: {
  descriptor: EvidenceCandidateView;
  onClose: () => void;
}) {
  const state = useSimStore((s) => s.state);
  const markEvidenceAnalyzed = useSimStore((s) => s.markEvidenceAnalyzed);
  const toggleBookmark = useSimStore((s) => s.toggleBookmark);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!state) return null;
  const analyzed = state.analyzedEvidence.includes(descriptor.evidence_id);
  const bookmarked = state.bookmarkedEvidence.includes(descriptor.evidence_id);

  return (
    <div className="modal-backdrop evidence-backdrop" onClick={onClose}>
      <div
        className="evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-label={descriptor.title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="evidence-modal-head">
          <div className="evidence-modal-id">
            <span className="ev-type-badge">
              {TYPE_LABELS[descriptor.type] ?? descriptor.type}
            </span>
            <span className="mono ev-modal-code">{descriptor.evidence_id}</span>
            <span className="ev-classification">SYNTHETIC — TRAINING DATA</span>
          </div>
          <h2 className="evidence-modal-title">{descriptor.title}</h2>
          <div className="ev-meta">
            <span>Source: {descriptor.source}</span>
            {descriptor.host && <span>Host: {descriptor.host}</span>}
            <span>TZ: {descriptor.timezone}</span>
            <span>
              Window (IST): {descriptor.window_ist.start} → {descriptor.window_ist.end}
            </span>
          </div>
          <div className="evidence-modal-actions">
            <button
              type="button"
              className={`btn-ghost btn-sm${bookmarked ? " active" : ""}`}
              onClick={() => toggleBookmark(descriptor.evidence_id)}
            >
              {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
            </button>
            <button
              type="button"
              className={`btn-sm ${analyzed ? "btn-ghost" : "btn-primary"}`}
              disabled={analyzed}
              onClick={() => markEvidenceAnalyzed(descriptor.evidence_id)}
            >
              {analyzed ? "✓ Analyzed" : "Mark as analyzed"}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
              Close (Esc)
            </button>
          </div>
        </header>
        <div className="evidence-modal-body">
          <EvidenceViewer descriptor={descriptor} />
        </div>
      </div>
    </div>
  );
}
