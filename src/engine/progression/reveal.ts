/**
 * Evidence reveal schedule (PROGRESSION_LOGIC.md §3; assessment.json
 * progression.evidence_reveal_schedule). Reveal is cumulative and additive:
 * once revealed, an artifact stays open for the rest of the run.
 *
 * Approved resolution (overrides PROGRESSION_LOGIC staging): the INTERIM
 * E-VALID-002 packet reveals at P7 ENTRY so Q-07-01's evidence selection can
 * include it. The 16:55 re-run version replaces it only after the candidate
 * declares stage-1 NOT SAFE on Q-07-02, or after the remediation loop when
 * SAFE was declared prematurely (state.safeState.rerunRevealed). E-REPORT-001
 * reveals once the re-run is revealed.
 *
 * revealedEvidence() is a pure function of CandidateState.
 */

import type { CandidateState } from "../../types";
import { isPhaseOpen, isSubmitted } from "./phases";

/** assessment.json progression.evidence_reveal_schedule.phase_0 */
export const REVEAL_PHASE_0: readonly string[] = ["E-ALERT-001", "E-TICKET-001"];

/** assessment.json progression.evidence_reveal_schedule.phase_1 (58 artifacts). */
export const REVEAL_PHASE_1: readonly string[] = [
  "E-ALERT-002",
  "E-WEB-001", "E-WEB-002", "E-WEB-003", "E-WEB-004",
  "E-AUTH-001", "E-AUTH-002", "E-AUTH-003", "E-AUTH-004", "E-AUTH-005",
  "E-AUTH-006", "E-AUTH-007", "E-AUTH-008", "E-AUTH-009", "E-AUTH-010",
  "E-AUTH-011", "E-AUTH-012",
  "E-EDR-001", "E-EDR-002", "E-EDR-003", "E-EDR-004", "E-EDR-005",
  "E-EDR-006", "E-EDR-007", "E-EDR-008", "E-EDR-008B", "E-EDR-009",
  "E-EDR-010", "E-EDR-011", "E-EDR-012", "E-EDR-013", "E-EDR-014",
  "E-EDR-015",
  "E-FS-001", "E-FS-002", "E-FS-003", "E-FS-004", "E-FS-005", "E-FS-006",
  "E-FS-007",
  "E-NET-001", "E-NET-002", "E-NET-003", "E-NET-004", "E-NET-005",
  "E-NET-006", "E-PROXY-001",
  "E-AD-001", "E-AD-002", "E-AD-003",
  "E-DB-001", "E-VULN-001", "E-VULN-002", "E-SHARE-001", "E-WIKI-001",
  "E-DOC-001", "E-DOC-002", "E-DOC-003",
];

/** P6 response records materialize as the candidate's decisions execute. */
export const REVEAL_AFTER_Q0601: readonly string[] = ["E-RESP-001", "E-AD-004"];
export const REVEAL_AFTER_Q0602: readonly string[] = ["E-RESP-002"];
export const REVEAL_AFTER_Q0603: readonly string[] = ["E-RESP-003"];
export const REVEAL_AFTER_Q0604: readonly string[] = ["E-RESP-004", "E-VALID-001"];

/** Interim validation packet — revealed at P7 entry (approved resolution). */
export const VALIDATION_INTERIM_ID = "E-VALID-002";
/** Final report template — revealed once the 16:55 re-run is available. */
export const REPORT_TEMPLATE_ID = "E-REPORT-001";

export const EVIDENCE_PATH_INTERIM =
  "response/E-VALID-002_safestate_interim.json";
export const EVIDENCE_PATH_RERUN = "response/E-VALID-002_safestate_rerun.json";

/**
 * Pure: the set of evidence IDs currently revealed, in deterministic order.
 * Never includes an ID before its reveal condition is met.
 */
export function revealedEvidence(state: CandidateState): string[] {
  const ids: string[] = [];
  const push = (list: readonly string[]) => {
    for (const id of list) if (!ids.includes(id)) ids.push(id);
  };

  // P0 opens at assessment start.
  push(REVEAL_PHASE_0);

  // P1 entry: all investigation artifacts.
  if (isPhaseOpen(state, "P1")) push(REVEAL_PHASE_1);

  // P6: materialized by executed decisions (submission-triggered).
  if (isSubmitted(state, "Q-06-01")) push(REVEAL_AFTER_Q0601);
  if (isSubmitted(state, "Q-06-02")) push(REVEAL_AFTER_Q0602);
  if (isSubmitted(state, "Q-06-03")) push(REVEAL_AFTER_Q0603);
  if (isSubmitted(state, "Q-06-04")) push(REVEAL_AFTER_Q0604);

  // P7 entry: interim E-VALID-002 (with the SKIPPED line).
  if (isPhaseOpen(state, "P7")) push([VALIDATION_INTERIM_ID]);

  // After the 16:55 re-run is revealed (NOT SAFE, or remediation loop after
  // a premature SAFE): the report template becomes available.
  if (state.safeState.rerunRevealed) push([REPORT_TEMPLATE_ID]);

  return ids;
}

export function isEvidenceRevealed(state: CandidateState, id: string): boolean {
  return revealedEvidence(state).includes(id);
}

/**
 * Resolves the file path for evidence whose content depends on run state.
 * E-VALID-002 serves the interim packet until the re-run is revealed, then
 * the 16:55 re-run. Returns null for IDs with a single static file (resolved
 * by the evidence directory spec, not by progression state).
 */
export function evidenceFileFor(id: string, state: CandidateState): string | null {
  if (id === VALIDATION_INTERIM_ID) {
    return state.safeState.rerunRevealed
      ? EVIDENCE_PATH_RERUN
      : EVIDENCE_PATH_INTERIM;
  }
  return null;
}
