/**
 * Runtime data access. Candidate bundle and dossier are statically imported;
 * the evidence manifest and artifact bodies are fetched from public/evidence.
 *
 * SECURITY BOUNDARY: candidate-facing components may only consume
 * getCandidateBundle() and candidate_view descriptors. The grading bundle is
 * loaded here for the engine but must never flow into candidate UI props.
 */
import candidateBundleJson from "../data/generated/candidate.bundle.json";
import gradingBundleJson from "../data/generated/grading.bundle.json";
import type {
  EvidenceCandidateView,
  EvidenceManifest,
  ScoringConfig,
  SupportingStructures,
  TaskKey,
} from "../types";

// ---------------------------------------------------------------------------
// Candidate bundle types (grading fields stripped at build time)
// ---------------------------------------------------------------------------

export interface CandidateSubAnswer {
  key: string;
  question: string;
  answer_type: string;
  options?: string[];
  points: number;
  cell_count?: number;
  cell_points?: number;
}

export interface CandidateHint {
  text: string;
  penalty: number;
}

export interface CandidateItem {
  id: string;
  phase: string;
  title: string;
  instructions: string;
  task_type: string;
  answer_type: string;
  points: number;
  difficulty: string;
  evidence_linked: boolean;
  unlock: string;
  required_evidence: string[];
  reference_evidence?: string[];
  learning_outcomes: number[];
  hints: CandidateHint[];
  hint_penalty: number;
  evidence_selection: {
    is_candidate_action: boolean;
    earns_points: boolean;
    points: number;
    expressed_as?: string;
  };
  sub_answers: CandidateSubAnswer[];
}

export interface TimelineCard {
  displayId: string;
  description: string;
  token: string;
}

export interface ReportFieldDef {
  key: string;
  question: string;
  answer_type: string;
  options?: string[];
}

export interface CandidateActivities {
  timeline_display: TimelineCard[];
  attack_behaviors: string[];
  attack_techniques: { id: string; name: string }[];
  host_classification_hosts: string[];
  host_classification_classes: string[];
  ioc_candidates: string[];
  containment_options: Record<string, string[]>;
  eradication_options: string[];
  recovery_options: Record<string, unknown>;
  safe_state_check_options: string[];
  residual_risk_options: string[];
  recommendation_options: string[];
  report_fields: ReportFieldDef[];
  exec_summary_rubric?: string[];
}

export interface Dossier {
  caseSummary: string;
  organization: unknown;
  network: unknown;
  hosts: unknown[];
  users: unknown;
  webApp: unknown;
  activeDirectory: unknown;
  securityControls: unknown;
  policies: unknown[];
  externalContext: unknown;
  timezoneNote: string;
}

export interface CandidateBundle {
  metadata: {
    assessment_id: string;
    title: string;
    incident: string;
    duration_minutes: number;
    pass_threshold_pct: number;
    total_points: number;
    task_count: number;
    version: string;
    timezone_convention: string;
  };
  phases: {
    id: string;
    name: string;
    time_budget_minutes: number;
    gate: string;
    tasks: string[];
  }[];
  items: CandidateItem[];
  activities: CandidateActivities;
  dossier: Dossier;
}

export interface GradingBundle {
  items: TaskKey[];
  supporting_structures: SupportingStructures;
  scoring: ScoringConfig;
  progression: Record<string, unknown>;
}

const candidateBundle = candidateBundleJson as unknown as CandidateBundle;
const gradingBundle = gradingBundleJson as unknown as GradingBundle;

export function getCandidateBundle(): CandidateBundle {
  return candidateBundle;
}

/** Engine-only. Never pass into candidate-facing component trees. */
export function getGradingBundle(): GradingBundle {
  return gradingBundle;
}

// ---------------------------------------------------------------------------
// Evidence manifest + bodies (fetched, cached)
// ---------------------------------------------------------------------------

let manifestPromise: Promise<EvidenceManifest> | null = null;

export function loadEvidenceManifest(): Promise<EvidenceManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch("evidence/manifest.json").then((r) => {
      if (!r.ok) throw new Error(`failed to load evidence manifest (${r.status})`);
      return r.json() as Promise<EvidenceManifest>;
    });
  }
  return manifestPromise;
}

const bodyCache = new Map<string, Promise<string>>();

export function loadEvidenceBody(path: string): Promise<string> {
  let p = bodyCache.get(path);
  if (!p) {
    p = fetch(`evidence/${path}`).then((r) => {
      if (!r.ok) throw new Error(`failed to load evidence file ${path} (${r.status})`);
      return r.text();
    });
    bodyCache.set(path, p);
  }
  return p;
}

/** Candidate-safe view of the manifest: strips internal grading metadata. */
export function candidateDescriptors(manifest: EvidenceManifest): EvidenceCandidateView[] {
  return manifest.artifacts.map((a) => a.candidate_view);
}
