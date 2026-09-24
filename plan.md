# PLAN.md — Agent 4: Assessment Designer & Candidate Task Architect

**Mission:** Transform the validated v1.1 five-hour cyber incident simulation package (Vistara Polymers / INC-2026-0417) into a complete, deterministic, evidence-driven candidate assessment.

**This is NOT a coding task.** No React/HTML/CSS/DB/API design. Output = assessment design documents + machine-readable spec.

## Authoritative inputs (already read, in /mnt/agents/upload/)
- SIMULATION_REQUIREMENTS.md (v1.0 baseline: 7 phases + P0, 300-min model, 20 learning outcomes, deterministic answer rules)
- ATTACK_TIMELINE_v1.1.md (38 EVT + 6 active RH; canonical order)
- ENVIRONMENT.md (canonical registry: hosts, accounts, weaknesses W-01..W-09, policies)
- EVIDENCE_CATALOG_v1.1.md (52 artifacts, reveal phases, corroboration)
- EVIDENCE_MATRIX_v1.1.md (event↔evidence map, 10 minimum-evidence findings, noise budget)
- EVIDENCE_DIRECTORY_SPEC_v1.1.md + EVIDENCE_SCHEMAS_TEMPLATES_v1.1.md (paths, candidate_view/internal_metadata split, exemplars)
- EVIDENCE_TRACEABILITY_AUDIT.md (15 KFs, all-event traceability)
- CONSISTENCY_QA_REPORT.md (QA-01..21; v1.1 resolutions: no 4628, no RH-06, scanner two-instance canon)
- PRE_ASSESSMENT_RELEASE.md (PASS gate + Agent 4 hand-off notes 1–5)

**v1.1 hard rules to honor:** treat v1.1 as authoritative; never use retired RH-06; never reintroduce Event ID 4628; IIS logs UTC with canonical header; all other timestamps IST; no invented facts/events/hosts/accounts/evidence; safe-state trap + "restore-from-backup insufficient" trap preserved; residual-risk set fixed = {stolen-data exposure, W-05, W-06, W-08, W-09}.

## Design summary (locked in Stage 2 kernel)
- **Structure:** 8 phases (P0 briefing/triage → P7 safe-state/reporting), per SIM_REQUIREMENTS §9/§10 time model (15/30/45/60/45/30/45/30 = 300 min).
- **Task count:** 30 substantial scored tasks (many with multiple deterministic sub-answers) — within the 15–30 band; depth from multi-source correlation, not question volume.
- **Answer types:** exact string (asset/username/IP/path/filename/technique), timestamp (IST, IIS items accept UTC equivalent), single choice, multi-select exact set, ordered sequence (Kendall-tau scored), yes/no decision, structured report fields + ONE rubric-scored executive summary.
- **Scoring:** 254 raw points → weighted dimensions (Investigation 40% / Scoping & reconstruction 15% / Containment 10% / Eradication 10% / Recovery 8% / Safe-state 12% / Reporting 5%) ≈ 55/28/17 investigative/response/validation+reporting per SIM_REQ §27 guidance. Pass ≥70%; 3 critical-failure caps (unsafe-safe declaration; failure to contain active C2/compromised host; missing major compromise in scoping).

## Stages

### Stage 1 — Plan (this file). DONE FIRST. No skill files needed (no matching built-in skill governs this bespoke deliverable set; Orchestrator-designed workflow).

### Stage 2 — Design kernel (orchestrator-authored, `/_internal/ASSESSMENT_DESIGN_KERNEL.md`)
Single source of truth capturing for all 30 tasks: ID, phase, title, candidate instructions, question, answer type, canonical answer, accepted answers, required evidence IDs, attack event IDs, correlation requirement, points, difficulty, hint + penalty, unlock condition, common wrong answer + why, learning outcome. Plus: scoring model spec, progression/gates, ATT&CK controlled list (18 package-tagged IDs only), IOC set, timeline canonical sequence, scope classification sets, containment/eradication/recovery canonical states, report fields + rubric, red-herring usage map, time model, learning-outcome coverage map.

### Stage 3 — Parallel authoring (4 foreground subagents, all fed the kernel + upload paths)
- A: `QUESTION_BANK.md` (30 tasks × full field set per instructions §6)
- B: `assessment.json` (machine-readable spec per §27; MUST pass json.load; IDs exactly match kernel)
- C: `ASSESSMENT_BLUEPRINT.md` + `PROGRESSION_LOGIC.md`
- D: `SCORING_MODEL.md` + `HINTS_GUIDE.md`

### Stage 4 — Independent verification (verifier subagent)
Audit: JSON validity; ID parity across all 7 deliverables; every canonical answer supported by v1.1 evidence (≥2 sources for key findings); timestamps match ATTACK_TIMELINE_v1.1; no RH-06 / no 4628; no answer leakage in candidate-facing text/hints; point sums; weight sums; critical-failure definitions; invalid-task test (§29) applied per task. Fix via targeted edits (orchestrator or fix subagent).

### Stage 5 — Readiness & assembly
Author `ASSESSMENT_READINESS.md`: final traceability table (Learning Outcome → Phase → Task → Attack Event → Evidence → Expected Answer → Scoring) covering all 20 SIM_REQ §5 outcomes + §32 PASS/FAIL checklist (21 gates). Deliver all 7 files from /mnt/agents/output/.

## Deliverables (final, /mnt/agents/output/)
1. ASSESSMENT_BLUEPRINT.md
2. QUESTION_BANK.md
3. SCORING_MODEL.md
4. PROGRESSION_LOGIC.md
5. HINTS_GUIDE.md
6. assessment.json
7. ASSESSMENT_READINESS.md

---

# STAGE 6 — Agent 4.1: Scoring Reconciliation & Finalization (per "You are Agent 4.1 A.txt")

Authoritative resolutions locked into kernel v1.0.1 (2026-09-11):
- R1 Q-05-01: 40 cells × 0.25 = 10 pts everywhere; evidence = validation metadata, no separate points.
- R2 Equal pooling: all sub-answers equally weighted (pool/N); JSON-only custom weights removed across all 30 tasks.
- R3 Q-02-02(e): (a)-(d)=2.0 each + (e) evidence=2.0 tier rule; no double rescale.
- R4 Q-07-04(g): accept 140–144 h (142h ±2h) + day aliases in every artifact incl. JSON.
- R5 SM §8 decomposition fix: 240 machine-graded + 10 deterministic report fields + 5 rubric = 255.
- R6 Q-05-04: evidence refs = authoring metadata; evidence_selection earns_points=false.
- R7 Evidence-selection UI: per-task explicit evidence_selection block in JSON (is_candidate_action / earns_points / points / rule).
- R8 RH-06 / Event ID 4628: zero content usage; retirement notes allowed only as change-control notes.

Stage 6.1 (parallel): Coder X = assessment.json programmatic rewrite + validation; Coder Y = markdown deliverable patches (QB, SM, BLUEPRINT, PROGRESSION, HINTS).
Stage 6.2: Verifier = full 30-task reconciliation audit (instruction §10, §12) + authors SCORING_RECONCILIATION.md (30 rows, all PASS required) + ASSESSMENT_FINAL_VERIFICATION.md (19 checks, all PASS → "READY FOR KIMI").
Stage 6.3: ASSESSMENT_READINESS.md (original Agent 4 deliverable: 20-LO traceability + 21-gate checklist).
Stage 6.4: Final assembly + REF-tag delivery.
