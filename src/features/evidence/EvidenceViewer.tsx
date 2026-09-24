/**
 * Standalone evidence viewer with a working toolbar:
 * zoom (font scaling), search-within-document, drill-down toggle.
 * Used both inside the Evidence tab and inside the immersive modal.
 * Consumes candidate_view descriptors and bodies only.
 */
import { useEffect, useMemo, useState } from "react";
import type { EvidenceCandidateView } from "../../types";
import { loadEvidenceBody } from "../../engine/loader";
import { useSimStore } from "../../engine/state/store";
import { evidenceFileFor } from "../../engine/progression/reveal";
import { LogViewer } from "./viewers/LogViewer";
import { CsvTable } from "./viewers/CsvTable";
import { DocView } from "./viewers/DocView";
import { JsonView } from "./viewers/JsonViews";

export const TYPE_LABELS: Record<string, string> = {
  siem_alert: "SIEM alert",
  ticket: "ITSM ticket",
  iis_access_log: "IIS access log (UTC)",
  windows_security: "Windows security log",
  edr_process: "EDR process telemetry",
  edr_session: "EDR session",
  powershell_log: "PowerShell log",
  firewall_log: "Firewall log",
  netflow_summary: "NetFlow summary",
  proxy_log: "Proxy log",
  ad_snapshot: "AD snapshot",
  sql_audit: "SQL audit",
  vpn_log: "VPN log",
  vuln_scan_job: "Vulnerability scan job",
  smb_file_audit: "SMB file audit",
  document: "Document",
  fs_event: "Filesystem event",
  response_record: "Response record",
  validation_record: "Validation record",
  report: "Report",
};

type BodyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; text: string };

export function EvidenceViewer({
  descriptor,
  query = "",
}: {
  descriptor: EvidenceCandidateView;
  query?: string;
}) {
  const state = useSimStore((s) => s.state);
  const [showDrilldown, setShowDrilldown] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [localQuery, setLocalQuery] = useState("");
  const [body, setBody] = useState<BodyState>({ status: "loading" });

  // E-VALID-002 swaps interim -> re-run based on progression state.
  const statePath = state ? evidenceFileFor(descriptor.evidence_id, state) : null;
  const primaryPath = statePath ?? descriptor.path;
  const activePath =
    showDrilldown && descriptor.drilldown ? descriptor.drilldown : primaryPath;

  useEffect(() => {
    let cancelled = false;
    setBody({ status: "loading" });
    loadEvidenceBody(activePath)
      .then((text) => {
        if (!cancelled) setBody({ status: "ready", text });
      })
      .catch((e) => {
        if (!cancelled) {
          setBody({
            status: "error",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePath]);

  // In-document search takes precedence over the inherited list query.
  const effectiveQuery = localQuery.trim() || query;
  const matchCount = useMemo(() => {
    if (body.status !== "ready" || !effectiveQuery) return 0;
    const b = body.text.toLowerCase();
    const q = effectiveQuery.toLowerCase();
    let n = 0;
    let i = b.indexOf(q);
    while (i !== -1) {
      n++;
      i = b.indexOf(q, i + q.length);
    }
    return n;
  }, [body, effectiveQuery]);

  return (
    <div className="ev-viewer-inner">
      <div className="ev-toolbar">
        <div className="ev-toolbar-group">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2)))}
            title="Zoom out"
          >
            A−
          </button>
          <span className="muted small mono">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(2)))}
            title="Zoom in"
          >
            A+
          </button>
        </div>
        <div className="ev-toolbar-group ev-toolbar-search">
          <input
            type="search"
            placeholder="Search in document…"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {effectiveQuery && (
            <span className="muted small">
              {matchCount} match{matchCount === 1 ? "" : "es"}
            </span>
          )}
        </div>
        {descriptor.drilldown && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setShowDrilldown((v) => !v)}
          >
            {showDrilldown ? "View summary" : "View drill-down"}
          </button>
        )}
      </div>
      <div className="ev-document" style={{ fontSize: `${zoom}em` }}>
        {body.status === "loading" && <p className="muted small">Loading artifact…</p>}
        {body.status === "error" && (
          <p className="check-fail small">Could not load this artifact: {body.message}</p>
        )}
        {body.status === "ready" && (
          <BodyView descriptor={descriptor} path={activePath} body={body.text} query={effectiveQuery} />
        )}
      </div>
    </div>
  );
}

function BodyView({
  descriptor,
  path,
  body,
  query,
}: {
  descriptor: EvidenceCandidateView;
  path: string;
  body: string;
  query: string;
}) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv") return <CsvTable body={body} />;
  if (ext === "md") return <DocView body={body} />;
  if (ext === "json") {
    try {
      const data: unknown = JSON.parse(body);
      return <JsonView type={descriptor.type} data={data} />;
    } catch (e) {
      return (
        <p className="check-fail small">
          Malformed JSON in this artifact: {e instanceof Error ? e.message : String(e)}
        </p>
      );
    }
  }
  return <LogViewer body={body} query={query} />;
}
