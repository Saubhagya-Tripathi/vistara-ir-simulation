# PROGRESSION_LOGIC.md — VISTARA-IR-ASSESSMENT-v1.0

**Version:** 1.0
**Status:** INTERNAL DESIGN DOCUMENT — never candidate-visible. Consequence paths and gate logic reference canonical states at a structural level; answer-key material is marked **[INTERNAL — ANSWER KEY]**.
**Authoritative basis:** Simulation package v1.1 as consolidated in `_internal/ASSESSMENT_DESIGN_KERNEL.md` (phase model §1, progression spec §4, task definitions §2). No invented facts. All timestamps IST (UTC+05:30); IIS artifacts are natively UTC with the canonical conversion header.

---

## 1. Progression model

- **Phase-gated, not question-railroaded.** Eight phases (P0–P7) open in sequence through the gates in §3. A phase is not "question 1 → question 2 → …": opening a phase reveals its evidence and its task set; the candidate investigates, establishes findings, and additional evidence/context becomes available at the next gate.
- **Free navigation within unlocked phases.** Once a phase is open, its tasks may be worked in any order (except the explicit intra-phase chains in P6/P7, §3), paused, and resumed. All revealed evidence remains open for revisit for the rest of the run.
- **Completed phases stay open.** The candidate can navigate back to any completed phase, re-read its evidence, and review submitted answers (answers are locked once submitted — see §7; review is read-only). This supports synthesis tasks (P5, Q-07-04) that deliberately draw on earlier phases.
- **Scored artifacts are answers, not the path taken.** Scoring consumes submitted answers and evidence selections only. Navigation order, dwell time, and revisit patterns are never scored. The only time-related mechanic is the non-penalizing pacing nudge (§5).
- **Scoring references (normative, per SCORING_MODEL.md / kernel v1.0.1):** within each task, scored sub-answers are equally pooled (points per component = component pool / N; no custom component weights). Evidence selection is a candidate-facing scored action (20% tier rule) on the 25 scored evidence-linked tasks — all `evidence_linked: true` tasks EXCEPT **Q-05-01**, which is exempt (40 cells × 0.25 = 10 pts; its evidence is validation/authoring metadata, not scored). Q-05-03, Q-05-04, Q-06-02, and Q-07-04 have no evidence-selection scoring.
- **No dead ends.** Every wrong operational decision resolves into an in-simulation consequence with a recovery path (§4). The run can always be completed.

---

## 2. Task unlock table

| Task | Title | Unlock condition |
|---|---|---|
| Q-00-01 | Triage & incident declaration | None — assessment entry (P0 opens at start) |
| Q-01-01 | Reading the correlation cluster | P0 gate: Q-00-01 complete (verdict + severity + anchors) |
| Q-01-02 | Signal vs noise: the vulnerability scanner | P0 gate |
| Q-02-01 | The exposure | P1 gate: Q-01-01 and Q-01-02 complete |
| Q-02-02 | Initial access determination | P1 gate |
| Q-02-03 | The web shell | P1 gate |
| Q-02-04 | Web/application weakness chain | P1 gate |
| Q-03-01 | Credential access chain | P2 gate: Q-02-01..04 complete |
| Q-03-02 | First lateral movement & privilege discovery | P2 gate |
| Q-03-03 | Identity persistence (rogue account) | P2 gate |
| Q-03-04 | Host persistence & C2 (scheduled task) | P2 gate |
| Q-03-05 | Domain dominance (DCSync) | P2 gate |
| Q-03-06 | Persistence inventory (synthesis) | P2 gate |
| Q-04-01 | Rogue account in action | P3 gate: Q-03-01..06 complete |
| Q-04-02 | Collection & staging | P3 gate |
| Q-04-03 | Exfiltration | P3 gate |
| Q-04-04 | Scope discrimination: accessed vs compromised vs probed | P3 gate |
| Q-05-01 | Breach scope: host classification table | P4 gate: Q-04-01..04 complete |
| Q-05-02 | Breach scope: identities | P4 gate |
| Q-05-03 | Timeline reconstruction | P4 gate |
| Q-05-04 | ATT&CK mapping | P4 gate |
| Q-05-05 | IOC consolidation | P4 gate |
| Q-06-01 | Containment decision | P5 gate: Q-05-01..05 complete |
| Q-06-02 | Response lifecycle sequencing | Q-06-01 complete |
| Q-06-03 | Eradication plan | Q-06-02 complete |
| Q-06-04 | Recovery sequencing & approach | Q-06-03 complete |
| Q-07-01 | Validation requirements | P6 gate: Q-06-01..04 complete |
| Q-07-02 | The safe-state gate (TRAP) | Q-07-01 complete |
| Q-07-03 | Residual risk & recommendations | Q-07-02 complete |
| Q-07-04 | Final incident report (structured) | Q-07-03 complete; submission of Q-07-04 ends the run |

Intra-phase ordering chains exist only where the narrative is causal (response actions in P6; validation-then-report in P7). All other tasks within an open phase are unordered.

---

## 3. Evidence reveal schedule

Artifacts are revealed by phase per EVIDENCE_CATALOG_v1.1 reveal-phase metadata. Once revealed, an artifact stays open for the remainder of the run.

### Phase 0 — Briefing (2 artifacts)
`E-ALERT-001` (triggering SIEM/EDR alert EDR-20260909-0417), `E-TICKET-001` (INC-2026-0417 ticket). Plus the persistent RIGHT-pane dossier (organization, network, assets, users, policies, weakness register) — reference only, no incident answers.

### Phase 1 — All investigation evidence (58 artifacts)
Revealed when P1 opens; `E-ALERT-002` (SIEM retrospective correlation cluster) surfaces at this moment:

- **Alerts/correlation:** E-ALERT-002
- **Web/IIS (UTC):** E-WEB-001, E-WEB-002, E-WEB-003, E-WEB-004
- **Authentication:** E-AUTH-001 … E-AUTH-012 (incl. E-AUTH-012 VPN full-window summary)
- **EDR telemetry:** E-EDR-001 … E-EDR-015, plus variant E-EDR-008B (4104 script-block decode)
- **File system:** E-FS-001 … E-FS-007
- **Network/firewall/proxy:** E-NET-001 … E-NET-006, E-PROXY-001
- **Active Directory:** E-AD-001, E-AD-002, E-AD-003
- **Database / share / scanner / context:** E-DB-001, E-SHARE-001, E-VULN-001, E-VULN-002, E-WIKI-001, E-DOC-001, E-DOC-002, E-DOC-003

### Phase 6 — Response execution records (6 artifacts, revealed as decisions execute)
Not dumped at phase open: each record materializes when the candidate's corresponding decision is applied in-simulation, so the response record reflects *the candidate's* actions.

- `E-RESP-001` — containment execution record (after Q-06-01 containment set executes)
- `E-AD-004` — AD account-state record reflecting the account-disable actions (after Q-06-01 executes)
- `E-RESP-002` — evidence-preservation record (as the preservation step is sequenced/executed)
- `E-RESP-003` — eradication record (after Q-06-03 plan executes)
- `E-RESP-004` — recovery record (after Q-06-04 plan executes)
- `E-VALID-001` — validation-execution setup record (as recovery completes)

### Phase 7 — Validation & reporting (2 artifacts, staged)
- `E-VALID-002` — **interim validation packet with the SKIPPED line** ("persistence re-check on rebuilt APP-PRD-01: SKIPPED — host was rebuilt, considered clean"; AD audit not yet re-run) — revealed at **Q-07-02 stage 1**.
- `E-VALID-002` — **16:55 IST re-run** (scheduled tasks/services/run keys/web directories CLEAN on APP-PRD-01; AD audit confirms svc_mon ABSENT; all other checks PASS) — revealed **after the candidate refuses the incomplete packet** (stage-1 NOT SAFE) **or after the remediation loop** if the candidate declared SAFE prematurely (consequence path, §4 — no dead end).
- `E-REPORT-001` — final incident-report template — revealed after the E-VALID-002 re-run, in time for Q-07-04.

**Consistency check:** 2 + 58 + 6 + 2 = 68 catalog entries, matching EVIDENCE_CATALOG_v1.1 reveal-phase metadata.

---

## 4. Decision consequence flows (no dead ends)

Wrong operational decisions produce in-simulation consequences, never a soft-lock. Points for the affected task are lost per the deterministic grading rules; the run always continues.

### 4.1 Over-containment (Q-06-01)
- **Trigger:** containment set includes assets beyond the canonical three hosts — e.g., isolating DC-01 or the entire Server VLAN.
- **In-simulation consequence:** business-impact escalation — domain authentication degrades (DC-01 isolation) and/or production halts; CFO / plant-operations escalation lands in the workspace.
- **Resolution:** the candidate may **roll back** the over-broad action and re-submit the containment set. **[INTERNAL — ANSWER KEY] Points for the affected components are already spent; re-submission restores progression, not points.**
- **No dead end:** the phase completes on a valid containment state; the incident proceeds to eradication.

### 4.2 Under-containment (Q-06-01)
- **Trigger:** containment set omits blocking 185.220.101.47 or omits isolating one of the proven-compromised hosts.
- **In-simulation consequence:** the beacon persists; ~30 minutes of simulated time later a **new SIEM escalation** fires showing continued 8443 egress.
- **Resolution:** **remedial containment is offered** — the candidate executes the missing action(s) and the escalation clears. **[INTERNAL — ANSWER KEY] CF-2 evaluation is based on the submitted set (omitting the C2 block or any of the three host isolations caps the total score at 49%); the remedial path exists so the run can continue, not to erase the failure.**
- **No dead end:** the phase completes after remedial containment.

### 4.3 Incomplete eradication (Q-06-03)
- **Trigger:** the eradication plan omits a persistence mechanism or required action (e.g., missing the scheduled task, the web shell, svc_mon deletion, the second krbtgt reset, or the W-01/W-02b weakness closures).
- **In-simulation consequence:** at validation, **persistence is rediscovered** — the validation packet shows the surviving mechanism.
- **Resolution:** a **revision loop** opens: the candidate revises the eradication plan and re-executes. **Q-07-02 does not open** until the persistence inventory is actually clean — the safe-state gate cannot be reached with live persistence.
- **No dead end:** the loop repeats until eradication is complete; scoring already reflects the flawed plan.

### 4.4 Premature SAFE declaration (Q-07-02 stage 1)
- **Trigger:** stage-1 declaration of `SAFE` against the interim E-VALID-002 packet (EDR clean, but persistence re-check SKIPPED on rebuilt APP-PRD-01; AD audit not re-run).
- **In-simulation consequence:** **[INTERNAL — ANSWER KEY] CF-1 recorded — total score capped at 49%**. In the narrative, the unsafe declaration is overridden by the validation gate discipline: the missing checks are run.
- **Resolution:** the candidate **continues the run** — the remediation loop produces the E-VALID-002 16:55 re-run, Q-07-02 stage 2, Q-07-03, and Q-07-04 remain available **for partial credit**. The failure is recorded, not fatal to completion.

---

## 5. Pacing system

- **Visible clock:** total elapsed time and current-phase elapsed time are always visible in the LEFT pane, beside the phase guidance from the time model (15/30/45/60/45/30/45/30 min; 300 total).
- **Soft nudge:** when a phase exceeds its guidance by **>20%**, a gentle, non-modal nudge suggests moving on or requesting a hint. Fires once per threshold crossing per phase.
- **No hard time fails:** slow investigation never fails the candidate. There is no score effect from time. The 300-minute budget is a design target, not a cutoff mechanism.
- **Median target:** ~4.5 hours for a competent security professional; the full 5-hour budget accommodates careful evidence review and the report.

---

## 6. State machine summary

Per phase: **entry condition → activities → exit (gate) condition → artifacts unlocked on entry/exit.**

| Phase | Entry condition | Core activities | Exit (gate) condition | Artifacts unlocked |
|---|---|---|---|---|
| P0 Briefing & Triage | Assessment start | Read ticket + alert; triage call (verdict/severity/anchors); first evidence selection | Q-00-01 complete (verdict + severity + anchors) | On entry: E-ALERT-001, E-TICKET-001, dossier |
| P1 Detection Validation & Initial Scoping | P0 gate | Correlation-cluster analysis; beacon recognition; scanner signal-vs-noise | Q-01-01, Q-01-02 complete | On entry: all 58 investigation artifacts (E-ALERT-002, E-WEB-*, E-AUTH-*, E-EDR-*, E-FS-*, E-NET-*, E-PROXY-001, E-AD-001/002/003, E-DB-001, E-VULN-001/002, E-SHARE-001, E-WIKI-001, E-DOC-001/002/003) |
| P2 Initial Access & Compromise Analysis | P1 gate | Exposure + policy-failure analysis; initial-access correlation; web-shell isolation (UTC→IST); weakness chaining | Q-02-01..04 complete | — (evidence already open; revisit P0–P1 artifacts freely) |
| P3 Execution, Credentials & Persistence | P2 gate | Credential-access chain; first-hop + domain recon; rogue account; scheduled-task C2; DCSync; persistence synthesis | Q-03-01..06 complete | — |
| P4 Discovery, Lateral Movement, Collection & Exfiltration | P3 gate | svc_mon session proof; collection/staging; dual-exfil reconstruction + retention-gap reasoning; accessed-vs-compromised-vs-probed calls | Q-04-01..04 complete | — |
| P5 Full Scoping & Attack-Path Reconstruction | P4 gate | Host classification table; identity blast radius; timeline ordering; ATT&CK mapping; IOC consolidation | Q-05-01..05 complete | — |
| P6 Containment, Eradication & Recovery | P5 gate | Containment decision (executes in-sim); lifecycle sequencing; eradication plan (executes); recovery plan (executes); consequence handling per §4 | Q-06-01..04 complete | As decisions execute: E-RESP-001..004, E-AD-004, E-VALID-001 |
| P7 Safe-State Validation & Final Reporting | P6 gate | Validation-gate definition; two-stage safe-state call; residual risk + recommendations; structured final report | Q-07-01..04 complete → submit | E-VALID-002 interim packet at Q-07-02 stage 1; E-VALID-002 16:55 re-run + E-REPORT-001 after the incomplete packet is refused (or after the §4.4 remediation loop) |

Global invariants: (1) a phase's gate requires all its tasks submitted, regardless of correctness; (2) completed-phase evidence never locks; (3) intra-phase chains in P6/P7 enforce causal order only; (4) consequence loops (§4) are sub-states of P6/P7, not new phases.

---

## 7. Session, save & feedback policy

- **Single sitting:** the assessment is one 300-minute session; there is no multi-day resume. A short supervised pause does not pause the narrative but does not extend the budget.
- **Autosave:** every answer, evidence selection, and decision is autosaved on submission of each component; browser refresh or disconnect restores to the last autosaved state within the sitting.
- **Answer locking:** a submitted answer locks (grading input fixed). Navigation and evidence review remain open, but changing a submitted answer is not possible — this preserves the integrity of consistency cross-checks in Q-07-04 and of the consequence flows in §4.
- **Hints:** max 2 per task, on demand, from the CENTER workspace; each deducts its task-specific penalty from that task's earned score (floor 0). Hints point at evidence and method; they never name the answer.
- **Feedback during the run:** light, phase-end feedback only — a non-scored confirmation that the phase gate was met plus narrative consequences of decisions (§4). **No answer disclosure during the run:** correctness, canonical answers, and point outcomes are never shown mid-assessment.
- **Feedback at the end:** full feedback after final submission — per-task outcomes, evidence-selection quality, consequence-path record, dimension-level scores (D1–D7), band (Distinction / Pass / Near miss / Fail), and any critical failures (CF-1/CF-2/CF-3).
