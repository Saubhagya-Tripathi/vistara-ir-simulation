# EVIDENCE_MATRIX.md

**Master Evidence Correlation Matrix — Vistara Polymers Incident**
**Version:** 1.1 — Agent 3.5 consistency pass (2026-09-11)
**Canonical sources:** ATTACK_TIMELINE.md (EVT/RH/E-codes), SCENARIO_BIBLE.md, ENVIRONMENT.md, SIMULATION_REQUIREMENTS.md
**Convention:** All timestamps IST (UTC+05:30). Only canonical names/IPs/paths used. No new facts invented.

---

## 1. Master Matrix

Columns: Attack Event | Evidence IDs | Evidence Type | Evidence Source (host/system) | What the Candidate Can Infer | Required Corroboration (≥2 independent sources) | Relevant Investigation Phase (SIM_REQUIREMENTS §9)

### PHASE A — RECONNAISSANCE (2026-09-02 → 2026-09-04)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-001 — 2026-09-02 14:12 TCP SYN scan ports 1–10000 from 45.155.90.23 | E-NET-001 | FW-01 deny/allow log | FW-01 | External host mapped exposed services; recon preceding intrusion | E-NET-001 (scan from 45.155.90.23) + E-WEB-001 (IIS 404s in same window) — both single-actor sourced from 45.155.90.23, timing-consistent | 1 |
| EVT-002 — 2026-09-02 14:31 RDP banner grab / NLA check | E-NET-001, E-WEB-001 | FW-01 log + IIS log | FW-01 / WEB-PRD-01 | 3389 confirmed reachable on 203.0.113.10 — W-01 exposure discovered by attacker | E-NET-001 (3389 connect attempt) + dossier FW-01 rule review showing any→203.0.113.10:3389 stale rule (E-DOC-001 origin) | 1–2 |
| EVT-003 — 2026-09-02 15:05 gobuster dir enumeration of /staging/ | E-WEB-002 | IIS access log | WEB-PRD-01 | Attacker discovered /staging/test/upload.aspx (200) — future web-shell vector; distinguishes scanner-style 404 burst from benign bots via UA "Go-http-client/1.1" + focused path | E-WEB-002 (404 burst then 200s on /staging/) + timing correlation with E-NET-001 (same source IP 45.155.90.23) | 1–2 |
| EVT-004 — 2026-09-03 10:22 RDP username enumeration | E-AUTH-001 | Windows Security 4625 bursts | WEB-PRD-01 | Targeted username probing (svc_portal yields distinct substatus/timing = valid account); distinct from ambient scanners | E-AUTH-001 (4625 substatus pattern, common usernames) + single-source IP 45.155.90.23 continuity with E-NET-001 | 2 |
| EVT-005 — 2026-09-03 11:40–11:47 svc_portal brute force, success 11:47 | E-AUTH-001, E-NET-005 | Security 4625 (10:22–11:46) + 4624 Type 10 success (+ DC-01 4776) + FW-01 session log | WEB-PRD-01 / FW-01 / DC-01 | **Initial access:** svc_portal password (Portal@2024, W-03) brute-forced over exposed RDP (W-01) | E-AUTH-001 (failure run + 4624 Type 10 success from 45.155.90.23 + DC-01 4776 NTLM validations) + E-NET-005 (FW-01 TCP 3389 session 45.155.90.23 → 203.0.113.10, 11:47–12:20) + E-EDR-001 (interactive cmd session immediately after, EVT-006) | 2 |
| EVT-006 — 2026-09-03 11:47–12:20 interactive RDP as svc_portal; whoami/ipconfig/net/quser | E-EDR-001, E-NET-005 | EDR process telemetry + FW-01 session log | WEB-PRD-01 / FW-01 | Hands-on-keyboard session; svc_portal is local admin on WEB-PRD-01 (legacy app-pool setup) | E-EDR-001 (process tree) + E-NET-005 (FW-01 RDP session 11:47–12:20) + E-AUTH-001 (4624 Type 10 session from 45.155.90.23 at 11:47) | 2–3 |
| EVT-007 — 2026-09-04 09:15 VULN-01 on-demand authenticated scan (noise) | E-VULN-001 | Scanner job log | VULN-01 (10.10.40.13) | **RED HERRING RH-01:** benign; internal authenticated scanner, on-demand/manual scan initiated by devang.shah (pre-peak-season baseline re-scan; NOT the weekly Tuesday job), job VS-MAN-2026-0904 | E-VULN-001 (authenticated job log) + source 10.10.40.13 = dossier scanner; no post-scan attacker behavior | 1 |

### PHASE B — INITIAL ACCESS / FOOTHOLD (2026-09-03 → 2026-09-04)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-008 — 2026-09-03 13:02 web shell upload via /staging/test/upload.aspx → img.aspx | E-WEB-003, E-FS-001 | IIS log + file-creation event | WEB-PRD-01 | **Persistence #3:** attacker placed web shell at C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx via W-02b; cmd-eval GETs from 13:04 | E-WEB-003 (POST 200 to upload.aspx then GET img.aspx?cmd=…) + E-FS-001 (file creation event, matching timestamp) | 2–3 |
| EVT-009 — 2026-09-03 13:10 Compress-Archive of /staging → staging.zip | E-EDR-002, E-FS-002 | EDR process + file event | WEB-PRD-01 | Portal source/config staged (~18 MB) at C:\ProgramData\Microsoft\Crypto\RSA\staging.zip — collection begins | E-EDR-002 (Compress-Archive command line) + E-FS-002 (zip file creation) | 3 |
| EVT-010 — 2026-09-03 13:25–13:31 exfil staging.zip → 185.220.101.47:8443 | E-NET-002, E-PROXY-001 | FW-01 outbound log + proxy absence note | FW-01 / WEB-PRD-01 | **First exfiltration:** ~18 MB source code to attacker VPS, direct (no proxy) | E-NET-002 (10.10.20.11 → 185.220.101.47:8443, ~18 MB) + E-FS-002/E-EDR-002 (staged archive created minutes before) + E-NET-006 (NetFlow retention summary: 09-03 flow absent from 7-day NetFlow, survives only in FW-01 logs + EDR — W-09 lesson) | 3–4 |
| EVT-011 — 2026-09-03 14:40 host recon (netstat, tasklist, wmic, appcmd) | E-EDR-003 | EDR process telemetry | WEB-PRD-01 | Credential-hunting prep; w3wp.exe runs as svc_portal | E-EDR-003 (recon command set) + E-EDR-004 (dump follows at 15:05) | 3 |
| EVT-012 — 2026-09-03 15:05 memory scrape w3wp.exe + credential manager; recovers RajKulk@2023 | E-EDR-004, E-AUTH-002 | EDR telemetry + auth log | WEB-PRD-01 | OS credential dumping (T1003); old rajesh.kulkarni password recovered | E-EDR-004 (suspicious w3wp dump + Credential Manager file access) + E-AUTH-002 (subsequent NTLM attempt as rajesh.kulkarni 15:12, fails) | 3 |
| EVT-013 — 2026-09-03 15:12 failed lateral move with RajKulk@2023 | E-AUTH-003 | Security 4625 (bad password) | APP-PRD-01 | Old password dead; confirms account rajesh.kulkarni is live; attacker still probing | E-AUTH-003 (4625 from 10.10.20.11) + E-EDR-004 (dump source established on WEB-PRD-01) | 3 |
| EVT-014 — 2026-09-03 16:20 passwords.txt yields RajKulk@2026 | E-FS-003, E-EDR-005, E-WIKI-001 | File metadata/content + EDR + wiki | WEB-PRD-01 / wiki | **Pivot credential obtained:** C:\Users\svc_portal\Documents\passwords.txt contains rajesh.kulkarni:RajKulk@2026; svc_portal:Portal@2024 also in wiki (W-03/W-05) | E-FS-003 (file content/metadata) + E-EDR-005 (type/findstr commands); E-WIKI-001 corroborates the weak-credential hygiene pattern | 3 |

### PHASE C — EXECUTION / PRIVILEGE ABUSE (2026-09-04)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-015 — 2026-09-04 09:58 RDP WEB-PRD-01 → APP-PRD-01 as rajesh.kulkarni | E-AUTH-004, E-EDR-006 | Security 4624 Type 10 + EDR | APP-PRD-01 | **Lateral movement #1:** valid-account (T1078/T1021.001) pivot to app tier; source 10.10.20.11 | E-AUTH-004 (4624 success 09:58, source WEB-PRD-01) + E-EDR-006 (rdpclip/mstsc artifacts) + E-FS-003 (credential origin) | 4 |
| EVT-016 — 2026-09-04 10:05–10:40 AD discovery (net group DA/EA, nltest, net view, LDAP) | E-EDR-007, E-AUTH-005 | EDR commands + LDAP binds | APP-PRD-01 → DC-01 | Attacker maps domain; learns rajesh.kulkarni is Domain Admin (W-04); identifies DC-01/DC-02, FILE-PRD-01 | E-EDR-007 (AD recon command lines) + E-AUTH-005 (LDAP binds to DC-01 from APP-PRD-01) | 4 |
| EVT-017 — 2026-09-04 11:15 create svc_mon + Domain Admins/RDP group adds | E-AD-001, E-AD-002, E-AD-003 | DC security events 4720/4728/4732 + AD snapshot | DC-01 (originating APP-PRD-01) | **Persistence #1:** rogue DA account vistara\svc_mon ("Monitoring Agent"), password Mon!tor#2026 | E-AD-001 (4720 creation 11:15, source APP-PRD-01) + E-AD-002 (4728/4732 group adds 11:16) + E-AD-003 (AD object snapshot) | 4 |
| EVT-018 — 2026-09-04 11:30 scheduled task C2 beacon (SYSTEM, every 30 min) | E-EDR-008, E-FS-004, E-NET-003, E-EDR-008B | EDR + task XML + FW egress + PS script-block log | APP-PRD-01 / FW-01 | **Persistence #2:** "MicrosoftEdgeUpdateTaskMachineCore" task, powershell -enc beacon to https://185.220.101.47:8443/beacon | E-EDR-008 (schtasks /create, encoded PS) + E-FS-004 (task XML) + E-NET-003 (8443 egress every 30 min) + E-EDR-008B (PowerShell Operational 4104 script-block, 11:32, decoded beacon URL) | 4 |
| EVT-019 — 2026-09-04 13:10–13:14 DCSync from APP-PRD-01 to DC-01 as rajesh.kulkarni | E-AUTH-006, E-EDR-009 | 4662 replication access + EDR | DC-01 / APP-PRD-01 | **Domain dominance:** DRS replication requests dump all domain NTLM hashes (T1003.006) | E-AUTH-006 (4662 replication 13:10–13:14, account rajesh.kulkarni, source APP-PRD-01) + E-EDR-009 (mimikatz-style process + lsadump strings) | 4 |
| EVT-020 — 2026-09-04 13:20 krbtgt hash captured (reserve capability) | (EVT-019 evidence set) | Same 4662/EDR artifacts | DC-01 | Golden-ticket capability exists but is never exercised — forces double krbtgt reset in eradication | E-AUTH-006 + E-EDR-009 (DCSync scope /all includes krbtgt); inference, not separate artifact | 4 |

### PHASE D — DISCOVERY / LATERAL MOVEMENT / COLLECTION (2026-09-05 → 2026-09-08)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-021 — 2026-09-05 10:15 RDP APP-PRD-01 → FILE-PRD-01 as svc_mon | E-AUTH-007, E-EDR-015 | Security 4624 Type 10 + EDR session telemetry | FILE-PRD-01 | **Lateral movement #2:** rogue account svc_mon validated in use; source 10.10.20.21 | E-AUTH-007 (4624 svc_mon from APP-PRD-01) + E-EDR-015 (EDR RDP session svc_mon from 10.10.20.21, 10:15→13:05, spanning collection→archive→exfil) + E-AD-001/002 (svc_mon created by attacker 09-04) | 4 |
| EVT-022 — 2026-09-05 10:20–11:45 share discovery + staging of ~2.1 GB to C:\Windows\Temp\collect\ | E-FS-005, E-EDR-010, E-SHARE-001 | File events + EDR + SMB audit | FILE-PRD-01 | **Collection:** client designs (S:\Clients), payroll_aug2026.xlsx (R:\HR), finance summaries (R:\Finance) staged | E-FS-005 (copy events, Temp\collect creation) + E-EDR-010 (robocopy/copy commands) + E-SHARE-001 (SMB session + file-open audit) | 4 |
| EVT-023 — 2026-09-05 12:05 Compress-Archive → order_export_2026.zip (~680 MB) | E-FS-006, E-EDR-011 | File event + EDR | FILE-PRD-01 | Archive staged for exfil; archive name order_export_2026.zip | E-FS-006 (zip creation) + E-EDR-011 (Compress-Archive command) | 4 |
| EVT-024 — 2026-09-05 12:30–13:05 exfil #2: 680 MB HTTPS POST → 185.220.101.47:8443 | E-NET-004, E-EDR-012 | FW-01 outbound + EDR | FW-01 / FILE-PRD-01 | **Exfiltration volume + destination:** ~680 MB chunked POST to /upload from 10.10.20.23 | E-NET-004 (FW-01 flow, volume, window) + E-EDR-012 (Invoke-WebRequest/curl process to 185.220.101.47) + E-FS-006 (archive existence) | 4 |
| EVT-025 — 2026-09-05 15:20–15:41 read-only SQL enumeration of DB-PRD-01 (rajesh.kulkarni) | E-DB-001, E-AUTH-008 | SQL audit + 4624 | DB-PRD-01 | DB-PRD-01 accessed read-only (sys.databases, 5-row samples) — **not compromised, no bulk DB exfil** (scoping judgment) | E-DB-001 (query log, read-only) + E-AUTH-008 (network logon from FILE-PRD-01) | 4–5 |
| EVT-026 — 2026-09-06 09:30 ERP-APP-01 probe (failed SMB 09:33) | E-EDR-013, E-AUTH-009 | EDR + 4625 audit | APP-PRD-01 / ERP-APP-01 | ERP probed, not entered; single failed SMB connect (4625) only; no successful logon follows; ERP-APP-01 out of compromise scope | E-EDR-013 (wmic/net use probes) + E-AUTH-009 (single failed SMB connect (4625) only on ERP-APP-01) | 4–5 |
| EVT-027 — 2026-09-06 16:45 pranav.joshi odd-hour orders via VPN (noise) | E-AUTH-010, E-WEB-004 | VPN log + IIS/API | VPN-GW-01 / WEB-PRD-01 | **RED HERRING RH-02:** benign; Ahmedabad office IP 122.176.45.9, orders match dealer PO pattern | E-AUTH-010 (VPN ties to 122.176.45.9) + E-WEB-004 (order API calls match legitimate POs) | 1–5 |
| EVT-028 — 2026-09-08 02:00 VULN-01 weekly scheduled scan (noise) | E-VULN-002 | Scanner job log | VULN-01 | **RED HERRING RH-01 (recurrence):** weekly scheduled scan on the Tuesday 02:00 IST schedule (job VS-WK37-2026), internal 10.10.40.13, authenticated | E-VULN-002 (job log) + dossier scanner registry (10.10.40.13) | 1–5 |
| EVT-029 — 2026-09-07 11:20 ananya.iyer VPN from Ahmedabad (noise) | E-AUTH-011, E-DOC-003 | VPN + ERP 4624 + HR travel record | VPN-GW-01 / ERP-APP-01 | **RED HERRING RH-03:** benign travel; HR-approved ticket TRV-2026-0312; role-consistent ERP use | E-AUTH-011 (VPN 11:20 + ERP logon 11:26) + E-DOC-003 (HR travel approval TRV-2026-0312) | 1–5 |
| EVT-030 — 2026-09-08 10:05 anti-forensics: clear PS history, empty recycle bins | E-EDR-014 | EDR telemetry | APP-PRD-01 | Partial cleanup attempt; event logs intact (no server log-cleaning under EDR); SIEM copies preserved | E-EDR-014 (Clear-History, ConsoleHost_history.txt deletion) + SIEM-retained copies of prior events | 3–4 |

### PHASE E — DETECTION (2026-09-09)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-031 — 2026-09-09 09:47 EDR alert → INC-2026-0417 | E-ALERT-001, E-TICKET-001 | SIEM alert + ServiceNow ticket | EDR-CON-01 / SIEM-01 | **Detection trigger:** "Suspicious PowerShell encode + external connection" on APP-PRD-01; true incident (Sev-1 per IR-Policy-01) | E-ALERT-001 (alert detail: host, 8443, 185.220.101.47) + E-TICKET-001 (INC-2026-0417) + underlying E-EDR-008/E-NET-003 | 0–1 |
| EVT-032 — 2026-09-09 09:52 SIEM retrospective correlation cluster | E-ALERT-002 | SIEM correlation view | SIEM-01 | Cluster of related signals: svc_mon logons, DC-01 4662, 8443 egress from WEB-PRD-01 (09-03) and FILE-PRD-01 (09-05) — timeline seed | E-ALERT-002 + the underlying primary artifacts (E-AUTH-007, E-AUTH-006, E-NET-002, E-NET-004) | 1 |

### PHASE F — RESPONSE (2026-09-09 → 2026-09-10; canonical correct path, candidate-driven)

| Attack Event | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Required Corroboration | Phase |
|---|---|---|---|---|---|---|
| EVT-033 — 09-09 10:30 containment (isolate 3 hosts, disable 3 accounts, block 185.220.101.47) | E-RESP-001, E-AD-004 | Isolation records + 4725/4726 | FW-02/EDR-CON-01, DC-01 | Containment executed per canonical set (Bible §27) | E-RESP-001 + E-AD-004 (disable events) | 6 |
| EVT-034 — 09-09 11:00 evidence preservation | E-RESP-002 | Preservation records | All three hosts + SIEM | Chain of custody before destructive actions | E-RESP-002 + SIEM export record | 6 |
| EVT-035 — 09-09 12:00 eradication (ordered 7 steps incl. krbtgt ×2) | E-RESP-003 | Eradication checklist execution | APP-PRD-01, WEB-PRD-01, AD, FW-01 | All persistence removed, W-01/W-02b closed, credentials reset | E-RESP-003 + E-AD-004 + re-verification in E-VALID-001/002 | 6 |
| EVT-036 — 09-09 15:00 recovery (DC validate → WEB rebuild → APP rebuild → FILE restore) | E-RESP-004, E-VALID-001 | Restore logs + validation | WEB/APP/FILE, DC-01 | Correct sequencing: identity first, rebuild known-compromised, restore from 09-02 backup | E-RESP-004 + E-VALID-001 | 6 |
| EVT-037 — 09-09 17:30 safe-state validation gate | E-VALID-002 | Validation report | All touched hosts + AD + FW-01 | 7-check gate (Bible §30) passed; trap: EDR-clean alone insufficient — persistence re-check on rebuilt hosts + svc_mon absence required | E-VALID-002 + E-VALID-001 + AD snapshot (svc_mon absent) | 7 |
| EVT-038 — 09-10 10:00 final report / closure | E-REPORT-001 | Incident report | Candidate deliverable | Residual risk acknowledged (stolen data, W-05 hygiene, W-06, W-08, W-09) | E-REPORT-001 + consistency with phase answers | 7 |

### RED HERRING / NOISE LEDGER (RH-01, RH-02, RH-03, RH-04, RH-05, RH-07)

| Red Herring | Evidence IDs | Evidence Type | Evidence Source | What the Candidate Can Infer | Rule-Out Evidence (named) | Phase |
|---|---|---|---|---|---|---|
| RH-01 — VULN-01 authenticated scans (EVT-007 2026-09-04 09:15 on-demand/manual by devang.shah, job VS-MAN-2026-0904; EVT-028 2026-09-08 02:00 weekly scheduled, job VS-WK37-2026) | E-VULN-001, E-VULN-002 | Scanner job logs | VULN-01 (10.10.40.13) | Scanning mimics recon | Internal scanner source 10.10.40.13 (VULN-01, registered in asset inventory); authenticated scan using svc_monitor with a scanner job log; operator devang.shah; scan pattern is plugin-based host enumeration with no follow-on exploitation; no attacker behavior is ever sourced from 10.10.40.13 | 1 |
| RH-02 — pranav.joshi odd-hour portal orders 09-06 16:45 (EVT-027) | E-AUTH-010, E-WEB-004 | VPN log + portal API log | VPN-GW-01 / WEB-PRD-01 | Odd-hour account use | VPN source = Ahmedabad office IP 122.176.45.9; orders match dealer PO pattern; no host compromise telemetry | 1–5 |
| RH-03 — ananya.iyer VPN from Ahmedabad 09-07 11:20 (EVT-029) | E-AUTH-011, E-DOC-003 | VPN + ERP auth log + HR travel record | VPN-GW-01 / ERP-APP-01 | Out-of-city login in window | E-AUTH-011 (VPN + ERP logon) + E-DOC-003 (HR-approved travel record TRV-2026-0312) + E-AUTH-012 (full-window VPN summary shows no anomalous sessions); ERP activity matches finance role; no lateral movement after | 1–5 |
| RH-04 — admin_legacy enabled, weak password (Vistara#Admin1) | (dossier AD registry; absence of E-AUTH events) | AD snapshot + auth-log absence | DC-01 | Juicy weak admin account — unused | No logons for 14 months in auth telemetry (last_logon_ist ≈2025-07 in E-AD-003 AD snapshot); never appears in any EVT row or attack-path evidence | 3–5 |
| RH-05 — 2025 quarantined web shell upload_bak.aspx on WEB-PRD-01 | E-DOC-002, E-FS-007 | Prior IR report + FS metadata | WEB-PRD-01 | Old shell looks like current foothold | File timestamp 2025-11-08 (E-FS-007 file metadata); quarantine note in E-DOC-002; no 2026 IIS execution entries in E-WEB-003 | 2–3 |
| RH-07 — Internet background 3389 scanners | E-AUTH-001 (background 4625s), E-NET-001 | Auth log + FW log | FW-01 / WEB-PRD-01 | Constant low-grade failures look threatening | Distributed random source IPs, zero successes; contrast with focused single-source 45.155.90.23 campaign culminating in success 11:47 | 1–2 |

Note: RH-06 (WSUS maintenance churn) was removed in v1.1 as it lacked resolvable candidate-visible evidence; the RH-06 ID is retired and not reused.

---

## 2. Classification of All E-Codes: Decisive / Corroborating / Red-Herring

**Decisive** = required for a key finding (appears in §3 minimum-evidence sets). **Corroborating** = strengthens/adds context but not strictly required. **Red-herring/noise** = benign by design.

| E-Code | Artifact | Class | Anchors |
|---|---|---|---|
| E-ALERT-001 | SIEM alert INC-2026-0417 | Decisive | Detection trigger (EVT-031) |
| E-ALERT-002 | SIEM correlation cluster | Corroborating | Timeline seed (EVT-032) |
| E-TICKET-001 | ServiceNow INC-2026-0417 | Corroborating | Entry context |
| E-WEB-001 | IIS log (unrelated 404s, scan window) | Corroborating | EVT-002 window |
| E-WEB-002 | IIS gobuster burst on /staging/ | Decisive | Recon→web-shell vector (EVT-003) |
| E-WEB-003 | IIS POST upload.aspx + GET img.aspx | Decisive | Web shell (EVT-008) |
| E-WEB-004 | Portal order API calls (pranav) | Red-herring | RH-02 |
| E-AUTH-001 | WEB-PRD-01 4625 bursts + 4624 Type 10 success 11:47 (+ DC-01 4776) | Decisive | Brute force + initial access (EVT-004/005); also hosts RH-07 background |
| E-AUTH-002 | Failed NTLM rajesh.kulkarni 15:12 | Corroborating | Old-password dead end (EVT-012) |
| E-AUTH-003 | APP-PRD-01 4625 from WEB-PRD-01 | Corroborating | EVT-013 |
| E-AUTH-004 | APP-PRD-01 4624 Type 10 09:58 | Decisive | Lateral movement (EVT-015) |
| E-AUTH-005 | LDAP binds APP-PRD-01→DC-01 | Corroborating | AD discovery (EVT-016) |
| E-AUTH-006 | DC-01 4662 replication 13:10–13:14 | Decisive | DCSync (EVT-019/020) |
| E-AUTH-007 | FILE-PRD-01 4624 svc_mon 10:15 | Decisive | Rogue-account use (EVT-021) |
| E-AUTH-008 | DB-PRD-01 4624 from FILE-PRD-01 | Corroborating | DB read-only access (EVT-025) |
| E-AUTH-009 | ERP-APP-01 single failed SMB connect (4625) 09:33 | Corroborating | Probe only (EVT-026) |
| E-AUTH-010 | VPN log pranav.joshi 122.176.45.9 | Red-herring | RH-02 |
| E-AUTH-011 | VPN + ERP log ananya.iyer | Red-herring | RH-03 |
| E-AUTH-012 | VPN-GW-01 full-window session summary 09-02→09-09 | Corroborating | VPN negative evidence; closes "initial access via VPN?" question; RH-02/RH-03 context |
| E-EDR-001 | WEB-PRD-01 cmd/whoami/ipconfig tree | Decisive | Interactive session post-brute-force (EVT-006) |
| E-EDR-002 | Compress-Archive staging.zip | Decisive | Source staging (EVT-009) |
| E-EDR-003 | netstat/tasklist/appcmd recon | Corroborating | EVT-011 |
| E-EDR-004 | w3wp dump + CredMgr access | Decisive | Credential dumping (EVT-012) |
| E-EDR-005 | type/findstr credential search | Decisive | passwords.txt discovery (EVT-014) |
| E-EDR-006 | rdpclip/mstsc on APP-PRD-01 | Corroborating | EVT-015 |
| E-EDR-007 | AD recon commands (net group, nltest) | Decisive | Discovery (EVT-016) |
| E-EDR-008 | schtasks /create + encoded PS | Decisive | Task persistence (EVT-018) |
| E-EDR-008B | PowerShell 4104 script-block of encoded beacon | Corroborating | EVT-018 beacon payload (second source) |
| E-EDR-009 | mimikatz-style process + lsadump strings | Decisive | DCSync (EVT-019) |
| E-EDR-010 | robocopy/copy commands FILE-PRD-01 | Decisive | Collection (EVT-022) |
| E-EDR-011 | Compress-Archive order_export_2026.zip | Decisive | Staging (EVT-023) |
| E-EDR-012 | Invoke-WebRequest/curl to 185.220.101.47 | Decisive | Exfil #2 (EVT-024) |
| E-EDR-013 | wmic/net use ERP probes | Corroborating | EVT-026 |
| E-EDR-014 | Clear-History / history deletion | Corroborating | Anti-forensics (EVT-030) |
| E-EDR-015 | FILE-PRD-01 svc_mon RDP session telemetry 10:15→13:05 | Corroborating | EVT-021 (+ continuity for EVT-022/023/024) |
| E-FS-001 | img.aspx file creation | Decisive | Web shell (EVT-008) |
| E-FS-002 | staging.zip creation | Decisive | EVT-009 |
| E-FS-003 | passwords.txt metadata + content | Decisive | Pivot credential (EVT-014) |
| E-FS-004 | Scheduled task XML | Decisive | Task persistence (EVT-018) |
| E-FS-005 | Temp\collect copy events | Decisive | Collection (EVT-022) |
| E-FS-006 | order_export_2026.zip creation | Decisive | Staging/exfil (EVT-023/024) |
| E-FS-007 | upload_bak.aspx 2025 file metadata (quarantined 2025-11-08) | Red-herring | RH-05 surface (rule-out via timestamp + E-DOC-002 + no 2026 execution in E-WEB-003) |
| E-NET-001 | FW-01 scan + RDP logs from 45.155.90.23 | Decisive | Recon + exposure (EVT-001/002) |
| E-NET-002 | FW-01 outbound 18 MB 09-03 | Decisive | Exfil #1 (EVT-010) |
| E-NET-003 | 8443 beacon cadence every 30 min | Decisive | C2 (EVT-018) |
| E-NET-004 | FW-01 outbound 680 MB 09-05 | Decisive | Exfil #2 volume/dest (EVT-024) |
| E-NET-005 | FW-01 RDP session log 45.155.90.23 → 203.0.113.10, 09-03 11:47–12:20 | Corroborating | EVT-005/006 |
| E-NET-006 | NetFlow 7-day retention summary (09-03 flow absent; FW-01 logs survive) | Corroborating | Retention / W-09 teaching point; EVT-010/024 context |
| E-PROXY-001 | Proxy absence note (explicit negative record: no matching entries; direct egress) | Corroborating | EVT-010 |
| E-AD-001 | DC-01 4720 svc_mon creation | Decisive | Rogue account (EVT-017) |
| E-AD-002 | 4728/4732 group additions | Decisive | Privilege grant (EVT-017) |
| E-AD-003 | AD snapshot svc_mon in Domain Admins (includes last_logon_ist per object) | Corroborating | EVT-017; safe-state re-check; RH-04 rule-out surface |
| E-AD-004 | 4725/4726 disable events | Corroborating | Containment (EVT-033) |
| E-DB-001 | SQL audit (read-only queries) | Decisive (scoping) | DB-PRD-01 not compromised (EVT-025) |
| E-SHARE-001 | SMB session + file-open audit FILE-PRD-01 | Decisive | Collection (EVT-022) |
| E-VULN-001/002 | VULN-01 scan job logs (09-04 on-demand VS-MAN-2026-0904; 09-08 weekly VS-WK37-2026) | Red-herring | RH-01 |
| E-WIKI-001 | Service-account wiki (svc_portal:Portal@2024) | Corroborating | W-03 documentation (EVT-014) |
| E-DOC-001 | 2025 vendor RDP email | Corroborating | W-01 origin (CH-Policy-03 violation) |
| E-DOC-002 | 2025 prior IR report | Red-herring (rule-out) | RH-05 |
| E-DOC-003 | HR travel approval TRV-2026-0312 (ananya.iyer) | Corroborating (RH-03 rule-out) | RH-03 / EVT-029 |
| E-RESP-001..004 | Response execution records | Corroborating | EVT-033..036 |
| E-VALID-001/002 | Validation reports | Decisive (Phase 7 gate) | EVT-036/037 |
| E-REPORT-001 | Final incident report | Corroborating | EVT-038 |

---

## 3. Minimum-Evidence Conclusions (10 Key Findings)

Each conclusion requires combining the listed evidence IDs — **no single artifact suffices** (SIM_REQUIREMENTS §7.2 / §15.1).

| # | Key Finding | Minimum Evidence Combination |
|---|---|---|
| 1 | **Initial access vector** = RDP brute force of svc_portal over internet-exposed 3389 (W-01 + W-03), success 2026-09-03 11:47 from 45.155.90.23 | **E-AUTH-001** (4625 run + 4624 Type 10 success + DC-01 4776 validations) + **E-NET-005** (FW-01 3389 session 11:47–12:20) + **E-NET-001** (3389 reachable/scanned from same IP) + **E-EDR-001** (interactive session follows) |
| 2 | **Brute-forced account** = svc_portal (Portal@2024) | **E-AUTH-001** (success on svc_portal) + **E-WIKI-001** (wiki documents weak password) or **E-FS-003** (passwords.txt confirms Portal@2024) |
| 3 | **Web shell location** = C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx | **E-WEB-003** (POST to upload.aspx + GET img.aspx callbacks) + **E-FS-001** (file creation at that path) |
| 4 | **Pivot credential source** = passwords.txt on WEB-PRD-01 yielded rajesh.kulkarni:RajKulk@2026 | **E-FS-003** (file content) + **E-EDR-005** (search/type commands) + **E-AUTH-004** (subsequent successful use) |
| 5 | **Lateral movement path** = WEB-PRD-01 → APP-PRD-01 (rajesh.kulkarni) → DC-01; APP-PRD-01 → FILE-PRD-01 (svc_mon) | **E-AUTH-004** + **E-EDR-006** (first hop); **E-AUTH-006** (DC-01 access); **E-AUTH-007** + **E-EDR-015** (FILE-PRD-01 hop) — ≥2 independent logon records with source/attribution |
| 6 | **Rogue account persistence** = svc_mon in Domain Admins, created 09-04 11:15 from APP-PRD-01 | **E-AD-001** (4720 creation) + **E-AD-002** (4728/4732 group adds) + **E-AD-003** (AD snapshot) or **E-AUTH-007** (account used in anger) |
| 7 | **Scheduled-task persistence** = "MicrosoftEdgeUpdateTaskMachineCore" on APP-PRD-01, SYSTEM, 30-min encoded-PS beacon | **E-EDR-008** (schtasks creation + encoded PS) + **E-FS-004** (task XML) + **E-NET-003** (observed 30-min 8443 cadence) + **E-EDR-008B** (4104 script-block, decoded beacon payload) |
| 8 | **DCSync / domain dominance** = replication from APP-PRD-01 to DC-01 as rajesh.kulkarni, all NTLM hashes + krbtgt | **E-AUTH-006** (4662 replication access) + **E-EDR-009** (mimikatz/lsadump process evidence) |
| 9 | **Exfil volumes + destination** = ~18 MB (09-03) + ~680 MB (09-05) to 185.220.101.47:8443 | **E-NET-002** + **E-FS-002** (exfil #1); **E-NET-004** + **E-EDR-012** + **E-FS-006** (exfil #2 volume/destination) |
| 10 | **Detection trigger** = EDR behavior alert on APP-PRD-01 beacon (encoded PS + 8443 egress), 2026-09-09 09:47 | **E-ALERT-001** (alert detail) + **E-EDR-008**/**E-NET-003** (underlying behavior) + **E-TICKET-001** (escalation) |

---

## 4. Noise-Budget Note

Six red herrings/noise classes are defined (RH-01, RH-02, RH-03, RH-04, RH-05, RH-07) against 38 canonical events and ~52 registered evidence artifacts. Herring-bearing artifacts: E-VULN-001, E-VULN-002, E-WEB-004, E-AUTH-010, E-AUTH-011, E-DOC-002, E-FS-007, plus ambient noise interleaved inside E-AUTH-001 / E-NET-001 (RH-07 background scanners) and benign-bot traffic in E-WEB-001 — ≈9 of ~52 registered artifacts (~17% by artifact count), with raw-line noise held at 20–30% via interleaved benign lines per SIMULATION_REQUIREMENTS §15.5 (the ambient scanner noise and benign-user activity inflate raw line counts, not artifact count, keeping the effective noise ratio in the 20–30% band without obscuring the real path). Every herring is rule-out-able with named in-simulation evidence:

- **RH-01:** E-VULN-001/002 scanner job logs + internal source 10.10.40.13 (VULN-01, registered in asset inventory) + authenticated svc_monitor scans; operator devang.shah; plugin-based host enumeration with no follow-on exploitation; no attacker behavior ever sourced from 10.10.40.13.
- **RH-02:** E-AUTH-010 (Ahmedabad office IP 122.176.45.9) + E-WEB-004 (orders match dealer POs) + E-AUTH-012 (full-window VPN summary, no anomalies).
- **RH-03:** E-AUTH-011 + E-DOC-003 (HR travel approval TRV-2026-0312) + E-AUTH-012; role-consistent ERP use.
- **RH-04:** 14-month logon absence in auth telemetry (last_logon_ist ≈2025-07 in E-AD-003); appears in no attack event.
- **RH-05:** E-DOC-002 quarantine note + E-FS-007 file timestamp 2025-11-08 + no 2026 IIS execution in E-WEB-003.
- **RH-07:** Distributed source IPs, zero successes in E-AUTH-001 background, contrast with focused 45.155.90.23.

Count discipline: 3 major human/system herrings (RH-02, RH-03, RH-04) + historical-artifact herring (RH-05) + scanner noise (RH-01) + ambient internet noise (RH-07) — within the "3–5 major red herrings plus ambient noise" bound (§24.2).

---

## 5. v1.1 Resolutions (formerly "Gaps Flagged")

**Resolved in v1.1:**

1. **E-PROXY-001 rendering** (v1.0 gap 2) — resolved: E-PROXY-001 is now specified as an explicit negative-record proxy-log summary ("no matching entries for 10.10.20.11 → 185.220.101.47:8443, 2026-09-03 13:25–13:31 window; server-VLAN egress is direct (no proxy enforcement)"), not an empty file. Corroboration targets fixed to E-NET-002 + E-FS-002.
2. **RH-04 (admin_legacy) rule-out surface** (v1.0 gap 3) — resolved: E-AD-003 AD snapshot explicitly includes `last_logon_ist` per object (admin_legacy ≈2025-07, ~14 months dormant), providing the named rule-out evidence.
3. **RH-03 travel-ticket artifact** (v1.0 gap 4) — resolved: new artifact E-DOC-003 (HR travel-approval record TRV-2026-0312 for ananya.iyer) is registered and named in the EVT-029 row, the RH-03 ledger row, and §2.

**Retained as Evidence-Generator guidance (by design):**

4. **EVT-020 (krbtgt capture)** has no distinct artifact — it shares EVT-019's evidence (per ATTACK_TIMELINE internal note). Acceptable as designed: the candidate's "krbtgt stolen → double reset" conclusion rests on inference from the `/all` scope; the Evidence Generator must ensure E-EDR-009 output explicitly shows `lsadump::dcsync /domain:vistara.local /all`.
5. **09-03 exfil (E-NET-002) retention teaching point** — FW-01 connection logs survive while the NetFlow copy expired (7-day retention, W-09); E-NET-006 renders this explicitly. EDR coverage on WEB-PRD-01 exists per ENVIRONMENT §8, so E-EDR-002 file size can partially substitute as a second source for volume.
6. No other missing evidence: all 10 key findings have ≥2 independent named sources per §3.

---

## v1.1 Change Log

**Version: 1.1 — Agent 3.5 consistency pass (2026-09-11)**

Changes applied per V1_1_CHANGE_SPEC.md:

- **CHG-01** — Scanner timing resolved: EVT-007 = on-demand authenticated scan manually initiated by devang.shah (2026-09-04 09:15, job VS-MAN-2026-0904); EVT-028 = weekly scheduled scan 2026-09-08 02:00 IST (Tuesday, job VS-WK37-2026); RH-01 ledger row rewritten with canonical rule-out wording (no "Tuesday schedule" leg for the 09-04 instance).
- **CHG-02** — E-NET-005 ID collision fixed: E-NET-005 = FW-01 RDP session log (EVT-005/006); NetFlow 7-day-retention summary registered as E-NET-006 (classification row + EVT-010 corroboration reference).
- **CHG-03** — Orphan artifacts registered: E-FS-007, E-AUTH-012, E-EDR-015, E-PROXY-001 (explicit negative record), E-EDR-008B, E-DOC-003 — classification rows and matrix references added.
- **CHG-04** — Event-ID realism: EVT-005 row and E-AUTH-001 classification row now read "4625 run + 4624 Type 10 success (+ DC-01 4776)"; the invalid v1.0 TGT event ID was removed entirely.
- **CHG-07** — RH-03 rule-out closure: RH-03 ledger row names E-AUTH-011 + E-DOC-003 + E-AUTH-012; EVT-029 evidence IDs add E-DOC-003.
- **CHG-08** — The WSUS maintenance-churn ledger row was deleted (herring retired per spec); tombstone footer note added under the RH ledger.
- **CHG-09** — §4 noise-budget note replaced with the post-retirement recount (six herring/noise classes, ≈9 of ~52 artifacts ≈17%, raw-line noise 20–30%).
- **CHG-10** — Wording standardization: ERP probe phrasing = "single failed SMB connect (4625) only; no successful logon follows" (EVT-026 row + E-AUTH-009 row).
- **CHG-12** — Structural updates: EVT-005/006 evidence IDs add E-NET-005; EVT-018 adds E-EDR-008B; EVT-021 adds E-EDR-015; §3 set #1 adds E-NET-005, set #5 FILE hop = E-AUTH-007 + E-EDR-015, set #7 adds E-EDR-008B; §5 rewritten as "v1.1 resolutions".
