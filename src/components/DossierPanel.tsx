import { useState } from "react";
import type { Dossier } from "../engine/loader";

/**
 * Case dossier (reference material, not answers), rendered inside the
 * slide-over drawer. Sections filter via the search box; matching sections
 * auto-open. Renders the structured dossier data generically so future
 * simulations reuse it without component changes.
 */
export function DossierPanel({ dossier }: { dossier: Dossier }) {
  const [query, setQuery] = useState("");
  const sections: [string, unknown][] = [
    ["Case Summary", dossier.caseSummary],
    ["Organization", dossier.organization],
    ["Network", dossier.network],
    ["Assets & Hosts", dossier.hosts],
    ["Users & Identities", dossier.users],
    ["Web / Application", dossier.webApp],
    ["Active Directory", dossier.activeDirectory],
    ["Security Controls", dossier.securityControls],
    ["Policies", dossier.policies],
    ["External Context", dossier.externalContext],
    ["Timezone Reference", dossier.timezoneNote],
  ];
  const q = query.trim().toLowerCase();
  const visible = q
    ? sections.filter(([title, value]) =>
        `${title} ${JSON.stringify(value)}`.toLowerCase().includes(q),
      )
    : sections;
  return (
    <div className="dossier">
      <input
        className="dossier-search"
        placeholder="Filter dossier (host, user, policy, IP…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="muted small">Reference material — always available. Not evidence.</p>
      {visible.length === 0 && <p className="muted small">No dossier sections match.</p>}
      {visible.map(([title, value]) => (
        <DossierSection key={title} title={title} value={value} forceOpen={q.length > 0} />
      ))}
    </div>
  );
}

function DossierSection({
  title,
  value,
  forceOpen,
}: {
  title: string;
  value: unknown;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(title === "Case Summary");
  const effectiveOpen = forceOpen || open;
  return (
    <section className="dossier-section">
      <button className="dossier-toggle" onClick={() => setOpen(!open)}>
        <span>{effectiveOpen ? "▾" : "▸"}</span> {title}
      </button>
      {effectiveOpen && <div className="dossier-body">{renderValue(value)}</div>}
    </section>
  );
}

function labelize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return <p className="dossier-text">{value}</p>;
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="mono">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <ul className="dossier-list">
          {value.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      );
    }
    return (
      <div className={depth > 0 ? "dossier-nested" : undefined}>
        {value.map((v, i) => (
          <div key={i} className="dossier-card">
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="dossier-kv">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="dossier-kv-row">
            <dt>{labelize(k)}</dt>
            <dd>{renderValue(v, depth + 1)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return null;
}
