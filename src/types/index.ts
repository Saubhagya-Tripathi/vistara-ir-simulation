/**
 * Core data model for the Vistara IR simulation platform.
 * Types are derived from the authoritative design package:
 *   - assessment.json (items, phases, supporting_structures, scoring, progression)
 *   - EVIDENCE_DIRECTORY_SPEC_v1.1.md §4–5 (evidence metadata model)
 * Runtime code must never expose grading-side fields to candidate-facing components.
 */

// ---------------------------------------------------------------------------
// Assessment / task model (from assessment.json)
// ---------------------------------------------------------------------------

export type PhaseId = "P0" | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";

export interface Phase {
  id: PhaseId;
  name: string;
  time_budget_minutes: number;
  time_split: { investigation: number; evidence_review: number; task_decision: number };
  gate: string;
  tasks: string[];
}

export type AnswerType =
  | "single_choice"
  | "multi_select"
  | "asset"
  | "ip"
  | "username"
  | "account"
  | "filename"
  | "path"
  | "string"
  | "timestamp"
  | "yes_no"
  | "attack_technique"
  | "matching"
  | "ordered_sequence"
  | "classification_table"
  | "structured_report"
  | "composite";

export type AnswerValue =
  | string
  | string[]
  | Record<string, string>
  | Record<string, string[]>;

export interface SubAnswer {
  key: string; // "(a)", "(b)", ...
  question: string;
  answer_type: AnswerType;
  options?: string[];
  points: number;
  cell_count?: number; // classification_table
  cell_points?: number; // classification_table
  accepted_range_hours?: { min: number; max: number; note?: string }; // dwell tolerance
}

/** Grading-side sub-answer record (never sent to candidate components). */
export interface SubAnswerKey extends SubAnswer {
  canonical_answer: unknown;
  accepted_answers: unknown;
  attack_events?: string[];
}

export interface Hint {
  text: string;
  penalty: number;
}

export interface EvidenceSelectionSpec {
  is_candidate_action: boolean;
  earns_points: boolean;
  points: number;
  required_set: string[] | null;
  rule: string;
  expressed_as?: string;
}

/** Candidate-facing task record. */
export interface Task {
  id: string; // Q-XX-YY
  phase: PhaseId;
  title: string;
  instructions: string;
  task_type: string;
  answer_type: AnswerType;
  sub_answers: SubAnswer[];
  required_evidence: string[]; // IDs only; used for evidence-picker context
  points: number;
  difficulty: string;
  evidence_linked: boolean;
  hints: Hint[];
  hint_penalty: number;
  unlock: string;
  learning_outcomes: number[];
  evidence_selection: EvidenceSelectionSpec;
  reference_evidence?: string[];
}

/** Grading-side task record. */
export interface TaskKey extends Task {
  canonical_answer: unknown;
  accepted_answers: unknown;
  attack_events: string[];
  evidence_correlation: string;
  common_wrong_answer: { answer: string; why_wrong: string };
  critical_failure_link?: "CF-1" | "CF-2" | "CF-3";
  sub_answers: SubAnswerKey[];
}

// ---------------------------------------------------------------------------
// Supporting structures (from assessment.json supporting_structures)
// ---------------------------------------------------------------------------

export interface TimelineItem {
  key: string; // TL-01..TL-11 — internal; never displayed to candidate
  description: string;
  evt: string;
  canonical_position: number;
}

export interface AttackTechnique {
  id: string; // T-ID
  name: string;
}

export interface AttackMapping {
  behavior: string;
  canonical_technique: string;
}

export interface HostClassification {
  host: string;
  canonical_class: string;
  basis: string;
}

export interface IocSet {
  canonical: string[];
  distractors: string[];
}

export interface ContainmentState {
  isolate_hosts: string[];
  disable_accounts: string[];
  block_ips: string[];
  suspend_paths: string[];
}

export interface ReportField {
  field: string;
  canonical: unknown;
  note?: string;
  accepted_range_hours?: { min: number; max: number; note?: string };
}

export interface SupportingStructures {
  timeline_items: TimelineItem[];
  attack_controlled_list: AttackTechnique[];
  attack_mappings: AttackMapping[];
  host_classification: HostClassification[];
  ioc_set: IocSet;
  containment_state: ContainmentState;
  eradication_steps: string[];
  recovery_sequence: string[];
  recovery_approach: Record<string, string>;
  safe_state_checks: string[];
  residual_risks: string[];
  recommendations: string[];
  report_fields: ReportField[];
  exec_summary_rubric: string[];
}

// ---------------------------------------------------------------------------
// Scoring model (from assessment.json scoring)
// ---------------------------------------------------------------------------

export interface Dimension {
  id: string;
  name: string;
  tasks: string[];
  raw_points: number;
  weight_pct: number;
}

export interface CriticalFailureSpec {
  id: "CF-1" | "CF-2" | "CF-3";
  trigger: string;
  effect: string;
}

export interface ScoringConfig {
  raw_points_by_phase: Record<string, number>;
  dimensions: Dimension[];
  grading_formulas: Record<string, string>;
  hint_policy: string;
  pass_threshold_pct: number;
  pass_rule: string;
  critical_failures: CriticalFailureSpec[];
  bands: { label: string; range: string }[];
}

// ---------------------------------------------------------------------------
// Evidence model (from EVIDENCE_DIRECTORY_SPEC §4–5)
// ---------------------------------------------------------------------------

export type EvidenceType =
  | "siem_alert" | "ticket" | "iis_access_log" | "windows_security"
  | "edr_process" | "edr_session" | "powershell_log" | "firewall_log"
  | "netflow_summary" | "proxy_log" | "ad_snapshot" | "sql_audit"
  | "vpn_log" | "vuln_scan_job" | "smb_file_audit" | "document"
  | "fs_event" | "response_record" | "validation_record" | "report";

export interface EvidenceCandidateView {
  evidence_id: string;
  path: string; // relative to evidence/
  type: EvidenceType;
  source: string;
  host: string | null;
  timezone: string;
  window_ist: { start: string; end: string };
  reveal_phase: number;
  synthetic: boolean;
  drilldown: string | null;
  title: string;
}

/** Grading-side metadata — shipped in a separate manifest, never rendered. */
export interface EvidenceInternalMetadata {
  evt_refs: string[];
  rh_refs: string[];
  red_herring: boolean;
  rule_out: string | null;
  corroborates: string[];
  relevance?: string;
  expected_significance?: string;
}

export interface EvidenceManifestEntry {
  candidate_view: EvidenceCandidateView;
  internal_metadata: EvidenceInternalMetadata;
}

export interface EvidenceManifest {
  artifacts: EvidenceManifestEntry[];
}

/** Candidate-safe artifact descriptor (what the UI is allowed to know). */
export type EvidenceDescriptor = EvidenceCandidateView;

// ---------------------------------------------------------------------------
// Candidate state
// ---------------------------------------------------------------------------

export type TaskStatus = "locked" | "available" | "submitted";

export interface HintUse {
  taskId: string;
  hintIndex: number;
  at: string; // ISO timestamp
  penalty: number;
}

export interface TaskSubmission {
  taskId: string;
  answers: Record<string, AnswerValue>; // sub-answer key -> value
  evidenceSelection: string[];
  submittedAt: string;
  earned: number; // pre-hint
  hintPenalty: number;
  score: number; // final task score
  breakdown: Record<string, number>; // per component
}

export interface SafeStateProgress {
  stage: 1 | 2;
  interimReviewed: boolean;
  stage1Declaration: "SAFE" | "NOT SAFE" | null;
  rerunRevealed: boolean;
  remediationLoopUsed: boolean;
}

export interface ConsequenceState {
  overContainment: boolean;
  /** Set when an under-contained Q-06-01 set executes (SIEM escalation pending). */
  underContainment: boolean;
  underContainmentRemediated: boolean;
  eradicationIncomplete: boolean;
  prematureSafe: boolean;
  triggeredCriticalFailures: string[];
}

export interface CandidateState {
  version: number;
  candidateName: string;
  /** Candidate-supplied role (e.g. "Senior IR Analyst"). */
  candidateRole: string;
  startedAt: string;
  elapsedBeforePauseMs: number;
  currentPhase: PhaseId;
  currentTask: string | null;
  phaseStatus: Record<PhaseId, "locked" | "open" | "complete">;
  taskStatus: Record<string, TaskStatus>;
  drafts: Record<string, Record<string, AnswerValue>>;
  evidenceDrafts: Record<string, string[]>;
  submissions: Record<string, TaskSubmission>;
  revealedEvidence: string[];
  viewedEvidence: string[];
  /** Artifacts the candidate explicitly marked as analyzed (persists). */
  analyzedEvidence: string[];
  /** Bookmarked artifact IDs. */
  bookmarkedEvidence: string[];
  hintsUsed: HintUse[];
  notes: Record<string, string>;
  safeState: SafeStateProgress;
  consequences: ConsequenceState;
  reportFields: Record<string, AnswerValue>;
  execSummary: string;
  /** Accumulated elapsed ms per phase (for the soft pacing nudge). */
  phaseElapsedMs: Record<PhaseId, number>;
  /** Phases whose >120%-of-budget pacing nudge has already fired (once per phase). */
  nudgedPhases: PhaseId[];
  finished: boolean;
}

// ---------------------------------------------------------------------------
// Scoring output
// ---------------------------------------------------------------------------

export interface ScoreReport {
  taskScores: Record<string, number>;
  rawTotal: number;
  rawMax: number;
  dimensionScores: { id: string; name: string; earned: number; max: number; weightPct: number; weighted: number }[];
  finalPct: number;
  capped: boolean;
  criticalFailures: string[];
  band: string;
  passed: boolean;
  hintLog: HintUse[];
}
