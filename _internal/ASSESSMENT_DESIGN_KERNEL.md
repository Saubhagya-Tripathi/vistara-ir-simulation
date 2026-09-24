# ASSESSMENT_DESIGN_KERNEL.md — INTERNAL AUTHORING DOCUMENT (never candidate-visible)

**Purpose:** Single source of truth for the Agent 4 assessment deliverables. Every deliverable (QUESTION_BANK.md, assessment.json, ASSESSMENT_BLUEPRINT.md, PROGRESSION_LOGIC.md, SCORING_MODEL.md, HINTS_GUIDE.md, ASSESSMENT_READINESS.md) must match this kernel exactly.
**Authoritative basis:** v1.1 package only. No invented facts, events, hosts, accounts, evidence, timestamps, IOCs, or techniques. RH-06 retired (never reused). Event ID 4628 retired (never used). IIS logs UTC with canonical header; all other timestamps IST (UTC+05:30).

---

## 0. GLOBAL CONVENTIONS

- **Assessment ID:** VISTARA-IR-ASSESSMENT-v1.0 (built on simulation package v1.1).
- **Incident:** INC-2026-0417, Vistara Polymers Pvt. Ltd. Detection 2026-09-09 09:47 IST.
- **Timezone rule (candidate-facing):** All evidence IST except IIS artifacts (UTC + canonical header `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`). Timestamp answers accepted in IST at minute precision (HH:MM) and, for IIS-derived items, the equivalent UTC value.
- **Task ID scheme:** `Q-P#-##` (P0–P7). Sub-answers: `Q-P#-##(a)`, `(b)`, ...
- **Difficulty scale:** Low / Medium / Medium-High / High.
- **Every key investigative task is evidence-linked:** candidate selects supporting evidence IDs; 20% of task points ride on evidence selection, 80% on the answer (see §SCORING). Tasks flagged `evidence_linked: true` below.
- **Grading formulas (deterministic):**
  - Single answer / single choice / yes-no: all-or-nothing for that sub-answer.
  - Multi-select: `earned = points_component × max(0, TP − FP) / |correct set|`, rounded to nearest 0.5.
  - Classification table: per-cell all-or-nothing; cell points = task points / number of cells. (Q-05-01: 40 cells × 0.25 = 10 pts.)
  - Ordered sequence: Kendall-tau concordance `earned = points × concordant_pairs / total_pairs`, rounded to nearest 0.5.
  - Evidence selection component: full 20% iff selected set ⊇ required set AND contains no incorrect IDs; half (10%) iff ⊇ required with ≤2 incorrect; else 0.
  - **Sub-answer weighting (authoritative, v1.0.1):** all scored sub-answers/components within a task are EQUALLY weighted — points per component = component pool / N. No task uses custom per-component weights; any per-component values in any artifact MUST equal this equal-pooling split.
  - **Evidence-selection scoring scope (authoritative, v1.0.1):** the 80/20 evidence rule applies to every `evidence_linked: true` task EXCEPT **Q-05-01** (25 tasks carry scored evidence selection). Q-05-01 is exempt: its full 10 pts ride on the 40-cell table (0.25/cell); its evidence requirement is validation/authoring metadata (used for feedback + CF-3 evaluation), earning no separate points. **Q-05-04** (`evidence_linked: false`) likewise treats evidence references as authoring/validation metadata, never scored. For the 25 scored tasks, evidence selection is a candidate-facing scored action worth exactly 20% of task points under the tier rule above; the answer components share the remaining 80% equally. Q-02-02 surfaces the evidence component as explicit sub-question (e): (a)–(d) = 2.0 pts each, (e) = 2.0 pts under the tier rule — (e) IS the evidence 20%; no additional rescale applies.
- **Hints:** max 2 per task. Hint penalty = `hint_penalty` points deducted from that task's earned score (floor 0). Hints never name the answer.

---

## 1. PHASE MODEL (8 phases; total 300 min; per SIM_REQ §9–10)

| Phase | Name | Budget | Investigation / Evidence-review / Task-decision split | Gate to next phase |
|---|---|---|---|---|
| P0 | Briefing & Triage | 15 min | 6 / 5 / 4 | Q-00-01 complete (verdict + severity + anchors) |
| P1 | Detection Validation & Initial Scoping | 30 min | 12 / 10 / 8 | Q-01-01, Q-01-02 complete |
| P2 | Initial Access & Compromise Analysis | 45 min | 18 / 17 / 10 | Q-02-01..04 complete |
| P3 | Execution, Credentials & Persistence | 60 min | 24 / 22 / 14 | Q-03-01..06 complete |
| P4 | Discovery, Lateral Movement, Collection & Exfiltration | 45 min | 18 / 16 / 11 | Q-04-01..04 complete |
| P5 | Full Scoping & Attack-Path Reconstruction | 30 min | 10 / 8 / 12 | Q-05-01..05 complete |
| P6 | Containment, Eradication & Recovery | 45 min | 12 / 10 / 23 | Q-06-01..04 complete |
| P7 | Safe-State Validation & Final Reporting | 30 min | 6 / 8 / 16 | Q-07-01..04 complete → submit |

**Pacing nudge:** soft nudge when a phase exceeds guidance by >20% (no penalty). Visible clock; no hard fail for slow investigation.
**Evidence reveal schedule (from catalog):** reveal phase 0 = E-ALERT-001, E-TICKET-001; phase 1 = all investigation evidence (E-ALERT-002, E-WEB-*, E-AUTH-*, E-EDR-*, E-FS-*, E-NET-*, E-PROXY-001, E-AD-001/002/003, E-DB-001, E-VULN-001/002, E-SHARE-001, E-WIKI-001, E-DOC-001/002/003); phase 6 = E-RESP-001..004, E-VALID-001, E-AD-004 (revealed as the candidate's decisions are executed); phase 7 = E-VALID-002, E-REPORT-001.

---

## 2. TASK DEFINITIONS (30 scored tasks; 255 raw points)

### PHASE 0 — BRIEFING & TRIAGE (15 min)

---
**Q-00-01 — Triage & incident declaration** (5 pts, Low, evidence_linked: true)
- **Instructions:** You are the Senior IR Analyst assigned to INC-2026-0417. Review the briefing ticket and the triggering SIEM alert in your workspace, then make your triage call.
- **Sub-questions:**
  - (a) Verdict — single choice: `A` True security incident — declare and investigate / `B` False positive — benign scanner noise / `C` Legitimate user activity / `D` Insufficient evidence to decide. **Canonical: A.**
  - (b) Severity per IR-Policy-01 — single choice: Sev-1 / Sev-2 / Sev-3 / Sev-4. **Canonical: Sev-1** (confirmed compromise of production server / domain credentials).
  - (c) Alerting host (asset): **canonical `APP-PRD-01`**; accepted: `APP-PRD-01`, `10.10.20.21`.
  - (d) External IP implicated by the alert (IP): **canonical `185.220.101.47`**; accepted: `185.220.101.47`, `185.220.101.47:8443`.
- **Required evidence:** E-ALERT-001, E-TICKET-001. **Attack events:** EVT-031.
- **Correlation:** SIEM alert detail × ticket; (E-ALERT-002 cluster + E-EDR-008/E-NET-003 available in P1 disprove the false-positive option).
- **Unlock:** none (assessment entry). **Hint:** "Read the alert's full process lineage and destination, then check whether the dossier or ticket describes any sanctioned activity that matches it." penalty 1.
- **Common wrong answer:** B (false positive / scanner noise) — wrong because the alert shows an encoded-PowerShell child of a scheduled task making an external 8443 connection from APP-PRD-01; no scanner job or benign process matches that lineage.
- **Learning outcomes:** 1 (full-cycle analysis), 11 (correlation), 15 (initial scoping).

### PHASE 1 — DETECTION VALIDATION & INITIAL SCOPING (30 min)

---
**Q-01-01 — Reading the correlation cluster** (6 pts, Medium, evidence_linked: true)
- **Instructions:** Open the SIEM correlation view that followed the alert. Establish which hosts the incident touches and what the recurring outbound connections mean before you dig deeper.
- **Sub-questions:**
  - (a) Which hosts appear in the correlated cluster? multi-select from: WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01, ERP-APP-01, MAIL-PRD-01, DB-PRD-01, MES-PLC-01. **Canonical set: {WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01}.**
  - (b) The ~30-minute small outbound connections 10.10.20.21 → 185.220.101.47:8443 most likely indicate — single choice: `A` Windows update telemetry / `B` An active C2 beacon from APP-PRD-01 / `C` Vulnerability scanner callbacks / `D` NTP synchronization. **Canonical: B.**
- **Required evidence:** E-ALERT-002, E-NET-003, E-EDR-008. **Attack events:** EVT-032, EVT-018.
- **Correlation:** cluster view × FW-01 beacon cadence × EDR schtasks artifact.
- **Unlock:** P0 gate. **Hint:** "Pull the underlying artifacts the cluster references rather than reading the cluster summary alone; compare the cadence and packet size of the 8443 traffic against known benign service patterns in the dossier." penalty 1.
- **Common wrong answer:** including ERP-APP-01/DB-PRD-01 in (a) — wrong: neither appears in the cluster; ERP shows only a later single failed probe and DB a later read-only session.
- **Learning outcomes:** 1, 11, 15.

---
**Q-01-02 — Signal vs noise: the vulnerability scanner** (5 pts, Medium, evidence_linked: true)
- **Instructions:** While reviewing activity around the incident window you find vulnerability-scan-like behavior on 2026-09-04 09:15–11:02 and again 2026-09-08 02:00–03:47. Decide whether it belongs to the attack.
- **Sub-questions:**
  - (a) Classification — single choice: `A` Attacker reconnaissance / `B` Benign sanctioned vulnerability scanning / `C` Attacker re-entry attempt. **Canonical: B.**
  - (b) Select ALL facts that rule it out — multi-select: (i) Source is 10.10.40.13, the registered VULN-01 scanner; (ii) jobs ran authenticated as svc_monitor with scanner job logs (VS-MAN-2026-0904 on-demand, VS-WK37-2026 scheduled); (iii) operator identity devang.shah recorded; (iv) plugin-based host enumeration with no follow-on exploitation; (v) the Tuesday 02:00 schedule proves the 09-04 run was routine; (vi) no attacker behavior is ever sourced from 10.10.40.13. **Canonical: {i, ii, iii, iv, vi}.** ((v) is false — the 09-04 instance is an on-demand run, NOT the weekly job.)
- **Required evidence:** E-VULN-001, E-VULN-002 (+ dossier asset inventory). **Attack events:** EVT-007, EVT-028 (RH-01).
- **Unlock:** P0 gate. **Hint:** "Trace the source IP in the asset inventory and read both job headers fully — note which job is on-demand and which is scheduled." penalty 1.
- **Common wrong answer:** A (attacker recon) — wrong because scan-like volume alone isn't hostile; the authenticated internal scanner with a named operator and no post-scan exploitation excludes it. Selecting (v) in (b) is wrong because the 09-04 run was on-demand, not the weekly schedule.
- **Learning outcomes:** 2 (recon discrimination), 11.

### PHASE 2 — INITIAL ACCESS & COMPROMISE ANALYSIS (45 min)

---
**Q-02-01 — The exposure** (6 pts, Medium, evidence_linked: true)
- **Instructions:** Working from the perimeter evidence, identify exactly how the server came to be reachable for remote login from the internet and why that condition existed.
- **Sub-questions:**
  - (a) Which weakness made the initial access vector reachable? single choice: `A` W-01 — a stale 2025 vendor-era FW-01 rule permitting TCP 3389 from any source to 203.0.113.10, never ticketed or removed / `B` W-08 — missing MFA on the VPN gateway / `C` An unpatched IIS remote-code-execution vulnerability / `D` W-06 — the Plant VLAN → FILE-PRD-01 SMB exception. **Canonical: A (W-01).**
  - (b) Which policy/change-control failure explains its persistence? single choice: `A` CH-Policy-03 — firewall rule added without a change ticket (grandfathered vendor session), conflicting with VP-Policy-05 vendor-access rules / `B` BK-Policy-04 backup retention / `C` AC-Policy-02 password length / `D` IR-Policy-01 severity definitions. **Canonical: A.**
- **Required evidence:** E-NET-001, E-DOC-001 (+ dossier FW-01 rules, CH-Policy-03, VP-Policy-05). **Attack events:** EVT-001, EVT-002.
- **Correlation:** FW-01 allow-rule visibility × 2025 vendor email (origin) × policy gap.
- **Unlock:** P1 gate. **Hint:** "Look at which FW-01 rule allowed the inbound 3389 connections, then search the document store for how and when that rule was created." penalty 1.
- **Common wrong answer:** B (VPN/no-MFA) — wrong: the attacker never used the VPN (see Q-02-02(d)); the exposure is the stale RDP rule.
- **Learning outcomes:** 3, 5.

---
**Q-02-02 — Initial access determination** (10 pts, High, evidence_linked: true)
- **Instructions:** Determine the initial access event end-to-end: who probed, which account was broken, when exactly access was gained, and by which vector. Expect to correlate perimeter, authentication, and endpoint telemetry and to reject ambient noise.
- **Sub-questions:**
  - (a) External source IP of the focused campaign (IP): **canonical `45.155.90.23`**.
  - (b) Account compromised for initial access (username): **canonical `svc_portal`**; accepted: `svc_portal`, `VISTARA\svc_portal`, `vistara\svc_portal`.
  - (c) Successful logon timestamp (timestamp, IST): **canonical `2026-09-03 11:47 IST`**; accepted: any rendering of 11:47 IST that minute (e.g., `2026-09-03 11:47:03 IST`, `2026-09-03T11:47+05:30`).
  - (d) Initial access vector — single choice: `A` RDP brute force of svc_portal over internet-exposed TCP 3389 / `B` VPN login with stolen credentials (no MFA) / `C` Web-shell upload as the first entry / `D` Phishing-mail execution. **Canonical: A.**
  - (e) Evidence-linked selection: select the artifacts that prove (a)–(d). **Required set: {E-AUTH-001, E-NET-005, E-NET-001, E-EDR-001}** (E-AUTH-012 strengthens the VPN rule-out).
- **Points split (authoritative):** (a)–(d) = 2.0 pts each (the 80% answer pool, equally pooled); (e) = 2.0 pts under the evidence tier rule (this IS the 20% evidence component — no further rescale).
- **Attack events:** EVT-001, EVT-004, EVT-005, EVT-006.
- **Correlation:** 4625 failure run w/ distinct substatus + 4624 Type 10 success 11:47 + DC-01 4776 NTLM validations (E-AUTH-001) × FW-01 session 11:47–12:20 (E-NET-005) × FW-01 scan/allow from same IP (E-NET-001) × interactive EDR session (E-EDR-001); VPN ruled out by E-AUTH-012 full-window summary; RH-07 ambient 3389 scanners rejected (distributed IPs, zero successes).
- **Unlock:** P1 gate. **Hint 1:** "Filter authentication events on WEB-PRD-01 by source IP and look for the failure burst followed by a Type 10 success; check the DC-01 4776 records in the same minute." penalty 2. **Hint 2:** "To eliminate the VPN hypothesis, read the full-window VPN session summary and compare source IPs." penalty 2.
- **Common wrong answers:** C (web shell first) — wrong: the shell upload (09-03 13:02) post-dates the 11:47 RDP success; B (VPN) — wrong: no attacker IPs or svc_* logins appear in the full VPN window.
- **Learning outcomes:** 3, 7, 11.

---
**Q-02-03 — The web shell** (8 pts, High, evidence_linked: true)
- **Instructions:** The attacker established a web-based way back into WEB-PRD-01. Locate it precisely and separate it from the historical shell fragment left over from the 2025 incident.
- **Sub-questions:**
  - (a) Full path of THIS incident's web shell (path): **canonical `C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx`**; accepted: case-insensitive, `/` or `\`.
  - (b) Delivery vector (URI path): **canonical `/staging/test/upload.aspx`**.
  - (c) Shell upload time (timestamp): **canonical `2026-09-03 13:02 IST`**; accepted: `2026-09-03 13:02 IST` (minute precision) or IIS-native `2026-09-03 07:32 UTC`.
  - (d) Why is `C:\inetpub\wwwroot\assets\old\upload_bak.aspx` NOT this incident's shell? single choice: `A` It is a 2025-11-08 file quarantined per the IR-2025-011 note with no 2026 execution requests / `B` It is encrypted / `C` It belongs to the marketing WordPress site / `D` It has a valid digital signature. **Canonical: A.**
- **Required evidence:** E-WEB-003, E-FS-001 (+ E-WEB-002 discovery of the upload page; RH-05 rule-out E-FS-007, E-DOC-002). **Attack events:** EVT-003, EVT-008.
- **Correlation:** IIS POST 200 to upload.aspx then GET img.aspx?cmd=… × matching file-creation event; UTC→IST conversion required by artifact header; RH-05 rejected by 2025 timestamp + quarantine note + no 2026 hits.
- **Unlock:** P1 gate. **Hint:** "IIS logs are UTC — convert. Follow the 404 burst on /staging/ to the successful POST, then match the created file on disk; compare timestamps and paths against the 2025 quarantine note." penalty 2.
- **Common wrong answer:** naming upload_bak.aspx — wrong per (d); or reporting 07:32 as IST — wrong: IIS artifacts are UTC (header instruction), so the IST time is 13:02.
- **Learning outcomes:** 4, 5, 8, 11.

---
**Q-02-04 — Web/application weakness chain** (6 pts, Medium, evidence_linked: true)
- **Instructions:** Identify which validated weaknesses chained together to turn moderate web/application exposure into a foothold. Select from the weakness register (W-IDs).
- **Sub-questions:**
  - (a) Select ALL weaknesses in the initial-access/foothold chain — multi-select: W-01 (exposed RDP rule), W-02b (staging site + vendor upload page exposed without auth), W-03 (weak svc_portal password Portal@2024, documented), W-05 (password reuse), W-06 (Plant VLAN SMB exception), W-08 (no MFA), W-09 (NetFlow retention). **Canonical set: {W-01, W-02b, W-03}.**
  - (b) The documented internal source that published the brute-forced password (asset/artifact): **canonical: the service-account wiki page (E-WIKI-001)**; accepted: `E-WIKI-001`, `service-account wiki`, `IT wiki`.
- **Required evidence:** E-NET-001, E-WEB-002, E-WEB-003, E-WIKI-001 (+ E-DOC-001). **Attack events:** EVT-001, EVT-003, EVT-005, EVT-008.
- **Unlock:** P1 gate. **Hint:** "Ask which weakness each attack step needed: reaching the host, getting the password, and regaining access without RDP." penalty 1.
- **Common wrong answer:** including W-08 — wrong: no-MFA is real but irrelevant; the VPN was never used by the attacker (E-AUTH-012).
- **Learning outcomes:** 5, 11.

### PHASE 3 — EXECUTION, CREDENTIALS & PERSISTENCE (60 min)

---
**Q-03-01 — Credential access chain** (10 pts, High, evidence_linked: true)
- **Instructions:** Trace how the attacker turned a service-account foothold on WEB-PRD-01 into a privileged domain credential. There were two credential recoveries — establish both and the failed attempt between them.
- **Sub-questions:**
  - (a) Process whose memory was dumped (filename/process): **canonical `w3wp.exe`**; accepted: `w3wp`.
  - (b) Account whose OLD password (RajKulk@2023) was recovered (username): **canonical `rajesh.kulkarni`**; accepted: `rajesh.kulkarni`, `VISTARA\rajesh.kulkarni`.
  - (c) Result of the 15:12 authentication attempt to APP-PRD-01 with that old password — single choice: `A` Success / `B` Failure — bad password (4625) / `C` Account locked out. **Canonical: B.**
  - (d) File that yielded the CURRENT password (path): **canonical `C:\Users\svc_portal\Documents\passwords.txt`**; accepted: case-insensitive, slash variants.
  - (e) The current password recovered there belongs to (username) and its value (string): **canonical `rajesh.kulkarni` / `RajKulk@2026`**; accepted per (b) for the user; password exact string `RajKulk@2026`.
- **Required evidence:** E-EDR-004, E-AUTH-002, E-AUTH-003, E-FS-003, E-EDR-005 (+ E-EDR-003 prep, E-WIKI-001 hygiene pattern). **Attack events:** EVT-011, EVT-012, EVT-013, EVT-014.
- **Correlation:** EDR dump + Credential Manager access × failed NTLM/4625 at 15:12 from 10.10.20.11 × findstr/type commands × passwords.txt content.
- **Unlock:** P2 gate. **Hint:** "Sequence the EDR events on WEB-PRD-01 after the RDP session: recon commands → memory dump → failed 4625 on APP-PRD-01 → file search. The successful pivot one morning later tells you which recovery mattered." penalty 2.
- **Common wrong answer:** (c)=A — wrong: E-AUTH-002/003 record a bad-password failure; the old password was dead. Omitting the second recovery — wrong: the 09-04 success proves the current credential came from passwords.txt.
- **Learning outcomes:** 4, 7, 11.

---
**Q-03-02 — First lateral movement & privilege discovery** (8 pts, Medium-High, evidence_linked: true)
- **Instructions:** Establish the attacker's first successful hop off WEB-PRD-01 and what the subsequent domain enumeration revealed.
- **Sub-questions:**
  - (a) Destination host of the first successful lateral movement (asset): **canonical `APP-PRD-01`**; accepted: `APP-PRD-01`, `10.10.20.21`.
  - (b) Account used (username): **canonical `rajesh.kulkarni`**.
  - (c) Method — single choice: `A` RDP (logon type 10) / `B` PsExec service / `C` WinRM / `D` SSH. **Canonical: A.**
  - (d) Timestamp of the successful hop (IST): **canonical `2026-09-04 09:58 IST`** (minute precision accepted).
  - (e) What did the attacker learn from `net group` / nltest / LDAP enumeration? single choice: `A` rajesh.kulkarni is a member of Domain Admins (migration leftover, W-04) / `B` svc_portal is an Enterprise Admin / `C` admin_legacy is the only Domain Admin / `D` The domain has a tiered admin model. **Canonical: A.**
- **Required evidence:** E-AUTH-004, E-EDR-006, E-EDR-007, E-AUTH-005 (+ E-FS-003 credential origin; dossier §5.2). **Attack events:** EVT-015, EVT-016.
- **Unlock:** P2 gate. **Hint:** "Match the 4624 Type 10 on the destination host against EDR session artifacts, then read the next hour of command telemetry for the domain-recon set." penalty 2.
- **Common wrong answer:** (b)=svc_mon — wrong: svc_mon did not exist until 11:15 that day; the 09:58 hop used rajesh.kulkarni.
- **Learning outcomes:** 6, 9, 11.

---
**Q-03-03 — Identity persistence (rogue account)** (8 pts, Medium, evidence_linked: true)
- **Instructions:** The attacker created a durable identity for re-entry. Identify it, its privileges, its origin, and when it appeared.
- **Sub-questions:**
  - (a) Rogue account (username): **canonical `svc_mon`**; accepted: `svc_mon`, `VISTARA\svc_mon`, `vistara\svc_mon`.
  - (b) Its display name (string): **canonical `Monitoring Agent`**.
  - (c) Groups it was added to — multi-select: Domain Admins / Enterprise Admins / Remote Desktop Users (local on APP-PRD-01 & WEB-PRD-01) / Backup Operators / Server Operators. **Canonical: {Domain Admins, Remote Desktop Users}.**
  - (d) Created by (account) and from which host: **canonical `rajesh.kulkarni` from `APP-PRD-01`** (accepted aliases as above).
  - (e) Creation timestamp (IST): **canonical `2026-09-04 11:15 IST`** (minute precision).
- **Required evidence:** E-AD-001, E-AD-002, E-AD-003 (+ E-AUTH-007 later use). **Attack events:** EVT-017.
- **Unlock:** P2 gate. **Hint:** "On DC-01, look for 4720/4728/4732 events inside the incident window and check the creator and source workstation fields; confirm current membership in the AD snapshot." penalty 2.
- **Common wrong answer:** selecting admin_legacy — wrong: it is a pre-existing account (created 2019), never used by the attacker (14-month dormancy in E-AD-003).
- **Learning outcomes:** 6, 8, 11.

---
**Q-03-04 — Host persistence & C2 (scheduled task)** (8 pts, Medium-High, evidence_linked: true)
- **Instructions:** Characterize the persistence mechanism that survived on APP-PRD-01 and the channel it maintains. The mechanism's name is deliberately uninteresting — read what it DOES.
- **Sub-questions:**
  - (a) Scheduled task name (string): **canonical `MicrosoftEdgeUpdateTaskMachineCore`**.
  - (b) Host (asset): **canonical `APP-PRD-01`**.
  - (c) Runs as (account): **canonical `SYSTEM`**; accepted: `SYSTEM`, `NT AUTHORITY\SYSTEM`.
  - (d) Interval (single choice): every 30 minutes / hourly / daily / on logon. **Canonical: every 30 minutes.**
  - (e) Decoded callback URL (string): **canonical `https://185.220.101.47:8443/beacon`**; accepted: with/without trailing slash.
- **Required evidence:** E-EDR-008, E-FS-004, E-NET-003, E-EDR-008B. **Attack events:** EVT-018 (detection link EVT-031).
- **Correlation:** schtasks /create (EDR) × task XML (FS) × 30-min 8443 egress cadence (FW-01) × 4104 script-block decode (independent second source for the URL).
- **Unlock:** P2 gate. **Hint:** "Don't trust the task name — export the task XML, decode the -enc payload (the PowerShell Operational log gives you a second copy), and match the FW egress cadence." penalty 2.
- **Common wrong answer:** treating the task as legitimate Edge maintenance — wrong: the action is encoded PowerShell calling an external IP:8443; legitimate Edge tasks don't do that.
- **Learning outcomes:** 4, 8, 11.

---
**Q-03-05 — Domain dominance (DCSync)** (10 pts, High, evidence_linked: true)
- **Instructions:** Determine how the attacker obtained domain-wide credential material, from where, against what, and the full consequence for credential hygiene during eradication.
- **Sub-questions:**
  - (a) ATT&CK technique ID: **canonical `T1003.006`** (DCSync).
  - (b) Source host (asset): **canonical `APP-PRD-01`** (`10.10.20.21`).
  - (c) Target host (asset): **canonical `DC-01`** (`10.10.20.31`).
  - (d) Account performing it (username): **canonical `rajesh.kulkarni`**.
  - (e) Event window (IST): **canonical `2026-09-04 13:10–13:14 IST`**; accepted: any range covering 13:10–13:14 that day.
  - (f) Beyond user hashes, which domain credential was captured given the `/all` replication scope — forcing a DOUBLE reset during eradication (string): **canonical `krbtgt`**.
- **Required evidence:** E-AUTH-006, E-EDR-009. **Attack events:** EVT-019, EVT-020 (krbtgt inference-by-design from the `/all` scope visible in E-EDR-009).
- **Unlock:** P2 gate. **Hint:** "Look for 4662 directory-replication access on DC-01 from a non-DC source, then read the endpoint telemetry in that session — the command line shows the scope." penalty 2.
- **Common wrong answer:** (f)=administrator — wrong: the `/all` DCSync scope captures every account's hash including krbtgt; missing krbtgt is the classic eradication failure (golden-ticket capability survives).
- **Learning outcomes:** 6, 7, 11.

---
**Q-03-06 — Persistence inventory (synthesis)** (6 pts, Medium, evidence_linked: true)
- **Instructions:** Before planning eradication, enumerate EVERY mechanism by which the attacker can regain or retain access. Select all that the evidence supports.
- **Sub-questions:**
  - (a) Select ALL attacker persistence mechanisms — multi-select: (i) Rogue Domain Admin account svc_mon; (ii) Scheduled task MicrosoftEdgeUpdateTaskMachineCore on APP-PRD-01; (iii) Web shell img.aspx on WEB-PRD-01; (iv) Golden ticket actively in use; (v) Backdoored admin_legacy account; (vi) SSH key implanted on VPN-GW-01. **Canonical: {i, ii, iii}.**
  - (b) Which capability does the attacker hold in reserve but has NOT exercised (so it needs eradication-side mitigation, not containment)? single choice: `A` Golden-ticket capability via stolen krbtgt hash / `B` Ransomware payload / `C` Firmware implant / `D` BGP hijack. **Canonical: A.**
- **Required evidence:** E-AD-001, E-AD-002, E-AD-003, E-EDR-008, E-FS-004, E-NET-003, E-WEB-003, E-FS-001 (+ E-EDR-009 `/all` scope for (b)). **Attack events:** EVT-008, EVT-017, EVT-018, EVT-020.
- **Unlock:** P2 gate. **Hint:** "Count mechanisms by evidence type: one identity artifact family, one host artifact family, one web artifact family. Don't count capabilities never exercised as active mechanisms." penalty 1.
- **Common wrong answer:** including (iv) as active persistence — wrong: the krbtgt hash was captured (EVT-020) but never used; it mandates the double krbtgt reset during eradication, not a fourth live mechanism.
- **Learning outcomes:** 8, 11.

### PHASE 4 — DISCOVERY, LATERAL MOVEMENT, COLLECTION & EXFILTRATION (45 min)

---
**Q-04-01 — Rogue account in action** (6 pts, Medium, evidence_linked: true)
- **Instructions:** Prove whether the attacker's created identity was actually used, and where.
- **Sub-questions:**
  - (a) Host accessed using svc_mon (asset): **canonical `FILE-PRD-01`** (`10.10.20.23`).
  - (b) Source host (asset): **canonical `APP-PRD-01`** (`10.10.20.21`).
  - (c) Session start (timestamp IST): **canonical `2026-09-05 10:15 IST`** (minute precision).
  - (d) Logon type — single choice: `A` Type 10 (RemoteInteractive/RDP) / `B` Type 3 (network only) / `C` Type 5 (service) / `D` Type 2 (console). **Canonical: A.**
- **Required evidence:** E-AUTH-007, E-EDR-015 (+ E-AD-001/002 account provenance). **Attack events:** EVT-021.
- **Unlock:** P3 gate. **Hint:** "Search FILE-PRD-01 authentication events for the rogue account and confirm session continuity in EDR telemetry through the afternoon." penalty 1.
- **Common wrong answer:** (d)=B — wrong: E-AUTH-007 shows LogonType 10 and E-EDR-015 shows a continuous RDP session 10:15→13:05 spanning collection→exfil.
- **Learning outcomes:** 8, 9, 11.

---
**Q-04-02 — Collection & staging** (8 pts, Medium, evidence_linked: true)
- **Instructions:** Determine exactly what data the attacker gathered on FILE-PRD-01 and where it was staged. Distinguish collected data from data merely queried.
- **Sub-questions:**
  - (a) Select ALL data categories staged for theft — multi-select: (i) Client packaging designs (S:\Clients); (ii) Engineering spec sheets; (iii) HR payroll export (payroll_aug2026.xlsx, R:\HR); (iv) Financial summaries (R:\Finance); (v) Full ERPDB database dump; (vi) Executive email mailboxes; (vii) AD database copy (ntds.dit). **Canonical: {i, ii, iii, iv}.**
  - (b) Local staging directory (path): **canonical `C:\Windows\Temp\collect\`** (trailing slash optional).
  - (c) Approximate staged volume — single choice: ~2.1 GB / ~18 MB / ~680 MB / ~50 GB. **Canonical: ~2.1 GB** (680 MB is the compressed archive; 18 MB was the earlier source-code staging).
- **Required evidence:** E-FS-005, E-EDR-010, E-SHARE-001 (+ E-EDR-015 session continuity). **Attack events:** EVT-022.
- **Unlock:** P3 gate. **Hint:** "Correlate the dir/robocopy command lines with SMB file-open audit and the Temp directory writes; the DB questions are answered by a different artifact set (read-only queries ≠ collection)." penalty 2.
- **Common wrong answer:** including (v)/(vii) — wrong: no bulk DB export or ntds.dit copy exists in evidence; DB activity was 5-row sampling only.
- **Learning outcomes:** 10, 11, 15.

---
**Q-04-03 — Exfiltration** (8 pts, Medium-High, evidence_linked: true)
- **Instructions:** Establish both exfiltration events, their volumes and destination, and explain an evidence-survivability gap the investigation must account for.
- **Sub-questions:**
  - (a) Exfil archive filename on FILE-PRD-01 (filename): **canonical `order_export_2026.zip`**.
  - (b) Exfil destination (IP:port): **canonical `185.220.101.47:8443`**.
  - (c) The two exfiltration events and volumes — matching: `2026-09-03 13:25–13:31, ~18 MB (staging.zip, portal source/config, from 10.10.20.11)` and `2026-09-05 12:30–13:05, ~680 MB (order_export_2026.zip, from 10.10.20.23)`; total **~698 MB**. (Candidate matches volume→event; single-choice per event or ordered match.)
  - (d) Why is the 09-03 exfil flow absent from NetFlow? single choice: `A` NetFlow retention is 7 days (W-09); the flow survives only in FW-01 connection logs + EDR / `B` The attacker deleted the NetFlow records / `C` NetFlow was never enabled / `D` The flow used DNS tunneling invisible to NetFlow. **Canonical: A.**
- **Required evidence:** E-NET-002, E-FS-002, E-EDR-002 (exfil #1); E-NET-004, E-EDR-012, E-FS-006 (exfil #2); E-NET-006 (+ E-PROXY-001 negative record) for (d). **Attack events:** EVT-009, EVT-010, EVT-023, EVT-024.
- **Unlock:** P3 gate. **Hint:** "Match archive creation times on each host against FW-01 outbound volume windows; read the NetFlow summary's retention note before assuming a missing flow means no traffic." penalty 2.
- **Common wrong answer:** (d)=B — wrong: no evidence of NetFlow tampering; the collector retains only 7 days and today is 09-09. Missing exfil #1 — wrong: staging.zip's 18 MB upload on 09-13:25... (typo guard: 09-03 13:25) is a distinct first exfil of source code/config.
- **Learning outcomes:** 10, 11.

---
**Q-04-04 — Scope discrimination: accessed vs compromised vs probed** (6 pts, Medium-High, evidence_linked: true)
- **Instructions:** Two systems brushed against the attack without being owned. Classify each correctly — this judgment drives containment scope.
- **Sub-questions:**
  - (a) DB-PRD-01 — single choice: `A` Compromised (attacker code execution) / `B` Accessed but not compromised (read-only enumeration: sys.databases + TOP-5 row samples, no bulk export) / `C` Probed only / `D` Unrelated. **Canonical: B.**
  - (b) ERP-APP-01 — single choice: `A` Compromised / `B` Accessed but not compromised / `C` Probed only (single failed SMB connect 4625 at 09:33, no successful logon) / `D` Unrelated. **Canonical: C.**
  - (c) Which account authenticated to DB-PRD-01 during the enumeration (username): **canonical `rajesh.kulkarni`**.
- **Required evidence:** E-DB-001, E-AUTH-008 (DB); E-AUTH-009, E-EDR-013 (ERP). **Attack events:** EVT-025, EVT-026.
- **Unlock:** P3 gate. **Hint:** "Read the SQL audit for statement types and row counts, and the ERP security log for the exact event count — one failed SMB connect with no following success." penalty 1.
- **Common wrong answer:** DB-PRD-01 = compromised — wrong: read-only Windows-auth queries from FILE-PRD-01, no persistence, no execution, no bulk export; containment of DB-PRD-01 would be over-scoping.
- **Learning outcomes:** 9, 15, 11.

### PHASE 5 — FULL SCOPING & ATTACK-PATH RECONSTRUCTION (30 min)

---
**Q-05-01 — Breach scope: host classification table** (10 pts, High, evidence_linked: true)
- **Instructions:** Classify each listed system into exactly one column. This is the definitive blast-radius statement for the incident record.
- **Interaction:** classification table; 10 hosts × 4 classes: `Compromised` / `Accessed but not compromised` / `Probed only` / `Benign–unrelated`.
- **Scoring (authoritative):** 40 cells (10 hosts × 4 classes) × 0.25 pts = 10 pts, per-cell all-or-nothing. EXEMPT from the 80/20 evidence-selection split: the required evidence below is validation/authoring metadata (feedback + CF-3 evaluation) and earns no separate points.
- **Canonical classification:**
  - Compromised: **WEB-PRD-01** (initial foothold + web shell + credential theft + exfil #1), **APP-PRD-01** (persistence + C2 + DCSync origin), **FILE-PRD-01** (collection + exfil #2), **DC-01** (DCSync target — full domain credential disclosure; attacker session present).
  - Accessed but not compromised: **DB-PRD-01** (read-only enumeration).
  - Probed only: **ERP-APP-01** (single failed SMB 4625; no success).
  - Benign–unrelated: **MAIL-PRD-01**, **VPN-GW-01**, **HR-APP-01**, **MES-PLC-01**.
- **Required evidence:** E-AUTH-001/E-NET-005/E-EDR-001 (WEB), E-EDR-008/E-FS-004/E-AUTH-006 (APP+DC), E-AUTH-007/E-EDR-015/E-FS-005 (FILE), E-DB-001/E-AUTH-008 (DB), E-AUTH-009/E-EDR-013 (ERP), E-AUTH-012 + dossier (benign set). **Attack events:** EVT-005, EVT-008, EVT-015, EVT-018, EVT-019, EVT-021, EVT-025, EVT-026.
- **Unlock:** P4 gate. **Hint:** "For each host demand proof of execution or credential use: a successful logon alone is access, not compromise; a failed logon is a probe; no attacker telemetry at all is benign." penalty 2.
- **Common wrong answer:** Compromised for DB-PRD-01 (over-scope) or missing DC-01's credential disclosure (under-scope — counts toward the missing-major-compromise critical failure).
- **Learning outcomes:** 15, 11. **Critical-failure link: CF-3** (misclassifying any of the four Compromised hosts caps the score).

---
**Q-05-02 — Breach scope: identities** (8 pts, High, evidence_linked: true)
- **Instructions:** Produce the identity blast radius — which accounts are compromised or attacker-controlled, and the domain-wide exposure verdict.
- **Sub-questions:**
  - (a) Select ALL compromised or attacker-controlled accounts — multi-select: svc_portal / rajesh.kulkarni / svc_mon / admin_legacy / pranav.joshi / ananya.iyer / svc_backup / helpdesk. **Canonical: {svc_portal, rajesh.kulkarni, svc_mon}.**
  - (b) Given the DCSync scope, must ALL domain credentials be treated as exposed? yes/no: **Canonical: Yes.**
  - (c) admin_legacy's correct disposition — single choice: `A` Compromised in this incident / `B` Weak but unexploited — ~14 months without logon (last_logon ≈2025-07); hygiene finding only / `C` Attacker-created. **Canonical: B.**
  - (d) The two VPN users with odd-window activity are — single choice: `A` Both compromised / `B` Both benign (Ahmedabad office IP 122.176.45.9; pranav.joshi orders match dealer POs; ananya.iyer covered by HR travel approval TRV-2026-0312) / `C` One compromised, one benign. **Canonical: B.**
- **Required evidence:** E-AD-003, E-AUTH-006, E-EDR-009, E-AUTH-012, E-AUTH-010, E-WEB-004, E-DOC-003 (+ E-AUTH-011). **Attack events:** EVT-005, EVT-014, EVT-017, EVT-019, EVT-027 (RH-02), EVT-029 (RH-03), RH-04.
- **Unlock:** P4 gate. **Hint:** "For each account ask: is there attacker-controlled use in evidence? Then check the AD snapshot's last-logon field and the VPN full-window summary plus the HR travel record." penalty 2.
- **Common wrong answer:** including admin_legacy (looks juicy, weak password) — wrong: dormant ~14 months, absent from every attack artifact.
- **Learning outcomes:** 7, 15, 2.

---
**Q-05-03 — Timeline reconstruction** (10 pts, Medium, evidence_linked: false)
- **Instructions:** Drag the 11 shuffled incident milestones into chronological order. (Candidate sees event descriptions with dates hidden; ordering only.)
- **Canonical sequence (item key → description → EVT):**
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
- **Scoring:** Kendall-tau concordance × 10 pts, rounded to 0.5.
- **Required evidence (study set):** E-NET-001, E-WEB-002, E-AUTH-001, E-WEB-003, E-FS-003, E-AUTH-004, E-AD-001, E-EDR-008, E-AUTH-006, E-AUTH-007, E-NET-004, E-ALERT-001. **Attack events:** as mapped above.
- **Unlock:** P4 gate. **Hint:** "Anchor the two exfil-relevant dates (09-03 vs 09-05) and the detection date, then place persistence strictly after the first successful pivot." penalty 2.
- **Common wrong answer:** placing the web shell before initial access — wrong: the upload (13:02) rode the 11:47 RDP session's access.
- **Learning outcomes:** 12, 1.

---
**Q-05-04 — ATT&CK mapping** (15 pts, Medium, evidence_linked: false)
- **Instructions:** Map each observed behavior to exactly one MITRE ATT&CK technique from the controlled list. Every behavior is evidence-backed; scoring is 1 pt per correct mapping.
- **Evidence note (authoritative):** evidence IDs referenced beside behavior rows are authoring/validation metadata; evidence selection is NOT a scored action on this task (15 mappings × 1.0 = 15 pts carry the full score).
- **Controlled list (18 IDs; all package-supported):** T1003 (OS Credential Dumping), T1003.006 (OS Credential Dumping: DCSync), T1005 (Data from Local System), T1018 (Remote System Discovery), T1021.001 (Remote Services: Remote Desktop Protocol), T1039 (Data from Network Shared Drive), T1041 (Exfiltration Over C2 Channel), T1053.005 (Scheduled Task/Job: Scheduled Task), T1069 (Permission Groups Discovery), T1070 (Indicator Removal), T1071.001 (Application Layer Protocol: Web Protocols), T1078 (Valid Accounts), T1087 (Account Discovery), T1098 (Account Manipulation), T1136.001 (Create Account), T1552 (Unsecured Credentials), T1560.001 (Archive Collected Data: Archive via Utility), T1567 (Exfiltration Over Web Service). [T1005, T1087, T1567 are plausible non-target options; the other 15 are all correct answers to one row each.]
- **15 scored mappings (behavior → canonical technique):**
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
- **Unlock:** P4 gate. **Hint:** "Match each behavior row to the evidence artifact quoted beside it; where two techniques look close (e.g., exfil-over-C2 vs exfil-over-web-service), prefer the channel the evidence actually shows — the same 8443 endpoint as the beacon." penalty 3.
- **Common wrong answer:** T1567 for exfil — wrong here: the exfil rode the existing C2 endpoint (185.220.101.47:8443), i.e., exfiltration over the C2 channel (T1041).
- **Learning outcomes:** 13.

---
**Q-05-05 — IOC consolidation** (8 pts, Medium-High, evidence_linked: true)
- **Instructions:** Assemble the defensible indicator set for blocking and threat-hunting. Include only indicators tied to THIS attacker; reject benign and historical look-alikes.
- **Sub-questions:**
  - (a) Select ALL valid IOCs — multi-select: (i) 45.155.90.23; (ii) 185.220.101.47 (:8443); (iii) https://185.220.101.47:8443/beacon; (iv) C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx; (v) order_export_2026.zip; (vi) C:\ProgramData\Microsoft\Crypto\RSA\staging.zip; (vii) svc_mon; (viii) MicrosoftEdgeUpdateTaskMachineCore; (ix) 10.10.40.13; (x) 122.176.45.9; (xi) C:\inetpub\wwwroot\assets\old\upload_bak.aspx; (xii) pranav.joshi; (xiii) admin_legacy; (xiv) VS-MAN-2026-0904. **Canonical: {i, ii, iii, iv, v, vi, vii, viii}.**
  - (b) Highest-priority indicator to block at FW-01 immediately (single choice): **canonical `185.220.101.47`** (active C2 + exfil destination). (Accepted: `185.220.101.47:8443`.)
- **Required evidence:** E-NET-001, E-AUTH-001, E-NET-003, E-NET-002/004, E-EDR-008, E-WEB-003, E-FS-001/002/006, E-AD-001; rule-outs E-VULN-001/002, E-AUTH-010/011/012, E-FS-007/E-DOC-002. **Attack events:** EVT-001, EVT-005, EVT-008, EVT-010, EVT-018, EVT-024.
- **Unlock:** P4 gate. **Hint:** "An IOC must be attacker-attributable: test each candidate against its evidence — scanner, office-egress IP, and the 2025 shell all fail that test." penalty 2.
- **Common wrong answer:** including 122.176.45.9 or 10.10.40.13 — wrong: registered Ahmedabad office egress and the internal scanner; blocking them causes business harm.
- **Learning outcomes:** 14, 2.

### PHASE 6 — CONTAINMENT, ERADICATION & RECOVERY (45 min)

---
**Q-06-01 — Containment decision** (12 pts, High, evidence_linked: true)
- **Instructions:** It is 2026-09-09 ~10:00 IST; the attacker's beacon is live. Select the containment set to execute now. Over- and under-containment both cost points; the set must be evidence-driven.
- **Sub-questions:**
  - (a) Hosts to network-isolate — multi-select from: WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01, DB-PRD-01, ERP-APP-01, MAIL-PRD-01, entire Server VLAN. **Canonical: {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}.**
  - (b) Accounts to disable — multi-select: svc_mon, rajesh.kulkarni, svc_portal, admin_legacy, svc_backup, ananya.iyer. **Canonical: {svc_mon, rajesh.kulkarni, svc_portal}.**
  - (c) Network action — single choice: `A` Block 185.220.101.47 (all ports) at FW-01 / `B` Block 45.155.90.23 only / `C` Block both attacker IPs AND take the DMZ offline / `D` No network action. **Canonical: A.**
  - (d) Web action — single choice: `A` Suspend the /staging/ site on WEB-PRD-01 / `B` Take the entire dealer portal offline / `C` No web action / `D` Rebuild WEB-PRD-01 immediately. **Canonical: A.**
  - (e) Primary rationale for isolating APP-PRD-01 — single choice: `A` Host exhibits an active C2 beacon and holds attacker persistence / `B` It is the oldest server / `C` Policy requires isolating all servers / `D` It is nearest to DC-01. **Canonical: A.**
- **Canonical containment state (must equal v1.1 canon, EVT-033 / E-RESP-001 / E-AD-004):** isolate {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}; disable {svc_mon, rajesh.kulkarni, svc_portal}; block 185.220.101.47 at FW-01; suspend /staging/.
- **Required evidence:** E-NET-003, E-ALERT-001, E-EDR-008, E-AUTH-007, E-AD-001/002/003 (+ dossier business context: DC-01 isolation would halt domain auth; ERP/payroll criticality). **Attack events:** EVT-033.
- **Unlock:** P5 gate. **Hint:** "Contain what is proven compromised or attacker-controlled — no more (domain auth and payroll depend on the rest), no less (a beacon is still running)." penalty 2.
- **Common wrong answers:** isolating DC-01 (destructive: domain-wide authentication outage — overbroad); monitor-only (under-reactive against a live C2); disabling admin_legacy (not compromised).
- **Learning outcomes:** 16. **Critical-failure link: CF-2** (omitting the 185.220.101.47 block or any of the 3 host isolations).

---
**Q-06-02 — Response lifecycle sequencing** (5 pts, Medium, evidence_linked: false)
- **Instructions:** Order the major response actions. One of these orderings destroys evidence and leaves persistence alive — identify the defensible sequence.
- **Task:** ordered sequence of 5 actions: **Canonical: 1. Containment (isolate hosts/accounts, block C2) → 2. Evidence preservation (snapshots, memory, SIEM export, chain of custody) → 3. Eradication (remove persistence, close weaknesses, reset credentials) → 4. Recovery (rebuild/restore) → 5. Safe-state validation.**
- **Required evidence:** IR-Policy-01 (dossier) + response-record conventions (E-RESP-001 → E-RESP-004 ordering; QA-14 wording: preservation after urgent containment, before eradication). **Attack events:** EVT-033, EVT-034, EVT-035, EVT-036, EVT-037.
- **Unlock:** Q-06-01 complete. **Hint:** "Urgent containment comes first; destructive cleanup must never precede preservation; you cannot validate a state you have not yet restored." penalty 1.
- **Common wrong answer:** preservation before containment — wrong in spirit (urgent containment stops the bleeding first; preservation immediately follows, before eradication).
- **Learning outcomes:** 16, 17.

---
**Q-06-03 — Eradication plan** (12 pts, High, evidence_linked: true)
- **Instructions:** Select every action required to evict the attacker and close what let them in, then order the plan. "Restore from backup" alone is NOT eradication.
- **Sub-questions:**
  - (a) Select ALL required eradication actions — multi-select: (i) Delete scheduled task MicrosoftEdgeUpdateTaskMachineCore on APP-PRD-01; (ii) Delete web shell img.aspx on WEB-PRD-01; (iii) Delete staged artifacts (staging.zip, passwords.txt on WEB-PRD-01; C:\Windows\Temp\collect remnants and order_export_2026.zip on FILE-PRD-01); (iv) Delete rogue account svc_mon and audit groups it touched; (v) Reset credentials: rajesh.kulkarni, svc_portal, ALL Domain Admin accounts, krbtgt TWICE, plus org-wide user password reset; (vi) Remove the FW-01 any→3389 rule (close W-01); (vii) Disable/remove /staging/test/upload.aspx and restrict /staging/ (close W-02b); (viii) Restore FILE-PRD-01 from backup and consider the incident closed; (ix) Reboot all servers to clear memory; (x) Change svc_mon's password and keep the account. **Canonical: {i, ii, iii, iv, v, vi, vii}.**
  - (b) Order the 7 eradication step-groups canonically — **canonical sequence: (1) remove scheduled task on APP-PRD-01 → (2) delete web shell img.aspx on WEB-PRD-01 → (3) delete staged artifacts (staging.zip + passwords.txt; collect dir + order_export_2026.zip) → (4) delete svc_mon + audit groups → (5) credential resets incl. krbtgt ×2 + org-wide reset → (6) remove FW-01 RDP rule (W-01 fix) → (7) close/restrict staging upload page (W-02b fix).** (Per EVT-035 / E-RESP-003.)
- **Required evidence:** E-FS-004/E-EDR-008 (task), E-FS-001/E-WEB-003 (shell), E-FS-002/003/006 (artifacts), E-AD-001/002/003 (svc_mon), E-AUTH-006/E-EDR-009 (credential scope incl. krbtgt), E-NET-001/E-DOC-001 (W-01), E-WEB-002 (W-02b). **Attack events:** EVT-035 (canon), EVT-008, EVT-017, EVT-018, EVT-019/020.
- **Unlock:** Q-06-02 complete. **Hint:** "Walk your own findings: every persistence mechanism (Q-03-06), both entry weaknesses (Q-02-01, Q-02-03), and every credential whose exposure you proved — including what the /all DCSync scope implies." penalty 2.
- **Common wrong answer:** selecting (viii) as sufficient — wrong: backup restoration does not remove the web shell/task/rogue account, does not close W-01/W-02b, and does not invalidate stolen credentials (the designed trap). Omitting the second krbtgt reset — wrong: single reset leaves golden tickets minted between resets valid.
- **Learning outcomes:** 17, 8, 6.

---
**Q-06-04 — Recovery sequencing & approach** (10 pts, High, evidence_linked: true)
- **Instructions:** Plan the restoration: which systems come back, in what order, by which method, and what follows them.
- **Sub-questions:**
  - (a) Restoration order — ordered sequence: **canonical: 1. Validate DC-01 (no rebuild; verify no persistence, forced krbtgt reset ×2 complete) → 2. Rebuild WEB-PRD-01 from clean template + redeploy portal → 3. Rebuild APP-PRD-01 + domain rejoin (config from version control) → 4. Restore FILE-PRD-01 data from the 2026-09-02 pre-incident backup after malware scan + ACL verification.** (Per EVT-036 / E-RESP-004.)
  - (b) Match host → recovery approach (matching): DC-01 = validate-only (no OS rebuild; credential remediation); WEB-PRD-01 = clean-template rebuild + portal redeploy + content restore from 09-02 backup after AV scan; APP-PRD-01 = rebuild + rejoin + config from version control; FILE-PRD-01 = in-place OS with data restore from 09-02 backup after malware scan. **Canonical as stated.**
  - (c) Backup date selection — single choice: `A` 2026-09-02 (pre-incident) / `B` 2026-09-04 (most recent before detection) / `C` 2026-09-08 (latest available). **Canonical: A** (later backups may contain attacker artifacts; RPO 24h per BK-Policy-04 accepts ~1 day file-version loss).
  - (d) Post-restore requirement — yes/no: include 72-hour enhanced monitoring? **Canonical: Yes.**
- **Required evidence:** E-RESP-004 canon, E-VALID-001, BK-Policy-04 (dossier), compromise timeline (backups after 09-03 11:47 are untrusted). **Attack events:** EVT-036.
- **Unlock:** Q-06-03 complete. **Hint:** "Identity infrastructure must be trustworthy before anything rejoins it; known-compromised operating systems are rebuilt, not patched; pick the newest backup that PREDATES initial access." penalty 2.
- **Common wrong answer:** restoring FILE-PRD-01 from the 09-08 backup — wrong: post-compromise backups risk reintroducing staged artifacts; or restoring services before DC validation — wrong: rebuilt hosts would rejoin an untrusted domain.
- **Learning outcomes:** 18.

### PHASE 7 — SAFE-STATE VALIDATION & FINAL REPORTING (30 min)

---
**Q-07-01 — Validation requirements** (8 pts, Medium, evidence_linked: true)
- **Instructions:** Before anyone declares recovery complete, define the full validation gate. Select every check that must PASS.
- **Sub-questions:**
  - (a) Select ALL required checks — multi-select: (i) EDR full-scan clean on all touched hosts; (ii) Persistence re-check (scheduled tasks, services, run keys, web directories) on ALL touched hosts INCLUDING rebuilt ones; (iii) Credential resets verified — rajesh.kulkarni, svc_portal, all Domain Admins, krbtgt ×2, org-wide user reset; (iv) AD audit confirms svc_mon absent; (v) No egress to 185.220.101.47 in 72h enhanced monitoring; (vi) FW-01 3389 rule removed AND external rescan shows 3389 closed on 203.0.113.10; (vii) /staging/test/upload.aspx returns 404; (viii) No anomalous 4624 Type 10 logons or encoded-PowerShell beacons in logs; (ix) Business validation — dealer portal order flow, S:/R: shares, payroll app verified; (x) Antivirus definitions updated; (xi) CEO sign-off by email. **Canonical: {i, ii, iii, iv, v, vi, vii, viii, ix}.**
- **Required evidence:** E-VALID-002 (7-check gate canon: EDR clean; persistence re-check; credential resets incl. krbtgt ×2 + org-wide; network — no 8443 egress + rule absent + 3389 closed + upload page 404; log review; business validation) + E-AD-003 re-check + E-VALID-001. **Attack events:** EVT-037.
- **Unlock:** P6 gate. **Hint:** "A rebuilt host can still carry a re-deployed misconfiguration or a missed artifact — the checklist must verify persistence absence everywhere, identity state, network exposure, log silence, and business function." penalty 2.
- **Common wrong answer:** treating EDR-clean (i) alone as sufficient — wrong: that is exactly the trap exercised in Q-07-02.
- **Learning outcomes:** 19.

---
**Q-07-02 — The safe-state gate (TRAP)** (10 pts, High, evidence_linked: true)
- **Instructions (stage 1):** The interim validation packet shows: EDR full-scan CLEAN on all rebuilt/restored hosts; credential resets verified; network checks pass; **persistence re-check on rebuilt APP-PRD-01 marked SKIPPED ("host was rebuilt, considered clean")**; AD audit not yet re-run. The business is pressing to reopen the portal. Declare the current state:
- **Sub-questions:**
  - (a) Stage-1 declaration — single choice: `SAFE` / `NOT SAFE`. **Canonical: NOT SAFE.**
  - (b) The blocking deficiency — single choice: `A` Persistence re-check skipped on rebuilt APP-PRD-01 and svc_mon absence not yet re-verified in AD / `B` EDR vendor signatures are one day old / `C` The portal SSL certificate expires soon / `D` NetFlow only retains 7 days. **Canonical: A.**
  - (c) Stage-2 (after the packet shows the 16:55 re-run: scheduled tasks/services/run keys/web dirs CLEAN on APP-PRD-01; AD audit confirms svc_mon ABSENT; all other checks PASS) — declaration: `SAFE` / `NOT SAFE`. **Canonical: SAFE.**
- **Required evidence:** E-VALID-001, E-VALID-002 (+ E-AD-003 re-verification, E-RESP-003 completeness). **Attack events:** EVT-037.
- **Unlock:** Q-07-01 complete. **Hint:** "Check the gate against your own Q-07-01 checklist line by line; a SKIPPED line is not a PASS." penalty 2.
- **Common wrong answer:** stage-1 SAFE on EDR-clean grounds — the designed critical failure: EDR-clean is necessary, not sufficient; persistence and identity checks must be explicitly complete.
- **Learning outcomes:** 19. **Critical-failure link: CF-1** (stage-1 answered SAFE).

---
**Q-07-03 — Residual risk & recommendations** (8 pts, Medium, evidence_linked: true)
- **Instructions:** Close out honestly: acknowledge what recovery did NOT fix, and select the remediation set that maps to the weaknesses this incident actually exercised or exposed.
- **Sub-questions:**
  - (a) Select ALL residual risks — multi-select: (i) Stolen data (~698 MB incl. payroll PII and client designs) is unrecoverable — exposure must be managed; (ii) W-05 — password-reuse/plaintext-credential hygiene; (iii) W-06 — Plant VLAN → FILE-PRD-01 SMB exception still open; (iv) W-08 — no MFA on remote access; (v) W-09 — NetFlow 7-day retention limits investigations; (vi) The attacker still has an active beacon; (vii) ERPDB was fully exfiltrated. **Canonical: {i, ii, iii, iv, v}** (fixed set per release hand-off).
  - (b) Select ALL correct recommendations — multi-select: (i) Enforce CH-Policy-03 change control for firewall rules + audit for stale rules; (ii) Service-account credential vaulting + rotation (close W-03/W-03c; register per AC-Policy-02); (iii) MFA on VPN/remote access (W-08); (iv) Privileged-access tiering; remove standing Domain Admin membership (W-04); deploy LAPS (W-05b); (v) Extend NetFlow/log retention (W-09); (vi) Review/remove the W-06 segmentation exception; (vii) Permanently remove internet exposure of staging resources (W-02b) and audit for upload pages; (viii) Replace the EDR vendor; (ix) Discipline the vulnerability-scanner operator. **Canonical: {i, ii, iii, iv, v, vi, vii}.**
- **Required evidence:** exfil findings (E-NET-002/004), E-FS-003, dossier weaknesses W-05/W-06/W-08/W-09 (+W-04, W-05b), E-NET-006. **Attack events:** EVT-038 (canon), plus the W-exposure events.
- **Unlock:** Q-07-02 complete. **Hint:** "Map each recommendation to a weakness ID you actually met in evidence; exclude anything already verified closed by eradication." penalty 2.
- **Common wrong answer:** (a) including vi/vii — wrong: the beacon was contained and eradicated (E-RESP-003, E-VALID-002), and ERPDB was never bulk-exfiltrated (E-DB-001).
- **Learning outcomes:** 19, 20.

---
**Q-07-04 — Final incident report (structured)** (15 pts, Medium, evidence_linked: false)
- **Instructions:** Complete the structured incident report. Deterministic fields are cross-checked against your phase answers (inconsistency costs points); the executive summary is the one rubric-scored narrative.
- **Deterministic fields (1 pt each, 10 pts):**
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
- **Executive summary (5 pts, rubric-scored — the ONLY non-deterministic item):** 3–5 sentences for a non-technical executive. Rubric (1 pt each): states what happened (web-facing server breached via exposed remote access + weak service password); states business impact (≈698 MB stolen incl. client designs + payroll data; ~6-day presence); states actions taken (contained, eradicated, rebuilt/restored, validated safe); states current status (services restored, safe state verified 09-09 17:30 IST); states residual risk/next steps (data exposure management, credential-hygiene/MFA/retention program).
- **Consistency rule:** fields 1–10 auto-compared with Q-00-01, Q-02-01/02/03, Q-03-*, Q-05-01/02, Q-07-02 answers; each contradiction voids that report field's point.
- **Required evidence:** synthesis of all phases. **Attack events:** EVT-031..038.
- **Unlock:** Q-07-03 complete. **Hint:** "Your phase answers are the report's source of truth — do not introduce anything you did not prove." penalty 3 (applies to deterministic fields only).
- **Learning outcomes:** 20, 1.

---

## 3. SCORING SPEC (summary for SCORING_MODEL.md + assessment.json)

- **Raw points:** P0 5 | P1 11 | P2 30 | P3 50 | P4 28 | P5 51 | P6 39 | P7 41 | **Total 255**.
- **Weighted dimensions (final score = Σ earned/max × weight):**
  - D1 Investigation accuracy & evidence correlation (P0–P4 tasks): 40%
  - D2 Scoping & attack reconstruction (P5): 15%
  - D3 Containment (Q-06-01, Q-06-02): 10%
  - D4 Eradication (Q-06-03): 10%
  - D5 Recovery (Q-06-04): 8%
  - D6 Safe-state validation (Q-07-01, Q-07-02): 12%
  - D7 Reporting & risk communication (Q-07-03, Q-07-04): 5%
  (Investigative 55% = D1+D2; response decisions 28% = D3+D4+D5; validation+reporting 17% = D6+D7 — matches SIM_REQ §27 guidance ≈55/25/20.)
- **Evidence-linked component:** for `evidence_linked: true` tasks EXCEPT Q-05-01 (25 tasks; see §0 scope rule), 20% of task points = evidence selection (full 20% iff selection ⊇ required set with zero incorrect; 10% iff ⊇ required with ≤2 incorrect; else 0); the remaining 80% = answer components, split by EQUAL POOLING (pool / N; no custom component weights anywhere). Q-05-01: 40 cells × 0.25 = 10 pts, evidence not separately scored. Q-05-03: single 10-pt Kendall-tau ordering component. Q-05-04: 15 mappings × 1.0 = 15 pts, evidence not scored. Q-07-04: 10 deterministic fields × 1.0 + 5-pt rubric.
- **Multi-select:** `max(0, TP−FP)/|set|` × component points, rounded to 0.5. **Classification table:** per-cell. **Ordering:** Kendall-tau × points, rounded to 0.5. **Single/exact/yes-no/timestamp:** all-or-nothing (accepted aliases per kernel).
- **No negative marking** on investigative items; decision items lose their own points only.
- **Hints:** deduct `hint_penalty` from the task's earned score (floor 0), max 2 hints/task.
- **Pass threshold:** ≥70% overall AND zero critical failures.
- **Critical failures (cap total score at 49%):**
  - CF-1: Q-07-02 stage-1 declared SAFE (unsafe safe-state declaration).
  - CF-2: Q-06-01 omits blocking 185.220.101.47 OR omits isolating any of {WEB-PRD-01, APP-PRD-01, FILE-PRD-01} (failure to contain known active attacker infrastructure/compromised host).
  - CF-3: Q-05-01 classifies any of {WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01} as anything other than Compromised (missed major compromise).
- **Performance bands:** ≥90 Distinction / 70–89.5 Pass / 50–69.5 Near miss / <50 or any CF = Fail.

## 4. PROGRESSION SPEC (summary for PROGRESSION_LOGIC.md)

- Phase-gated (§1 gates); free navigation + evidence revisit within unlocked phases; completed-phase evidence stays open.
- Reveal schedule per §1 (catalog reveal phases 0/1/6/7). E-ALERT-002 surfaces when P1 opens. Phase-6 response records (E-RESP-001..004, E-AD-004, E-VALID-001) appear as the candidate's executed decisions are applied; E-VALID-002 (interim, with the SKIPPED line) at Q-07-02 stage 1; final E-VALID-002 re-run (16:55) after the candidate refuses the incomplete packet (or after remediation if they declared SAFE prematurely — consequence path, no dead end).
- **Consequence paths (no soft-lock):** over-containment (DC-01/VLAN) → business-impact alert (domain auth degraded; CFO/plant escalation), points lost, option to roll back and re-submit; under-containment (missing C2 block) → beacon persists, new SIEM escalation 30 min later, points lost, remedial containment offered. Eradication missing a mechanism → persistence rediscovered at validation, candidate must revise before Q-07-02 opens.
- **Pacing nudges:** >20% over phase guidance → gentle nudge; no score effect.
- **Save/resume:** single 300-min sitting; autosave per answer.

## 5. RED-HERRING USAGE MAP

| RH | Assessed by | Rule-out evidence (candidate-visible) |
|---|---|---|
| RH-01 scans | Q-01-02 | E-VULN-001/002 + asset inventory (10.10.40.13, svc_monitor, devang.shah) |
| RH-02 pranav.joshi | Q-05-02(d), Q-05-05 distractors | E-AUTH-010 (122.176.45.9) + E-WEB-004 + E-AUTH-012 |
| RH-03 ananya.iyer | Q-05-02(d), Q-05-05 distractors | E-AUTH-011 + E-DOC-003 (TRV-2026-0312) + E-AUTH-012 |
| RH-04 admin_legacy | Q-05-02(c), Q-05-05 distractors | E-AD-003 last_logon ≈2025-07 (14-month dormancy) |
| RH-05 2025 shell | Q-02-03(d), Q-05-05 distractors | E-FS-007 (2025-11-08) + E-DOC-002 quarantine + no 2026 hits in E-WEB-003 |
| RH-07 ambient 3389 scanners | Q-02-02 noise rejection | E-AUTH-001/E-NET-001: distributed sources, zero successes |
| (retired RH-06 — never referenced) | — | — |

## 6. LEARNING-OUTCOME COVERAGE MAP (SIM_REQ §5 → tasks)

1 Full-cycle → Q-00-01, Q-05-03, Q-07-04 | 2 Recon discrimination → Q-01-02, Q-02-02, Q-05-05 | 3 Initial access → Q-02-01, Q-02-02 | 4 Execution/post-compromise → Q-02-03, Q-03-01, Q-03-04 | 5 Web weakness chaining → Q-02-01, Q-02-03, Q-02-04 | 6 AD/identity chaining → Q-03-02, Q-03-03, Q-03-05, Q-06-03 | 7 Credential compromise → Q-03-01, Q-05-02 | 8 Persistence → Q-03-03, Q-03-04, Q-03-06, Q-04-01 | 9 Discovery & lateral movement → Q-03-02, Q-04-01, Q-04-04 | 10 Collection & exfil → Q-04-02, Q-04-03 | 11 Multi-source correlation → all evidence_linked tasks (26 of 30) | 12 Timeline → Q-05-03 | 13 ATT&CK → Q-05-04 | 14 IOC → Q-05-05 | 15 Scoping → Q-01-01, Q-04-02, Q-04-04, Q-05-01, Q-05-02 | 16 Containment → Q-06-01, Q-06-02 | 17 Eradication → Q-06-02, Q-06-03 | 18 Recovery → Q-06-04 | 19 Safe-state → Q-07-01, Q-07-02, Q-07-03 | 20 Reporting → Q-07-03, Q-07-04. **All 20 covered; none unassessed.**

## 7. POINT-VALUE SANITY (tasks × points)

Q-00-01 5 | Q-01-01 6, Q-01-02 5 | Q-02-01 6, Q-02-02 10, Q-02-03 8, Q-02-04 6 | Q-03-01 10, Q-03-02 8, Q-03-03 8, Q-03-04 8, Q-03-05 10, Q-03-06 6 | Q-04-01 6, Q-04-02 8, Q-04-03 8, Q-04-04 6 | Q-05-01 10, Q-05-02 8, Q-05-03 10, Q-05-04 15, Q-05-05 8 | Q-06-01 12, Q-06-02 5, Q-06-03 12, Q-06-04 10 | Q-07-01 8, Q-07-02 10, Q-07-03 8, Q-07-04 15. **Σ = 255.**
