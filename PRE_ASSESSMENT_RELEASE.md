# PRE_ASSESSMENT_RELEASE.md

**Vistara Polymers Incident — Pre-Assessment Release Gate (Agent 3.5 final deliverable)**
**Version:** 1.1 — 2026-09-11
**Gate rule:** No PASS is declared while any CRITICAL issue remains open. All CRITICAL/HIGH issues from CONSISTENCY_QA_REPORT.md are resolved in the v1.1 package and confirmed by an independent verification pass (10/10 checks PASS after two targeted fixes).

**Overall verdict: ✅ PASS — the v1.1 package is ready for Agent 4 (Assessment Designer).**

---

## Release checklist

| # | Gate | Verdict | Basis |
|---|------|---------|-------|
| 1 | Scenario consistency | **PASS** | One attack path, one timeline, one objective preserved; no narrative redesign. RH-06 removal and scan-timing resolution recorded in UPSTREAM_CORRECTIONS.md (U-01/U-02/U-03). |
| 2 | Timeline consistency | **PASS** | Prerequisite ordering verified programmatically across all 38 events (auth after credential access, persistence after compromise, exfil after staging, containment→preservation→eradication→recovery→validation→closure). Scanner instances reconciled with the calendar (on-demand Fri 09-04 09:15; scheduled Tue 09-08 02:00). |
| 3 | Evidence ID consistency | **PASS** | 52 registered E-codes; zero duplicates (E-NET-005/006 collision resolved), zero orphans, zero dangling references — full three-leg cross-resolution (catalog ↔ matrix ↔ directory spec) verified by automated sweep. |
| 4 | Directory/catalog consistency | **PASS** | E-SHARE-001, E-FS-007, E-AUTH-012, E-EDR-015, E-EDR-008B, E-PROXY-001, E-DOC-003, E-NET-005/006 all present in tree + manifest rules + catalog + matrix; manifest type enum extended (edr_session, proxy_log). |
| 5 | Schema consistency | **PASS** | All JSON exemplar blocks parse; event-ID enum corrected (4776 in, invalid ID out); IIS schema/exemplars consistent with catalog windows; vuln-scan schema models scheduled vs on-demand job types. |
| 6 | Evidence corroboration | **PASS** | All 15 key findings (KF-01…KF-15) have ≥2 independent sources (EVT-021 and EVT-018 gaps closed via E-EDR-015 and E-EDR-008B); EVT-020 single-source is documented inference-by-design (`/all` scope visible in E-EDR-009). |
| 7 | Red-herring integrity | **PASS** | 6 active herrings/noise classes (RH-01, 02, 03, 04, 05, 07); every one has candidate-visible evidence AND in-simulation rule-out; none creates a second valid attack narrative; RH-06 retired because it was unresolvable. |
| 8 | Candidate-visible/internal separation | **PASS** | `candidate_view` / `internal_metadata` split codified (DIRECTORY_SPEC §4–5, SCHEMAS §15); verified zero forbidden authoring strings inside any candidate-visible exemplar block; diegetic rule-out pointers retained as evidence content. |
| 9 | Scope determination | **PASS** | COMPROMISED (WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01 credential-disclosure) / ACCESSED-NOT-COMPROMISED (DB-PRD-01 read-only, E-DB-001 + E-AUTH-008) / PROBED ONLY (ERP-APP-01, single failed 4625) / BENIGN (RH set + untouched hosts) — all objectively derivable; no host supported as both compromised and not. |
| 10 | Web evidence consistency | **PASS** | IIS artifacts in UTC with one exact header string everywhere; UTC↔IST conversions verified (15:05, 13:02, 16:45 IST windows); web-shell path single-form across all docs; RH-05 2025 shell cleanly separated. |
| 11 | AD/identity evidence consistency | **PASS** | svc_mon lifecycle 4720/4728/4732→4725/4726 coherent across DC-01 artifacts; DCSync (4662 + EDR) deterministic; RH-04 rule-out via last_logon_ist in E-AD-003; all group memberships match ENVIRONMENT §5.2. |
| 12 | Containment | **PASS** | Canonical set (3 hosts isolated, 3 accounts disabled, C2 blocked, /staging/ suspended) consistent across Bible §27, timeline EVT-033, E-RESP-001/E-AD-004; wording fix U-04 specified upstream. |
| 13 | Eradication | **PASS** | Covers all 3 persistence mechanisms, both entry weaknesses (W-01, W-02b), all compromised + privileged credentials incl. double krbtgt reset, staged artifacts; "restore from backup alone" explicitly insufficient. |
| 14 | Recovery | **PASS** | Order DC → WEB → APP → FILE with dependency rationale; backups pre-date compromise (09-02, RPO 24h); no implication that backup restoration removes persistence; 72h monitoring included. |
| 15 | Safe-state validation | **PASS** | 7-check gate; designed trap (EDR-clean alone insufficient) has a deterministic basis (checklist completeness, re-run shown in E-VALID-002); candidate has enough evidence to judge safe state. |
| 16 | Indian-context naming | **PASS** | All personnel/account/team names plausibly Indian; no Western placeholders; no real government organization; brand-adjacency review of "Vistara Polymers" documented and dispositioned (QA-21, keep). |
| 17 | Five-hour evidence depth | **PASS** | Volume discipline intact: 20–80-line targets, ≤200-line cap, summary+drill-down for high-volume sources (scan, beacons, SMB opens); noise 20–30% of raw lines; no giant dumps added. |
| 18 | No unresolved critical issues | **PASS** | QA-01/02/03 (CRITICAL) and QA-04…QA-08 (HIGH) all resolved and verified; remaining LOW items are upstream wording/documentation with corrections specified in UPSTREAM_CORRECTIONS.md. |

---

## Package manifest (assessment-ready set)

| File | Role |
|---|---|
| `SIMULATION_REQUIREMENTS.md` (v1.0, unchanged) | Requirements baseline |
| `SCENARIO_BIBLE.md` (v1.0 + corrections U-01…U-05, U-10) | Narrative truth — apply UPSTREAM_CORRECTIONS.md |
| `ATTACK_TIMELINE_v1.1.md` | Canonical event list (corrected) |
| `ENVIRONMENT.md` (v1.0 + corrections U-06, U-07) | Canonical registry — apply UPSTREAM_CORRECTIONS.md |
| `EVIDENCE_CATALOG_v1.1.md` | Evidence registry (52 artifacts, reveal phases, corroboration) |
| `EVIDENCE_MATRIX_v1.1.md` | Event↔evidence correlation + minimum-evidence sets |
| `EVIDENCE_DIRECTORY_SPEC_v1.1.md` | Directory layout, manifest schema, candidate/internal split |
| `EVIDENCE_SCHEMAS_TEMPLATES_v1.1.md` | Per-type schemas + exemplar templates |
| `UPSTREAM_CORRECTIONS.md` | Exact upstream edits (U-01…U-10) |
| `EVIDENCE_TRACEABILITY_AUDIT.md` | Event→evidence→corroboration→finding traceability (15 KFs + 38 events + 6 RH) |
| `CONSISTENCY_QA_REPORT.md` | 21 findings, classified, resolved/dispositioned |

## Hand-off notes for Agent 4 (Assessment Designer)

1. Answer-key fields (`evt_refs`, `corroborates`, `red_herring`, `rule_out`, relevance, expected significance) live exclusively in `internal_metadata` — build grading from that manifest, never from candidate_view.
2. Every deterministic answer key must cite its supporting evidence IDs from EVIDENCE_MATRIX_v1.1 §3 / EVIDENCE_TRACEABILITY_AUDIT.md Part 1.
3. The safe-state trap (E-VALID-002) and the "restore-from-backup is insufficient" distractor are the two designed critical-failure tests — preserve their semantics.
4. RH-06 is a retired ID; do not reuse it in question IDs or distractors.
5. The residual-risk set for reporting tasks is fixed: stolen-data exposure, W-05, W-06, W-08, W-09.

**Released by:** Agent 3.5 — Simulation Consistency Auditor
**Date:** 2026-09-11
**Status: PASS — ready for assessment design.**
