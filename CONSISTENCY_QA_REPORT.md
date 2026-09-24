# CONSISTENCY_QA_REPORT.md

**Vistara Polymers Incident — Consistency, Completeness & Traceability QA Report (Agent 3.5 deliverable G)**
**Version:** 1.1 — 2026-09-11
**Scope:** Full cross-document audit of the v1.0 simulation package (8 source documents) against SIMULATION_REQUIREMENTS.md v1.0, producing the v1.1 package. Classification: **CRITICAL** (breaks determinism/candidate fairness — blocks release) / **HIGH** (broken references, missing required artifacts, answer-key leakage) / **MEDIUM** (consistency defects a candidate could notice) / **LOW** (hygiene/documentation).

**Summary: 21 findings — 3 CRITICAL, 5 HIGH, 5 MEDIUM, 8 LOW. All resolved in v1.1 or dispositioned with zero remaining release-blocking risk.**

---

## CRITICAL

### QA-01 — CRITICAL — Vulnerability scanner timing contradiction (RH-01)
- **Affected documents:** ATTACK_TIMELINE (EVT-007, EVT-028, RH ledger), ENVIRONMENT §8, EVIDENCE_CATALOG (E-VULN-001/002, Gap #1), EVIDENCE_MATRIX (EVT-007/028 rows, RH-01 row), EVIDENCE_SCHEMAS_TEMPLATES §9, SCENARIO_BIBLE Appendix A
- **Affected artifacts/events:** EVT-007, EVT-028, E-VULN-001, E-VULN-002
- **Issue:** Three-way conflict. (a) EVT-007 labels the 2026-09-04 09:15 scan "scheduled weekly" but 2026-09-04 is a **Friday**; ENVIRONMENT §8 fixes the schedule at Tuesdays 02:00 IST. (b) EVT-028 dated 2026-09-07 02:10 is a **Monday**, also off-schedule, and drifts 10 min from the 02:00 schedule. (c) RH-01's rule-out leaned on "Tuesday schedule," which is false for the 09-04 instance — a candidate could not resolve the herring deterministically.
- **Resolution:** Two-instance canon (per mandate §3.A preferred resolution; verified not to contradict SCENARIO_BIBLE): EVT-007 = **on-demand authenticated scan manually run by devang.shah** (job VS-MAN-2026-0904, 09:15–11:02, pre-peak-season baseline); EVT-028 = weekly scheduled job VS-WK37-2026 moved to **2026-09-08 02:00 IST (Tuesday)**. RH-01 rule-out re-based on internal source 10.10.40.13 + authenticated svc_monitor job + operator identity + no follow-on exploitation. Applied across all four v1.1 evidence docs + ATTACK_TIMELINE_v1.1; SCENARIO_BIBLE Appendix A correction listed (U-01).
- **Remaining risk:** None. Calendar-verified (2026-09-08 is Tuesday). Rule-out is now schedule-independent for the 09-04 instance.

### QA-02 — CRITICAL — Duplicate evidence ID E-NET-005 (registry collision)
- **Affected documents:** EVIDENCE_CATALOG (E-NET-005 = FW-01 RDP session log), EVIDENCE_DIRECTORY_SPEC (E-NET-005 = NetFlow retention summary; §7), EVIDENCE_SCHEMAS_TEMPLATES §5 (references), EVIDENCE_MATRIX
- **Issue:** One E-code assigned to two different artifacts in two authoritative documents — breaks the canonical registry rule (SIM_REQUIREMENTS rule 16) and would corrupt manifest generation.
- **Resolution:** E-NET-005 retained for the FW-01 RDP session log (EVT-005/006 corroboration); NetFlow retention artifact renumbered to **E-NET-006** (`net/E-NET-006_netflow_summary_7day_retention.log`). All references updated in all four v1.1 docs.
- **Remaining risk:** None. Full-registry re-audit (QA-06) confirms no further collisions.

### QA-03 — CRITICAL — Invalid Windows Event ID 4628 used for scored initial-access conclusion
- **Affected documents:** ATTACK_TIMELINE (EVT-005, Notes #3), EVIDENCE_CATALOG (E-AUTH-001, Gap #6), EVIDENCE_MATRIX (EVT-005 row, §2 E-AUTH-001 row), EVIDENCE_DIRECTORY_SPEC (filename `...4625_4628_4624...`), EVIDENCE_SCHEMAS_TEMPLATES §2(a) enum + §2(b) exemplar
- **Affected artifacts/events:** EVT-005, E-AUTH-001
- **Issue:** 4628 is not a valid logon event; the exemplar's "4628 TGT granted" conflates it with Kerberos 4768. A technically knowledgeable candidate could challenge the artifact (mandate §8 known issue), and the scored initial-access answer rested partly on a bogus event ID.
- **Resolution:** Initial-access success renders as **4624 LogonType 10 on WEB-PRD-01 (11:47:03 IST)**, corroborated by **4776 NTLM credential-validation records on DC-01** (correct for NLA/NTLM fallback from a non-domain source). 4628 removed from every document; enums, exemplars, filenames updated.
- **Remaining risk:** None. The 4776 addition strengthens (not weakens) realism and corroboration depth.

## HIGH

### QA-04 — HIGH — RH-03 rule-out artifact missing (dangling reference)
- **Affected documents:** ATTACK_TIMELINE (EVT-029, RH-03), EVIDENCE_CATALOG (E-AUTH-011, Gap #2), EVIDENCE_MATRIX (RH-03 row, Gap #4), SCENARIO_BIBLE Appendix A
- **Issue:** RH-03 (ananya.iyer) rule-out cites an "HR-approved travel ticket," but no artifact ID existed — the candidate could not rule out the herring with in-simulation evidence (violates SIM_REQUIREMENTS §24.1/§24.4).
- **Resolution:** Added **E-DOC-003** — minimal candidate-visible HR travel-approval record (TRV-2026-0312, approved 2026-09-04, window 09-07→09-09, approver Rohit Chavan). Document-type context artifact (no telemetry, per mandate §3.B); registered in catalog, matrix, directory spec, schemas; EVT-029/RH-03 references updated. E-AUTH-012 (full-window VPN summary) provides the supporting negative view.
- **Remaining risk:** None.

### QA-05 — HIGH — RH-06 (WSUS churn) unresolvable
- **Affected documents:** SCENARIO_BIBLE (§5, Appendix A), ATTACK_TIMELINE (RH ledger), EVIDENCE_MATRIX (RH ledger, §4), EVIDENCE_DIRECTORY_SPEC (§6.3), EVIDENCE_CATALOG (Gap #3), ENVIRONMENT §4.2
- **Issue:** The WSUS 09-05 03:00 patch-churn herring had no assigned artifact anywhere; rule-out evidence ("WSUS logs") did not exist in the package — unresolvable herring, violating §24.1.
- **Resolution:** **Option 2 (removal) per mandate §3.C.** RH-06 removed from the candidate path and all documents; RH-06 ID retired (tombstone note in matrix/timeline ledgers; not reused). WSUS-01 remains in the asset inventory as a plain, uninvolved host. No new evidence volume created. Noise budget re-derived (QA-15) and remains compliant.
- **Remaining risk:** None. No artifact referenced the 09-05 early-hours churn, so removal leaves no dangling reference.

### QA-06 — HIGH — Orphaned / missing evidence IDs across catalog ↔ matrix ↔ directory spec
- **Affected documents:** all four evidence documents
- **Issue:** Cross-registry audit found: **E-FS-007** (in directory spec only — absent from catalog/matrix); **E-AUTH-012, E-EDR-015** (in catalog only — no directory location/manifest path); **E-PROXY-001** (catalog + matrix only); **E-EDR-008B** (schemas §4 only — no catalog entry or path). Each violates the mandate §4 completeness checklist (ID, source, type, schema, location, manifest representation, event ref, corroboration, reveal phase).
- **Resolution:** All six artifacts fully registered in all four v1.1 documents with the complete attribute set; manifest `type` enum extended (`edr_session`, `proxy_log`); E-PROXY-001 mandated to render as an explicit negative record ("no matching entries"), not an empty file.
- **Remaining risk:** None. Post-fix cross-registry check: every E-code in any v1.1 document resolves in all four.

### QA-07 — HIGH — Answer-key / authoring metadata leaks into candidate-visible surfaces
- **Affected documents:** EVIDENCE_DIRECTORY_SPEC (§4 sidecar schema, §5 manifest schema), EVIDENCE_SCHEMAS_TEMPLATES (§8 "RED HERRING context" header, §9 "RED HERRING/RULE-OUT" banner lines, §14 checklist wording)
- **Issue:** Candidate-facing files/sidecars carried `red_herring`, `rule_out`, `rh_refs`, `evt_refs` fields, and raw-log exemplars embedded "# RED HERRING" / "# RULE-OUT" banner lines — directly exposing classifications the candidate must derive (violates mandate §5; undermines SIM_REQUIREMENTS §13.7 opacity-of-answers).
- **Resolution:** Formal **`candidate_view` / `internal_metadata` split** codified in DIRECTORY_SPEC v1.1 §4–5: browser UI renders only candidate_view + artifact body; classification/corroboration/rule-out fields ship in a separate grading manifest never exposed to candidates. Schemas exemplars stripped of banner lines; diegetic in-world pointers retained (e.g., "HR travel approval TRV-2026-0312 on file", quarantine-note reference in E-DOC-002) because they are genuine evidence content. Catalog v1.1 carries an explicit internal-authoring-document header note.
- **Remaining risk:** LOW residual — the Evidence Generator must apply the split when emitting final JSON; this is now a stated generator contract (SCHEMAS v1.1 §14 / DIRECTORY_SPEC v1.1 §5).

### QA-08 — HIGH — EVT-021 (rogue-account lateral movement) was single-sourced
- **Affected documents:** ATTACK_TIMELINE (EVT-021), EVIDENCE_MATRIX (§1 EVT-021 row, §3 set #5)
- **Issue:** A decisive lateral-movement event canonically had only E-AUTH-007 — below the §15.1 two-source bar for key findings.
- **Resolution:** **E-EDR-015** (EDR session telemetry on FILE-PRD-01, svc_mon session 10:15→13:05 spanning collection→exfil) fully registered; matrix set #5 updated.
- **Remaining risk:** None.

## MEDIUM

### QA-09 — MEDIUM — IIS UTC header convention not standardized
- **Affected documents:** EVIDENCE_CATALOG (header note variant), EVIDENCE_SCHEMAS_TEMPLATES (§1 exemplar variant), EVIDENCE_DIRECTORY_SPEC (§4 sidecar wording), ENVIRONMENT §12 (ambiguous "some security logs")
- **Issue:** Multiple wording variants for the UTC→IST conversion note; ENVIRONMENT §12 ambiguous about security logs (evidence package renders all Windows security events in IST).
- **Resolution:** Single canonical string mandated everywhere: `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.` ENVIRONMENT §12 rewrite specified (U-07). Verified: all IIS exemplar timestamps convert correctly (09:35 UTC = 15:05 IST; 07:32:41 UTC = 13:02:41 IST; 11:15–12:05 UTC = 16:45–17:35 IST).
- **Remaining risk:** None.

### QA-10 — MEDIUM — E-PROXY-001 corroboration mislink
- **Affected documents:** EVIDENCE_CATALOG (E-PROXY-001)
- **Issue:** Listed E-EDR-012 (2026-09-05 FILE-PRD-01 exfil) as corroboration for a 2026-09-03 WEB-PRD-01 egress-window artifact — cross-window mislink.
- **Resolution:** Corroboration corrected to E-NET-002 + E-FS-002 (same window/host).
- **Remaining risk:** None.

### QA-11 — MEDIUM — Catalog lacked reveal phases
- **Affected documents:** EVIDENCE_CATALOG (all entries)
- **Issue:** Mandate §4 requires a reveal phase for every candidate-visible artifact; catalog had none (only the manifest schema did).
- **Resolution:** `Reveal phase` added to every catalog entry: Phase 0 (E-ALERT-001, E-TICKET-001); Phase 1 (all investigation evidence); Phase 6 (E-RESP-001..004, E-VALID-001, E-AD-004); Phase 7 (E-VALID-002, E-REPORT-001).
- **Remaining risk:** None.

### QA-12 — MEDIUM — Ambiguous "4625/4624 audit" wording for the ERP probe
- **Affected documents:** ATTACK_TIMELINE (EVT-026), EVIDENCE_MATRIX (EVT-026/E-AUTH-009)
- **Issue:** Wording implied both failure and success events existed on ERP-APP-01; only a failed 4625 exists — a candidate could misread ERP as accessed.
- **Resolution:** Standardized to "single failed SMB connect (4625) only; no successful logon follows."
- **Remaining risk:** None.

### QA-13 — MEDIUM — RH-04 rule-out surface not explicit
- **Affected documents:** EVIDENCE_CATALOG (E-AD-003), EVIDENCE_MATRIX (RH-04 row, Gap #3), EVIDENCE_SCHEMAS_TEMPLATES §6
- **Issue:** admin_legacy rule-out depends on a 14-month logon absence; v1.0 did not guarantee the candidate-visible surface exposing it.
- **Resolution:** E-AD-003 schema already carried `last_logon_ist`; v1.1 makes it explicit that the snapshot includes admin_legacy with last_logon ≈2025-07 (14 months dormant) — deterministic rule-out. No new artifact needed.
- **Remaining risk:** None.

## LOW

### QA-14 — LOW — SCENARIO_BIBLE §27 containment table row 5 wording
"Preserve evidence first" in order slot 5 contradicted itself. Correction specified (U-04): "Preserve evidence (after urgent containment, before eradication)." Canonical order unchanged. **Remaining risk:** none.

### QA-15 — LOW — Noise-budget recount after RH-06 removal
Matrix §4 referenced WSUS logs and "10 of ~50 artifacts." Recount: herring-bearing artifacts E-VULN-001/002, E-WEB-004, E-AUTH-010/011, E-DOC-002, E-FS-007 + interleaved ambient noise in E-AUTH-001/E-NET-001/E-WEB-001 ≈ 9 of ~52 artifacts (~17%); raw-line noise remains 20–30% per §15.5 via interleaving. Six herring/noise classes remain (RH-01, 02, 03, 04, 05, 07): 3 major human/system + historical + scanner + ambient — within the §24.2 "3–5 major + ambient" bound. **Remaining risk:** none.

### QA-16 — LOW — ENVIRONMENT §4.2 stale WSUS-01 cross-reference
Pointed to "SCENARIO_BIBLE §24" (wrong section; RH ledger is Appendix A) and became stale after RH-06 removal. Correction specified (U-06). **Remaining risk:** none.

### QA-17 — LOW — Orphaned weakness ID W-05b
ENVIRONMENT §7 and SCENARIO_BIBLE §7 cite W-05b (no LAPS), absent from the §13 weakness table. Correction specified (U-05: add row, Not-exploited). **Remaining risk:** none.

### QA-18 — LOW — EVT-020 single-source by design
krbtgt capture shares EVT-019's evidence. Verified acceptable: the `/all` scope is explicit in E-EDR-009 and the 4662 scope in E-AUTH-006, making the inference deterministic; v1.1 catalog makes the `/all` visibility explicit. **Remaining risk:** none (documented design decision).

### QA-19 — LOW — E-AD-004 exemplar timestamp granularity
4725 disable exemplar at 10:31:12 vs containment stated 10:30 — seconds-level execution lag within the action minute; realistic, kept. **Remaining risk:** none.

### QA-20 — LOW — "ADDED-BY-AGENT3" labels and unresolved "Gaps flagged" sections
v1.0 carried authoring scaffolding labels and open gap lists. v1.1 integrates artifacts as first-class (labels removed) and converts gaps into a resolved/by-design change log. **Remaining risk:** none.

### QA-21 — LOW — Organization name real-world association check (mandate §14)
"Vistara Polymers Pvt. Ltd." shares a word with a well-known Indian airline brand. Assessment: suffix, industry (polymer manufacturing), and all-synthetic disclaimers make confusion unlikely; renaming would touch every document for marginal benefit. **Decision: keep; recorded here for transparency.** Fallback replacement pre-approved if the program owner disagrees: "Kalyani Plastipack Pvt. Ltd." with full propagation. No government organization names used; all personnel names plausibly Indian; no Western placeholder names found. **Remaining risk:** minimal, accepted.

---

## Cross-document ID audit (final state, v1.1)

| Registry | Count | Result |
|---|---|---|
| EVT IDs (001–038) | 38 | All defined in ATTACK_TIMELINE_v1.1; all referenced by ≥1 artifact; none orphaned/duplicated |
| RH IDs | 6 active (RH-01,02,03,04,05,07) + RH-06 retired | All active RH have candidate-visible evidence AND in-simulation rule-out |
| W IDs | W-01…W-09 (+W-02b, W-03b/c, W-04b, W-05b via U-05) | All resolve to SCENARIO_BIBLE §13 (after U-05) |
| E-codes | 52 registered artifacts | Every E-code resolves in catalog + matrix + directory spec + (schema/template where applicable) |
| Policies | IR-Policy-01, AC-Policy-02, CH-Policy-03, BK-Policy-04, VP-Policy-05, NW-Policy-06 | Consistent across ENVIRONMENT §9, Bible §9, evidence references |
| Hostnames / IPs / usernames / paths / filenames | per ENVIRONMENT §11 registry | No divergent spellings found in v1.1 pass; dual-IP convention for WEB-PRD-01 and VPN-GW-01 applied consistently |
| Timestamps | all audited against master timeline | Prerequisites order holds: no auth before credential access; persistence after compromise; collection after access; exfil after staging; containment after detection; preservation before eradication; eradication before recovery; validation after recovery; closure after validation |

**Full-detail traceability:** see EVIDENCE_TRACEABILITY_AUDIT.md (Part 1: 15 key findings; Part 2: all 38 events + 6 herrings).
