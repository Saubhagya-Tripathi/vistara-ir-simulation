# QUESTION_BANK.md — Vistara Polymers Incident (INC-2026-0417) Assessment

**Version:** 1.0
**Assessment ID:** VISTARA-IR-ASSESSMENT-v1.0
**Basis:** Authoritative v1.1 simulation package (ATTACK_TIMELINE_v1.1, EVIDENCE_CATALOG_v1.1, EVIDENCE_MATRIX_v1.1, ENVIRONMENT, SIMULATION_REQUIREMENTS) as codified in ASSESSMENT_DESIGN_KERNEL.md. This bank must match the kernel exactly: task IDs, canonical answers, accepted answers, evidence IDs, event IDs, points, difficulties, hints, unlock conditions, common wrong answers, and learning outcomes.
**Audience:** INTERNAL — implementers and graders. This is the question bank / answer key. Candidate-facing fields (instructions, question, option lists) are explicitly separated from grader-facing fields (canonical answer, accepted answers, evidence, rationale). Candidate-facing text never leaks the answer.
**Hard constraints:** No invented facts, events, hosts, accounts, evidence IDs, timestamps, IOCs, or ATT&CK techniques. Change-control note: the retired v1.0 Windows event ID four-six-two-eight and retired red herring RH-06 are never used anywhere in this assessment. All timestamps are IST (UTC+05:30); IIS-derived artifacts are UTC and carry the canonical header `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.` — timestamp answers are accepted in IST at minute precision (HH:MM) and, for IIS-derived items, the equivalent UTC value.

---

## 0. COVERAGE SUMMARY (30 scored tasks, 255 points)

| Phase | Name | Tasks | Task points | Phase points |
|---|---|---|---|---|
| P0 | Briefing & Triage | Q-00-01 | 5 | 5 |
| P1 | Detection Validation & Initial Scoping | Q-01-01, Q-01-02 | 6, 5 | 11 |
| P2 | Initial Access & Compromise Analysis | Q-02-01..04 | 6, 10, 8, 6 | 30 |
| P3 | Execution, Credentials & Persistence | Q-03-01..06 | 10, 8, 8, 8, 10, 6 | 50 |
| P4 | Discovery, Lateral Movement, Collection & Exfiltration | Q-04-01..04 | 6, 8, 8, 6 | 28 |
| P5 | Full Scoping & Attack-Path Reconstruction | Q-05-01..05 | 10, 8, 10, 15, 8 | 51 |
| P6 | Containment, Eradication & Recovery | Q-06-01..04 | 12, 5, 12, 10 | 39 |
| P7 | Safe-State Validation & Final Reporting | Q-07-01..04 | 8, 10, 8, 15 | 41 |
| **Total** | | **30 tasks** | | **255** |

## 0.1 GRADING-FORMULA REFERENCE (from kernel §0)

- **Single answer / single choice / yes-no / timestamp:** all-or-nothing per sub-answer (accepted aliases per task entry).
- **Multi-select:** `earned = points_component × max(0, TP − FP) / |correct set|`, rounded to nearest 0.5.
- **Classification table:** per-cell all-or-nothing; cell points = task points / number of cells. (Q-05-01: 40 cells = 10 hosts × 4 classes × 0.25 pts = 10 pts.)
- **Ordered sequence:** Kendall-tau concordance — `earned = points × concordant_pairs / total_pairs`, rounded to nearest 0.5.
- **Sub-answer weighting (equal pooling — authoritative, v1.0.1):** all scored sub-answers/components within a task are EQUALLY weighted — points per component = component pool / N. For evidence-linked tasks the answer pool is 80% of task points split equally among the answer components; evidence selection carries the remaining 20%. No task uses custom per-component weights; every task entry below states its resulting split on a **Points split** line.
- **Evidence-linked tasks (`evidence_linked: true`):** 26 of 30 tasks. Evidence selection IS a candidate-facing scored action (the "select the evidence" sub-question) for **25** of them: 80% of task points on the answer components, 20% on evidence selection. Evidence component: full 20% iff selected set ⊇ required set with zero incorrect IDs; half (10%) iff ⊇ required set with ≤2 incorrect IDs; else 0. **EXCEPTIONS:** **Q-05-01 is EXEMPT** from the 80/20 split — its full 10 pts ride on the 40-cell table (0.25/cell); its required evidence is validation/authoring metadata (feedback + CF-3 evaluation) and earns NO separate points. Q-05-03, Q-05-04, Q-06-02, and Q-07-04 are not evidence-linked and have NO evidence-selection scoring (Q-05-04's per-row evidence references are authoring/validation metadata only). Q-02-02 surfaces the evidence component as explicit sub-question (e): (a)–(d) = 2.0 pts each; (e) = 2.0 pts under the tier rule — (e) IS the 20% evidence component; no additional rescale applies.
- **Hints:** max 2 per task; `hint_penalty` points deducted from that task's earned score (floor 0); hints never name the answer.
- **No negative marking** on investigative items; decision items lose only their own points.
- **Pass threshold:** ≥70% overall AND zero critical failures (CF-1 Q-07-02 stage-1 SAFE; CF-2 Q-06-01 omits C2 block or any of the 3 host isolations; CF-3 Q-05-01 misclassifies any of the 4 Compromised hosts). Critical failure caps the total score at 49%.

---

# PHASE P0 — BRIEFING & TRIAGE (15 min)

---

## Q-00-01 — Triage & incident declaration

- **Question ID:** Q-00-01
- **Phase:** P0 — Briefing & Triage
- **Task title:** Triage & incident declaration
- **Points:** 5 | **Difficulty:** Low | **evidence_linked:** true (80% answer / 20% evidence selection)
- **Unlock condition:** None (assessment entry).

### CANDIDATE-FACING

**Instructions:** You are the Senior IR Analyst assigned to INC-2026-0417. Review the briefing ticket and the triggering SIEM alert in your workspace, then make your triage call.

**Question (sub-questions):**
- (a) Verdict — single choice:
  - A. True security incident — declare and investigate
  - B. False positive — benign scanner noise
  - C. Legitimate user activity
  - D. Insufficient evidence to decide
- (b) Severity per IR-Policy-01 — single choice: Sev-1 / Sev-2 / Sev-3 / Sev-4
- (c) Alerting host (asset)
- (d) External IP implicated by the alert (IP)
- (e) Select the evidence artifact(s) that support your triage call.

### GRADER-FACING

- **Answer type:** (a) single choice; (b) single choice; (c) asset; (d) IP; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 1.0 pt each (80% answer pool 4.0 / 4 components); evidence selection (e) = 1.0 pt under the tier rule (the 20%).
- **Canonical answer:** (a) A. (b) Sev-1 (confirmed compromise of production server / domain credentials). (c) `APP-PRD-01`. (d) `185.220.101.47`. (e) {E-ALERT-001, E-TICKET-001}.
- **Accepted answers:** (c) `APP-PRD-01`, `10.10.20.21`. (d) `185.220.101.47`, `185.220.101.47:8443`.
- **Required evidence IDs:** E-ALERT-001, E-TICKET-001.
- **Supporting attack event IDs:** EVT-031.
- **Evidence correlation requirement:** SIEM alert detail × ticket; (E-ALERT-002 cluster + E-EDR-008/E-NET-003 available in P1 disprove the false-positive option).
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Read the alert's full process lineage and destination, then check whether the dossier or ticket describes any sanctioned activity that matches it."
- **Common wrong answer:** (a) = B (false positive / scanner noise).
- **Why the wrong answer is wrong:** The alert shows an encoded-PowerShell child of a scheduled task making an external 8443 connection from APP-PRD-01; no scanner job or benign process matches that lineage.
- **Learning outcome(s) assessed (SIM_REQ §5):** 1 (Full-cycle breach analysis), 11 (Multi-source correlation), 15 (Breach scoping).

---

# PHASE P1 — DETECTION VALIDATION & INITIAL SCOPING (30 min)

---

## Q-01-01 — Reading the correlation cluster

- **Question ID:** Q-01-01
- **Phase:** P1 — Detection Validation & Initial Scoping
- **Task title:** Reading the correlation cluster
- **Points:** 6 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P0 gate (Q-00-01 complete).

### CANDIDATE-FACING

**Instructions:** Open the SIEM correlation view that followed the alert. Establish which hosts the incident touches and what the recurring outbound connections mean before you dig deeper.

**Question (sub-questions):**
- (a) Which hosts appear in the correlated cluster? multi-select from: WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01, ERP-APP-01, MAIL-PRD-01, DB-PRD-01, MES-PLC-01.
- (b) The ~30-minute small outbound connections 10.10.20.21 → 185.220.101.47:8443 most likely indicate — single choice:
  - A. Windows update telemetry
  - B. An active C2 beacon from APP-PRD-01
  - C. Vulnerability scanner callbacks
  - D. NTP synchronization
- (c) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) single choice; (c) evidence selection.
- **Points split (equal pooling):** (a) = 2.4, (b) = 2.4 (80% answer pool 4.8 / 2 components); evidence selection (c) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) {WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01}. (b) B. (c) {E-ALERT-002, E-NET-003, E-EDR-008}.
- **Accepted answers:** As canonical (multi-select graded per `max(0, TP−FP)/|set|`).
- **Required evidence IDs:** E-ALERT-002, E-NET-003, E-EDR-008.
- **Supporting attack event IDs:** EVT-032, EVT-018.
- **Evidence correlation requirement:** Cluster view × FW-01 beacon cadence × EDR schtasks artifact — three artifact families must agree before the host set and the beacon verdict are defensible.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Pull the underlying artifacts the cluster references rather than reading the cluster summary alone; compare the cadence and packet size of the 8443 traffic against known benign service patterns in the dossier."
- **Common wrong answer:** Including ERP-APP-01/DB-PRD-01 in (a).
- **Why the wrong answer is wrong:** Neither appears in the cluster; ERP shows only a later single failed probe and DB a later read-only session.
- **Learning outcome(s) assessed:** 1 (Full-cycle breach analysis), 11 (Multi-source correlation), 15 (Breach scoping).

---

## Q-01-02 — Signal vs noise: the vulnerability scanner

- **Question ID:** Q-01-02
- **Phase:** P1 — Detection Validation & Initial Scoping
- **Task title:** Signal vs noise: the vulnerability scanner
- **Points:** 5 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P0 gate (Q-00-01 complete).

### CANDIDATE-FACING

**Instructions:** While reviewing activity around the incident window you find vulnerability-scan-like behavior on 2026-09-04 09:15–11:02 and again 2026-09-08 02:00–03:47. Decide whether it belongs to the attack.

**Question (sub-questions):**
- (a) Classification — single choice:
  - A. Attacker reconnaissance
  - B. Benign sanctioned vulnerability scanning
  - C. Attacker re-entry attempt
- (b) Select ALL facts that rule it out — multi-select:
  - (i) Source is 10.10.40.13, the registered VULN-01 scanner
  - (ii) jobs ran authenticated as svc_monitor with scanner job logs (VS-MAN-2026-0904 on-demand, VS-WK37-2026 scheduled)
  - (iii) operator identity devang.shah recorded
  - (iv) plugin-based host enumeration with no follow-on exploitation
  - (v) the Tuesday 02:00 schedule proves the 09-04 run was routine
  - (vi) no attacker behavior is ever sourced from 10.10.40.13
- (c) Select the evidence artifacts that support your classification.

### GRADER-FACING

- **Answer type:** (a) single choice; (b) multi-select; (c) evidence selection.
- **Points split (equal pooling):** (a) = 2.0, (b) = 2.0 (80% answer pool 4.0 / 2 components); evidence selection (c) = 1.0 under the tier rule (the 20%).
- **Canonical answer:** (a) B. (b) {i, ii, iii, iv, vi}. (c) {E-VULN-001, E-VULN-002 (+ dossier asset inventory)}.
- **Accepted answers:** As canonical. Note: (v) is FALSE — the 09-04 instance is an on-demand run (VS-MAN-2026-0904), NOT the weekly scheduled job (VS-WK37-2026).
- **Required evidence IDs:** E-VULN-001, E-VULN-002 (+ dossier asset inventory).
- **Supporting attack event IDs:** EVT-007, EVT-028 (RH-01).
- **Evidence correlation requirement:** Scanner source IP × asset inventory registration × both job headers (on-demand vs scheduled) × absence of any follow-on exploitation from that source — the benign classification requires the chain, not scan volume alone.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Trace the source IP in the asset inventory and read both job headers fully — note which job is on-demand and which is scheduled."
- **Common wrong answer:** (a) = A (attacker recon); selecting (v) in (b).
- **Why the wrong answer is wrong:** Scan-like volume alone isn't hostile; the authenticated internal scanner with a named operator and no post-scan exploitation excludes it. Selecting (v) is wrong because the 09-04 run was on-demand, not the weekly schedule.
- **Learning outcome(s) assessed:** 2 (Reconnaissance discrimination), 11 (Multi-source correlation).

---

# PHASE P2 — INITIAL ACCESS & COMPROMISE ANALYSIS (45 min)

---

## Q-02-01 — The exposure

- **Question ID:** Q-02-01
- **Phase:** P2 — Initial Access & Compromise Analysis
- **Task title:** The exposure
- **Points:** 6 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P1 gate (Q-01-01, Q-01-02 complete).

### CANDIDATE-FACING

**Instructions:** Working from the perimeter evidence, identify exactly how the server came to be reachable for remote login from the internet and why that condition existed.

**Question (sub-questions):**
- (a) Which weakness made the initial access vector reachable? single choice:
  - A. W-01 — a stale 2025 vendor-era FW-01 rule permitting TCP 3389 from any source to 203.0.113.10, never ticketed or removed
  - B. W-08 — missing MFA on the VPN gateway
  - C. An unpatched IIS remote-code-execution vulnerability
  - D. W-06 — the Plant VLAN → FILE-PRD-01 SMB exception
- (b) Which policy/change-control failure explains its persistence? single choice:
  - A. CH-Policy-03 — firewall rule added without a change ticket (grandfathered vendor session), conflicting with VP-Policy-05 vendor-access rules
  - B. BK-Policy-04 backup retention
  - C. AC-Policy-02 password length
  - D. IR-Policy-01 severity definitions
- (c) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) single choice; (b) single choice; (c) evidence selection.
- **Points split (equal pooling):** (a) = 2.4, (b) = 2.4 (80% answer pool 4.8 / 2 components); evidence selection (c) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) A (W-01). (b) A (CH-Policy-03). (c) {E-NET-001, E-DOC-001 (+ dossier FW-01 rules, CH-Policy-03, VP-Policy-05)}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-NET-001, E-DOC-001 (+ dossier FW-01 rules, CH-Policy-03, VP-Policy-05).
- **Supporting attack event IDs:** EVT-001, EVT-002.
- **Evidence correlation requirement:** FW-01 allow-rule visibility × 2025 vendor email (origin) × policy gap — the rule, its provenance document, and the change-control policy must be correlated.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Look at which FW-01 rule allowed the inbound 3389 connections, then search the document store for how and when that rule was created."
- **Common wrong answer:** (a) = B (VPN/no-MFA).
- **Why the wrong answer is wrong:** The attacker never used the VPN (see Q-02-02(d)); the exposure is the stale RDP rule.
- **Learning outcome(s) assessed:** 3 (Initial access determination), 5 (Attack-path chaining).

---

## Q-02-02 — Initial access determination

- **Question ID:** Q-02-02
- **Phase:** P2 — Initial Access & Compromise Analysis
- **Task title:** Initial access determination
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P1 gate (Q-01-01, Q-01-02 complete).

### CANDIDATE-FACING

**Instructions:** Determine the initial access event end-to-end: who probed, which account was broken, when exactly access was gained, and by which vector. Expect to correlate perimeter, authentication, and endpoint telemetry and to reject ambient noise.

**Question (sub-questions):**
- (a) External source IP of the focused campaign (IP)
- (b) Account compromised for initial access (username)
- (c) Successful logon timestamp (timestamp, IST)
- (d) Initial access vector — single choice:
  - A. RDP brute force of svc_portal over internet-exposed TCP 3389
  - B. VPN login with stolen credentials (no MFA)
  - C. Web-shell upload as the first entry
  - D. Phishing-mail execution
- (e) Evidence-linked selection: select the artifacts that prove (a)–(d).

### GRADER-FACING

- **Answer type:** (a) IP; (b) username; (c) timestamp; (d) single choice; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 2.0 pts each (the 80% answer pool, equally pooled); (e) = 2.0 pts under the evidence tier rule — (e) IS the 20% evidence component; no additional rescale applies.
- **Canonical answer:** (a) `45.155.90.23`. (b) `svc_portal`. (c) `2026-09-03 11:47 IST`. (d) A. (e) {E-AUTH-001, E-NET-005, E-NET-001, E-EDR-001} (E-AUTH-012 strengthens the VPN rule-out).
- **Accepted answers:** (b) `svc_portal`, `VISTARA\svc_portal`, `vistara\svc_portal`. (c) any rendering of 11:47 IST that minute (e.g., `2026-09-03 11:47:03 IST`, `2026-09-03T11:47+05:30`).
- **Required evidence IDs:** E-AUTH-001, E-NET-005, E-NET-001, E-EDR-001.
- **Supporting attack event IDs:** EVT-001, EVT-004, EVT-005, EVT-006.
- **Evidence correlation requirement:** 4625 failure run w/ distinct substatus + 4624 Type 10 success 11:47 + DC-01 4776 NTLM validations (E-AUTH-001) × FW-01 session 11:47–12:20 (E-NET-005) × FW-01 scan/allow from same IP (E-NET-001) × interactive EDR session (E-EDR-001); VPN ruled out by E-AUTH-012 full-window summary; RH-07 ambient 3389 scanners rejected (distributed IPs, zero successes).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Filter authentication events on WEB-PRD-01 by source IP and look for the failure burst followed by a Type 10 success; check the DC-01 4776 records in the same minute." Hint 2 (penalty 2): "To eliminate the VPN hypothesis, read the full-window VPN session summary and compare source IPs."
- **Common wrong answer:** (d) = C (web shell first); (d) = B (VPN).
- **Why the wrong answer is wrong:** C is wrong because the shell upload (09-03 13:02) post-dates the 11:47 RDP success. B is wrong because no attacker IPs or svc_* logins appear in the full VPN window.
- **Learning outcome(s) assessed:** 3 (Initial access determination), 7 (Credential compromise identification), 11 (Multi-source correlation).

---

## Q-02-03 — The web shell

- **Question ID:** Q-02-03
- **Phase:** P2 — Initial Access & Compromise Analysis
- **Task title:** The web shell
- **Points:** 8 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P1 gate (Q-01-01, Q-01-02 complete).

### CANDIDATE-FACING

**Instructions:** The attacker established a web-based way back into WEB-PRD-01. Locate it precisely and separate it from the historical shell fragment left over from the 2025 incident.

**Question (sub-questions):**
- (a) Full path of THIS incident's web shell (path)
- (b) Delivery vector (URI path)
- (c) Shell upload time (timestamp)
- (d) Why is `C:\inetpub\wwwroot\assets\old\upload_bak.aspx` NOT this incident's shell? single choice:
  - A. It is a 2025-11-08 file quarantined per the IR-2025-011 note with no 2026 execution requests
  - B. It is encrypted
  - C. It belongs to the marketing WordPress site
  - D. It has a valid digital signature
- (e) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) path; (b) string (URI path); (c) timestamp; (d) single choice; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 1.6 pts each (80% answer pool 6.4 / 4 components); evidence selection (e) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) `C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx`. (b) `/staging/test/upload.aspx`. (c) `2026-09-03 13:02 IST`. (d) A. (e) {E-WEB-003, E-FS-001 (+ E-WEB-002 discovery of the upload page; RH-05 rule-out E-FS-007, E-DOC-002)}.
- **Accepted answers:** (a) case-insensitive, `/` or `\`. (c) `2026-09-03 13:02 IST` (minute precision) or IIS-native `2026-09-03 07:32 UTC` — IIS artifacts are UTC per the canonical artifact header.
- **Required evidence IDs:** E-WEB-003, E-FS-001 (+ E-WEB-002 discovery of the upload page; RH-05 rule-out E-FS-007, E-DOC-002).
- **Supporting attack event IDs:** EVT-003, EVT-008.
- **Evidence correlation requirement:** IIS POST 200 to upload.aspx then GET img.aspx?cmd=… × matching file-creation event; UTC→IST conversion required by artifact header; RH-05 rejected by 2025 timestamp + quarantine note + no 2026 hits.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "IIS logs are UTC — convert. Follow the 404 burst on /staging/ to the successful POST, then match the created file on disk; compare timestamps and paths against the 2025 quarantine note."
- **Common wrong answer:** Naming upload_bak.aspx; or reporting 07:32 as IST.
- **Why the wrong answer is wrong:** upload_bak.aspx is the 2025 shell per (d); reporting 07:32 as IST is wrong because IIS artifacts are UTC (header instruction), so the IST time is 13:02.
- **Learning outcome(s) assessed:** 4 (Execution and post-compromise analysis), 5 (Attack-path chaining), 8 (Persistence identification), 11 (Multi-source correlation).

---

## Q-02-04 — Web/application weakness chain

- **Question ID:** Q-02-04
- **Phase:** P2 — Initial Access & Compromise Analysis
- **Task title:** Web/application weakness chain
- **Points:** 6 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P1 gate (Q-01-01, Q-01-02 complete).

### CANDIDATE-FACING

**Instructions:** Identify which validated weaknesses chained together to turn moderate web/application exposure into a foothold. Select from the weakness register (W-IDs).

**Question (sub-questions):**
- (a) Select ALL weaknesses in the initial-access/foothold chain — multi-select:
  - W-01 (exposed RDP rule)
  - W-02b (staging site + vendor upload page exposed without auth)
  - W-03 (weak svc_portal password Portal@2024, documented)
  - W-05 (password reuse)
  - W-06 (Plant VLAN SMB exception)
  - W-08 (no MFA)
  - W-09 (NetFlow retention)
- (b) The documented internal source that published the brute-forced password (asset/artifact)
- (c) Select the evidence artifacts that support your chain.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) asset/artifact (string); (c) evidence selection.
- **Points split (equal pooling):** (a) = 2.4, (b) = 2.4 (80% answer pool 4.8 / 2 components); evidence selection (c) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) {W-01, W-02b, W-03}. (b) the service-account wiki page (E-WIKI-001). (c) {E-NET-001, E-WEB-002, E-WEB-003, E-WIKI-001 (+ E-DOC-001)}.
- **Accepted answers:** (b) `E-WIKI-001`, `service-account wiki`, `IT wiki`.
- **Required evidence IDs:** E-NET-001, E-WEB-002, E-WEB-003, E-WIKI-001 (+ E-DOC-001).
- **Supporting attack event IDs:** EVT-001, EVT-003, EVT-005, EVT-008.
- **Evidence correlation requirement:** Each selected weakness must map to a concrete attack step in evidence: reaching the host (FW-01 rule), getting the password (wiki-published weak credential), and regaining access without RDP (exposed upload page → shell).
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Ask which weakness each attack step needed: reaching the host, getting the password, and regaining access without RDP."
- **Common wrong answer:** Including W-08.
- **Why the wrong answer is wrong:** No-MFA is real but irrelevant; the VPN was never used by the attacker (E-AUTH-012).
- **Learning outcome(s) assessed:** 5 (Attack-path chaining), 11 (Multi-source correlation).

---

# PHASE P3 — EXECUTION, CREDENTIALS & PERSISTENCE (60 min)

---

## Q-03-01 — Credential access chain

- **Question ID:** Q-03-01
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** Credential access chain
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Trace how the attacker turned a service-account foothold on WEB-PRD-01 into a privileged domain credential. There were two credential recoveries — establish both and the failed attempt between them.

**Question (sub-questions):**
- (a) Process whose memory was dumped (filename/process)
- (b) Account whose OLD password was recovered (username)
- (c) Result of the 15:12 authentication attempt to APP-PRD-01 with that old password — single choice:
  - A. Success
  - B. Failure — bad password (4625)
  - C. Account locked out
- (d) File that yielded the CURRENT password (path)
- (e) The current password recovered there belongs to (username) and its value (string)
- (f) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) filename; (b) username; (c) single choice; (d) path; (e) username + string; (f) evidence selection.
- **Points split (equal pooling):** (a)–(e) = 1.6 pts each (80% answer pool 8.0 / 5 components); evidence selection (f) = 2.0 under the tier rule (the 20%).
- **Canonical answer:** (a) `w3wp.exe`. (b) `rajesh.kulkarni` (OLD password RajKulk@2023). (c) B. (d) `C:\Users\svc_portal\Documents\passwords.txt`. (e) `rajesh.kulkarni` / `RajKulk@2026`. (f) {E-EDR-004, E-AUTH-002, E-AUTH-003, E-FS-003, E-EDR-005 (+ E-EDR-003 prep, E-WIKI-001 hygiene pattern)}.
- **Accepted answers:** (a) `w3wp.exe`, `w3wp`. (b) `rajesh.kulkarni`, `VISTARA\rajesh.kulkarni`. (d) case-insensitive, slash variants. (e) user aliases per (b); password exact string `RajKulk@2026`.
- **Required evidence IDs:** E-EDR-004, E-AUTH-002, E-AUTH-003, E-FS-003, E-EDR-005 (+ E-EDR-003 prep, E-WIKI-001 hygiene pattern).
- **Supporting attack event IDs:** EVT-011, EVT-012, EVT-013, EVT-014.
- **Evidence correlation requirement:** EDR dump + Credential Manager access × failed NTLM/4625 at 15:12 from 10.10.20.11 × findstr/type commands × passwords.txt content — the failed attempt (old password) and the later successful pivot (current password) together prove which recovery mattered.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Sequence the EDR events on WEB-PRD-01 after the RDP session: recon commands → memory dump → failed 4625 on APP-PRD-01 → file search. The successful pivot one morning later tells you which recovery mattered."
- **Common wrong answer:** (c) = A; omitting the second recovery.
- **Why the wrong answer is wrong:** E-AUTH-002/003 record a bad-password failure; the old password was dead. Omitting the second recovery is wrong because the 09-04 success proves the current credential came from passwords.txt.
- **Learning outcome(s) assessed:** 4 (Execution and post-compromise analysis), 7 (Credential compromise identification), 11 (Multi-source correlation).

---

## Q-03-02 — First lateral movement & privilege discovery

- **Question ID:** Q-03-02
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** First lateral movement & privilege discovery
- **Points:** 8 | **Difficulty:** Medium-High | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Establish the attacker's first successful hop off WEB-PRD-01 and what the subsequent domain enumeration revealed.

**Question (sub-questions):**
- (a) Destination host of the first successful lateral movement (asset)
- (b) Account used (username)
- (c) Method — single choice:
  - A. RDP (logon type 10)
  - B. PsExec service
  - C. WinRM
  - D. SSH
- (d) Timestamp of the successful hop (IST)
- (e) What did the attacker learn from `net group` / nltest / LDAP enumeration? single choice:
  - A. rajesh.kulkarni is a member of Domain Admins (migration leftover, W-04)
  - B. svc_portal is an Enterprise Admin
  - C. admin_legacy is the only Domain Admin
  - D. The domain has a tiered admin model
- (f) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) asset; (b) username; (c) single choice; (d) timestamp; (e) single choice; (f) evidence selection.
- **Points split (equal pooling):** (a)–(e) = 1.28 pts each (80% answer pool 6.4 / 5 components); evidence selection (f) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) `APP-PRD-01`. (b) `rajesh.kulkarni`. (c) A. (d) `2026-09-04 09:58 IST`. (e) A. (f) {E-AUTH-004, E-EDR-006, E-EDR-007, E-AUTH-005 (+ E-FS-003 credential origin; dossier §5.2)}.
- **Accepted answers:** (a) `APP-PRD-01`, `10.10.20.21`. (d) minute precision accepted.
- **Required evidence IDs:** E-AUTH-004, E-EDR-006, E-EDR-007, E-AUTH-005 (+ E-FS-003 credential origin; dossier §5.2).
- **Supporting attack event IDs:** EVT-015, EVT-016.
- **Evidence correlation requirement:** 4624 Type 10 on the destination host × EDR session artifacts on source and destination × the following hour of domain-recon command telemetry — destination authentication and endpoint/session evidence must agree on host, account, method, and time.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Match the 4624 Type 10 on the destination host against EDR session artifacts, then read the next hour of command telemetry for the domain-recon set."
- **Common wrong answer:** (b) = svc_mon.
- **Why the wrong answer is wrong:** svc_mon did not exist until 11:15 that day; the 09:58 hop used rajesh.kulkarni.
- **Learning outcome(s) assessed:** 6 (Identity/AD weakness exploitation), 9 (Discovery and lateral movement investigation), 11 (Multi-source correlation).

---

## Q-03-03 — Identity persistence (rogue account)

- **Question ID:** Q-03-03
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** Identity persistence (rogue account)
- **Points:** 8 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** The attacker created a durable identity for re-entry. Identify it, its privileges, its origin, and when it appeared.

**Question (sub-questions):**
- (a) Rogue account (username)
- (b) Its display name (string)
- (c) Groups it was added to — multi-select:
  - Domain Admins
  - Enterprise Admins
  - Remote Desktop Users (local on APP-PRD-01 & WEB-PRD-01)
  - Backup Operators
  - Server Operators
- (d) Created by (account) and from which host
- (e) Creation timestamp (IST)
- (f) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) username; (b) string; (c) multi-select; (d) username + asset; (e) timestamp; (f) evidence selection.
- **Points split (equal pooling):** (a)–(e) = 1.28 pts each (80% answer pool 6.4 / 5 components); evidence selection (f) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) `svc_mon`. (b) `Monitoring Agent`. (c) {Domain Admins, Remote Desktop Users}. (d) `rajesh.kulkarni` from `APP-PRD-01`. (e) `2026-09-04 11:15 IST`. (f) {E-AD-001, E-AD-002, E-AD-003 (+ E-AUTH-007 later use)}.
- **Accepted answers:** (a) `svc_mon`, `VISTARA\svc_mon`, `vistara\svc_mon`. (d) aliases as above for the account; `APP-PRD-01`, `10.10.20.21` for the host. (e) minute precision.
- **Required evidence IDs:** E-AD-001, E-AD-002, E-AD-003 (+ E-AUTH-007 later use).
- **Supporting attack event IDs:** EVT-017.
- **Evidence correlation requirement:** DC-01 4720/4728/4732 events in the incident window × creator and source workstation fields × current membership in the AD snapshot — creation, group adds, and snapshot state must agree.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "On DC-01, look for 4720/4728/4732 events inside the incident window and check the creator and source workstation fields; confirm current membership in the AD snapshot."
- **Common wrong answer:** Selecting admin_legacy.
- **Why the wrong answer is wrong:** admin_legacy is a pre-existing account (created 2019), never used by the attacker (14-month dormancy in E-AD-003).
- **Learning outcome(s) assessed:** 6 (Identity/AD weakness exploitation), 8 (Persistence identification), 11 (Multi-source correlation).

---

## Q-03-04 — Host persistence & C2 (scheduled task)

- **Question ID:** Q-03-04
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** Host persistence & C2 (scheduled task)
- **Points:** 8 | **Difficulty:** Medium-High | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Characterize the persistence mechanism that survived on APP-PRD-01 and the channel it maintains. The mechanism's name is deliberately uninteresting — read what it DOES.

**Question (sub-questions):**
- (a) Scheduled task name (string)
- (b) Host (asset)
- (c) Runs as (account)
- (d) Interval — single choice: every 30 minutes / hourly / daily / on logon
- (e) Decoded callback URL (string)
- (f) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) string; (b) asset; (c) username/account; (d) single choice; (e) string (URL); (f) evidence selection.
- **Points split (equal pooling):** (a)–(e) = 1.28 pts each (80% answer pool 6.4 / 5 components); evidence selection (f) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) `MicrosoftEdgeUpdateTaskMachineCore`. (b) `APP-PRD-01`. (c) `SYSTEM`. (d) every 30 minutes. (e) `https://185.220.101.47:8443/beacon`. (f) {E-EDR-008, E-FS-004, E-NET-003, E-EDR-008B}.
- **Accepted answers:** (c) `SYSTEM`, `NT AUTHORITY\SYSTEM`. (e) with/without trailing slash.
- **Required evidence IDs:** E-EDR-008, E-FS-004, E-NET-003, E-EDR-008B.
- **Supporting attack event IDs:** EVT-018 (detection link EVT-031).
- **Evidence correlation requirement:** schtasks /create (EDR) × task XML (FS) × 30-min 8443 egress cadence (FW-01) × 4104 script-block decode (independent second source for the URL).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Don't trust the task name — export the task XML, decode the -enc payload (the PowerShell Operational log gives you a second copy), and match the FW egress cadence."
- **Common wrong answer:** Treating the task as legitimate Edge maintenance.
- **Why the wrong answer is wrong:** The action is encoded PowerShell calling an external IP:8443; legitimate Edge tasks don't do that.
- **Learning outcome(s) assessed:** 4 (Execution and post-compromise analysis), 8 (Persistence identification), 11 (Multi-source correlation).

---

## Q-03-05 — Domain dominance (DCSync)

- **Question ID:** Q-03-05
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** Domain dominance (DCSync)
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Determine how the attacker obtained domain-wide credential material, from where, against what, and the full consequence for credential hygiene during eradication.

**Question (sub-questions):**
- (a) ATT&CK technique ID
- (b) Source host (asset)
- (c) Target host (asset)
- (d) Account performing it (username)
- (e) Event window (IST)
- (f) Beyond user hashes, which domain credential was captured given the `/all` replication scope — forcing a DOUBLE reset during eradication (string)
- (g) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) string (ATT&CK technique ID); (b) asset; (c) asset; (d) username; (e) timestamp range; (f) string; (g) evidence selection.
- **Points split (equal pooling):** (a)–(f) = 8.0/6 ≈ 1.33 pts each (80% answer pool 8.0 / 6 components); evidence selection (g) = 2.0 under the tier rule (the 20%).
- **Canonical answer:** (a) `T1003.006` (DCSync). (b) `APP-PRD-01` (`10.10.20.21`). (c) `DC-01` (`10.10.20.31`). (d) `rajesh.kulkarni`. (e) `2026-09-04 13:10–13:14 IST`. (f) `krbtgt`. (g) {E-AUTH-006, E-EDR-009}.
- **Accepted answers:** (e) any range covering 13:10–13:14 that day.
- **Required evidence IDs:** E-AUTH-006, E-EDR-009.
- **Supporting attack event IDs:** EVT-019, EVT-020 (krbtgt inference-by-design from the `/all` scope visible in E-EDR-009).
- **Evidence correlation requirement:** 4662 directory-replication access on DC-01 from a non-DC source × endpoint telemetry in that session showing the command line and its `/all` scope — network-directory audit and host telemetry must agree on source, target, account, and window.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Look for 4662 directory-replication access on DC-01 from a non-DC source, then read the endpoint telemetry in that session — the command line shows the scope."
- **Common wrong answer:** (f) = administrator.
- **Why the wrong answer is wrong:** The `/all` DCSync scope captures every account's hash including krbtgt; missing krbtgt is the classic eradication failure (golden-ticket capability survives).
- **Learning outcome(s) assessed:** 6 (Identity/AD weakness exploitation), 7 (Credential compromise identification), 11 (Multi-source correlation).

---

## Q-03-06 — Persistence inventory (synthesis)

- **Question ID:** Q-03-06
- **Phase:** P3 — Execution, Credentials & Persistence
- **Task title:** Persistence inventory (synthesis)
- **Points:** 6 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P2 gate (Q-02-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Before planning eradication, enumerate EVERY mechanism by which the attacker can regain or retain access. Select all that the evidence supports.

**Question (sub-questions):**
- (a) Select ALL attacker persistence mechanisms — multi-select:
  - (i) Rogue Domain Admin account svc_mon
  - (ii) Scheduled task MicrosoftEdgeUpdateTaskMachineCore on APP-PRD-01
  - (iii) Web shell img.aspx on WEB-PRD-01
  - (iv) Golden ticket actively in use
  - (v) Backdoored admin_legacy account
  - (vi) SSH key implanted on VPN-GW-01
- (b) Which capability does the attacker hold in reserve but has NOT exercised (so it needs eradication-side mitigation, not containment)? single choice:
  - A. Golden-ticket capability via stolen krbtgt hash
  - B. Ransomware payload
  - C. Firmware implant
  - D. BGP hijack
- (c) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) single choice; (c) evidence selection.
- **Points split (equal pooling):** (a) = 2.4, (b) = 2.4 (80% answer pool 4.8 / 2 components); evidence selection (c) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii}. (b) A. (c) {E-AD-001, E-AD-002, E-AD-003, E-EDR-008, E-FS-004, E-NET-003, E-WEB-003, E-FS-001 (+ E-EDR-009 `/all` scope for (b))}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-AD-001, E-AD-002, E-AD-003, E-EDR-008, E-FS-004, E-NET-003, E-WEB-003, E-FS-001 (+ E-EDR-009 `/all` scope for (b)).
- **Supporting attack event IDs:** EVT-008, EVT-017, EVT-018, EVT-020.
- **Evidence correlation requirement:** Count mechanisms by evidence type: one identity artifact family (AD), one host artifact family (task XML + schtasks + egress), one web artifact family (shell file + IIS hits). Capabilities never exercised (krbtgt-held-in-reserve) are eradication-side mitigation, not a live mechanism.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Count mechanisms by evidence type: one identity artifact family, one host artifact family, one web artifact family. Don't count capabilities never exercised as active mechanisms."
- **Common wrong answer:** Including (iv) as active persistence.
- **Why the wrong answer is wrong:** The krbtgt hash was captured (EVT-020) but never used; it mandates the double krbtgt reset during eradication, not a fourth live mechanism.
- **Learning outcome(s) assessed:** 8 (Persistence identification), 11 (Multi-source correlation).

---

# PHASE P4 — DISCOVERY, LATERAL MOVEMENT, COLLECTION & EXFILTRATION (45 min)

---

## Q-04-01 — Rogue account in action

- **Question ID:** Q-04-01
- **Phase:** P4 — Discovery, Lateral Movement, Collection & Exfiltration
- **Task title:** Rogue account in action
- **Points:** 6 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P3 gate (Q-03-01..06 complete).

### CANDIDATE-FACING

**Instructions:** Prove whether the attacker's created identity was actually used, and where.

**Question (sub-questions):**
- (a) Host accessed using svc_mon (asset)
- (b) Source host (asset)
- (c) Session start (timestamp IST)
- (d) Logon type — single choice:
  - A. Type 10 (RemoteInteractive/RDP)
  - B. Type 3 (network only)
  - C. Type 5 (service)
  - D. Type 2 (console)
- (e) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) asset; (b) asset; (c) timestamp; (d) single choice; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 1.2 pts each (80% answer pool 4.8 / 4 components); evidence selection (e) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) `FILE-PRD-01` (`10.10.20.23`). (b) `APP-PRD-01` (`10.10.20.21`). (c) `2026-09-05 10:15 IST`. (d) A. (e) {E-AUTH-007, E-EDR-015 (+ E-AD-001/002 account provenance)}.
- **Accepted answers:** (a) `FILE-PRD-01`, `10.10.20.23`. (b) `APP-PRD-01`, `10.10.20.21`. (c) minute precision.
- **Required evidence IDs:** E-AUTH-007, E-EDR-015 (+ E-AD-001/002 account provenance).
- **Supporting attack event IDs:** EVT-021.
- **Evidence correlation requirement:** FILE-PRD-01 authentication event for the rogue account × EDR session continuity telemetry through the afternoon — destination authentication and endpoint session evidence must agree on host pair, account, type, and window.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Search FILE-PRD-01 authentication events for the rogue account and confirm session continuity in EDR telemetry through the afternoon."
- **Common wrong answer:** (d) = B (network-only logon).
- **Why the wrong answer is wrong:** E-AUTH-007 shows LogonType 10 and E-EDR-015 shows a continuous RDP session 10:15→13:05 spanning collection→exfil.
- **Learning outcome(s) assessed:** 8 (Persistence identification), 9 (Discovery and lateral movement investigation), 11 (Multi-source correlation).

---

## Q-04-02 — Collection & staging

- **Question ID:** Q-04-02
- **Phase:** P4 — Discovery, Lateral Movement, Collection & Exfiltration
- **Task title:** Collection & staging
- **Points:** 8 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P3 gate (Q-03-01..06 complete).

### CANDIDATE-FACING

**Instructions:** Determine exactly what data the attacker gathered on FILE-PRD-01 and where it was staged. Distinguish collected data from data merely queried.

**Question (sub-questions):**
- (a) Select ALL data categories staged for theft — multi-select:
  - (i) Client packaging designs (S:\Clients)
  - (ii) Engineering spec sheets
  - (iii) HR payroll export (payroll_aug2026.xlsx, R:\HR)
  - (iv) Financial summaries (R:\Finance)
  - (v) Full ERPDB database dump
  - (vi) Executive email mailboxes
  - (vii) AD database copy (ntds.dit)
- (b) Local staging directory (path)
- (c) Approximate staged volume — single choice: ~2.1 GB / ~18 MB / ~680 MB / ~50 GB
- (d) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) path; (c) single choice; (d) evidence selection.
- **Points split (equal pooling):** (a)–(c) = 6.4/3 ≈ 2.13 pts each (80% answer pool 6.4 / 3 components); evidence selection (d) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii, iv}. (b) `C:\Windows\Temp\collect\` (trailing slash optional). (c) ~2.1 GB (680 MB is the compressed archive; 18 MB was the earlier source-code staging). (d) {E-FS-005, E-EDR-010, E-SHARE-001 (+ E-EDR-015 session continuity)}.
- **Accepted answers:** (b) `C:\Windows\Temp\collect\` with trailing slash optional; case-insensitive, slash variants.
- **Required evidence IDs:** E-FS-005, E-EDR-010, E-SHARE-001 (+ E-EDR-015 session continuity).
- **Supporting attack event IDs:** EVT-022.
- **Evidence correlation requirement:** dir/robocopy command lines × SMB file-open audit × Temp directory writes; DB questions are answered by a different artifact set (read-only queries ≠ collection).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Correlate the dir/robocopy command lines with SMB file-open audit and the Temp directory writes; the DB questions are answered by a different artifact set (read-only queries ≠ collection)."
- **Common wrong answer:** Including (v)/(vii).
- **Why the wrong answer is wrong:** No bulk DB export or ntds.dit copy exists in evidence; DB activity was 5-row sampling only.
- **Learning outcome(s) assessed:** 10 (Collection and exfiltration analysis), 11 (Multi-source correlation), 15 (Breach scoping).

---

## Q-04-03 — Exfiltration

- **Question ID:** Q-04-03
- **Phase:** P4 — Discovery, Lateral Movement, Collection & Exfiltration
- **Task title:** Exfiltration
- **Points:** 8 | **Difficulty:** Medium-High | **evidence_linked:** true (80/20)
- **Unlock condition:** P3 gate (Q-03-01..06 complete).

### CANDIDATE-FACING

**Instructions:** Establish both exfiltration events, their volumes and destination, and explain an evidence-survivability gap the investigation must account for.

**Question (sub-questions):**
- (a) Exfil archive filename on FILE-PRD-01 (filename)
- (b) Exfil destination (IP:port)
- (c) The two exfiltration events and volumes — matching: match each exfiltration event to its volume (single-choice per event / ordered match):
  - Event 1: `2026-09-03 13:25–13:31` — volume?
  - Event 2: `2026-09-05 12:30–13:05` — volume?
  - (Candidate matches volume→event; total volume also requested.)
- (d) Why is the 09-03 exfil flow absent from NetFlow? single choice:
  - A. NetFlow retention is 7 days (W-09); the flow survives only in FW-01 connection logs + EDR
  - B. The attacker deleted the NetFlow records
  - C. NetFlow was never enabled
  - D. The flow used DNS tunneling invisible to NetFlow
- (e) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) filename; (b) IP:port; (c) matching (volume→event); (d) single choice; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 1.6 pts each (80% answer pool 6.4 / 4 components); evidence selection (e) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) `order_export_2026.zip`. (b) `185.220.101.47:8443`. (c) `2026-09-03 13:25–13:31, ~18 MB (staging.zip, portal source/config, from 10.10.20.11)` and `2026-09-05 12:30–13:05, ~680 MB (order_export_2026.zip, from 10.10.20.23)`; total **~698 MB**. (d) A. (e) {E-NET-002, E-FS-002, E-EDR-002 (exfil #1); E-NET-004, E-EDR-012, E-FS-006 (exfil #2); E-NET-006 (+ E-PROXY-001 negative record) for (d)}.
- **Accepted answers:** As canonical; (c) accepted as single-choice per event or ordered match of volume→event.
- **Required evidence IDs:** E-NET-002, E-FS-002, E-EDR-002 (exfil #1); E-NET-004, E-EDR-012, E-FS-006 (exfil #2); E-NET-006 (+ E-PROXY-001 negative record) for (d).
- **Supporting attack event IDs:** EVT-009, EVT-010, EVT-023, EVT-024.
- **Evidence correlation requirement:** Archive creation times on each host × FW-01 outbound volume windows; NetFlow summary's retention note must be read before assuming a missing flow means no traffic.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Match archive creation times on each host against FW-01 outbound volume windows; read the NetFlow summary's retention note before assuming a missing flow means no traffic."
- **Common wrong answer:** (d) = B (attacker deleted NetFlow records); missing exfil #1.
- **Why the wrong answer is wrong:** No evidence of NetFlow tampering; the collector retains only 7 days and today is 09-09. Missing exfil #1 is wrong: staging.zip's 18 MB upload on 09-03 13:25 is a distinct first exfil of source code/config.
- **Learning outcome(s) assessed:** 10 (Collection and exfiltration analysis), 11 (Multi-source correlation).

---

## Q-04-04 — Scope discrimination: accessed vs compromised vs probed

- **Question ID:** Q-04-04
- **Phase:** P4 — Discovery, Lateral Movement, Collection & Exfiltration
- **Task title:** Scope discrimination: accessed vs compromised vs probed
- **Points:** 6 | **Difficulty:** Medium-High | **evidence_linked:** true (80/20)
- **Unlock condition:** P3 gate (Q-03-01..06 complete).

### CANDIDATE-FACING

**Instructions:** Two systems brushed against the attack without being owned. Classify each correctly — this judgment drives containment scope.

**Question (sub-questions):**
- (a) DB-PRD-01 — single choice:
  - A. Compromised (attacker code execution)
  - B. Accessed but not compromised (read-only enumeration: sys.databases + TOP-5 row samples, no bulk export)
  - C. Probed only
  - D. Unrelated
- (b) ERP-APP-01 — single choice:
  - A. Compromised
  - B. Accessed but not compromised
  - C. Probed only (single failed SMB connect 4625 at 09:33, no successful logon)
  - D. Unrelated
- (c) Which account authenticated to DB-PRD-01 during the enumeration (username)
- (d) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) single choice; (b) single choice; (c) username; (d) evidence selection.
- **Points split (equal pooling):** (a)–(c) = 1.6 pts each (80% answer pool 4.8 / 3 components); evidence selection (d) = 1.2 under the tier rule (the 20%).
- **Canonical answer:** (a) B. (b) C. (c) `rajesh.kulkarni`. (d) {E-DB-001, E-AUTH-008 (DB); E-AUTH-009, E-EDR-013 (ERP)}.
- **Accepted answers:** (c) `rajesh.kulkarni`, `VISTARA\rajesh.kulkarni`.
- **Required evidence IDs:** E-DB-001, E-AUTH-008 (DB); E-AUTH-009, E-EDR-013 (ERP).
- **Supporting attack event IDs:** EVT-025, EVT-026.
- **Evidence correlation requirement:** SQL audit statement types and row counts × ERP security log exact event count (one failed SMB connect with no following success) — classification rests on the type and count of activity, not its mere presence.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Read the SQL audit for statement types and row counts, and the ERP security log for the exact event count — one failed SMB connect with no following success."
- **Common wrong answer:** DB-PRD-01 = compromised.
- **Why the wrong answer is wrong:** Read-only Windows-auth queries from FILE-PRD-01, no persistence, no execution, no bulk export; containment of DB-PRD-01 would be over-scoping.
- **Learning outcome(s) assessed:** 9 (Discovery and lateral movement investigation), 15 (Breach scoping), 11 (Multi-source correlation).

---

# PHASE P5 — FULL SCOPING & ATTACK-PATH RECONSTRUCTION (30 min)

---

## Q-05-01 — Breach scope: host classification table

- **Question ID:** Q-05-01
- **Phase:** P5 — Full Scoping & Attack-Path Reconstruction
- **Task title:** Breach scope: host classification table
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true — **EXEMPT from the 80/20 evidence split** (evidence below is validation/authoring metadata, not scored; see Scoring)
- **Unlock condition:** P4 gate (Q-04-01..04 complete).
- **Critical-failure link: CF-3** — misclassifying any of the four Compromised hosts caps the total score at 49%.

### CANDIDATE-FACING

**Instructions:** Classify each listed system into exactly one column. This is the definitive blast-radius statement for the incident record.

**Question:** 10-host × 4-class classification table. For each host, select exactly one class: `Compromised` / `Accessed but not compromised` / `Probed only` / `Benign–unrelated`.

Hosts: WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01, DB-PRD-01, ERP-APP-01, MAIL-PRD-01, VPN-GW-01, HR-APP-01, MES-PLC-01.

Then select the evidence artifacts that support your classification.

### GRADER-FACING

- **Answer type:** classification table (per-cell all-or-nothing; cell points = task points / 40 cells = 0.25) + evidence selection (captured for feedback/CF-3 validation only — earns no points).
- **Scoring (authoritative):** 40 cells (10 hosts × 4 classes) × 0.25 pts = 10 pts, per-cell all-or-nothing. EXEMPT from the 80/20 evidence-selection split: the required evidence below is validation/authoring metadata (feedback + CF-3 evaluation) and earns no separate points.

**Canonical classification table (10 hosts × 4 classes):**

| Host | Compromised | Accessed but not compromised | Probed only | Benign–unrelated |
|---|---|---|---|---|
| WEB-PRD-01 | ✅ | | | |
| APP-PRD-01 | ✅ | | | |
| FILE-PRD-01 | ✅ | | | |
| DC-01 | ✅ | | | |
| DB-PRD-01 | | ✅ | | |
| ERP-APP-01 | | | ✅ | |
| MAIL-PRD-01 | | | | ✅ |
| VPN-GW-01 | | | | ✅ |
| HR-APP-01 | | | | ✅ |
| MES-PLC-01 | | | | ✅ |

**Canonical class membership with rationale:**
- Compromised: **WEB-PRD-01** (initial foothold + web shell + credential theft + exfil #1), **APP-PRD-01** (persistence + C2 + DCSync origin), **FILE-PRD-01** (collection + exfil #2), **DC-01** (DCSync target — full domain credential disclosure; attacker session present).
- Accessed but not compromised: **DB-PRD-01** (read-only enumeration).
- Probed only: **ERP-APP-01** (single failed SMB 4625; no success).
- Benign–unrelated: **MAIL-PRD-01**, **VPN-GW-01**, **HR-APP-01**, **MES-PLC-01**.

- **Canonical answer:** as the table above.
- **Accepted answers:** Per-cell exact class match; no aliases.
- **Required evidence IDs:** E-AUTH-001/E-NET-005/E-EDR-001 (WEB), E-EDR-008/E-FS-004/E-AUTH-006 (APP+DC), E-AUTH-007/E-EDR-015/E-FS-005 (FILE), E-DB-001/E-AUTH-008 (DB), E-AUTH-009/E-EDR-013 (ERP), E-AUTH-012 + dossier (benign set).
- **Supporting attack event IDs:** EVT-005, EVT-008, EVT-015, EVT-018, EVT-019, EVT-021, EVT-025, EVT-026.
- **Evidence correlation requirement:** For each host demand proof of execution or credential use from the phase findings: successful logon alone = access, not compromise; failed logon = probe; no attacker telemetry at all = benign. Synthesizes the P2–P4 per-host evidence chains.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "For each host demand proof of execution or credential use: a successful logon alone is access, not compromise; a failed logon is a probe; no attacker telemetry at all is benign."
- **Common wrong answer:** Compromised for DB-PRD-01 (over-scope); or missing DC-01's credential disclosure (under-scope — counts toward the missing-major-compromise critical failure).
- **Why the wrong answer is wrong:** DB-PRD-01 shows read-only enumeration with no execution/persistence/bulk export — classifying it Compromised over-scopes containment; omitting DC-01 under-scopes the full domain credential disclosure that DCSync caused.
- **Learning outcome(s) assessed:** 15 (Breach scoping), 11 (Multi-source correlation).

---

## Q-05-02 — Breach scope: identities

- **Question ID:** Q-05-02
- **Phase:** P5 — Full Scoping & Attack-Path Reconstruction
- **Task title:** Breach scope: identities
- **Points:** 8 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P4 gate (Q-04-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Produce the identity blast radius — which accounts are compromised or attacker-controlled, and the domain-wide exposure verdict.

**Question (sub-questions):**
- (a) Select ALL compromised or attacker-controlled accounts — multi-select: svc_portal / rajesh.kulkarni / svc_mon / admin_legacy / pranav.joshi / ananya.iyer / svc_backup / helpdesk.
- (b) Given the DCSync scope, must ALL domain credentials be treated as exposed? yes/no
- (c) admin_legacy's correct disposition — single choice:
  - A. Compromised in this incident
  - B. Weak but unexploited — ~14 months without logon (last_logon ≈2025-07); hygiene finding only
  - C. Attacker-created
- (d) The two VPN users with odd-window activity are — single choice:
  - A. Both compromised
  - B. Both benign (Ahmedabad office IP 122.176.45.9; pranav.joshi orders match dealer POs; ananya.iyer covered by HR travel approval TRV-2026-0312)
  - C. One compromised, one benign
- (e) Select the evidence artifacts that support your answers.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) yes-no; (c) single choice; (d) single choice; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 1.6 pts each (80% answer pool 6.4 / 4 components); evidence selection (e) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) {svc_portal, rajesh.kulkarni, svc_mon}. (b) Yes. (c) B. (d) B. (e) {E-AD-003, E-AUTH-006, E-EDR-009, E-AUTH-012, E-AUTH-010, E-WEB-004, E-DOC-003 (+ E-AUTH-011)}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-AD-003, E-AUTH-006, E-EDR-009, E-AUTH-012, E-AUTH-010, E-WEB-004, E-DOC-003 (+ E-AUTH-011).
- **Supporting attack event IDs:** EVT-005, EVT-014, EVT-017, EVT-019, EVT-027 (RH-02), EVT-029 (RH-03), RH-04.
- **Evidence correlation requirement:** For each account: is there attacker-controlled use in evidence? Cross-check the AD snapshot's last-logon field, the VPN full-window summary, and the HR travel record before including or excluding any identity.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "For each account ask: is there attacker-controlled use in evidence? Then check the AD snapshot's last-logon field and the VPN full-window summary plus the HR travel record."
- **Common wrong answer:** Including admin_legacy (looks juicy, weak password).
- **Why the wrong answer is wrong:** admin_legacy is dormant ~14 months and absent from every attack artifact.
- **Learning outcome(s) assessed:** 7 (Credential compromise identification), 15 (Breach scoping), 2 (Reconnaissance discrimination).

---

## Q-05-03 — Timeline reconstruction

- **Question ID:** Q-05-03
- **Phase:** P5 — Full Scoping & Attack-Path Reconstruction
- **Task title:** Timeline reconstruction
- **Points:** 10 | **Difficulty:** Medium | **evidence_linked:** false
- **Unlock condition:** P4 gate (Q-04-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Drag the 11 shuffled incident milestones into chronological order. (Candidate sees event descriptions with dates hidden; ordering only.)

**Question:** Order the following 11 timeline items chronologically (earliest → latest). Candidate-facing display order (shuffled — dates hidden):

1. svc_mon RDP to FILE-PRD-01; collection begins (TL-09)
2. DCSync against DC-01 dumps all domain credentials (TL-08)
3. Pivot credential recovered from passwords.txt (TL-04)
4. Detection: EDR alert fires, INC-2026-0417 opened (TL-11)
5. Initial access: svc_portal RDP brute force succeeds (TL-02)
6. Scheduled-task C2 beacon planted on APP-PRD-01 (TL-07)
7. External recon: port scan + staging directory enumeration (TL-01)
8. Bulk exfiltration ~680 MB to 185.220.101.47:8443 (TL-10)
9. First lateral movement: WEB-PRD-01 → APP-PRD-01 (TL-05)
10. Web shell deployed via staging upload page (TL-03)
11. Rogue DA account svc_mon created (TL-06)

(Implementation note: fixed shuffled display order = TL-09, TL-08, TL-04, TL-11, TL-02, TL-07, TL-01, TL-10, TL-05, TL-03, TL-06. The TL keys are NOT shown to the candidate.)

### GRADER-FACING

- **Answer type:** ordered sequence (11 items).
- **Points split (equal pooling):** single component — the full 10 pts ride on the Kendall-tau ordering; no evidence-selection component (evidence_linked: false).
- **Canonical answer (canonical key — item order → description → EVT mapping):**
  1. TL-01 External recon: port scan + staging directory enumeration (EVT-001/003, 2026-09-02)
  2. TL-02 Initial access: svc_portal RDP brute force succeeds (EVT-005, 09-03 11:47)
  3. TL-03 Web shell deployed via staging upload page (EVT-008, 09-03 13:02)
  4. TL-04 Pivot credential recovered from passwords.txt (EVT-014, 09-03 16:20)
  5. TL-05 First lateral movement: WEB-PRD-01 → APP-PRD-01 (EVT-015, 09-04 09:58)
  6. TL-06 Rogue DA account svc_mon created (EVT-017, 09-04 11:15)
  7. TL-07 Scheduled-task C2 beacon planted on APP-PRD-01 (EVT-018, 09-04 11:30)
  8. TL-08 DCSync against DC-01 dumps all domain credentials (EVT-019, 09-04 13:10)
  9. TL-09 svc_mon RDP to FILE-PRD-01; collection begins (EVT-021/022, 09-05 10:15)
  10. TL-10 Bulk exfiltration ~680 MB to 185.220.101.47:8443 (EVT-024, 09-05 12:30)
  11. TL-11 Detection: EDR alert fires, INC-2026-0417 opened (EVT-031, 09-09 09:47)
- **Accepted answers:** Kendall-tau concordance partial credit: `earned = 10 × concordant_pairs / total_pairs`, rounded to nearest 0.5.
- **Required evidence IDs (study set):** E-NET-001, E-WEB-002, E-AUTH-001, E-WEB-003, E-FS-003, E-AUTH-004, E-AD-001, E-EDR-008, E-AUTH-006, E-AUTH-007, E-NET-004, E-ALERT-001.
- **Supporting attack event IDs:** as mapped per item above (EVT-001/003, EVT-005, EVT-008, EVT-014, EVT-015, EVT-017, EVT-018, EVT-019, EVT-021/022, EVT-024, EVT-031).
- **Evidence correlation requirement:** Synthesis of the phase findings; each milestone must anchor to its phase evidence (recon/perimeter, auth success, IIS upload, file recovery, lateral 4624, AD 4720, schtasks, 4662, RDP to FILE, FW egress volume, EDR alert).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Anchor the two exfil-relevant dates (09-03 vs 09-05) and the detection date, then place persistence strictly after the first successful pivot."
- **Common wrong answer:** Placing the web shell before initial access.
- **Why the wrong answer is wrong:** The upload (13:02) rode the 11:47 RDP session's access.
- **Learning outcome(s) assessed:** 12 (Timeline reconstruction), 1 (Full-cycle breach analysis).

---

## Q-05-04 — ATT&CK mapping

- **Question ID:** Q-05-04
- **Phase:** P5 — Full Scoping & Attack-Path Reconstruction
- **Task title:** ATT&CK mapping
- **Points:** 15 | **Difficulty:** Medium | **evidence_linked:** false
- **Unlock condition:** P4 gate (Q-04-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Map each observed behavior to exactly one MITRE ATT&CK technique from the controlled list. Every behavior is evidence-backed.

**Controlled list (18 IDs; all package-supported):**
- T1003 (OS Credential Dumping)
- T1003.006 (OS Credential Dumping: DCSync)
- T1005 (Data from Local System)
- T1018 (Remote System Discovery)
- T1021.001 (Remote Services: Remote Desktop Protocol)
- T1039 (Data from Network Shared Drive)
- T1041 (Exfiltration Over C2 Channel)
- T1053.005 (Scheduled Task/Job: Scheduled Task)
- T1069 (Permission Groups Discovery)
- T1070 (Indicator Removal)
- T1071.001 (Application Layer Protocol: Web Protocols)
- T1078 (Valid Accounts)
- T1087 (Account Discovery)
- T1098 (Account Manipulation)
- T1136.001 (Create Account)
- T1552 (Unsecured Credentials)
- T1560.001 (Archive Collected Data: Archive via Utility)
- T1567 (Exfiltration Over Web Service)

**Question (15 behavior rows; candidate maps each to exactly one technique from the controlled list):**
1. Procdump-style memory dump of w3wp.exe on WEB-PRD-01
2. Credentials recovered from C:\Users\svc_portal\Documents\passwords.txt
3. Interactive RDP session WEB-PRD-01 → APP-PRD-01 using a legitimate account
4. Intrusion conducted through legitimate accounts (svc_portal, rajesh.kulkarni, svc_mon)
5. `net group "Domain Admins" /domain`, `net group "Enterprise Admins" /domain`
6. `nltest /dclist:vistara.local`, `net view` from APP-PRD-01
7. Creation of domain account svc_mon
8. Adding svc_mon to Domain Admins / Remote Desktop Users
9. `schtasks /create` of MicrosoftEdgeUpdateTaskMachineCore
10. Encoded-PowerShell beacon every 30 minutes over HTTPS to 185.220.101.47:8443
11. `lsadump::dcsync /domain:vistara.local /all` replication request from APP-PRD-01 to DC-01
12. Bulk reads from S:\ and R:\ shares into C:\Windows\Temp\collect\
13. `Compress-Archive` of the staging tree and the collect directory into zip archives
14. HTTPS POST of archives to the attacker's 185.220.101.47:8443 /upload endpoint
15. `Clear-History`, ConsoleHost_history.txt deletion, recycle-bin emptying on APP-PRD-01

### GRADER-FACING

- **Answer type:** matching (behavior → technique ID), 15 scored mappings; 1 pt per correct mapping.
- **Points split (authoritative):** 15 mappings × 1.0 = 15 pts (equal pooling — the mappings carry the full task score).
- **Evidence note (authoritative):** the evidence IDs quoted beside behavior rows are authoring/validation metadata; evidence selection is NOT a scored action on this task (assessment.json carries `reference_evidence` metadata for Q-05-04 with no scored evidence component).
- **Canonical answer (15 scored mappings — behavior → canonical technique):**
  1. Procdump-style memory dump of w3wp.exe on WEB-PRD-01 → **T1003**
  2. Credentials recovered from C:\Users\svc_portal\Documents\passwords.txt → **T1552**
  3. Interactive RDP session WEB-PRD-01 → APP-PRD-01 using a legitimate account → **T1021.001**
  4. Intrusion conducted through legitimate accounts (svc_portal, rajesh.kulkarni, svc_mon) → **T1078**
  5. `net group "Domain Admins" /domain`, `net group "Enterprise Admins" /domain` → **T1069**
  6. `nltest /dclist:vistara.local`, `net view` from APP-PRD-01 → **T1018**
  7. Creation of domain account svc_mon → **T1136.001** (package labeling per EVIDENCE_CATALOG EVT-017 row)
  8. Adding svc_mon to Domain Admins / Remote Desktop Users → **T1098**
  9. `schtasks /create` of MicrosoftEdgeUpdateTaskMachineCore → **T1053.005**
  10. Encoded-PowerShell beacon every 30 minutes over HTTPS to 185.220.101.47:8443 → **T1071.001**
  11. `lsadump::dcsync /domain:vistara.local /all` replication request from APP-PRD-01 to DC-01 → **T1003.006**
  12. Bulk reads from S:\ and R:\ shares into C:\Windows\Temp\collect\ → **T1039**
  13. `Compress-Archive` of the staging tree and the collect directory into zip archives → **T1560.001**
  14. HTTPS POST of archives to the attacker's 185.220.101.47:8443 /upload endpoint → **T1041**
  15. `Clear-History`, ConsoleHost_history.txt deletion, recycle-bin emptying on APP-PRD-01 → **T1070**
- **Accepted answers:** Exact technique ID per row. Controlled-list notes: T1005, T1087, T1567 are plausible non-target options; the other 15 are each the correct answer to exactly one row.
- **Required evidence IDs:** n/a (evidence_linked: false; each behavior row quotes its evidence artifact in the workspace).
- **Supporting attack event IDs:** EVT-011, EVT-014, EVT-015, EVT-005/015/021, EVT-016, EVT-016, EVT-017, EVT-017, EVT-018, EVT-018, EVT-019, EVT-022, EVT-009/023, EVT-010/024, EVT-030 (rows 1–15 respectively, per package ATT&CK labeling).
- **Evidence correlation requirement:** Match each behavior row to the evidence artifact quoted beside it in the workspace; where two techniques look close, prefer the channel the evidence actually shows.
- **Hint(s) + penalty:** Hint 1 (penalty 3): "Match each behavior row to the evidence artifact quoted beside it; where two techniques look close (e.g., exfil-over-C2 vs exfil-over-web-service), prefer the channel the evidence actually shows — the same 8443 endpoint as the beacon."
- **Common wrong answer:** T1567 for exfil.
- **Why the wrong answer is wrong:** The exfil rode the existing C2 endpoint (185.220.101.47:8443), i.e., exfiltration over the C2 channel (T1041).
- **Learning outcome(s) assessed:** 13 (MITRE ATT&CK mapping).

---

## Q-05-05 — IOC consolidation

- **Question ID:** Q-05-05
- **Phase:** P5 — Full Scoping & Attack-Path Reconstruction
- **Task title:** IOC consolidation
- **Points:** 8 | **Difficulty:** Medium-High | **evidence_linked:** true (80/20)
- **Unlock condition:** P4 gate (Q-04-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Assemble the defensible indicator set for blocking and threat-hunting. Include only indicators tied to THIS attacker; reject benign and historical look-alikes.

**Question (sub-questions):**
- (a) Select ALL valid IOCs — multi-select:
  - (i) 45.155.90.23
  - (ii) 185.220.101.47 (:8443)
  - (iii) https://185.220.101.47:8443/beacon
  - (iv) C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx
  - (v) order_export_2026.zip
  - (vi) C:\ProgramData\Microsoft\Crypto\RSA\staging.zip
  - (vii) svc_mon
  - (viii) MicrosoftEdgeUpdateTaskMachineCore
  - (ix) 10.10.40.13
  - (x) 122.176.45.9
  - (xi) C:\inetpub\wwwroot\assets\old\upload_bak.aspx
  - (xii) pranav.joshi
  - (xiii) admin_legacy
  - (xiv) VS-MAN-2026-0904
- (b) Highest-priority indicator to block at FW-01 immediately (single choice from the candidates above)
- (c) Select the evidence artifacts that support your IOC set.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) single choice (IP); (c) evidence selection.
- **Points split (equal pooling):** (a) = 3.2, (b) = 3.2 (80% answer pool 6.4 / 2 components); evidence selection (c) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii, iv, v, vi, vii, viii}. (b) `185.220.101.47` (active C2 + exfil destination). (c) {E-NET-001, E-AUTH-001, E-NET-003, E-NET-002/004, E-EDR-008, E-WEB-003, E-FS-001/002/006, E-AD-001; rule-outs E-VULN-001/002, E-AUTH-010/011/012, E-FS-007/E-DOC-002}.
- **Accepted answers:** (b) `185.220.101.47`, `185.220.101.47:8443`.
- **Required evidence IDs:** E-NET-001, E-AUTH-001, E-NET-003, E-NET-002/004, E-EDR-008, E-WEB-003, E-FS-001/002/006, E-AD-001; rule-outs E-VULN-001/002, E-AUTH-010/011/012, E-FS-007/E-DOC-002.
- **Supporting attack event IDs:** EVT-001, EVT-005, EVT-008, EVT-010, EVT-018, EVT-024.
- **Evidence correlation requirement:** Each candidate indicator must pass an attacker-attributability test against its evidence; scanner (E-VULN-001/002), office-egress IP (E-AUTH-010/012), and the 2025 shell (E-FS-007/E-DOC-002) all fail that test.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "An IOC must be attacker-attributable: test each candidate against its evidence — scanner, office-egress IP, and the 2025 shell all fail that test."
- **Common wrong answer:** Including 122.176.45.9 or 10.10.40.13.
- **Why the wrong answer is wrong:** Those are the registered Ahmedabad office egress and the internal scanner; blocking them causes business harm.
- **Learning outcome(s) assessed:** 14 (IOC identification), 2 (Reconnaissance discrimination).

---

# PHASE P6 — CONTAINMENT, ERADICATION & RECOVERY (45 min)

---

## Q-06-01 — Containment decision

- **Question ID:** Q-06-01
- **Phase:** P6 — Containment, Eradication & Recovery
- **Task title:** Containment decision
- **Points:** 12 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** P5 gate (Q-05-01..05 complete).
- **Critical-failure link: CF-2** — omitting the 185.220.101.47 block or any of the 3 host isolations caps the total score at 49%.

### CANDIDATE-FACING

**Instructions:** It is 2026-09-09 ~10:00 IST; the attacker's beacon is live. Select the containment set to execute now. Over- and under-containment both cost points; the set must be evidence-driven.

**Question (sub-questions):**
- (a) Hosts to network-isolate — multi-select from: WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01, DB-PRD-01, ERP-APP-01, MAIL-PRD-01, entire Server VLAN.
- (b) Accounts to disable — multi-select: svc_mon, rajesh.kulkarni, svc_portal, admin_legacy, svc_backup, ananya.iyer.
- (c) Network action — single choice:
  - A. Block 185.220.101.47 (all ports) at FW-01
  - B. Block 45.155.90.23 only
  - C. Block both attacker IPs AND take the DMZ offline
  - D. No network action
- (d) Web action — single choice:
  - A. Suspend the /staging/ site on WEB-PRD-01
  - B. Take the entire dealer portal offline
  - C. No web action
  - D. Rebuild WEB-PRD-01 immediately
- (e) Primary rationale for isolating APP-PRD-01 — single choice:
  - A. Host exhibits an active C2 beacon and holds attacker persistence
  - B. It is the oldest server
  - C. Policy requires isolating all servers
  - D. It is nearest to DC-01
- (f) Select the evidence artifacts that justify your containment set.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) multi-select; (c) single choice; (d) single choice; (e) single choice; (f) evidence selection.
- **Points split (equal pooling):** (a)–(e) = 1.92 pts each (80% answer pool 9.6 / 5 components); evidence selection (f) = 2.4 under the tier rule (the 20%).
- **Canonical answer:** (a) {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}. (b) {svc_mon, rajesh.kulkarni, svc_portal}. (c) A. (d) A. (e) A. (f) {E-NET-003, E-ALERT-001, E-EDR-008, E-AUTH-007, E-AD-001/002/003 (+ dossier business context: DC-01 isolation would halt domain auth; ERP/payroll criticality)}.
- **Canonical containment state (must equal v1.1 canon, EVT-033 / E-RESP-001 / E-AD-004):** isolate {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}; disable {svc_mon, rajesh.kulkarni, svc_portal}; block 185.220.101.47 at FW-01; suspend /staging/.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-NET-003, E-ALERT-001, E-EDR-008, E-AUTH-007, E-AD-001/002/003 (+ dossier business context: DC-01 isolation would halt domain auth; ERP/payroll criticality).
- **Supporting attack event IDs:** EVT-033.
- **Evidence correlation requirement:** Contain exactly what is proven compromised or attacker-controlled: live beacon (E-NET-003/E-EDR-008) × alerting host (E-ALERT-001) × rogue-account session (E-AUTH-007) × identity artifacts (E-AD-001/002/003), bounded by dossier business context (domain auth and payroll depend on the rest).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Contain what is proven compromised or attacker-controlled — no more (domain auth and payroll depend on the rest), no less (a beacon is still running)."
- **Common wrong answers:** Isolating DC-01 (overbroad); monitor-only (under-reactive); disabling admin_legacy.
- **Why the wrong answer is wrong:** Isolating DC-01 is destructive (domain-wide authentication outage — overbroad); monitor-only is under-reactive against a live C2; admin_legacy is not compromised.
- **Learning outcome(s) assessed:** 16 (Containment decision-making).

---

## Q-06-02 — Response lifecycle sequencing

- **Question ID:** Q-06-02
- **Phase:** P6 — Containment, Eradication & Recovery
- **Task title:** Response lifecycle sequencing
- **Points:** 5 | **Difficulty:** Medium | **evidence_linked:** false
- **Unlock condition:** Q-06-01 complete.

### CANDIDATE-FACING

**Instructions:** Order the major response actions. One of these orderings destroys evidence and leaves persistence alive — identify the defensible sequence.

**Question:** Order the following 5 response actions (ordered sequence, drag-and-drop):
- Containment (isolate hosts/accounts, block C2)
- Evidence preservation (snapshots, memory, SIEM export, chain of custody)
- Eradication (remove persistence, close weaknesses, reset credentials)
- Recovery (rebuild/restore)
- Safe-state validation

### GRADER-FACING

- **Answer type:** ordered sequence (5 actions; Kendall-tau concordance × 5 pts, rounded to 0.5).
- **Points split (equal pooling):** single component — the full 5 pts ride on the Kendall-tau ordering; no evidence-selection component (evidence_linked: false).
- **Canonical answer:** 1. Containment (isolate hosts/accounts, block C2) → 2. Evidence preservation (snapshots, memory, SIEM export, chain of custody) → 3. Eradication (remove persistence, close weaknesses, reset credentials) → 4. Recovery (rebuild/restore) → 5. Safe-state validation.
- **Accepted answers:** Exact canonical order (Kendall-tau partial credit per formula).
- **Required evidence IDs:** IR-Policy-01 (dossier) + response-record conventions (E-RESP-001 → E-RESP-004 ordering; QA-14 wording: preservation after urgent containment, before eradication).
- **Supporting attack event IDs:** EVT-033, EVT-034, EVT-035, EVT-036, EVT-037.
- **Evidence correlation requirement:** Response-record ordering (E-RESP-001 → E-RESP-004) × IR-Policy-01 lifecycle definition — preservation after urgent containment, before eradication.
- **Hint(s) + penalty:** Hint 1 (penalty 1): "Urgent containment comes first; destructive cleanup must never precede preservation; you cannot validate a state you have not yet restored."
- **Common wrong answer:** Preservation before containment.
- **Why the wrong answer is wrong:** Wrong in spirit — urgent containment stops the bleeding first; preservation immediately follows, before eradication.
- **Learning outcome(s) assessed:** 16 (Containment decision-making), 17 (Eradication planning).

---

## Q-06-03 — Eradication plan

- **Question ID:** Q-06-03
- **Phase:** P6 — Containment, Eradication & Recovery
- **Task title:** Eradication plan
- **Points:** 12 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** Q-06-02 complete.

### CANDIDATE-FACING

**Instructions:** Select every action required to evict the attacker and close what let them in, then order the plan. "Restore from backup" alone is NOT eradication.

**Question (sub-questions):**
- (a) Select ALL required eradication actions — multi-select:
  - (i) Delete scheduled task MicrosoftEdgeUpdateTaskMachineCore on APP-PRD-01
  - (ii) Delete web shell img.aspx on WEB-PRD-01
  - (iii) Delete staged artifacts (staging.zip, passwords.txt on WEB-PRD-01; C:\Windows\Temp\collect remnants and order_export_2026.zip on FILE-PRD-01)
  - (iv) Delete rogue account svc_mon and audit groups it touched
  - (v) Reset credentials: rajesh.kulkarni, svc_portal, ALL Domain Admin accounts, krbtgt TWICE, plus org-wide user password reset
  - (vi) Remove the FW-01 any→3389 rule (close W-01)
  - (vii) Disable/remove /staging/test/upload.aspx and restrict /staging/ (close W-02b)
  - (viii) Restore FILE-PRD-01 from backup and consider the incident closed
  - (ix) Reboot all servers to clear memory
  - (x) Change svc_mon's password and keep the account
- (b) Order the eradication step-groups you selected (ordered sequence).
- (c) Select the evidence artifacts that mandate your plan.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) ordered sequence (Kendall-tau); (c) evidence selection.
- **Points split (equal pooling):** (a) = 4.8, (b) = 4.8 (80% answer pool 9.6 / 2 components); evidence selection (c) = 2.4 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii, iv, v, vi, vii}. (b) (1) remove scheduled task on APP-PRD-01 → (2) delete web shell img.aspx on WEB-PRD-01 → (3) delete staged artifacts (staging.zip + passwords.txt; collect dir + order_export_2026.zip) → (4) delete svc_mon + audit groups → (5) credential resets incl. krbtgt ×2 + org-wide reset → (6) remove FW-01 RDP rule (W-01 fix) → (7) close/restrict staging upload page (W-02b fix). (Per EVT-035 / E-RESP-003.)
- **Accepted answers:** (a) as canonical set; (b) Kendall-tau partial credit per formula.
- **Required evidence IDs:** E-FS-004/E-EDR-008 (task), E-FS-001/E-WEB-003 (shell), E-FS-002/003/006 (artifacts), E-AD-001/002/003 (svc_mon), E-AUTH-006/E-EDR-009 (credential scope incl. krbtgt), E-NET-001/E-DOC-001 (W-01), E-WEB-002 (W-02b).
- **Supporting attack event IDs:** EVT-035 (canon), EVT-008, EVT-017, EVT-018, EVT-019/020.
- **Evidence correlation requirement:** Walk the phase findings: every persistence mechanism (Q-03-06), both entry weaknesses (Q-02-01, Q-02-03), and every credential whose exposure was proved — including what the `/all` DCSync scope implies (krbtgt double reset).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Walk your own findings: every persistence mechanism (Q-03-06), both entry weaknesses (Q-02-01, Q-02-03), and every credential whose exposure you proved — including what the /all DCSync scope implies."
- **Common wrong answer:** Selecting (viii) as sufficient; omitting the second krbtgt reset.
- **Why the wrong answer is wrong:** Backup restoration does not remove the web shell/task/rogue account, does not close W-01/W-02b, and does not invalidate stolen credentials (the designed trap). Omitting the second krbtgt reset leaves golden tickets minted between resets valid.
- **Learning outcome(s) assessed:** 17 (Eradication planning), 8 (Persistence identification), 6 (Identity/AD weakness exploitation).

---

## Q-06-04 — Recovery sequencing & approach

- **Question ID:** Q-06-04
- **Phase:** P6 — Containment, Eradication & Recovery
- **Task title:** Recovery sequencing & approach
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** Q-06-03 complete.

### CANDIDATE-FACING

**Instructions:** Plan the restoration: which systems come back, in what order, by which method, and what follows them.

**Question (sub-questions):**
- (a) Restoration order — ordered sequence of the four systems/actions: DC-01, WEB-PRD-01, APP-PRD-01, FILE-PRD-01.
- (b) Match host → recovery approach (matching):
  - DC-01 → ?
  - WEB-PRD-01 → ?
  - APP-PRD-01 → ?
  - FILE-PRD-01 → ?
  (Approach options: validate-only (no OS rebuild; credential remediation) / clean-template rebuild + portal redeploy + content restore from 09-02 backup after AV scan / rebuild + rejoin + config from version control / in-place OS with data restore from 09-02 backup after malware scan.)
- (c) Backup date selection — single choice:
  - A. 2026-09-02 (pre-incident)
  - B. 2026-09-04 (most recent before detection)
  - C. 2026-09-08 (latest available)
- (d) Post-restore requirement — yes/no: include 72-hour enhanced monitoring?
- (e) Select the evidence artifacts that support your recovery plan.

### GRADER-FACING

- **Answer type:** (a) ordered sequence (Kendall-tau); (b) matching; (c) single choice; (d) yes-no; (e) evidence selection.
- **Points split (equal pooling):** (a)–(d) = 2.0 pts each (80% answer pool 8.0 / 4 components); evidence selection (e) = 2.0 under the tier rule (the 20%).
- **Canonical answer:** (a) 1. Validate DC-01 (no rebuild; verify no persistence, forced krbtgt reset ×2 complete) → 2. Rebuild WEB-PRD-01 from clean template + redeploy portal → 3. Rebuild APP-PRD-01 + domain rejoin (config from version control) → 4. Restore FILE-PRD-01 data from the 2026-09-02 pre-incident backup after malware scan + ACL verification. (Per EVT-036 / E-RESP-004.)
  (b) DC-01 = validate-only (no OS rebuild; credential remediation); WEB-PRD-01 = clean-template rebuild + portal redeploy + content restore from 09-02 backup after AV scan; APP-PRD-01 = rebuild + rejoin + config from version control; FILE-PRD-01 = in-place OS with data restore from 09-02 backup after malware scan.
  (c) A (later backups may contain attacker artifacts; RPO 24h per BK-Policy-04 accepts ~1 day file-version loss). (d) Yes.
- **Accepted answers:** As canonical; (a) Kendall-tau partial credit.
- **Required evidence IDs:** E-RESP-004 canon, E-VALID-001, BK-Policy-04 (dossier), compromise timeline (backups after 09-03 11:47 are untrusted).
- **Supporting attack event IDs:** EVT-036.
- **Evidence correlation requirement:** Recovery canon (E-RESP-004) × validation gate (E-VALID-001) × backup policy RPO (BK-Policy-04) × compromise timeline establishing which backups predate initial access.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Identity infrastructure must be trustworthy before anything rejoins it; known-compromised operating systems are rebuilt, not patched; pick the newest backup that PREDATES initial access."
- **Common wrong answer:** Restoring FILE-PRD-01 from the 09-08 backup; restoring services before DC validation.
- **Why the wrong answer is wrong:** Post-compromise backups risk reintroducing staged artifacts; rebuilt hosts would rejoin an untrusted domain if DC validation were not first.
- **Learning outcome(s) assessed:** 18 (Controlled recovery).

---

# PHASE P7 — SAFE-STATE VALIDATION & FINAL REPORTING (30 min)

---

## Q-07-01 — Validation requirements

- **Question ID:** Q-07-01
- **Phase:** P7 — Safe-State Validation & Final Reporting
- **Task title:** Validation requirements
- **Points:** 8 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** P6 gate (Q-06-01..04 complete).

### CANDIDATE-FACING

**Instructions:** Before anyone declares recovery complete, define the full validation gate. Select every check that must PASS.

**Question (sub-questions):**
- (a) Select ALL required checks — multi-select:
  - (i) EDR full-scan clean on all touched hosts
  - (ii) Persistence re-check (scheduled tasks, services, run keys, web directories) on ALL touched hosts INCLUDING rebuilt ones
  - (iii) Credential resets verified — rajesh.kulkarni, svc_portal, all Domain Admins, krbtgt ×2, org-wide user reset
  - (iv) AD audit confirms svc_mon absent
  - (v) No egress to 185.220.101.47 in 72h enhanced monitoring
  - (vi) FW-01 3389 rule removed AND external rescan shows 3389 closed on 203.0.113.10
  - (vii) /staging/test/upload.aspx returns 404
  - (viii) No anomalous 4624 Type 10 logons or encoded-PowerShell beacons in logs
  - (ix) Business validation — dealer portal order flow, S:/R: shares, payroll app verified
  - (x) Antivirus definitions updated
  - (xi) CEO sign-off by email
- (b) Select the evidence artifacts that define and support this gate.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) evidence selection.
- **Points split (equal pooling):** (a) = 6.4 (80% answer pool 6.4 / 1 component); evidence selection (b) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii, iv, v, vi, vii, viii, ix}. (b) {E-VALID-002 (7-check gate canon: EDR clean; persistence re-check; credential resets incl. krbtgt ×2 + org-wide; network — no 8443 egress + rule absent + 3389 closed + upload page 404; log review; business validation) + E-AD-003 re-check + E-VALID-001}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-VALID-002 + E-AD-003 re-check + E-VALID-001.
- **Supporting attack event IDs:** EVT-037.
- **Evidence correlation requirement:** The gate must verify persistence absence everywhere (including rebuilt hosts), identity state, network exposure, log silence, and business function — validated against the E-VALID-002 canon and the AD re-check.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "A rebuilt host can still carry a re-deployed misconfiguration or a missed artifact — the checklist must verify persistence absence everywhere, identity state, network exposure, log silence, and business function."
- **Common wrong answer:** Treating EDR-clean (i) alone as sufficient.
- **Why the wrong answer is wrong:** That is exactly the trap exercised in Q-07-02 — EDR-clean is necessary, not sufficient.
- **Learning outcome(s) assessed:** 19 (Safe-state validation).

---

## Q-07-02 — The safe-state gate (TRAP)

- **Question ID:** Q-07-02
- **Phase:** P7 — Safe-State Validation & Final Reporting
- **Task title:** The safe-state gate (TRAP)
- **Points:** 10 | **Difficulty:** High | **evidence_linked:** true (80/20)
- **Unlock condition:** Q-07-01 complete.
- **Critical-failure link: CF-1** — stage-1 answered SAFE caps the total score at 49%.

### CANDIDATE-FACING

**Instructions (stage 1):** The interim validation packet shows: EDR full-scan CLEAN on all rebuilt/restored hosts; credential resets verified; network checks pass; **persistence re-check on rebuilt APP-PRD-01 marked SKIPPED ("host was rebuilt, considered clean")**; AD audit not yet re-run. The business is pressing to reopen the portal. Declare the current state:

**Question (sub-questions):**
- (a) Stage-1 declaration — single choice: `SAFE` / `NOT SAFE`
- (b) The blocking deficiency — single choice:
  - A. Persistence re-check skipped on rebuilt APP-PRD-01 and svc_mon absence not yet re-verified in AD
  - B. EDR vendor signatures are one day old
  - C. The portal SSL certificate expires soon
  - D. NetFlow only retains 7 days
- (c) Stage-2 (after the packet shows the 16:55 re-run: scheduled tasks/services/run keys/web dirs CLEAN on APP-PRD-01; AD audit confirms svc_mon ABSENT; all other checks PASS) — declaration: `SAFE` / `NOT SAFE`
- (d) Select the evidence artifacts that support your declarations.

### GRADER-FACING

- **Answer type:** (a) single choice (go/no-go decision); (b) single choice; (c) single choice (go/no-go decision); (d) evidence selection.
- **Points split (equal pooling):** (a)–(c) = 8.0/3 ≈ 2.67 pts each (80% answer pool 8.0 / 3 components); evidence selection (d) = 2.0 under the tier rule (the 20%).
- **Canonical answer:** (a) NOT SAFE. (b) A. (c) SAFE. (d) {E-VALID-001, E-VALID-002 (+ E-AD-003 re-verification, E-RESP-003 completeness)}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** E-VALID-001, E-VALID-002 (+ E-AD-003 re-verification, E-RESP-003 completeness).
- **Supporting attack event IDs:** EVT-037.
- **Evidence correlation requirement:** Check the packet against the candidate's own Q-07-01 checklist line by line; a SKIPPED line is not a PASS — validation report × identity verification × persistence verification × network verification × service verification must all be explicitly complete.
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Check the gate against your own Q-07-01 checklist line by line; a SKIPPED line is not a PASS."
- **Common wrong answer:** Stage-1 SAFE on EDR-clean grounds.
- **Why the wrong answer is wrong:** The designed critical failure — EDR-clean is necessary, not sufficient; persistence and identity checks must be explicitly complete.
- **Learning outcome(s) assessed:** 19 (Safe-state validation).

---

## Q-07-03 — Residual risk & recommendations

- **Question ID:** Q-07-03
- **Phase:** P7 — Safe-State Validation & Final Reporting
- **Task title:** Residual risk & recommendations
- **Points:** 8 | **Difficulty:** Medium | **evidence_linked:** true (80/20)
- **Unlock condition:** Q-07-02 complete.

### CANDIDATE-FACING

**Instructions:** Close out honestly: acknowledge what recovery did NOT fix, and select the remediation set that maps to the weaknesses this incident actually exercised or exposed.

**Question (sub-questions):**
- (a) Select ALL residual risks — multi-select:
  - (i) Stolen data (~698 MB incl. payroll PII and client designs) is unrecoverable — exposure must be managed
  - (ii) W-05 — password-reuse/plaintext-credential hygiene
  - (iii) W-06 — Plant VLAN → FILE-PRD-01 SMB exception still open
  - (iv) W-08 — no MFA on remote access
  - (v) W-09 — NetFlow 7-day retention limits investigations
  - (vi) The attacker still has an active beacon
  - (vii) ERPDB was fully exfiltrated
- (b) Select ALL correct recommendations — multi-select:
  - (i) Enforce CH-Policy-03 change control for firewall rules + audit for stale rules
  - (ii) Service-account credential vaulting + rotation (close W-03/W-03c; register per AC-Policy-02)
  - (iii) MFA on VPN/remote access (W-08)
  - (iv) Privileged-access tiering; remove standing Domain Admin membership (W-04); deploy LAPS (W-05b)
  - (v) Extend NetFlow/log retention (W-09)
  - (vi) Review/remove the W-06 segmentation exception
  - (vii) Permanently remove internet exposure of staging resources (W-02b) and audit for upload pages
  - (viii) Replace the EDR vendor
  - (ix) Discipline the vulnerability-scanner operator
- (c) Select the evidence artifacts that support your residual-risk set.

### GRADER-FACING

- **Answer type:** (a) multi-select; (b) multi-select; (c) evidence selection.
- **Points split (equal pooling):** (a) = 3.2, (b) = 3.2 (80% answer pool 6.4 / 2 components); evidence selection (c) = 1.6 under the tier rule (the 20%).
- **Canonical answer:** (a) {i, ii, iii, iv, v} (fixed set per release hand-off). (b) {i, ii, iii, iv, v, vi, vii}. (c) {exfil findings (E-NET-002/004), E-FS-003, dossier weaknesses W-05/W-06/W-08/W-09 (+W-04, W-05b), E-NET-006}.
- **Accepted answers:** As canonical.
- **Required evidence IDs:** exfil findings (E-NET-002/004), E-FS-003, dossier weaknesses W-05/W-06/W-08/W-09 (+W-04, W-05b), E-NET-006.
- **Supporting attack event IDs:** EVT-038 (canon), plus the W-exposure events.
- **Evidence correlation requirement:** Map each residual risk and recommendation to a weakness ID actually met in evidence; exclude anything already verified closed by eradication (beacon, upload page) and anything the evidence contradicts (ERPDB bulk exfil).
- **Hint(s) + penalty:** Hint 1 (penalty 2): "Map each recommendation to a weakness ID you actually met in evidence; exclude anything already verified closed by eradication."
- **Common wrong answer:** (a) including vi/vii.
- **Why the wrong answer is wrong:** The beacon was contained and eradicated (E-RESP-003, E-VALID-002), and ERPDB was never bulk-exfiltrated (E-DB-001).
- **Learning outcome(s) assessed:** 19 (Safe-state validation), 20 (Defensible reporting).

---

## Q-07-04 — Final incident report (structured)

- **Question ID:** Q-07-04
- **Phase:** P7 — Safe-State Validation & Final Reporting
- **Task title:** Final incident report (structured)
- **Points:** 15 | **Difficulty:** Medium | **evidence_linked:** false
- **Unlock condition:** Q-07-03 complete.

### CANDIDATE-FACING

**Instructions:** Complete the structured incident report. Deterministic fields are cross-checked against your phase answers (inconsistency costs points); the executive summary is the one rubric-scored narrative.

**Question (deterministic fields 1–10, then executive summary):**
1. Incident classification (severity per IR-Policy-01)
2. Detection source / ticket
3. Initial access vector (single choice from vector list)
4. First compromised asset
5. Compromised/attacker-controlled accounts (multi-select)
6. Compromised hosts (multi-select)
7. Dwell time (initial access → detection)
8. Total exfiltrated volume
9. Root cause (weaknesses, multi-select)
10. Privilege-escalation enabler (weakness)
11. Executive summary: 3–5 sentences for a non-technical executive.

### GRADER-FACING

- **Answer type:** fields 1–10 deterministic (single choice / multi-select / string / asset per field); field 11 rubric-scored narrative (the ONLY non-deterministic item).
- **Points split (equal pooling):** 10 deterministic fields × 1.0 = 10 pts + 5-pt rubric-scored executive summary; no evidence-selection component (evidence_linked: false).
- **Canonical answer (10 deterministic fields, 1 pt each, 10 pts):**
  1. Incident classification: **Sev-1** (IR-Policy-01).
  2. Detection source / ticket: **EDR-20260909-0417 / INC-2026-0417** (either or both accepted).
  3. Initial access vector: **RDP brute force of svc_portal over internet-exposed TCP 3389** (single choice from vector list).
  4. First compromised asset: **WEB-PRD-01**.
  5. Compromised/attacker-controlled accounts: **{svc_portal, rajesh.kulkarni, svc_mon}** (multi-select).
  6. Compromised hosts: **{WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01}** (multi-select; DC-01 = credential disclosure).
  7. Dwell time (initial access 09-03 11:47 → detection 09-09 09:47): **6 days** (accept `6 days`, `~6 days`, `5.9 days`, or any hour value in the inclusive range 140–144 hours = 142h ±2h, e.g. `142 hours`, `140h`, `144 hours`).
  8. Total exfiltrated volume: **~698 MB** (accept `698 MB`, `~700 MB`, `18 MB + 680 MB`).
  9. Root cause (weaknesses): **W-01 + W-03** (multi-select; W-02b accepted as third; W-04 = escalation, asked separately).
  10. Privilege-escalation enabler: **W-04** (rajesh.kulkarni's stale Domain Admin membership).
- **Executive summary rubric (5 pts, 1 pt each):**
  1. States what happened (web-facing server breached via exposed remote access + weak service password).
  2. States business impact (≈698 MB stolen incl. client designs + payroll data; ~6-day presence).
  3. States actions taken (contained, eradicated, rebuilt/restored, validated safe).
  4. States current status (services restored, safe state verified 09-09 17:30 IST).
  5. States residual risk/next steps (data exposure management, credential-hygiene/MFA/retention program).
- **Consistency rule:** fields 1–10 auto-compared with Q-00-01, Q-02-01/02/03, Q-03-*, Q-05-01/02, Q-07-02 answers; each contradiction voids that report field's point.
- **Accepted answers:** Per field above.
- **Required evidence IDs:** synthesis of all phases.
- **Supporting attack event IDs:** EVT-031..038.
- **Evidence correlation requirement:** Full-investigation synthesis; the report's source of truth is the candidate's own phase answers — nothing may appear that was not proved in evidence.
- **Hint(s) + penalty:** Hint 1 (penalty 3 — applies to deterministic fields only): "Your phase answers are the report's source of truth — do not introduce anything you did not prove."
- **Common wrong answer:** Report fields that contradict the candidate's own phase answers (e.g., omitting DC-01 from compromised hosts after classifying it Compromised in Q-05-01), or introducing unproven claims in the summary.
- **Why the wrong answer is wrong:** Each contradiction with the phase record voids that field's point under the consistency rule; the report must be a faithful synthesis of evidence-backed findings only.
- **Learning outcome(s) assessed:** 20 (Defensible reporting), 1 (Full-cycle breach analysis).

---

# POINTS SUBTOTALS & GRAND TOTAL

| Phase | Tasks | Points |
|---|---|---|
| P0 — Briefing & Triage | Q-00-01 | 5 |
| P1 — Detection Validation & Initial Scoping | Q-01-01 (6), Q-01-02 (5) | 11 |
| P2 — Initial Access & Compromise Analysis | Q-02-01 (6), Q-02-02 (10), Q-02-03 (8), Q-02-04 (6) | 30 |
| P3 — Execution, Credentials & Persistence | Q-03-01 (10), Q-03-02 (8), Q-03-03 (8), Q-03-04 (8), Q-03-05 (10), Q-03-06 (6) | 50 |
| P4 — Discovery, Lateral Movement, Collection & Exfiltration | Q-04-01 (6), Q-04-02 (8), Q-04-03 (8), Q-04-04 (6) | 28 |
| P5 — Full Scoping & Attack-Path Reconstruction | Q-05-01 (10), Q-05-02 (8), Q-05-03 (10), Q-05-04 (15), Q-05-05 (8) | 51 |
| P6 — Containment, Eradication & Recovery | Q-06-01 (12), Q-06-02 (5), Q-06-03 (12), Q-06-04 (10) | 39 |
| P7 — Safe-State Validation & Final Reporting | Q-07-01 (8), Q-07-02 (10), Q-07-03 (8), Q-07-04 (15) | 41 |
| **GRAND TOTAL** | **30 tasks** | **255** |

*End of QUESTION_BANK.md v1.0. All 30 task entries, canonical answers, accepted answers, evidence IDs, attack event IDs, hints, unlock conditions, common wrong answers, and learning outcomes are aligned to ASSESSMENT_DESIGN_KERNEL.md (v1.1 package basis).*
