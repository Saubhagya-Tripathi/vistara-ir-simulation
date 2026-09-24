/**
 * Center-panel "Evidence" tab: searchable card grid over revealed artifacts.
 * Cards communicate type, id, title, host/source, and viewed/analyzed/
 * bookmarked state; opening a card goes through onOpen (immersive modal).
 *
 * SECURITY BOUNDARY: candidate_view descriptors and artifact bodies only;
 * internal_metadata and the grading bundle are never touched here.
 */
import { useEffect, useMemo, useState } from "react";
import type { EvidenceCandidateView, EvidenceManifest } from "../../types";
import { candidateDescriptors, loadEvidenceBody } from "../../engine/loader";
import { useSimStore } from "../../engine/state/store";
import { evidenceFileFor } from "../../engine/progression/reveal";
import { countOccurrences, filterDescriptors } from "./search";
import { TYPE_LABELS } from "./EvidenceViewer";

/** Preferred group order (directory names under evidence/). */
const GROUP_ORDER = [
  "alerts", "web", "auth", "edr", "fs", "net",
  "ad", "db", "vuln", "docs", "response",
];

const GROUP_LABELS: Record<string, string> = {
  alerts: "Alerts & tickets",
  web: "Web logs",
  auth: "Authentication & VPN",
  edr: "EDR telemetry",
  fs: "Filesystem & shares",
  net: "Network",
  ad: "Active Directory",
  db: "Database",
  vuln: "Vulnerability scans",
  docs: "Documents",
  response: "Response & validation",
};

const BODY_SEARCH_MIN = 3;

function dirOf(d: EvidenceCandidateView): string {
  return d.path.split("/")[0] ?? "other";
}

export function EvidencePanel({
  manifest,
  onOpen,
}: {
  manifest: EvidenceManifest;
  onOpen: (id: string) => void;
}) {
  const state = useSimStore((s) => s.state);
  const markEvidenceViewed = useSimStore((s) => s.markEvidenceViewed);
  const [query, setQuery] = useState("");
  const [bodyMatches, setBodyMatches] = useState<Record<string, number>>({});
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // Only revealed artifacts are ever listed.
  const revealed = useMemo(() => {
    const ids = new Set(state?.revealedEvidence ?? []);
    return candidateDescriptors(manifest).filter((d) => ids.has(d.evidence_id));
  }, [manifest, state]);

  // Async body search across revealed artifacts (loadEvidenceBody is cached).
  useEffect(() => {
    const q = query.trim();
    if (q.length < BODY_SEARCH_MIN || !state) {
      setBodyMatches({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        revealed.map(async (d) => {
          const path = evidenceFileFor(d.evidence_id, state) ?? d.path;
          try {
            const n = countOccurrences(await loadEvidenceBody(path), q);
            if (n > 0) results[d.evidence_id] = n;
          } catch {
            // A body that fails to load simply gets no badge.
          }
        }),
      );
      if (!cancelled) setBodyMatches(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [query, revealed, state]);

  const visible = useMemo(() => {
    let list = filterDescriptors(revealed, query);
    if (showBookmarkedOnly && state) {
      list = list.filter((d) => state.bookmarkedEvidence.includes(d.evidence_id));
    }
    return list;
  }, [revealed, query, showBookmarkedOnly, state]);

  const groups = useMemo(() => {
    const byDir = new Map<string, EvidenceCandidateView[]>();
    for (const d of visible) {
      const dir = dirOf(d);
      const list = byDir.get(dir);
      if (list) list.push(d);
      else byDir.set(dir, [d]);
    }
    return Array.from(byDir.keys())
      .sort((a, b) => {
        const ia = GROUP_ORDER.indexOf(a);
        const ib = GROUP_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map((dir) => ({ dir, items: byDir.get(dir)! }));
  }, [visible]);

  const viewed = new Set(state?.viewedEvidence ?? []);
  const analyzed = new Set(state?.analyzedEvidence ?? []);
  const bookmarked = new Set(state?.bookmarkedEvidence ?? []);

  const open = (id: string) => {
    markEvidenceViewed(id);
    onOpen(id);
  };

  return (
    <div className="evidence-browser">
      <div className="evidence-browser-bar">
        <input
          className="evidence-search"
          type="search"
          placeholder="Search evidence — id, title, host, IP, user, or content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className={`btn-ghost btn-sm${showBookmarkedOnly ? " active" : ""}`}
          onClick={() => setShowBookmarkedOnly((v) => !v)}
        >
          ★ Bookmarked
        </button>
        <span className="muted small evidence-count">
          {visible.length} of {revealed.length} artifacts
        </span>
      </div>
      {groups.length === 0 && (
        <p className="muted small">
          {revealed.length === 0
            ? "No evidence revealed yet."
            : "No artifacts match this filter."}
        </p>
      )}
      {groups.map((g) => (
        <section key={g.dir} className="evidence-group">
          <h3 className="evidence-group-title">{GROUP_LABELS[g.dir] ?? g.dir}</h3>
          <div className="evidence-card-grid">
            {g.items.map((d) => (
              <button
                key={d.evidence_id}
                type="button"
                className="evidence-card"
                onClick={() => open(d.evidence_id)}
              >
                <div className="evidence-card-top">
                  <span className="ev-type-badge">
                    {TYPE_LABELS[d.type] ?? d.type}
                  </span>
                  <span className="evidence-card-flags">
                    {bookmarked.has(d.evidence_id) && <span title="Bookmarked">★</span>}
                    {!viewed.has(d.evidence_id) && (
                      <span className="flag-new" title="Not yet viewed">NEW</span>
                    )}
                    {analyzed.has(d.evidence_id) && (
                      <span className="flag-analyzed" title="Analyzed">✓ ANALYZED</span>
                    )}
                  </span>
                </div>
                <div className="evidence-card-id mono">{d.evidence_id}</div>
                <div className="evidence-card-title">{d.title}</div>
                <div className="evidence-card-meta">
                  {d.host ?? d.source}
                  {bodyMatches[d.evidence_id] != null && (
                    <span className="muted">
                      {" "}· {bodyMatches[d.evidence_id]} match
                      {bodyMatches[d.evidence_id] === 1 ? "" : "es"}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
