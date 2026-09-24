import { useState } from "react";

/**
 * Supporting-evidence multi-select. Contextual by default: artifacts
 * referenced by the current task are presented first ("Relevant artifacts
 * available"); the full revealed library is one click away behind an explicit
 * toggle, with a search filter — the candidate is never dumped into a wall of
 * unrelated chips.
 *
 * For Q-02-02 the picker's value IS sub-answer (e); for other evidence-linked
 * tasks it is the separate supporting-evidence selection.
 */
export function EvidencePicker({
  ids,
  relatedIds = [],
  value,
  onChange,
  disabled,
}: {
  ids: string[];
  relatedIds?: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const related = relatedIds.filter((id) => ids.includes(id));
  const rest = ids.filter((id) => !related.includes(id));
  const q = query.trim().toLowerCase();
  const restFiltered = q ? rest.filter((id) => id.toLowerCase().includes(q)) : rest;

  const chip = (id: string) => (
    <button
      key={id}
      type="button"
      className={`ev-chip${value.includes(id) ? " selected" : ""}`}
      onClick={() => toggle(id)}
      disabled={disabled}
      aria-pressed={value.includes(id)}
    >
      {id}
    </button>
  );

  return (
    <div className="evidence-picker">
      {related.length > 0 && (
        <>
          <p className="muted small picker-label">Relevant artifacts available</p>
          <div className="picker-grid">{related.map(chip)}</div>
        </>
      )}
      {!disabled && (
        <div className="picker-expand-row">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? "Hide full evidence library"
              : `Browse all available evidence (${rest.length} more)`}
          </button>
        </div>
      )}
      {(expanded || disabled) && rest.length > 0 && (
        <>
          {expanded && !disabled && (
            <input
              type="search"
              className="picker-filter"
              placeholder="Filter by artifact id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <div className="picker-grid">
            {(disabled ? rest : restFiltered).map(chip)}
            {!disabled && restFiltered.length === 0 && (
              <span className="muted small">No artifacts match this filter.</span>
            )}
          </div>
        </>
      )}
      <p className="muted small">{value.length} selected</p>
    </div>
  );
}
