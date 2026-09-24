/**
 * Typed renderers for JSON evidence bodies. Each renderer defensively
 * narrows the parsed body — a malformed or unexpected shape falls back to
 * the generic recursive renderer instead of crashing.
 */
import type { ReactNode } from "react";
import type { EvidenceType } from "../../../types";

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isScalar(v: unknown): v is string | number | boolean | null {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function labelize(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (isScalar(v)) return String(v);
  return JSON.stringify(v);
}

/** data-table for an array of flat-ish objects; explicit column order wins. */
function ObjectTable({ rows, columns }: { rows: Rec[]; columns?: string[] }) {
  const cols =
    columns ??
    Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return (
    <table className="data-table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{labelize(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {cols.map((c) => (
              <td key={c} className="mono" style={{ wordBreak: "break-word" }}>
                {cellText(r[c])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** kv-grid over the scalar entries of an object. */
function ScalarKv({ data, keys }: { data: Rec; keys?: string[] }) {
  const entries = Object.entries(data).filter(
    ([k, v]) => isScalar(v) && (!keys || keys.includes(k)),
  );
  if (entries.length === 0) return null;
  return (
    <dl className="kv-grid">
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{labelize(k)}</dt>
          <dd>{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function renderNested(v: unknown): ReactNode {
  if (Array.isArray(v)) {
    if (v.length > 0 && v.every(isRecord)) return <ObjectTable rows={v} />;
    return (
      <ul>
        {v.map((item, i) => (
          <li key={i}>{isScalar(item) ? String(item) : renderNested(item)}</li>
        ))}
      </ul>
    );
  }
  if (isRecord(v)) return <GenericJsonView data={v} />;
  return <span className="mono">{cellText(v)}</span>;
}

/** Recursive key/value renderer: scalars in kv-grid, nested values below. */
export function GenericJsonView({ data }: { data: Rec }) {
  const complex = Object.entries(data).filter(([, v]) => !isScalar(v));
  return (
    <>
      <ScalarKv data={data} />
      {complex.map(([k, v]) => (
        <section key={k}>
          <h4>{labelize(k)}</h4>
          {renderNested(v)}
        </section>
      ))}
    </>
  );
}

const EDR_EVENT_COLUMNS = [
  "time_ist",
  "ts_ist",
  "ts",
  "user",
  "process",
  "cmdline",
  "pid",
  "parent",
  "parent_pid",
  "sha256",
];

/** edr_process: session/scalar header + events as a data-table. */
function EdrProcessView({ data }: { data: Rec }) {
  const events = Array.isArray(data.events) ? data.events.filter(isRecord) : [];
  const session = isRecord(data.session) ? data.session : null;
  const columns = EDR_EVENT_COLUMNS.filter((c) =>
    events.some((e) => c in e),
  ).concat(
    Array.from(new Set(events.flatMap((e) => Object.keys(e)))).filter(
      (c) => !EDR_EVENT_COLUMNS.includes(c) && c !== "synthetic",
    ),
  );
  return (
    <>
      <ScalarKv
        data={data}
        keys={["evidence_id", "source", "host", "collection_window_ist"]}
      />
      {session && (
        <>
          <h4>Session</h4>
          <ScalarKv data={session} />
        </>
      )}
      {events.length > 0 ? (
        <ObjectTable rows={events} columns={columns} />
      ) : (
        <p className="muted small">No events in this export.</p>
      )}
    </>
  );
}

/** edr_session: session fields in kv-grid + events table when present. */
function EdrSessionView({ data }: { data: Rec }) {
  const session = isRecord(data.session) ? data.session : data;
  const events = Array.isArray(data.events) ? data.events.filter(isRecord) : [];
  return (
    <>
      <ScalarKv
        data={data}
        keys={["evidence_id", "source", "host", "collection_window_ist"]}
      />
      <h4>Session</h4>
      <ScalarKv data={session} />
      {events.length > 0 && <ObjectTable rows={events} />}
    </>
  );
}

/** ad_snapshot: group membership lists + per-object table with last_logon. */
function AdSnapshotView({ data }: { data: Rec }) {
  const groups = Array.isArray(data.groups) ? data.groups.filter(isRecord) : [];
  const objects = Array.isArray(data.objects) ? data.objects.filter(isRecord) : [];
  return (
    <>
      <ScalarKv
        data={data}
        keys={["evidence_id", "source", "domain", "captured_ist"]}
      />
      {groups.map((g, i) => (
        <section key={i}>
          <h4>Group: {cellText(g.name)}</h4>
          {Array.isArray(g.members) ? (
            <ul>
              {g.members.map((m, j) => (
                <li key={j} className="mono">
                  {cellText(m)}
                </li>
              ))}
            </ul>
          ) : (
            renderNested(g.members)
          )}
        </section>
      ))}
      {objects.length > 0 && (
        <>
          <h4>Objects</h4>
          <ObjectTable
            rows={objects}
            columns={[
              "sam",
              "display",
              "description",
              "created_ist",
              "enabled",
              "member_of",
              "last_logon_ist",
            ].filter((c) => objects.some((o) => c in o))}
          />
        </>
      )}
    </>
  );
}

const FS_EVENT_KEYS = [
  "path",
  "action",
  "process",
  "user",
  "ts_ist",
  "size_bytes",
  "sha256",
  "host",
  "host_ip",
  "timezone",
];

/** fs_event: kv-grid of event fields + content excerpt as log-body. */
function FsEventView({ data }: { data: Rec }) {
  return (
    <>
      <ScalarKv data={data} keys={["evidence_id", "source", ...FS_EVENT_KEYS]} />
      {typeof data.content_excerpt === "string" && (
        <>
          <h4>Content excerpt</h4>
          <pre className="log-body">{data.content_excerpt}</pre>
        </>
      )}
    </>
  );
}

function statusClass(result: unknown): string {
  const r = String(result ?? "").toUpperCase();
  if (r === "PASS" || r === "SUCCESS" || r === "COMPLETE" || r === "DONE") {
    return "check-pass";
  }
  if (r === "SKIPPED" || r === "SKIP" || r === "PARTIAL" || r === "PENDING") {
    return "check-skip";
  }
  return "check-fail";
}

/** response_record: header kv + ordered action list with status badges. */
function ResponseRecordView({ data }: { data: Rec }) {
  const actions = Array.isArray(data.actions) ? data.actions.filter(isRecord) : [];
  return (
    <>
      <ScalarKv
        data={data}
        keys={["evidence_id", "incident", "phase", "time_ist", "actor"]}
      />
      <ol>
        {actions.map((a, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            <div>
              <strong>{cellText(a.action)}</strong>{" "}
              <span className={statusClass(a.result)}>
                <strong>{cellText(a.result)}</strong>
              </span>
            </div>
            {a.target != null && (
              <div className="small mono">Target: {cellText(a.target)}</div>
            )}
            {a.detail != null && (
              <div className="muted small">{cellText(a.detail)}</div>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

/** validation_record: check list with PASS/FAIL/SKIPPED styling. */
function ValidationRecordView({ data }: { data: Rec }) {
  const checks = Array.isArray(data.checks) ? data.checks.filter(isRecord) : [];
  const declaration = isRecord(data.declaration) ? data.declaration : null;
  return (
    <>
      <ScalarKv
        data={data}
        keys={["evidence_id", "incident", "phase", "time_ist", "actor", "packet", "supersedes"]}
      />
      {checks.length === 0 && <GenericJsonView data={data} />}
      <ol>
        {checks.map((c, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            <div>
              {cellText(c.check)}{" "}
              <span className={statusClass(c.result)}>
                <strong>{cellText(c.result)}</strong>
              </span>
            </div>
            {c.basis != null && (
              <div className="muted small">{cellText(c.basis)}</div>
            )}
          </li>
        ))}
      </ol>
      {declaration && (
        <p className="small">
          <strong>Declaration: </strong>
          <span className={statusClass(declaration.state)}>
            {cellText(declaration.state)}
          </span>
          {declaration.note != null && (
            <span className="muted"> — {cellText(declaration.note)}</span>
          )}
        </p>
      )}
    </>
  );
}

/** Dispatch a parsed JSON body to the typed renderer for its evidence type. */
export function JsonView({ type, data }: { type: EvidenceType; data: unknown }) {
  if (!isRecord(data)) {
    return <p className="muted small">Unexpected JSON shape for this artifact.</p>;
  }
  switch (type) {
    case "edr_process":
      return <EdrProcessView data={data} />;
    case "edr_session":
      return <EdrSessionView data={data} />;
    case "ad_snapshot":
      return <AdSnapshotView data={data} />;
    case "fs_event":
      return <FsEventView data={data} />;
    case "response_record":
      return <ResponseRecordView data={data} />;
    case "validation_record":
      return <ValidationRecordView data={data} />;
    case "siem_alert":
    case "ticket":
    default:
      return <GenericJsonView data={data} />;
  }
}
