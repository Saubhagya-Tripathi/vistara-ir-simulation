/**
 * Per-answer-type controls for the task workspace (one renderer per
 * answer_type). The grading bundle is consulted ONLY to construct matching
 * and ordered-sequence controls (row keys and option pools are the
 * candidate-facing sets per QUESTION_BANK); canonical pairings and canonical
 * order are never displayed.
 */
import { useEffect, useRef, useState } from "react";
import type { AnswerValue } from "../../types";
import {
  getGradingBundle,
  type CandidateBundle,
  type CandidateItem,
  type CandidateSubAnswer,
} from "../../engine/loader";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Option key extraction: an option labelled "A - ..." or "iv - ..." submits
 * its prefix; anything else (bare "WEB-PRD-01", "entire Server VLAN",
 * "Yes"/"No", "SAFE") submits the whole string.
 */
export function extractOptionKey(option: string): string {
  const m = /^([A-Z]|[ivx]+) - /.exec(option);
  return m ? m[1] : option;
}

/**
 * Deterministic interleave: second half first, alternating with the first
 * half. Fixed across renders and sessions — used wherever a control must
 * present canonical-order source data in a fixed shuffled display order.
 */
export function interleaveShuffle<T>(arr: readonly T[]): T[] {
  const mid = Math.ceil(arr.length / 2);
  const first = arr.slice(0, mid);
  const second = arr.slice(mid);
  const out: T[] = [];
  for (let i = 0; i < mid; i++) {
    if (i < second.length) out.push(second[i]);
    if (i < first.length) out.push(first[i]);
  }
  return out;
}

function asStrings(v: AnswerValue | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asRecord(v: AnswerValue | undefined): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) if (typeof val === "string") out[k] = val;
  return out;
}

function asCells(v: AnswerValue | undefined): Record<string, string[]> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string") out[k] = [val];
    else if (Array.isArray(val)) out[k] = val.filter((x): x is string => typeof x === "string");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Matching sources (grading bundle — control construction only)
// ---------------------------------------------------------------------------

/**
 * Pair-map matching (Q-04-03(c), Q-06-04(b)): the sub-answer canonical object
 * doubles as the candidate-facing row set (keys) and option pool (values).
 */
function pairMapCanonical(taskId: string, subKey: string): Record<string, string> {
  const g = getGradingBundle();
  const sa = g.items.find((i) => i.id === taskId)?.sub_answers.find((s) => s.key === subKey);
  const ca = sa?.canonical_answer;
  if (ca && typeof ca === "object" && !Array.isArray(ca)) {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(ca)) if (typeof val === "string") out[k] = val;
    return out;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Ordered-sequence item sources
// ---------------------------------------------------------------------------

export interface OrderableItem {
  id: string;
  label: string;
}

const ERADICATION_NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

/**
 * Item source per task:
 *  - Q-05-03: activities.timeline_display cards (displayId + description;
 *    value = ordered TL tokens). The candidate bundle order is already the
 *    candidate-facing shuffle.
 *  - Q-06-02(a), Q-06-04(a): the step strings from the grading sub-answer,
 *    shown in the fixed interleave shuffle; value = ordered strings.
 *  - Q-06-03(b): the candidate's (a) selections mapped through the grading
 *    supporting_structures.eradication_steps (numerals i..vii) or, for
 *    distractor numerals viii..x, the (a) option text; shown shuffled so the
 *    numeral order does not hand over the canonical order for free.
 */
export function sequenceItemsFor(
  bundle: CandidateBundle,
  task: CandidateItem,
  sub: CandidateSubAnswer,
  answers: Record<string, AnswerValue | undefined>,
): OrderableItem[] {
  if (task.id === "Q-05-03") {
    return bundle.activities.timeline_display.map((c) => ({
      id: c.token,
      label: `${c.displayId} — ${c.description}`,
    }));
  }

  const g = getGradingBundle();

  if (task.id === "Q-06-03" && sub.key === "(b)") {
    const subA = task.sub_answers.find((s) => s.key === "(a)");
    const options = subA?.options ?? [];
    const selected = asStrings(answers["(a)"]);
    const orderedSelection = options
      .map(extractOptionKey)
      .filter((k) => selected.includes(k));
    // Numerals i..vii map positionally onto the (b) canonical step strings
    // (the grading key); distractors viii..x fall back to their option text.
    const gsa = g.items
      .find((i) => i.id === task.id)
      ?.sub_answers.find((s) => s.key === "(b)");
    const steps = Array.isArray(gsa?.canonical_answer)
      ? (gsa.canonical_answer as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    const mapped = orderedSelection.map((numeral) => {
      const k = ERADICATION_NUMERALS.indexOf(numeral.toLowerCase());
      if (k >= 0 && k < steps.length) return steps[k];
      return options.find((o) => extractOptionKey(o) === numeral) ?? numeral;
    });
    return interleaveShuffle(mapped).map((s) => ({ id: s, label: s }));
  }

  if (task.id === "Q-06-02" || (task.id === "Q-06-04" && sub.key === "(a)")) {
    const gsa = g.items
      .find((i) => i.id === task.id)
      ?.sub_answers.find((s) => s.key === sub.key);
    const steps = Array.isArray(gsa?.canonical_answer)
      ? (gsa.canonical_answer as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    return interleaveShuffle(steps).map((s) => ({ id: s, label: s }));
  }

  return [];
}

// ---------------------------------------------------------------------------
// Atomic controls
// ---------------------------------------------------------------------------

interface CommonProps {
  value: AnswerValue | undefined;
  disabled: boolean;
  onChange: (value: AnswerValue) => void;
}

function RadioList({
  name,
  options,
  value,
  disabled,
  onChange,
}: CommonProps & { name: string; options: string[] }) {
  const current = typeof value === "string" ? value : "";
  return (
    <div>
      {options.map((opt) => {
        const key = extractOptionKey(opt);
        return (
          <label key={key} className="option-row">
            <input
              type="radio"
              name={name}
              checked={current === key}
              disabled={disabled}
              onChange={() => onChange(key)}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxList({ options, value, disabled, onChange }: CommonProps & { options: string[] }) {
  const current = asStrings(value);
  const toggle = (key: string) => {
    onChange(
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    );
  };
  return (
    <div>
      {options.map((opt) => {
        const key = extractOptionKey(opt);
        return (
          <label key={key} className="option-row">
            <input
              type="checkbox"
              checked={current.includes(key)}
              disabled={disabled}
              onChange={() => toggle(key)}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

const TEXT_FORMAT_HINTS: Record<string, string> = {
  asset: "hostname or IP",
  ip: "IPv4 address, optionally with :port",
  username: "account name (e.g. svc_portal)",
  account: "account name (e.g. svc_mon)",
  filename: "file name (e.g. img.aspx)",
  path: "full path (e.g. C:\\Windows\\Temp\\collect\\)",
  string: "short free-text answer",
  timestamp: "YYYY-MM-DD HH:MM IST",
  attack_technique: "MITRE ATT&CK technique ID (e.g. T1003.006)",
};

function TextField({
  answerType,
  value,
  disabled,
  onChange,
}: CommonProps & { answerType: string }) {
  return (
    <div className="field-row">
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="muted small">Format: {TEXT_FORMAT_HINTS[answerType] ?? "free text"}</span>
    </div>
  );
}

/** Q-05-04 variant: one behavior row, select of "T-ID — name". */
function TechniqueMatch({
  behavior,
  techniques,
  value,
  disabled,
  onChange,
}: CommonProps & { behavior: string; techniques: { id: string; name: string }[] }) {
  return (
    <div className="match-row">
      <span className="behavior">{behavior}</span>
      <select
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— select technique —</option>
        {techniques.map((t) => (
          <option key={t.id} value={t.id}>
            {t.id} — {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Pair-map matching: one select per row, pool in fixed interleaved order. */
function PairMapMatch({
  taskId,
  subKey,
  value,
  disabled,
  onChange,
}: CommonProps & { taskId: string; subKey: string }) {
  const canonical = pairMapCanonical(taskId, subKey);
  const rows = Object.keys(canonical);
  const pool = interleaveShuffle(Object.values(canonical));
  const current = asRecord(value);
  if (rows.length === 0) {
    return <p className="muted small">Matching control unavailable.</p>;
  }
  return (
    <div>
      {rows.map((row) => (
        <div className="match-row" key={row}>
          <span className="behavior">{row}</span>
          <select
            value={current[row] ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...current, [row]: e.target.value })}
          >
            <option value="">— select —</option>
            {pool.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ordered sequence (drag-and-drop + up/down buttons)
// ---------------------------------------------------------------------------

function reconcileOrder(items: OrderableItem[], value: string[] | undefined): string[] {
  const ids = items.map((i) => i.id);
  const kept = (value ?? []).filter((v) => ids.includes(v));
  const missing = ids.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}

export function OrderList({
  items,
  value,
  disabled,
  onChange,
}: {
  items: OrderableItem[];
  value: string[] | undefined;
  disabled: boolean;
  onChange: (order: string[]) => void;
}) {
  const order = reconcileOrder(items, value);
  const sig = JSON.stringify(order);
  const lastSent = useRef<string>("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Seed the draft with the displayed order, and reconcile when the item set
  // changes (e.g. Q-06-03(b) follows the candidate's (a) selections).
  useEffect(() => {
    if (order.length === 0) return;
    if (JSON.stringify(value ?? []) !== sig && lastSent.current !== sig) {
      lastSent.current = sig;
      onChange(order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const move = (from: number, to: number) => {
    if (disabled || to < 0 || to >= order.length) return;
    const next = [...order];
    const [el] = next.splice(from, 1);
    next.splice(to, 0, el);
    lastSent.current = JSON.stringify(next);
    onChange(next);
  };

  return (
    <ol className="order-list">
      {order.map((id, idx) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <li
            key={id}
            className={`order-item${dragIdx === idx ? " dragging" : ""}`}
            draggable={!disabled}
            onDragStart={() => setDragIdx(idx)}
            onDragEnd={() => setDragIdx(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== idx) move(dragIdx, idx);
              setDragIdx(null);
            }}
          >
            {!disabled && <span className="grip" aria-hidden="true">⠿</span>}
            <span className="pos">{idx + 1}</span>
            <span>{item.label}</span>
            {!disabled && (
              <span className="move-btns">
                <button
                  type="button"
                  aria-label={`Move "${item.label}" up`}
                  disabled={idx === 0}
                  onClick={() => move(idx, idx - 1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move "${item.label}" down`}
                  disabled={idx === order.length - 1}
                  onClick={() => move(idx, idx + 1)}
                >
                  ▼
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Classification table (Q-05-01)
// ---------------------------------------------------------------------------

function ClassificationTable({
  hosts,
  classes,
  value,
  disabled,
  onChange,
}: CommonProps & { hosts: string[]; classes: string[] }) {
  const current = asCells(value);
  return (
    <table className="class-grid">
      <thead>
        <tr>
          <th>Host</th>
          {classes.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hosts.map((host) => (
          <tr key={host}>
            <td>{host}</td>
            {classes.map((cls) => {
              const selected = current[host]?.[0] === cls;
              return (
                <td key={cls} className={selected ? "selected" : ""}>
                  <input
                    type="radio"
                    name={`cls-${host}`}
                    checked={selected}
                    disabled={disabled}
                    aria-label={`${host}: ${cls}`}
                    onChange={() => onChange({ ...current, [host]: [cls] })}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export interface SubAnswerControlProps {
  bundle: CandidateBundle;
  task: CandidateItem;
  sub: CandidateSubAnswer;
  /** Current value of this sub-answer. */
  value: AnswerValue | undefined;
  /** Whole draft (needed by Q-06-03(b), which follows the (a) selections). */
  answers: Record<string, AnswerValue | undefined>;
  disabled: boolean;
  onChange: (value: AnswerValue) => void;
}

export function SubAnswerControl(props: SubAnswerControlProps) {
  const { bundle, task, sub, value, answers, disabled, onChange } = props;
  switch (sub.answer_type) {
    case "single_choice":
    case "yes_no":
      if (!sub.options || sub.options.length === 0) {
        // Q-05-05(b): choice-type sub-answer without an option list — free text.
        return <TextField answerType="string" value={value} disabled={disabled} onChange={onChange} />;
      }
      return (
        <RadioList
          name={`${task.id}-${sub.key}`}
          options={sub.options}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "multi_select":
      if (!sub.options || sub.options.length === 0) {
        // Q-02-02(e): the evidence picker below is this sub-answer's control.
        return (
          <p className="muted small">
            Use the evidence picker below to select the artifacts.
          </p>
        );
      }
      return (
        <CheckboxList options={sub.options} value={value} disabled={disabled} onChange={onChange} />
      );
    case "matching":
      return sub.options && sub.options.length > 0 ? (
        <TechniqueMatch
          behavior={sub.question}
          techniques={bundle.activities.attack_techniques}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : (
        <PairMapMatch
          taskId={task.id}
          subKey={sub.key}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "ordered_sequence":
      return (
        <OrderList
          items={sequenceItemsFor(bundle, task, sub, answers)}
          value={asStrings(value)}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "classification_table":
      return (
        <ClassificationTable
          hosts={bundle.activities.host_classification_hosts}
          classes={bundle.activities.host_classification_classes}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );
    case "structured_report":
      return (
        <div className="field-row">
          <textarea
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="3–5 sentences for a non-technical executive"
          />
        </div>
      );
    default:
      // asset, ip, username, account, filename, path, string, timestamp,
      // attack_technique — single-line text with a format hint.
      return (
        <TextField
          answerType={sub.answer_type}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Completeness (submit gating)
// ---------------------------------------------------------------------------

/** True when the sub-answer currently holds a submittable value. */
export function isSubComplete(
  bundle: CandidateBundle,
  task: CandidateItem,
  sub: CandidateSubAnswer,
  answers: Record<string, AnswerValue | undefined>,
): boolean {
  const v = answers[sub.key];
  switch (sub.answer_type) {
    case "multi_select":
      return Array.isArray(v) && v.length > 0;
    case "matching": {
      if (sub.options && sub.options.length > 0) {
        return typeof v === "string" && v.trim().length > 0;
      }
      const rows = Object.keys(pairMapCanonical(task.id, sub.key));
      const rec = asRecord(v);
      return rows.length > 0 && rows.every((r) => (rec[r] ?? "").trim().length > 0);
    }
    case "ordered_sequence": {
      const items = sequenceItemsFor(bundle, task, sub, answers);
      if (items.length === 0 || !Array.isArray(v)) return false;
      return items.every((it) => (v as string[]).includes(it.id));
    }
    case "classification_table": {
      const rec = asCells(v);
      return bundle.activities.host_classification_hosts.every(
        (h) => Array.isArray(rec[h]) && rec[h].length === 1,
      );
    }
    default:
      // single_choice, yes_no, text types, structured_report
      return typeof v === "string" && v.trim().length > 0;
  }
}
