# EVIDENCE_TRACEABILITY_AUDIT.md

**Vistara Polymers Incident — End-to-End Traceability Audit (Agent 3.5 deliverable F)**
**Version:** 1.1 — 2026-09-11
**Basis:** v1.1 package (ATTACK_TIMELINE_v1.1, EVIDENCE_CATALOG_v1.1, EVIDENCE_MATRIX_v1.1, EVIDENCE_DIRECTORY_SPEC_v1.1, EVIDENCE_SCHEMAS_TEMPLATES_v1.1)
**Rule under audit:** every scored conclusion must trace Attack Event → Evidence → Corroboration → Candidate Finding → Deterministic Answer, with ≥2 independent sources wherever SIMULATION_REQUIREMENTS §15.1 demands corroboration. No dangling references; no conclusion depends on missing evidence.

---

## Part 1 — The 15 Key Findings (per Agent 3.5 mandate §10)

### KF-01 — Initial access
- **Attack Event:** EVT-004/EVT-005 (2026-09-03 10:22–11:47 IST; success 11:47)
- **Evidence IDs:** E-AUTH-001, E-NET-005, E-NET-001
- **Evidence Types:** Windows Security (4625 run + 4624 Type 10 + DC-01 4776) | FW-01 session log | FW-01 scan/allow log
- **Corroborating Evidence:** E-EDR-001 (interactive session follows), E-WIKI-001 + E-FS-003 (Portal@2024 documented/confirmed)
- **Candidate Inference:** svc_portal (`Portal@2024`, W-03) brute-forced from 45.155.90.23 over internet-exposed RDP (W-01); WEB-PRD-01 is patient zero; VPN ruled out via E-AUTH-012
- **Deterministic Finding:** Initial vector = RDP brute force of svc_portal, success 2026-09-03 11:47 IST, source 45.155.90.23. ✅ ≥3 independent sources

### KF-02 — Compromised account (initial)
- **Attack Event:** EVT-005, EVT-006
- **Evidence IDs:** E-AUTH-001, E-EDR-001
- **Evidence Types:** Windows Security | EDR process telemetry
- **Corroborating Evidence:** E-WIKI-001 (wiki lists svc_portal:Portal@2024), E-FS-003 (passwords.txt also carries svc_portal:Portal@2024), E-NET-005
- **Candidate Inference:** the brute-forced account is svc_portal; it is local admin on WEB-PRD-01
- **Deterministic Finding:** Account = `svc_portal`; password = `Portal@2024`. ✅

### KF-03 — Web shell
- **Attack Event:** EVT-008 (2026-09-03 13:02 IST)
- **Evidence IDs:** E-WEB-003, E-FS-001
- **Evidence Types:** IIS access log | file-creation event
- **Corroborating Evidence:** E-WEB-002 (same source IP discovered the upload page 09-02); RH-05 ruled out by E-FS-007 + E-DOC-002 (2025 quarantined shell, different path, no 2026 execution)
- **Candidate Inference:** persistence #3 at C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx via W-02b
- **Deterministic Finding:** Shell path + upload vector `/staging/test/upload.aspx`. ✅

### KF-04 — Pivot credential
- **Attack Event:** EVT-012 → EVT-013 → EVT-014
- **Evidence IDs:** E-EDR-004, E-AUTH-002/E-AUTH-003, E-FS-003, E-EDR-005
- **Evidence Types:** EDR (dump; search commands) | auth failures | file content
- **Corroborating Evidence:** E-AUTH-004 (credential then works), E-WIKI-001 (hygiene pattern W-03/W-05)
- **Candidate Inference:** old RajKulk@2023 fails (4625, 15:12); current RajKulk@2026 recovered from passwords.txt
- **Deterministic Finding:** Pivot credential = rajesh.kulkarni : RajKulk@2026, source `C:\Users\svc_portal\Documents\passwords.txt`. ✅

### KF-05 — Lateral movement
- **Attack Event:** EVT-015 (09-04 09:58), EVT-019 (09-04 13:10), EVT-021 (09-05 10:15)
- **Evidence IDs:** E-AUTH-004 + E-EDR-006 (hop 1); E-AUTH-006 + E-EDR-009 (DC-01); E-AUTH-007 + E-EDR-015 (hop 2)
- **Evidence Types:** Windows Security 4624 Type 10 | EDR session artifacts | 4662 replication | EDR session telemetry
- **Corroborating Evidence:** E-FS-003 (credential origin for hop 1); E-AD-001/002 (svc_mon is rogue, for hop 2)
- **Candidate Inference:** path = WEB-PRD-01 → APP-PRD-01 (rajesh.kulkarni) → DC-01; APP-PRD-01 → FILE-PRD-01 (svc_mon); valid-account movement (T1021.001 + T1078)
- **Deterministic Finding:** Hop list, accounts, timestamps as above. ✅ each hop ≥2 sources (E-EDR-015 added in v1.1 to close the EVT-021 single-source gap)

### KF-06 — Rogue AD account
- **Attack Event:** EVT-017 (2026-09-04 11:15–11:16 IST)
- **Evidence IDs:** E-AD-001, E-AD-002, E-AD-003
- **Evidence Types:** 4720 creation | 4728/4732 group adds | AD snapshot
- **Corroborating Evidence:** E-AUTH-007 + E-EDR-015 (account used in anger)
- **Candidate Inference:** svc_mon ("Monitoring Agent") is attacker-created persistence #1, Domain Admin, created from APP-PRD-01 by compromised rajesh.kulkarni
- **Deterministic Finding:** Persistence #1 = vistara\svc_mon. ✅

### KF-07 — Scheduled-task persistence
- **Attack Event:** EVT-018 (2026-09-04 11:30; first beacon 11:32)
- **Evidence IDs:** E-EDR-008, E-FS-004, E-NET-003, E-EDR-008B
- **Evidence Types:** EDR (schtasks /create) | task XML | FW-01 beacon cadence | PowerShell 4104 script block
- **Corroborating Evidence:** E-ALERT-001 (detection fires on exactly this behavior)
- **Candidate Inference:** persistence #2 = "MicrosoftEdgeUpdateTaskMachineCore", SYSTEM, 30-min encoded-PS beacon to 185.220.101.47:8443; name impersonation must be read past
- **Deterministic Finding:** Task name, host APP-PRD-01, C2 https://185.220.101.47:8443/beacon. ✅ 4 sources (E-EDR-008B registered in v1.1)

### KF-08 — DCSync
- **Attack Event:** EVT-019/EVT-020 (2026-09-04 13:10–13:20 IST)
- **Evidence IDs:** E-AUTH-006, E-EDR-009
- **Evidence Types:** 4662 replication access (DS-Replication-Get-Changes-All) | EDR mimikatz-style process (`/all` flag visible)
- **Corroborating Evidence:** E-ALERT-002 (SIEM correlation row); krbtgt capture deterministic from `/all` scope (no separate artifact — by design, see CONSISTENCY_QA_REPORT LOW-03)
- **Candidate Inference:** all domain NTLM hashes + krbtgt captured by rajesh.kulkarni from APP-PRD-01; mandates org-wide resets + krbtgt ×2
- **Deterministic Finding:** DCSync T1003.006, source APP-PRD-01, target DC-01, 13:10–13:14. ✅

### KF-09 — Collection
- **Attack Event:** EVT-022 (2026-09-05 10:20–11:45), EVT-023 (12:05)
- **Evidence IDs:** E-FS-005, E-EDR-010, E-SHARE-001; E-FS-006, E-EDR-011
- **Evidence Types:** file events | EDR commands | SMB audit
- **Corroborating Evidence:** E-EDR-015 (session continuity over the whole window)
- **Candidate Inference:** ~2.1 GB staged (S:\Clients designs, spec sheets, R:\HR\payroll_aug2026.xlsx, R:\Finance summaries) → order_export_2026.zip (~680 MB)
- **Deterministic Finding:** Data categories + staging path C:\Windows\Temp\collect\ + archive name. ✅ 3 sources

### KF-10 — Exfiltration
- **Attack Event:** EVT-010 (09-03 13:25–13:31, ~18 MB), EVT-024 (09-05 12:30–13:05, ~680 MB)
- **Evidence IDs:** E-NET-002 + E-FS-002 + E-EDR-002 (exfil #1); E-NET-004 + E-EDR-012 + E-FS-006 (exfil #2)
- **Evidence Types:** FW-01 outbound logs | file events | EDR
- **Corroborating Evidence:** E-PROXY-001 (negative proxy record — direct egress), E-NET-006 (NetFlow 7-day retention gap: 09-03 flow visible only in FW-01 logs + EDR — W-09 lesson)
- **Candidate Inference:** total ~698 MB to 185.220.101.47:8443 via HTTPS POST /upload
- **Deterministic Finding:** Volumes 18 MB + 680 MB ≈ 698 MB; destination 185.220.101.47:8443. ✅

### KF-11 — Detection
- **Attack Event:** EVT-031/EVT-032 (2026-09-09 09:47 / 09:52)
- **Evidence IDs:** E-ALERT-001, E-TICKET-001; E-ALERT-002
- **Evidence Types:** SIEM alert | ServiceNow ticket | SIEM correlation view
- **Corroborating Evidence:** E-EDR-008 + E-NET-003 (underlying behavior)
- **Candidate Inference:** true incident (Sev-1 per IR-Policy-01); alerting host APP-PRD-01; C2 185.220.101.47; dwell ≈ 6 days
- **Deterministic Finding:** True incident; alert EDR-20260909-0417 / INC-2026-0417. ✅

### KF-12 — Containment
- **Attack Event:** EVT-033 (2026-09-09 10:30)
- **Evidence IDs:** E-RESP-001, E-AD-004
- **Evidence Types:** isolation/block records | 4725 disable events
- **Corroborating Evidence:** E-NET-003 (beacons cease after 10:30), canonical set per SCENARIO_BIBLE §27
- **Candidate Inference:** correct set = isolate {APP-PRD-01, FILE-PRD-01, WEB-PRD-01} + disable {svc_mon, rajesh.kulkarni, svc_portal} + block 185.220.101.47 + suspend /staging/
- **Deterministic Finding:** 3 hosts, 3 accounts, 1 IOC, 1 web path. ✅

### KF-13 — Eradication
- **Attack Event:** EVT-035 (2026-09-09 12:00–15:00)
- **Evidence IDs:** E-RESP-003, E-AD-004 (deletion)
- **Evidence Types:** eradication checklist log | AD 4726
- **Corroborating Evidence:** E-FS-001/002/003/004/006 (targets), E-VALID-002 (post-verification), E-RESP-002 (preservation preceded it)
- **Candidate Inference:** ordered 7-step set (task → shell → staged artifacts → svc_mon → credential resets incl. krbtgt ×2 → W-01 fix → W-02b fix); "restore from backup alone" insufficient
- **Deterministic Finding:** Ordered set per SCENARIO_BIBLE §28. ✅

### KF-14 — Recovery
- **Attack Event:** EVT-036 (2026-09-09 15:00–17:30)
- **Evidence IDs:** E-RESP-004, E-VALID-001
- **Evidence Types:** restore logs | interim validation report
- **Corroborating Evidence:** BK-Policy-04 (RPO 24h) + 09-02 pre-incident backups; dependency order DC → WEB → APP → FILE
- **Candidate Inference:** identity first; known-compromised OS rebuilt, not patched-in-place; data restored from 09-02 backup after malware scan; 72h enhanced monitoring
- **Deterministic Finding:** Restoration order + go/no-go per host per SCENARIO_BIBLE §29. ✅

### KF-15 — Safe-state validation
- **Attack Event:** EVT-037 (2026-09-09 17:30)
- **Evidence IDs:** E-VALID-002, E-VALID-001, E-AD-003
- **Evidence Types:** validation report | interim validation | AD snapshot (svc_mon absent)
- **Corroborating Evidence:** E-RESP-003 (what was eradicated), E-NET-003 (no 8443 recurrence)
- **Candidate Inference:** the trap — "EDR clean" alone is insufficient; persistence re-check on rebuilt APP-PRD-01 + AD audit for svc_mon absence must be explicitly complete (E-VALID-002 shows the re-run at 16:55); residual risk = stolen data unrecoverable + W-05/W-06/W-08/W-09 open
- **Deterministic Finding:** 7-check gate per SCENARIO_BIBLE §30; declaration = SAFE only after checklist complete. ✅

---

## Part 2 — Full event-level traceability (all 38 EVT + 6 RH)

| Event | Evidence IDs (all registered in v1.1) | Sources independent? | Candidate inference supported? | Status |
|---|---|---|---|---|
| EVT-001 | E-NET-001 | n/a (recon context) | External scan mapped 3389 exposure | ✅ |
| EVT-002 | E-NET-001, E-WEB-001 | 2 | RDP reachable; web quiet during RDP recon | ✅ |
| EVT-003 | E-WEB-002 (+E-NET-001 same IP) | 2 | /staging/test/upload.aspx discovered | ✅ |
| EVT-004 | E-AUTH-001 (+E-NET-001 continuity) | 2 | Username enum; svc_portal valid | ✅ |
| EVT-005 | E-AUTH-001, E-NET-005 | 2 | Initial access 11:47 | ✅ (4628 removed v1.1) |
| EVT-006 | E-EDR-001, E-NET-005 | 2 | Interactive hands-on session | ✅ |
| EVT-007 (RH-01) | E-VULN-001 | n/a (noise; rule-out in-artifact + dossier registry) | On-demand internal scan — benign | ✅ v1.1 reclassification |
| EVT-008 | E-WEB-003, E-FS-001 | 2 | Web shell persistence #3 | ✅ |
| EVT-009 | E-EDR-002, E-FS-002 | 2 | staging.zip staged | ✅ |
| EVT-010 | E-NET-002, E-PROXY-001, E-NET-006 | 3 | Exfil #1 ~18 MB; NetFlow gap lesson | ✅ |
| EVT-011 | E-EDR-003 (+E-EDR-004 sequence) | 2 | Credential-hunting prep | ✅ |
| EVT-012 | E-EDR-004, E-AUTH-002 | 2 | Old password dumped, fails | ✅ |
| EVT-013 | E-AUTH-003 (+E-EDR-004) | 2 | Failed pivot attempt | ✅ |
| EVT-014 | E-FS-003, E-EDR-005, E-WIKI-001 | 3 | Pivot credential obtained | ✅ |
| EVT-015 | E-AUTH-004, E-EDR-006 | 2 | Lateral movement #1 | ✅ |
| EVT-016 | E-EDR-007, E-AUTH-005 | 2 | AD discovery; DA confirmed | ✅ |
| EVT-017 | E-AD-001, E-AD-002, E-AD-003 | 3 | Rogue account persistence #1 | ✅ |
| EVT-018 | E-EDR-008, E-EDR-008B, E-FS-004, E-NET-003 | 4 | Task persistence #2 + C2 | ✅ |
| EVT-019 | E-AUTH-006, E-EDR-009 | 2 | DCSync | ✅ |
| EVT-020 | (EVT-019 set; `/all` scope visible) | inference-by-design | krbtgt captured → double reset | ✅ by design |
| EVT-021 | E-AUTH-007, E-EDR-015 | 2 | Rogue account used; FILE-PRD-01 in scope | ✅ (E-EDR-015 added v1.1) |
| EVT-022 | E-FS-005, E-EDR-010, E-SHARE-001 | 3 | Collection ~2.1 GB | ✅ |
| EVT-023 | E-FS-006, E-EDR-011 | 2 | Archive staged | ✅ |
| EVT-024 | E-NET-004, E-EDR-012, E-FS-006 | 3 | Exfil #2 ~680 MB | ✅ |
| EVT-025 | E-DB-001, E-AUTH-008 | 2 | DB read-only; not compromised | ✅ |
| EVT-026 | E-EDR-013, E-AUTH-009 | 2 | ERP probed only | ✅ |
| EVT-027 (RH-02) | E-AUTH-010, E-WEB-004 | 2 | Benign traveling-user orders | ✅ |
| EVT-028 (RH-01) | E-VULN-002 | n/a | Weekly scheduled scan (Tue 2026-09-08 02:00) — benign | ✅ v1.1 date fix |
| EVT-029 (RH-03) | E-AUTH-011, E-DOC-003 | 2 | Benign approved travel | ✅ (E-DOC-003 added v1.1) |
| EVT-030 | E-EDR-014 (+SIEM retention) | 2 | Partial anti-forensics | ✅ |
| EVT-031 | E-ALERT-001, E-TICKET-001, E-EDR-008, E-NET-003 | 4 | True incident declared | ✅ |
| EVT-032 | E-ALERT-002 (+primaries) | 2 | Correlated cluster seeds timeline | ✅ |
| EVT-033 | E-RESP-001, E-AD-004 | 2 | Containment executed | ✅ |
| EVT-034 | E-RESP-002 (+SIEM export) | 2 | Preservation before eradication | ✅ |
| EVT-035 | E-RESP-003, E-AD-004, E-VALID-002 | 3 | Eradication complete | ✅ |
| EVT-036 | E-RESP-004, E-VALID-001 | 2 | Recovery in correct order | ✅ |
| EVT-037 | E-VALID-002, E-VALID-001, E-AD-003 | 3 | Safe-state gate incl. trap | ✅ |
| EVT-038 | E-REPORT-001 | n/a (deliverable) | Closure + residual risk | ✅ |
| RH-04 | E-AD-003 (last_logon_ist ~2025-07) + auth-log absence | 2 | Weak-but-unused; hygiene finding | ✅ |
| RH-05 | E-FS-007, E-DOC-002 (+E-WEB-003 contrast) | 3 | 2025 quarantined shell; not this incident | ✅ (E-FS-007 registered v1.1) |
| RH-07 | E-AUTH-001 + E-NET-001 (interleaved noise) | 2 | Ambient scanners; zero successes | ✅ |

**Broken references after v1.1:** none. **Single-source key findings:** none (EVT-020 is inference-by-design, documented).
