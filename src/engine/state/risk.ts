/**
 * Organizational risk-exposure model — a narrative gauge driven purely by the
 * incident's operational state (what has been executed and which consequence
 * events fired). It deliberately knows nothing about answer correctness:
 * SCORING_MODEL.md §1.4 requires opacity of answers during the run, so the
 * gauge reacts to operational outcomes (containment executed, persistence
 * surviving, premature safe-state declaration) that the candidate observes
 * in-world, never to grading.
 *
 * Scale: 0–19 Minimal · 20–39 Reduced · 40–59 Elevated · 60–79 High · 80–100 Critical
 */

import type { CandidateState } from "../../types";
import { isSubmitted } from "../progression/phases";

export interface RiskAssessment {
  score: number;
  label: "Minimal" | "Reduced" | "Elevated" | "High" | "Critical";
  /** Currently active drivers, worst first. */
  drivers: string[];
}

export function assessRisk(state: CandidateState): RiskAssessment {
  const c = state.consequences;
  const ss = state.safeState;

  // Terminal: report submitted — incident closed.
  if (state.finished) {
    return {
      score: 5,
      label: "Minimal",
      drivers: ["Incident closed — residual risks documented in the final report"],
    };
  }

  // Premature SAFE until the stage-2 re-run declaration is made (§4.4).
  if (c.prematureSafe && ss.stage !== 2) {
    return {
      score: 70,
      label: "High",
      drivers: [
        "Safe state declared while validation was incomplete — re-checks running under the remediation loop",
      ],
    };
  }

  // Stage-2 declaration made after the 16:55 re-run.
  if (ss.stage === 2) {
    return {
      score: 10,
      label: "Minimal",
      drivers: ["Safe state validated — all checks PASS on the 16:55 re-run"],
    };
  }

  // Persistence rediscovered after eradication (§4.3).
  if (c.eradicationIncomplete) {
    return {
      score: 65,
      label: "High",
      drivers: ["Attacker persistence survived eradication — validation rediscovered it"],
    };
  }

  // Recovery executed.
  if (isSubmitted(state, "Q-06-04")) {
    return {
      score: 20,
      label: "Reduced",
      drivers: ["Hosts rebuilt / restored from pre-incident backups; enhanced monitoring running"],
    };
  }

  // Eradication executed cleanly.
  if (isSubmitted(state, "Q-06-03")) {
    return {
      score: 30,
      label: "Reduced",
      drivers: ["Persistence removed, entry weaknesses closed, credentials reset (incl. krbtgt ×2)"],
    };
  }

  // Containment submitted.
  if (isSubmitted(state, "Q-06-01")) {
    if (c.underContainment && !c.underContainmentRemediated) {
      return {
        score: 90,
        label: "Critical",
        drivers: ["Outbound 8443 traffic to attacker infrastructure still observed — containment incomplete"],
      };
    }
    if (c.overContainment) {
      return {
        score: 55,
        label: "Elevated",
        drivers: [
          "Containment active; compromised hosts isolated and C2 blocked",
          "Business impact from isolation scope under review (CFO / plant escalation)",
        ],
      };
    }
    return {
      score: 45,
      label: "Elevated",
      drivers: ["Contained: compromised hosts isolated, C2 blocked at FW-01, /staging/ suspended"],
    };
  }

  // Investigation in progress — breach active and uncontained.
  const investigating = isSubmitted(state, "Q-00-01");
  return {
    score: investigating ? 80 : 85,
    label: "Critical",
    drivers: [
      "Active incident: encoded-PowerShell beacon on APP-PRD-01 to external infrastructure",
      investigating
        ? "Scope under investigation — no containment applied yet"
        : "Awaiting triage and incident declaration",
    ],
  };
}
