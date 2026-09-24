# ASSESSMENT_BLUEPRINT.md — VISTARA-IR-ASSESSMENT-v1.0

**Version:** 1.0
**Status:** INTERNAL DESIGN DOCUMENT — never candidate-visible. Contains structural references to canonical answers (answer-key material); all canonical-answer content is marked **[INTERNAL — ANSWER KEY]**.
**Authoritative basis:** Simulation package v1.1 (SIMULATION_REQUIREMENTS.md, ATTACK_TIMELINE_v1.1.md, ENVIRONMENT.md v1.1, EVIDENCE_CATALOG_v1.1.md, EVIDENCE_MATRIX_v1.1.md) as consolidated in `_internal/ASSESSMENT_DESIGN_KERNEL.md`. No facts are invented; every task, evidence ID, timestamp, weakness, and technique below resolves to the v1.1 package, and retired v1.0 material is never used. All timestamps are IST (UTC+05:30) except IIS artifacts (E-WEB-*), which are natively UTC and carry the canonical header `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`

## 1. Purpose

A **five-hour (300-minute), browser-based investigation and incident-response assessment** for security professionals. The candidate plays the **Senior IR Analyst** assigned to **INC-2026-0417** at Vistara Polymers Pvt. Ltd. (detection 2026-09-09 09:47 IST) and works the incident end-to-end: triage → detection validation → initial access → post-compromise → lateral movement/exfiltration → scoping/reconstruction → containment/eradication/recovery → safe-state validation → final reporting.

The assessment contains **30 scored tasks across 8 phases (P0–P7), 255 raw points**, graded deterministically against canonical answers derived from the v1.1 package.

## 2. Design principles

1. **Evidence-first.** Every key investigative task is evidence-linked: the candidate must select the supporting evidence IDs — a candidate-facing, scored action (20% of task points ride on evidence selection; 80% on the answer). This 80/20 rule applies to the **25 scored evidence-linked tasks**: all `evidence_linked: true` tasks EXCEPT **Q-05-01**, which is exempt (its full 10 pts ride on the 40-cell classification table, 0.25/cell; its evidence requirement is validation/authoring metadata for feedback + CF-3, earning no separate points). Q-05-03, Q-05-04, Q-06-02, and Q-07-04 are not evidence-linked and carry no evidence-selection scoring. Within every task, scored sub-answers/components are **equally pooled** (points per component = component pool / N — no custom component weights anywhere); QUESTION_BANK.md states the resulting per-task split for every task. No scored conclusion is reachable without touching evidence.
2. **Correlation over isolation.** Multi-source findings (initial access, lateral movement, persistence, exfiltration, safe state) require correlating ≥2 independent artifact families (per EVIDENCE_MATRIX corroboration requirements). No multi-source finding is reduced to a one-artifact lookup.
3. **Short answer ≠ easy task.** Final answers are deterministic tokens (one hostname, one username, one timestamp, one decision), but reaching them requires 10–15 minutes of cross-artifact investigation (see §6 worked example).
4. **Deterministic grading.** Every scored item has exactly one objectively gradable answer or state (asset / username / IP / path / timestamp / technique / single choice / multi-select / ordered sequence / classification table / go-no-go decision). The single rubric-scored narrative (Q-07-04 executive summary, 5 of 255 points) is the only non-deterministic item.
5. **No dead ends.** Wrong operational decisions trigger in-simulation consequences (business-impact escalations, renewed SIEM alerts, validation failures) with rollback/remedial paths; the run can always be completed (see PROGRESSION_LOGIC.md §4).
6. **Signal vs noise is a scored skill.** Six validated red-herring/noise classes (RH-01, RH-02, RH-03, RH-04, RH-05, RH-07) are embedded in the evidence and assessed by dedicated tasks; every herring is rule-out-able with candidate-visible evidence.
7. **Contained information environment.** Candidates never leave the simulation for information. The dossier informs but never answers (see §3).

## 3. Candidate interaction model

The browser UI uses a persistent three-pane layout. Tasks are designed to fit this model.

| Pane | Contents | Role in task design |
|---|---|---|
| **LEFT — Task Overview / Phase Navigation** | Phase list (P0–P7) with lock/unlock state, tasks within the current phase and their completion state, phase time guidance vs elapsed | Candidate picks the next task within any unlocked phase; completed phases remain navigable (see PROGRESSION_LOGIC.md) |
| **CENTER — Investigation Workspace** | Evidence viewer (logs, records, files, SIEM views), document store, the active task's instructions/questions/decision controls, evidence-selection control for evidence-linked tasks | All 30 tasks are presented and answered here; evidence opens alongside the task so correlation is a side-by-side activity |
| **RIGHT — Dossier (persistent reference)** | Organization, network diagram/segments, asset inventory, users/accounts, policies (IR-Policy-01, CH-Policy-03, VP-Policy-05, AC-Policy-02, BK-Policy-04, …), weakness register (W-IDs), reference material | Provides the context needed to *interpret* evidence (e.g., that 10.10.40.13 is the registered scanner VULN-01, that DC-01 isolation halts domain authentication) — it never contains incident answers |

**Interaction rules:**
- Candidates never leave the simulation to find information. Every fact needed for every scored answer is in the CENTER evidence or the RIGHT dossier.
- The dossier is persistent reference information available in every phase from P0 onward; it **informs but never answers** (it contains no attack-event data — those exist only in evidence artifacts).
- Evidence artifacts are revealed on the phase-based schedule (§4 of PROGRESSION_LOGIC.md); once revealed, artifacts remain open for revisit for the rest of the run.
- Questions appear in the CENTER workspace bound to the task selected in the LEFT pane.

---

## 4. Phase-by-phase blueprint (P0–P7)

Time model: 300 minutes total. Splits are investigation / evidence-review / task-decision minutes (§6). Gates are enforced per PROGRESSION_LOGIC.md.

### P0 — Briefing & Triage (15 min; split 6 / 5 / 4)
- **Narrative purpose:** Drop the candidate into the SOC seat at 09:47 IST on 2026-09-09: an EDR alert and a freshly opened ticket. Establishes role, stakes, and the severity framework.
- **Story-arc role:** Triage — the candidate's entry point into the attack's *detection* event (the attack itself began 09-02).
- **Tasks:** Q-00-01 — Triage & incident declaration (5 pts).
- **Evidence worked with:** E-ALERT-001, E-TICKET-001 (both revealed at phase 0).
- **Red herrings encountered:** none directly (the false-positive option is the proto-herring; disproof arrives in P1 via E-ALERT-002/E-EDR-008/E-NET-003).
- **Expected outputs:** verdict (true incident), severity per IR-Policy-01, alerting host, implicated external IP; first evidence-linked selection.
- **Gate:** Q-00-01 complete (verdict + severity + anchors).

### P1 — Detection Validation & Initial Scoping (30 min; split 12 / 10 / 8)
- **Narrative purpose:** Validate the detection against the retrospective SIEM correlation cluster, size the initial blast radius, and clear the first noise source out of the way.
- **Story-arc role:** Triage → scoping pivot; frames the four core hosts and identifies the live C2 beacon that anchors the whole response phase.
- **Tasks:** Q-01-01 — Reading the correlation cluster (6 pts); Q-01-02 — Signal vs noise: the vulnerability scanner (5 pts).
- **Evidence worked with:** E-ALERT-002, E-NET-003, E-EDR-008 (cluster/cadence); E-VULN-001, E-VULN-002 + dossier asset inventory (scanner rule-out). All remaining investigation evidence reveals as this phase opens.
- **Red herrings encountered:** RH-01 (sanctioned vuln scans 09-04 09:15–11:02 and 09-08 02:00–03:47 — including the trap that the 09-04 run is on-demand, not the weekly schedule).
- **Expected outputs:** cluster host set, beacon interpretation, scanner classification with rule-out facts.
- **Gate:** Q-01-01 and Q-01-02 complete.

### P2 — Initial Access & Compromise Analysis (45 min; split 18 / 17 / 10)
- **Narrative purpose:** Rewind to 09-02/09-03 and establish exactly how the attacker got in: the exposure, the broken account, the vector, and the web shell — separating this incident's artifacts from historical debris.
- **Story-arc role:** Initial access — RDP brute force of svc_portal over internet-exposed TCP 3389 (09-03 11:47 IST), then web-shell deployment via the staging upload page (13:02 IST).
- **Tasks:** Q-02-01 — The exposure (6 pts); Q-02-02 — Initial access determination (10 pts); Q-02-03 — The web shell (8 pts); Q-02-04 — Web/application weakness chain (6 pts).
- **Evidence worked with:** E-NET-001, E-NET-005, E-AUTH-001, E-AUTH-012, E-EDR-001, E-WEB-002, E-WEB-003, E-FS-001, E-FS-007, E-DOC-001, E-DOC-002, E-WIKI-001.
- **Red herrings encountered:** RH-05 (2025 shell fragment upload_bak.aspx, quarantined per IR-2025-011); RH-07 (ambient internet 3389 scanning — distributed sources, zero successes); the VPN/no-MFA competing hypothesis (W-08 real but unused — ruled out by the full-window VPN summary E-AUTH-012).
- **Expected outputs:** exposure weakness + policy failure; attacker source IP, compromised account, success timestamp, vector with evidence set; shell path/delivery URI/upload time (UTC→IST conversion exercised); weakness chain {W-01, W-02b, W-03}.
- **Gate:** Q-02-01..04 complete.

### P3 — Execution, Credentials & Persistence (60 min; split 24 / 22 / 14)
- **Narrative purpose:** The deepest investigative phase. Follow the attacker inside: two credential recoveries with a failed attempt between them, the first hop to APP-PRD-01, rogue-account creation, scheduled-task C2, and the DCSync that exposes the entire domain.
- **Story-arc role:** Post-compromise — execution, credential access, privilege discovery, persistence, domain dominance (09-03 15:00 → 09-04 13:14 IST).
- **Tasks:** Q-03-01 — Credential access chain (10 pts); Q-03-02 — First lateral movement & privilege discovery (8 pts); Q-03-03 — Identity persistence: rogue account (8 pts); Q-03-04 — Host persistence & C2: scheduled task (8 pts); Q-03-05 — Domain dominance: DCSync (10 pts); Q-03-06 — Persistence inventory: synthesis (6 pts).
- **Evidence worked with:** E-EDR-003/004/005/006/007/008/008B/009, E-AUTH-002/003/004/005/006, E-FS-003/004, E-AD-001/002/003, E-NET-003 (+ E-AUTH-007 forward reference, E-WIKI-001 hygiene pattern).
- **Red herrings encountered:** RH-04 seeded here (admin_legacy looks privileged and weak but is dormant ~14 months; fully assessed in P5); the "legitimate Edge update task" name disguise (defeated by reading what the task *does*); golden-ticket-vs-active-persistence distinction (krbtgt captured, never used).
- **Expected outputs:** dumped process, both credential recoveries + the failed 15:12 attempt; first-hop host/account/method/timestamp + Domain Admin discovery; rogue account identity/groups/creator/timestamp; task name/host/account/interval/decoded callback URL; DCSync technique/source/target/account/window + krbtgt implication (double reset); the 3-mechanism persistence inventory.
- **Gate:** Q-03-01..06 complete.

### P4 — Discovery, Lateral Movement, Collection & Exfiltration (45 min; split 18 / 16 / 11)
- **Narrative purpose:** Track the rogue account to FILE-PRD-01, reconstruct collection/staging and both exfiltration events, and exercise the compromised-vs-accessed-vs-probed judgment that will drive containment scope.
- **Story-arc role:** Lateral movement / collection / exfiltration (09-05 10:15 → 13:05 IST), plus edge-case scoping of DB-PRD-01 and ERP-APP-01.
- **Tasks:** Q-04-01 — Rogue account in action (6 pts); Q-04-02 — Collection & staging (8 pts); Q-04-03 — Exfiltration (8 pts); Q-04-04 — Scope discrimination: accessed vs compromised vs probed (6 pts).
- **Evidence worked with:** E-AUTH-007/008/009, E-EDR-010/012/013/015, E-FS-002/005/006, E-NET-002/004/006, E-DB-001, E-SHARE-001, E-PROXY-001 (+ E-EDR-002 for exfil #1).
- **Red herrings encountered:** over-scoping traps — DB-PRD-01 (read-only 5-row sampling ≠ compromise) and ERP-APP-01 (single failed SMB 4625 ≠ access); evidence-survivability trap (missing 09-03 NetFlow flow is a 7-day retention gap (W-09), not tampering).
- **Expected outputs:** svc_mon session proof (host/source/start/logon type); staged categories + directory + ~2.1 GB volume; both exfil events matched to volumes and destination 185.220.101.47:8443 (~698 MB total); correct host classifications.
- **Gate:** Q-04-01..04 complete.

### P5 — Full Scoping & Attack-Path Reconstruction (30 min; split 10 / 8 / 12)
- **Narrative purpose:** Convert investigation into the definitive incident record: blast radius for hosts and identities, the ordered attack timeline, ATT&CK mapping, and the defensible IOC set. Decision-heavy phase (12 of 30 min on task decisions).
- **Story-arc role:** Scoping & reconstruction — synthesis of everything proven in P1–P4.
- **Tasks:** Q-05-01 — Breach scope: host classification table (10 pts); Q-05-02 — Breach scope: identities (8 pts); Q-05-03 — Timeline reconstruction (10 pts); Q-05-04 — ATT&CK mapping (15 pts); Q-05-05 — IOC consolidation (8 pts).
- **Evidence worked with:** synthesis sets per task (all major families); herring rule-out sets E-AUTH-010/011/012, E-WEB-004, E-DOC-003, E-AD-003, E-FS-007/E-DOC-002, E-VULN-001/002.
- **Red herrings encountered:** RH-02 (pranav.joshi — Ahmedabad office IP, orders match dealer POs), RH-03 (ananya.iyer — HR travel approval TRV-2026-0312), RH-04 (admin_legacy dormancy), RH-05 (2025 shell), RH-01 (scanner IOCs) — all as IOC/account distractors and scoping traps.
- **Expected outputs:** 10-host × 4-class classification table; compromised-account set + domain-wide credential exposure verdict; 11-milestone ordered timeline; 15 technique mappings from the 18-ID controlled list; 8-item IOC set + top block priority.
- **Gate:** Q-05-01..05 complete. **[INTERNAL — ANSWER KEY] CF-3 attaches here (any of the four Compromised hosts misclassified caps the score).**

### P6 — Containment, Eradication & Recovery (45 min; split 12 / 10 / 23)
- **Narrative purpose:** Decision phase. The beacon is live at ~10:00 IST on 09-09: the candidate selects containment, sequences the response lifecycle, builds and orders the eradication plan, and plans recovery. Decisions execute in-simulation and generate response-record artifacts.
- **Story-arc role:** Response — containment → evidence preservation → eradication → recovery (canonical events EVT-033 → EVT-036).
- **Tasks:** Q-06-01 — Containment decision (12 pts); Q-06-02 — Response lifecycle sequencing (5 pts); Q-06-03 — Eradication plan (12 pts); Q-06-04 — Recovery sequencing & approach (10 pts).
- **Evidence worked with:** decision-basis sets (E-NET-003, E-ALERT-001, E-EDR-008, E-AUTH-007, E-AD-001/002/003, persistence/credential/weakness evidence from P2–P4, dossier business context, BK-Policy-04); newly revealed as decisions execute: E-RESP-001..004, E-AD-004, E-VALID-001.
- **Red herrings encountered:** over-containment trap (isolating DC-01 = domain-wide auth outage; whole-VLAN isolation); under-containment trap (monitor-only against a live C2); "restore from backup alone" eradication trap; single-krbtgt-reset trap; post-compromise backup trap (09-08 backup may carry attacker artifacts).
- **Expected outputs:** executed containment set {3 hosts isolated, 3 accounts disabled, 185.220.101.47 blocked, /staging/ suspended}; canonical 5-step lifecycle order; 7-action eradication plan in canonical order; recovery order DC→WEB→APP→FILE with per-host approach, 09-02 backup selection, 72-hour monitoring commitment.
- **Gate:** Q-06-01..04 complete. **[INTERNAL — ANSWER KEY] CF-2 attaches to Q-06-01 (missing C2 block or any of the 3 isolations caps the score).**

### P7 — Safe-State Validation & Final Reporting (30 min; split 6 / 8 / 16)
- **Narrative purpose:** Close the incident honestly. Define the validation gate, survive the safe-state trap, record residual risk and recommendations, and file the structured final report.
- **Story-arc role:** Validation & reporting (canonical events EVT-037 → EVT-038; safe state verified 09-09 17:30 IST).
- **Tasks:** Q-07-01 — Validation requirements (8 pts); Q-07-02 — The safe-state gate [TRAP] (10 pts); Q-07-03 — Residual risk & recommendations (8 pts); Q-07-04 — Final incident report: structured (15 pts).
- **Evidence worked with:** E-VALID-001, E-VALID-002 (interim packet with the SKIPPED line, then the 16:55 re-run), E-AD-003 re-verification, E-RESP-003 completeness, dossier weaknesses W-04/W-05/W-05b/W-06/W-08/W-09; E-REPORT-001 (report template) reveals in this phase.
- **Red herrings encountered:** the designed safe-state trap — EDR-clean + business pressure to reopen the portal vs. a SKIPPED persistence re-check line and an un-run AD audit (a SKIPPED line is not a PASS); residual-risk distractors (active beacon — eradicated; ERPDB full exfil — never happened); recommendation distractors (replace EDR vendor; discipline the scanner operator).
- **Expected outputs:** 9-check validation gate; stage-1 NOT SAFE and stage-2 SAFE declarations with blocking deficiency; residual-risk set {i–v} and recommendation set {i–vii}; structured report (10 deterministic fields cross-checked against phase answers + rubric-scored executive summary).
- **Gate:** Q-07-01..04 complete → submit. **[INTERNAL — ANSWER KEY] CF-1 attaches to Q-07-02 stage 1 (premature SAFE caps the score at 49%; candidate may still finish for partial credit).**

---

## 5. Task inventory (30 tasks, 255 raw points)

Type abbreviations: SC = single choice; MS = multi-select; SEQ = ordered sequence; CT = classification table; MAP = matching/mapping; TXT = deterministic token (asset/username/IP/path/filename/timestamp/string); YN = yes/no; DEC = operational decision set; RPT = structured report fields + rubric narrative.

| ID | Title | Type | Pts | Difficulty | Evidence-linked |
|---|---|---|---|---|---|
| Q-00-01 | Triage & incident declaration | SC + TXT (asset, IP) | 5 | Low | Y |
| Q-01-01 | Reading the correlation cluster | MS + SC | 6 | Medium | Y |
| Q-01-02 | Signal vs noise: the vulnerability scanner | SC + MS | 5 | Medium | Y |
| Q-02-01 | The exposure | SC ×2 (weakness, policy failure) | 6 | Medium | Y |
| Q-02-02 | Initial access determination | TXT (IP, username, timestamp) + SC + evidence set | 10 | High | Y |
| Q-02-03 | The web shell | TXT (path, URI, timestamp) + SC | 8 | High | Y |
| Q-02-04 | Web/application weakness chain | MS (W-IDs) + TXT | 6 | Medium | Y |
| Q-03-01 | Credential access chain | TXT ×4 (process, user, path, password) + SC | 10 | High | Y |
| Q-03-02 | First lateral movement & privilege discovery | TXT (asset, user, timestamp) + SC ×2 | 8 | Medium-High | Y |
| Q-03-03 | Identity persistence (rogue account) | TXT ×3 + MS + TXT (creator/host) | 8 | Medium | Y |
| Q-03-04 | Host persistence & C2 (scheduled task) | TXT ×3 (task, host, URL) + TXT (account) + SC | 8 | Medium-High | Y |
| Q-03-05 | Domain dominance (DCSync) | TXT (technique, hosts, user, window, credential) | 10 | High | Y |
| Q-03-06 | Persistence inventory (synthesis) | MS + SC | 6 | Medium | Y |
| Q-04-01 | Rogue account in action | TXT (assets, timestamp) + SC | 6 | Medium | Y |
| Q-04-02 | Collection & staging | MS + TXT (path) + SC (volume) | 8 | Medium | Y |
| Q-04-03 | Exfiltration | TXT (filename, IP:port) + MAP (event↔volume) + SC | 8 | Medium-High | Y |
| Q-04-04 | Scope discrimination: accessed vs compromised vs probed | SC ×2 + TXT (username) | 6 | Medium-High | Y |
| Q-05-01 | Breach scope: host classification table | CT (10 hosts × 4 classes) | 10 | High | Y |
| Q-05-02 | Breach scope: identities | MS + YN + SC ×2 | 8 | High | Y |
| Q-05-03 | Timeline reconstruction | SEQ (11 milestones; Kendall-tau scored) | 10 | Medium | N |
| Q-05-04 | ATT&CK mapping | MAP (15 behaviors → controlled 18-ID list) | 15 | Medium | N |
| Q-05-05 | IOC consolidation | MS (14 candidates) + SC | 8 | Medium-High | Y |
| Q-06-01 | Containment decision | DEC: MS (hosts) + MS (accounts) + SC (network) + SC (web) + SC (rationale) | 12 | High | Y |
| Q-06-02 | Response lifecycle sequencing | SEQ (5 actions) | 5 | Medium | N |
| Q-06-03 | Eradication plan | MS (10 candidates → 7) + SEQ (7 step-groups) | 12 | High | Y |
| Q-06-04 | Recovery sequencing & approach | SEQ (4 systems) + MAP (host→approach) + SC (backup) + YN | 10 | High | Y |
| Q-07-01 | Validation requirements | MS (11 candidates → 9) | 8 | Medium | Y |
| Q-07-02 | The safe-state gate (TRAP) | SC (SAFE/NOT SAFE) ×2 stages + SC (blocking deficiency) | 10 | High | Y |
| Q-07-03 | Residual risk & recommendations | MS + MS | 8 | Medium | Y |
| Q-07-04 | Final incident report (structured) | RPT: 10 deterministic fields + 5-pt rubric executive summary | 15 | Medium | N |

**Totals:** 30 tasks; 255 raw points (P0 5 / P1 11 / P2 30 / P3 50 / P4 28 / P5 51 / P6 39 / P7 41). Difficulty mix: Low 1, Medium 14, Medium-High 5, High 10. Evidence-linked: 26 of 30 (all except Q-05-03, Q-05-04, Q-06-02, Q-07-04, which are synthesis tasks scored on answers already evidence-derived upstream). **Scoring references (normative):** sub-answers are equally pooled (component pool / N; no custom weights); the 80/20 evidence split is scored on 25 of the 26 evidence-linked tasks — **Q-05-01 is exempt** (40 cells × 0.25 = 10 pts; its evidence is validation/authoring metadata, not scored); Q-05-04's evidence references are likewise authoring/validation metadata, not scored (15 mappings × 1.0).

---

## 6. Five-hour depth model

### 6.1 Per-phase time budget (sums to 300 minutes)

| Phase | Name | Investigation | Evidence review | Task / decision | Total |
|---|---|---|---|---|---|
| P0 | Briefing & Triage | 6 | 5 | 4 | 15 |
| P1 | Detection Validation & Initial Scoping | 12 | 10 | 8 | 30 |
| P2 | Initial Access & Compromise Analysis | 18 | 17 | 10 | 45 |
| P3 | Execution, Credentials & Persistence | 24 | 22 | 14 | 60 |
| P4 | Discovery, Lateral Movement, Collection & Exfiltration | 18 | 16 | 11 | 45 |
| P5 | Full Scoping & Attack-Path Reconstruction | 10 | 8 | 12 | 30 |
| P6 | Containment, Eradication & Recovery | 12 | 10 | 23 | 45 |
| P7 | Safe-State Validation & Final Reporting | 6 | 8 | 16 | 30 |
| **Total** | | **106** | **96** | **98** | **300** |

Depth deliberately shifts across the run: investigation-heavy in P2–P4 (finding and correlating), decision-heavy in P5–P7 (acting on what was proven). The median competent-candidate target is ~4.5 h; the full budget is 5 h with soft pacing nudges only (PROGRESSION_LOGIC.md §5).

### 6.2 Where the depth comes from — worked example: Q-02-02(b)

**The answer is one username: `svc_portal`.** **[INTERNAL — ANSWER KEY]** Reaching it defensibly is 10–15 minutes of work across five evidence families plus one negative-evidence check:

1. **E-AUTH-001 (WEB-PRD-01 security log):** filter 4625 failures by source IP; find the focused 09-03 failure burst from 45.155.90.23, recognize the distinct substatus pattern of password-guessing, then find the 4624 Type 10 success at 11:47 IST and read the account name off it. Ambient RH-07 scanner noise (distributed IPs, zero successes) must be rejected on the way.
2. **DC-01 4776 records inside E-AUTH-001:** confirm NTLM credential validations for that account in the same minute — the domain controller corroborates the brute-force-then-success sequence.
3. **E-NET-005 (FW-01 session log):** match the 45.155.90.23 → 203.0.113.10:3389 session 11:47–12:20 to the logon minute — network and host agree.
4. **E-NET-001 (FW-01 rule/scan evidence):** tie the same source IP to the earlier scan and to the stale any→3389 allow rule (W-01) that made the vector reachable.
5. **E-EDR-001 (endpoint session telemetry):** confirm an interactive session on WEB-PRD-01 materialized from that logon.
6. **E-AUTH-012 (VPN full-window summary) — negative evidence:** eliminate the competing W-08/no-MFA VPN hypothesis: no attacker IPs and no svc_* logins appear anywhere in the VPN window.

Only then does the candidate type `svc_portal` into a single field (and select {E-AUTH-001, E-NET-005, E-NET-001, E-EDR-001} as the proving evidence set). **This is the depth model in miniature: question count stays at 30; time is consumed by correlation, hypothesis elimination, noise rejection, and timezone discipline — never by padding.** The same pattern repeats in Q-03-01 (two credential recoveries separated by a failed attempt), Q-03-05 (4662 replication + EDR command line + `/all`-scope inference), Q-04-03 (archive creation × FW volume windows × retention-gap reasoning), and Q-07-02 (checklist completeness vs. EDR-clean pressure).

---

## 7. Red-herring integration map

Six validated herring/noise classes from the v1.1 package are integrated; no new herrings are added. Each is rule-out-able with candidate-visible evidence, and each is *assessed* — dismissing noise correctly is scored, not just tolerated.

| RH | Content | Assessed by | Rule-out evidence (candidate-visible) |
|---|---|---|---|
| RH-01 | Sanctioned vulnerability scans (on-demand VS-MAN-2026-0904 on 09-04; scheduled VS-WK37-2026 on 09-08) | Q-01-02; distractors in Q-05-05 | E-VULN-001/002 + dossier asset inventory: source 10.10.40.13 = registered VULN-01, authenticated svc_monitor jobs, operator devang.shah, no follow-on exploitation |
| RH-02 | pranav.joshi odd-window VPN activity | Q-05-02(d); distractors in Q-05-05 | E-AUTH-010 (Ahmedabad office egress 122.176.45.9) + E-WEB-004 (orders match dealer POs) + E-AUTH-012 |
| RH-03 | ananya.iyer odd-window VPN activity | Q-05-02(d); distractors in Q-05-05 | E-AUTH-011 + E-DOC-003 (HR travel approval TRV-2026-0312) + E-AUTH-012 |
| RH-04 | admin_legacy — weak, privileged-looking, but unused | Q-05-02(c); distractors in Q-05-05 | E-AD-003 last_logon ≈2025-07 (~14-month dormancy); absent from every attack artifact |
| RH-05 | 2025 historical web-shell fragment upload_bak.aspx | Q-02-03(d); distractors in Q-05-05 | E-FS-007 (2025-11-08 file) + E-DOC-002 (IR-2025-011 quarantine note) + no 2026 execution requests in E-WEB-003 |
| RH-07 | Ambient internet 3389 scanning | Q-02-02 (noise rejection) | E-AUTH-001 / E-NET-001: distributed source IPs, zero successes — contrast with the focused 45.155.90.23 campaign |

---

## 8. MITRE ATT&CK coverage

**Controlled list (18 IDs, all package-supported):** T1003, T1003.006, T1005, T1018, T1021.001, T1039, T1041, T1053.005, T1069, T1070, T1071.001, T1078, T1087, T1098, T1136.001, T1552, T1560.001, T1567.

**15 scored mappings in Q-05-04** (behavior → canonical technique; T1005, T1087, T1567 serve as plausible non-target distractors): **[INTERNAL — ANSWER KEY]**
Scoring: 15 mappings × 1.0 = 15 pts (equal pooling — the mappings carry the full task score). The evidence IDs quoted beside behavior rows are **authoring/validation metadata only — evidence selection is NOT a scored action on Q-05-04** (assessment.json carries `reference_evidence` metadata for Q-05-04 with no scored evidence component).

| # | Observed behavior | Technique |
|---|---|---|
| 1 | Procdump-style memory dump of w3wp.exe on WEB-PRD-01 | T1003 |
| 2 | Credentials recovered from C:\Users\svc_portal\Documents\passwords.txt | T1552 |
| 3 | Interactive RDP session WEB-PRD-01 → APP-PRD-01 using a legitimate account | T1021.001 |
| 4 | Intrusion conducted through legitimate accounts (svc_portal, rajesh.kulkarni, svc_mon) | T1078 |
| 5 | `net group "Domain Admins" /domain`, `net group "Enterprise Admins" /domain` | T1069 |
| 6 | `nltest /dclist:vistara.local`, `net view` from APP-PRD-01 | T1018 |
| 7 | Creation of domain account svc_mon | T1136.001 |
| 8 | Adding svc_mon to Domain Admins / Remote Desktop Users | T1098 |
| 9 | `schtasks /create` of MicrosoftEdgeUpdateTaskMachineCore | T1053.005 |
| 10 | Encoded-PowerShell beacon every 30 minutes over HTTPS to 185.220.101.47:8443 | T1071.001 |
| 11 | `lsadump::dcsync /domain:vistara.local /all` replication request APP-PRD-01 → DC-01 | T1003.006 |
| 12 | Bulk reads from S:\ and R:\ shares into C:\Windows\Temp\collect\ | T1039 |
| 13 | `Compress-Archive` of staging tree and collect directory into zip archives | T1560.001 |
| 14 | HTTPS POST of archives to 185.220.101.47:8443 /upload | T1041 |
| 15 | `Clear-History`, ConsoleHost_history.txt deletion, recycle-bin emptying on APP-PRD-01 | T1070 |

ATT&CK also appears outside Q-05-04 as task content (e.g., Q-03-05(a) requires the DCSync technique ID), keeping mapping evidence-backed rather than memorization-based.

---

## 9. Learning-outcome coverage (SIMULATION_REQUIREMENTS §5 — all 20 outcomes assessed)

| # | Outcome | Assessing tasks |
|---|---|---|
| 1 | Full-cycle incident analysis | Q-00-01, Q-05-03, Q-07-04 |
| 2 | Recon vs benign discrimination | Q-01-02, Q-02-02, Q-05-05 |
| 3 | Initial-access analysis | Q-02-01, Q-02-02 |
| 4 | Execution / post-compromise analysis | Q-02-03, Q-03-01, Q-03-04 |
| 5 | Web/application weakness chaining | Q-02-01, Q-02-03, Q-02-04 |
| 6 | AD/identity weakness chaining | Q-03-02, Q-03-03, Q-03-05, Q-06-03 |
| 7 | Credential-compromise analysis | Q-03-01, Q-05-02 |
| 8 | Persistence identification | Q-03-03, Q-03-04, Q-03-06, Q-04-01 |
| 9 | Discovery & lateral movement | Q-03-02, Q-04-01, Q-04-04 |
| 10 | Collection & exfiltration analysis | Q-04-02, Q-04-03 |
| 11 | Multi-source evidence correlation | All 26 evidence-linked tasks |
| 12 | Timeline reconstruction | Q-05-03 |
| 13 | ATT&CK mapping | Q-05-04 |
| 14 | IOC identification & prioritization | Q-05-05 |
| 15 | Incident scoping | Q-01-01, Q-04-02, Q-04-04, Q-05-01, Q-05-02 |
| 16 | Containment decision-making | Q-06-01, Q-06-02 |
| 17 | Eradication planning | Q-06-02, Q-06-03 |
| 18 | Recovery sequencing | Q-06-04 |
| 19 | Safe-state validation | Q-07-01, Q-07-02, Q-07-03 |
| 20 | Reporting & risk communication | Q-07-03, Q-07-04 |

**All 20 outcomes are assessed; none exists only in the scenario.** Full traceability (outcome → phase → task → attack event → evidence → answer → scoring) is maintained in QUESTION_BANK.md and assessment.json.

---

## 10. Evidence usage summary

Cross-referencing every task's required/study/rule-out evidence sets (kernel §2) against the v1.1 evidence catalog:

- **64 of 68 catalog entries are referenced by at least one scored task**, counting E-RESP-002 via the explicit E-RESP-001→E-RESP-004 response-record family reference in Q-06-02. (The release manifest registers 52 E-codes per PRE_ASSESSMENT_RELEASE gate 3; catalog v1.1 enumerates 68 entries including v1.1 additions and variants such as E-EDR-008B.)
- **Not directly scored against:** E-WEB-001 (raw IIS excerpt carrying benign-web/bot context), E-EDR-011 (Compress-Archive process event, EVT-023), E-EDR-014 (pre-detection APP-PRD-01 activity, EVT-030), and E-REPORT-001 (the candidate's own report template/canonical exemplar). These remain in the workspace deliberately: they supply **ambient realism**, raw-line noise, and corroborating texture that make the decisive artifacts non-obvious — the candidate must find signal inside a realistic evidence volume rather than receive a pre-filtered answer set.
- Every task's canonical answer is supported by the supplied evidence; every key finding assessed has ≥2 independent sources per EVIDENCE_MATRIX (the krbtgt capture, EVT-020, is the documented single-source inference-by-design from the `/all` scope visible in E-EDR-009).
- **Scored vs metadata evidence:** evidence selection is a scored candidate action only on the 25 scored evidence-linked tasks (20% tier rule). Q-05-01's required evidence is validation/authoring metadata (feedback + CF-3 evaluation), earning no separate points; Q-05-04's per-row evidence references are likewise authoring/validation metadata — assessment.json carries `reference_evidence` metadata for Q-05-04 with no scored evidence component (15 mappings × 1.0 carry the full task score).
