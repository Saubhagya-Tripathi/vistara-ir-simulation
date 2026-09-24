# ATTACK_TIMELINE.md

**Master Canonical Attack Timeline — Vistara Polymers Incident**
**Version:** 1.1 — Agent 3.5 consistency pass (2026-09-11); base content Agent 2 Deliverable v1.0
**Timezone:** All timestamps IST (UTC+05:30) unless noted. IIS raw logs are emitted in **UTC** by the Evidence Generator; every IIS artifact carries the standard header line `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`
**Incident window:** 2026-09-02 (recon) → 2026-09-09 (detection) → 2026-09-10 (response complete)
**v1.1 scope:** consistency corrections only (scanner timing, event-ID realism, RH-03 rule-out artifact, RH-06 removal). No narrative redesign. See UPSTREAM_CORRECTIONS.md and CONSISTENCY_QA_REPORT.md.

**Column legend:**
- **ID:** Canonical event ID (referenced by evidence and assessment agents)
- **Time (IST):** Event time
- **Actor:** ATT = external attacker; ATT+svc_portal = attacker using that account; SYS = legitimate system/person
- **Evidence:** Candidate-visible artifacts that reveal this event (E-codes are evidence artifact placeholders for the Evidence Generator)
- **Truth:** Candidate-invisible internal state

---

## PHASE A — RECONNAISSANCE (2026-09-02 → 2026-09-04)

| ID | Time (IST) | Actor | Source → Target | Action | Intended outcome | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|----------------|--------|------------------|-----------------|---------------------------|----------------|
| EVT-001 | 2026-09-02 14:12 | ATT | 45.155.90.23 → 203.0.113.10 | TCP SYN scan of ports 1–10000 on public IPs (nmap -sS) | Map exposed services | FW-01 logs show scan; no alert | E-NET-001 (FW-01 deny/allow log excerpt) | Attacker identifies 3389 open on WEB-PRD-01 public IP |
| EVT-002 | 2026-09-02 14:31 | ATT | 45.155.90.23 → 203.0.113.10 | RDP banner grab / NLA check | Confirm RDP reachable, OS fingerprint | Confirmed: Server 2016, NLA enabled | E-NET-001, E-WEB-001 (IIS log shows unrelated 404s same window) | — |
| EVT-003 | 2026-09-02 15:05 | ATT | 45.155.90.23 → portal.vistara-polymers.in | Web directory enumeration (gobuster, UA "Mozilla/5.0 (compatible; Go-http-client/1.1)") on /staging/ | Find hidden dirs/files | Discovers /staging/, /staging/test/, /staging/test/upload.aspx (200), /staging/assets/ | E-WEB-002 (IIS log: 404 burst then 200s on /staging/) | Staging upload page exists and responds — later used for web shell |
| EVT-004 | 2026-09-03 10:22 | ATT | 45.155.90.23 → 203.0.113.10 | Username enumeration via RDP (rdp brute with common users: administrator, admin, svc_portal, rajesh.kulkarni...) | Find valid RDP usernames | "svc_portal" yields different NLA response timing (account exists) | E-AUTH-001 (Security log 4625 bursts with distinct substatus for valid vs invalid user) | svc_portal confirmed as valid account |
| EVT-005 | 2026-09-03 11:40 | ATT | 45.155.90.23 → 203.0.113.10 | Password spraying / brute force against svc_portal RDP (small dictionary: Portal@2024, Portal@2023, Portal2024!, Vistara@123...) | Gain RDP access | **Success at 11:47** with `Portal@2024` | E-AUTH-001 (4625 failures 10:22–11:46; **4624 LogonType 10 success 11:47**, source 45.155.90.23; corroborating **DC-01 4776 NTLM validation** records for the same run), E-NET-005 (FW-01 session log) | **Initial access achieved** |
| EVT-006 | 2026-09-03 11:47–12:20 | ATT+svc_portal | 45.155.90.23 → WEB-PRD-01 (RDP) | Interactive RDP session as svc_portal; opens cmd, runs `whoami`, `ipconfig /all`, `net user`, `quser` | Orient on host; identify network position | Host enumerated; attacker learns: Server 2016, 10.10.20.11, domain vistara.local, user is local admin? (svc_portal is in local Administrators on WEB-PRD-01) | E-EDR-001 (process tree: cmd → whoami/ipconfig/net; EDR telemetry on WEB-PRD-01), E-NET-005 (session duration) | svc_portal = local admin on WEB-PRD-01 (app pool setup legacy) |
| EVT-007 | 2026-09-04 09:15 | SYS | VULN-01 (10.10.40.13) → server VLAN | **On-demand authenticated vulnerability scan, manually initiated by devang.shah** (pre-peak-season baseline re-scan; NOT the weekly Tuesday 02:00 scheduled job — job VS-MAN-2026-0904) | Ad-hoc hygiene scan before peak season | Noise baseline | E-VULN-001 (scan job log, 09:15–11:02) | **RED HERRING (benign):** scan overlaps attack window; distinguishable by internal source 10.10.40.13 + authenticated svc_monitor job + operator identity; no attacker behavior from that source |

## PHASE B — INITIAL ACCESS CONFIRMED / FOOTHOLD (2026-09-03 → 2026-09-04)

| ID | Time (IST) | Actor | Source → Target | Action | Intended outcome | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|----------------|--------|------------------|-----------------|---------------------------|----------------|
| EVT-008 | 2026-09-03 13:02 | ATT+svc_portal | WEB-PRD-01 | Upload web shell via discovered staging upload page: POST /staging/test/upload.aspx (file img.aspx, simple cmd-eval ASPX shell) | Persistent web-based command execution | Shell written to C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx | E-WEB-003 (IIS POST to upload.aspx 13:02, 200; then GET /staging/assets/upload_2024/img.aspx?cmd=... 13:04+), E-FS-001 (file creation event on WEB-PRD-01) | Web shell live; RDP no longer needed for access |
| EVT-009 | 2026-09-03 13:10 | ATT+svc_portal | WEB-PRD-01 | Creates staging archive: `powershell Compress-Archive -Path C:\inetpub\wwwroot\staging -DestinationPath C:\ProgramData\Microsoft\Crypto\RSA\staging.zip` | Stage portal source code (contains DB connection strings, API keys) for later exfil | staging.zip created (~18 MB) | E-EDR-002 (powershell process with Compress-Archive), E-FS-002 (zip file creation) | Source code + config staged |
| EVT-010 | 2026-09-03 13:25 | ATT+svc_portal | WEB-PRD-01 → 185.220.101.47:8443 | Exfiltrates staging.zip via HTTPS POST to attacker server /upload | Steal portal source/config | 18 MB uploaded | E-NET-002 (FW-01 outbound log: 10.10.20.11 → 185.220.101.47:8443, 13:25–13:31, ~18 MB), E-PROXY-001 (no proxy; direct), E-NET-006 (NetFlow retention-gap note) | **First exfiltration (source code)** |
| EVT-011 | 2026-09-03 14:40 | ATT+svc_portal | WEB-PRD-01 | Host recon: `netstat -ano`, `tasklist`, `wmic process get...`, dump of app pool config (`appcmd list apppool /config`) | Find credentials in memory/config; map running services | Identifies w3wp.exe running as svc_portal; notes RDP sessions | E-EDR-003 (process list + appcmd) | Preparation for credential theft |
| EVT-012 | 2026-09-03 15:05 | ATT+svc_portal | WEB-PRD-01 | **Credential access:** memory scraping of w3wp.exe (procdump-style) + registry/LSA secret checks; recovers **RajKulk@2023** (Rajesh Kulkarni's old password, still cached in a saved-RDP credential manager entry on WEB-PRD-01 from a 2023 admin session) | Obtain higher-privilege credentials | RajKulk@2023 recovered | E-EDR-004 (suspicious dump of w3wp.exe; access to Credential Manager files), E-AUTH-002 (subsequent NTLM auth with rajesh.kulkarni from WEB-PRD-01 to APP-PRD-01 at 15:12 — **fails**, password changed) | Old password recovered but no longer valid → attacker pivots to current password via other means |
| EVT-013 | 2026-09-03 15:12 | ATT+rajesh.kulkarni(old) | WEB-PRD-01 → APP-PRD-01 | Attempts SMB/RPC + RDP with rajesh.kulkarni / RajKulk@2023 | Lateral movement | **Fails** (4625, bad password, source 10.10.20.11) | E-AUTH-003 (APP-PRD-01 security log 4625 15:12, source WEB-PRD-01) | Confirms old password dead; attacker learns account is live |
| EVT-014 | 2026-09-03 16:20 | ATT+svc_portal | WEB-PRD-01 | Dumps SAM/local secrets + searches drive for credentials: finds `C:\IT\scripts\deploy.ps1` containing **svc_portal's own password** (Portal@2024) and a note referencing the service-account wiki; finds KeePass DB? No — finds `C:\Users\svc_portal\Documents\passwords.txt` (legacy file from 2024 vendor) listing: svc_portal:Portal@2024, **rajesh.kulkarni:RajKulk@2026** (updated by Rajesh during 2026 rotation and re-saved by him on this server during a 2026-07 maintenance session) | Obtain current valid credentials | **RajKulk@2026 recovered** | E-FS-003 (passwords.txt file metadata + content), E-EDR-005 (type/findstr commands), E-WIKI-001 (service-account wiki page listing svc_portal:Portal@2024) | **Current Domain-Admin-equivalent credential obtained** |

## PHASE C — EXECUTION / PRIVILEGE ABUSE (2026-09-04)

| ID | Time (IST) | Actor | Source → Target | Action | Intended outcome | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|----------------|--------|------------------|-----------------|---------------------------|----------------|
| EVT-015 | 2026-09-04 09:58 | ATT+rajesh.kulkarni | WEB-PRD-01 → APP-PRD-01 | RDP to APP-PRD-01 as rajesh.kulkarni / RajKulk@2026 (**success**, 4624 Type 10, source 10.10.20.11) | Lateral movement to app tier | Session established on APP-PRD-01 | E-AUTH-004 (APP-PRD-01 4624 09:58), E-EDR-006 (rdpclip/mstsc artifacts) | **First lateral movement success** |
| EVT-016 | 2026-09-04 10:05–10:40 | ATT+rajesh.kulkarni | APP-PRD-01 | Discovery: `net group "Domain Admins" /domain`, `net group "Enterprise Admins" /domain`, `nltest /dclist:vistara.local`, `net view`, ADSI/ldap queries via PowerShell | Map domain privilege structure; identify targets | Learns: rajesh.kulkarni IS Domain Admin (migration leftover); DCs = DC-01, DC-02; FILE-PRD-01 shares visible | E-EDR-007 (powershell AD recon commands), E-AUTH-005 (LDAP binds to DC-01 from APP-PRD-01) | Attacker now knows he holds Domain Admin |
| EVT-017 | 2026-09-04 11:15 | ATT+rajesh.kulkarni | APP-PRD-01 | **Persistence #1 (identity):** creates AD user `svc_mon` (display "Monitoring Agent", description "Systems monitoring service"), adds to **Domain Admins** and **Remote Desktop Users** (local on APP-PRD-01 & WEB-PRD-01 via GPO-less direct local group add), sets password `Mon!tor#2026` | Rogue admin account for re-entry | Account created, privileged | E-AD-001 (DC-01 security log 4720 user creation 11:15, source APP-PRD-01), E-AD-002 (4728/4732 group additions 11:16), E-AD-003 (AD object snapshot showing svc_mon in Domain Admins) | **Identity persistence established** |
| EVT-018 | 2026-09-04 11:30 | ATT+rajesh.kulkarni | APP-PRD-01 | **Persistence #2 (host):** creates scheduled task "MicrosoftEdgeUpdateTaskMachineCore" on APP-PRD-01, action: `powershell -enc <base64>` beaconing to https://185.220.101.47:8443/beacon every 30 min (runs as SYSTEM via /RU SYSTEM) | Host-level persistence + C2 | Task registered; first beacon 11:32 | E-EDR-008 (schtasks /create via cmd; encoded powershell), E-EDR-008B (PowerShell 4104 script-block record of the beacon), E-FS-004 (scheduled task XML), E-NET-003 (outbound 8443 connections every 30 min from APP-PRD-01) | **Host persistence + active C2** |
| EVT-019 | 2026-09-04 13:10 | ATT+rajesh.kulkarni | APP-PRD-01 → DC-01 | **Privilege escalation / domain dominance:** RDP to DC-01 as rajesh.kulkarni (Domain Admin); runs DCSync-style replication request (mimikatz `lsadump::dcsync /domain:vistara.local /all`) — **simulated as**: directory replication (DRS) requests from APP-PRD-01 to DC-01 | Dump all domain credentials | DCSync succeeds; NTLM hashes for all domain users captured | E-AUTH-006 (DC-01 4662 replication access 13:10–13:14, source APP-PRD-01 account rajesh.kulkarni), E-EDR-009 (mimikatz-style process + lsadump strings on DC-01 session; `/all` flag visible) | **Full domain credential compromise** |
| EVT-020 | 2026-09-04 13:20 | ATT+rajesh.kulkarni | DC-01 | Captures krbtgt hash (part of DCSync output) | Golden ticket capability (kept in reserve; not used) | krbtgt hash in attacker hands | (Same as EVT-019 evidence; internal note only — deterministic inference from the `/all` scope visible in E-EDR-009) | Capability, not exercised — keeps realism without extra artifacts |

## PHASE D — DISCOVERY / LATERAL MOVEMENT / COLLECTION (2026-09-05 → 2026-09-08)

| ID | Time (IST) | Actor | Source → Target | Action | Intended outcome | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|----------------|--------|------------------|-----------------|---------------------------|----------------|
| EVT-021 | 2026-09-05 10:15 | ATT+svc_mon | APP-PRD-01 → FILE-PRD-01 | RDP to FILE-PRD-01 using **svc_mon** (rogue account — validates persistence works) | Access file server | Success (4624 Type 10, source 10.10.20.21) | E-AUTH-007 (FILE-PRD-01 4624 10:15, account svc_mon, source APP-PRD-01), E-EDR-015 (EDR session telemetry, 10:15→13:05) | **Rogue account validated** |
| EVT-022 | 2026-09-05 10:20–11:45 | ATT+svc_mon | FILE-PRD-01 | **Discovery + collection:** browses shares (S: Engineering, R: Shared); runs `dir /s *.dwg, *.xlsx, *.pdf, *payroll*, *salary*`; bulk-copies: client packaging designs (S:\Clients\), spec sheets, **HR payroll export** (R:\HR\payroll_aug2026.xlsx), financial summaries (R:\Finance\) to C:\Windows\Temp\collect\ | Identify and stage valuable data | ~2.1 GB staged in C:\Windows\Temp\collect\ | E-FS-005 (file access/copy events, Temp\collect creation), E-EDR-010 (cmd robocopy / copy commands), E-SHARE-001 (SMB session + file open audit on FILE-PRD-01) | **Collection complete** |
| EVT-023 | 2026-09-05 12:05 | ATT+svc_mon | FILE-PRD-01 | Compresses collection: `Compress-Archive C:\Windows\Temp\collect\* → C:\Windows\Temp\order_export_2026.zip` (~680 MB compressed) | Stage for exfil | order_export_2026.zip created | E-FS-006 (zip creation), E-EDR-011 (powershell Compress-Archive) | Staged |
| EVT-024 | 2026-09-05 12:30–13:05 | ATT+svc_mon | FILE-PRD-01 → 185.220.101.47:8443 | **Exfiltration #2:** HTTPS POST of order_export_2026.zip to attacker server /upload (chunked) | Steal data | 680 MB uploaded | E-NET-004 (FW-01 outbound: 10.10.20.23 → 185.220.101.47:8443, 12:30–13:05, ~680 MB), E-EDR-012 (powershell Invoke-WebRequest / curl to 185.220.101.47) | **Data exfiltrated** |
| EVT-025 | 2026-09-05 15:20 | ATT+svc_mon | FILE-PRD-01 → DB-PRD-01 | Brief SQL enumeration: sqlcmd with sql_portal? No — uses rajesh.kulkarni Windows auth; runs `SELECT name FROM sys.databases;`, samples top 5 rows of PortalDB.dbo.Customers and ERPDB.dbo.Vendors; **does not dump databases** (time + noise discipline) | Assess data value | Schema-level view only | E-DB-001 (SQL audit/login + queries 15:20–15:41), E-AUTH-008 (DB-PRD-01 4624 network logon from FILE-PRD-01) | Recon of DB; no bulk DB exfil (keeps scope bounded) |
| EVT-026 | 2026-09-06 09:30 | ATT+svc_mon | APP-PRD-01 | Returns to APP-PRD-01; runs additional discovery: `net localgroup administrators` on multiple hosts via wmic, checks ERP-APP-01 reachability | Assess ERP as target | ERP-APP-01 reachable; decides ERP too risky/noisy during business hours | E-EDR-013 (wmic /net use probes), E-AUTH-009 (ERP-APP-01 security log — **only a single failed SMB connect (4625) at 09:33; no successful logon follows**) | ERP probed, not entered |
| EVT-027 | 2026-09-06 16:45 | SYS | WKSTN-PRA-03 (pranav.joshi) | Pranav places unusually large dealer orders at 16:45–17:30 from Ahmedabad sales office via VPN | Normal sales work | Odd-hour activity logged | E-AUTH-010 (VPN-GW-01 log: pranav.joshi from Ahmedabad office IP 122.176.45.9, 16:45–17:35), E-WEB-004 (portal order API calls) | **RED HERRING (benign):** traveling sales user, legitimate orders |
| EVT-028 | 2026-09-08 02:00 | SYS | VULN-01 | **Weekly scheduled vulnerability scan runs (Tuesday 02:00 IST schedule, job VS-WK37-2026)** | Routine | Noise | E-VULN-002 | **RED HERRING (benign):** matches attack pattern superficially; distinguishable by authenticated scan config + internal source |
| EVT-029 | 2026-09-07 11:20 | SYS | WKSTN-ANU-01 (ananya.iyer) | Ananya Iyer logs into VPN from Ahmedabad (client visit), accesses ERP | Normal work | VPN + ERP logins | E-AUTH-011 (VPN log 11:20, ERP 4624 11:26), E-DOC-003 (HR travel approval TRV-2026-0312) | **RED HERRING (benign):** out-of-city exec login during window |
| EVT-030 | 2026-09-08 10:05 | ATT+svc_mon | APP-PRD-01 | Cleanup attempt: deletes C:\Windows\Temp\collect remnants on FILE-PRD-01? (done 09-05), clears PowerShell history on APP-PRD-01, empties recycle bins on touched hosts | Anti-forensics | Partial cleanup (history cleared; event logs intact — attacker lacks log-cleaning on servers with EDR) | E-EDR-014 (Clear-History, deletion of ConsoleHost_history.txt) | Anti-forensics partially successful; SIEM retention preserves copies |

## PHASE E — DETECTION (2026-09-09)

| ID | Time (IST) | Actor | Source → Target | Action | Intended outcome | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|----------------|--------|------------------|-----------------|---------------------------|----------------|
| EVT-031 | 2026-09-09 09:47 | SYS | EDR-CON-01 → SIEM-01 | **DETECTION:** EDR on APP-PRD-01 fires "Suspicious PowerShell encode + external connection" (the 11:32 beacon task action pattern + 8443 connection to 185.220.101.47); SOC analyst Priya Nair escalates as INC-2026-0417 | Alert on C2 beacon | Incident declared | E-ALERT-001 (SIEM alert INC-2026-0417, host APP-PRD-01, 09:47), E-TICKET-001 (ServiceNow ticket) | **Candidate's entry point** |
| EVT-032 | 2026-09-09 09:52 | SYS | SIEM-01 | Retrospective correlation: SIEM flags related events — 4624 Type 10 logons to FILE-PRD-01 from APP-PRD-01 (svc_mon), DC-01 4662 replication from APP-PRD-01, outbound 8443 to 185.220.101.47 from WEB-PRD-01 (09-03) and FILE-PRD-01 (09-05) | Context for responder | Correlated alert cluster | E-ALERT-002 (SIEM correlation view) | Candidate sees the cluster, must interpret |

## PHASE F — RESPONSE (2026-09-09 → 2026-09-10) — candidate-driven; canonical correct path

| ID | Time (IST) | Actor | Action | Resulting state | Candidate-visible evidence | Internal truth |
|----|-----------|-------|--------|-----------------|---------------------------|----------------|
| EVT-033 | 2026-09-09 10:30 | RESP | Containment: isolate APP-PRD-01, FILE-PRD-01, WEB-PRD-01 at FW-02/EDR network isolation; disable svc_mon, rajesh.kulkarni, svc_portal accounts; block 185.220.101.47 at FW-01 | Bleeding stopped | E-RESP-001 (isolation records), E-AD-004 (4725/4726 disable events) | Correct containment set |
| EVT-034 | 2026-09-09 11:00 | RESP | Evidence preservation: snapshot/memory capture APP-PRD-01, FILE-PRD-01, WEB-PRD-01; export SIEM logs; image relevant hosts | Chain of custody | E-RESP-002 | — |
| EVT-035 | 2026-09-09 12:00 | RESP | Eradication (ordered): 1) remove scheduled task on APP-PRD-01, 2) delete web shell img.aspx on WEB-PRD-01, 3) delete staging.zip + passwords.txt on WEB-PRD-01, 4) delete svc_mon from AD, 5) reset rajesh.kulkarni + svc_portal + all Domain Admin creds (incl. krbtgt twice), 6) remove FW-01 RDP rule (W-01 fix), 7) patch/close staging upload page (W-02b fix) | Foothold removed | E-RESP-003 (eradication checklist execution) | Correct ordered set |
| EVT-036 | 2026-09-09 15:00 | RESP | Recovery: rebuild WEB-PRD-01 from clean template + redeploy portal; restore FILE-PRD-01 data from pre-incident backup (09-02) after malware scan; APP-PRD-01 rebuild + rejoin; validate DC-01 (no changes persisted; forced krbtgt reset ×2) | Services restored safely | E-RESP-004 (restore logs), E-VALID-001 | Correct sequence: DC validation → WEB → APP → FILE |
| EVT-037 | 2026-09-09 17:30 | RESP | Safe-state validation: EDR full-scan clean on all touched hosts; persistence re-check (scheduled tasks, services, run keys, web dirs); 72h enhanced monitoring; confirm no new 8443 connections; web weakness re-test (RDP closed, staging page removed) | Safe state declared | E-VALID-002 (validation report) | Gate passed |
| EVT-038 | 2026-09-10 10:00 | RESP | Final report submitted; residual risk: krbtgt rotation impact, password-reuse hygiene program, segmentation exception review (W-06), NetFlow retention improvement | Incident closed | E-REPORT-001 | — |

---

## Red Herring / Noise Ledger (explicit classification)

| Ref | Description | Classification | Rule-out evidence |
|-----|-------------|----------------|-------------------|
| RH-01 | VULN-01 authenticated scans (EVT-007 on-demand run 2026-09-04 09:15; EVT-028 weekly scheduled run 2026-09-08 02:00) | **Benign** | Internal scanner source 10.10.40.13 (VULN-01, registered in asset inventory); authenticated job logs using svc_monitor; operator devang.shah; plugin-based enumeration pattern with no follow-on exploitation; no attacker behavior ever sourced from 10.10.40.13 |
| RH-02 | pranav.joshi odd-hour portal orders from Ahmedabad (EVT-027) | **Benign** | VPN-GW-01 log ties to office IP 122.176.45.9; orders match dealer PO pattern; no host compromise |
| RH-03 | ananya.iyer VPN from Ahmedabad (EVT-029) | **Benign** | HR-approved travel record TRV-2026-0312 (E-DOC-003); ERP activity matches role; no lateral movement; full-window VPN summary E-AUTH-012 shows nothing else anomalous |
| RH-04 | admin_legacy enabled with weak password | **Benign (ultimately)** | No logons for 14 months (last-logon attribute visible in E-AD-003 snapshot); attacker never uses it; exists to test "not every weak account is exploited" |
| RH-05 | Old cleaned web shell from 2025 incident on WEB-PRD-01: `C:\inetpub\wwwroot\assets\old\upload_bak.aspx` (quarantined by previous IR, never deleted) | **Benign (historical)** | File timestamp 2025-11-08 (E-FS-007); quarantine note in previous IR report E-DOC-002; no 2026 execution |
| RH-07 | Internet background 3389 scanners (constant low-grade 4625s from random IPs) | **Ambient noise** | Distributed sources, no success; contrast with focused 45.155.90.23 campaign |

*Note: RH-06 (WSUS maintenance churn) was removed in v1.1 as it lacked resolvable candidate-visible evidence; the RH-06 ID is retired and not reused.*

## Notes for Evidence Generator

1. Every EVT row maps to at least one E-xxx artifact; key findings (initial access, pivot, persistence, exfil, detection) map to ≥2 independent artifact types per SIMULATION_REQUIREMENTS §15.
2. IIS logs: emit in UTC; every IIS artifact header carries exactly `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.` (per ENVIRONMENT §12, standardized v1.1).
3. Windows Security logs: Event IDs as real (4624/4625/4662/4720/4728/4732/4725/4726/4776). Do NOT use the retired v1.0 "TGT granted" event ID — it is not a valid logon event for this scenario; initial-access success is rendered as 4624 LogonType 10 on WEB-PRD-01 plus 4776 NTLM validation records on DC-01. Sysmon-style EDR telemetry: process, command line, parent, hashes (synthetic), user, host.
4. All attacker commands must appear in at least one telemetry artifact; anti-forensics (EVT-030) must NOT erase SIEM-retained copies.
5. Volume discipline: no artifact > ~200 lines; use summarized views with drill-down.

---

## v1.1 change log

1. EVT-005: removed the invalid v1.0 "TGT granted" event ID (not valid for RDP logon); success now renders as 4624 LogonType 10 on WEB-PRD-01 + 4776 NTLM validation on DC-01; added E-NET-005 session log reference.
2. EVT-007: reclassified from "scheduled weekly scan" to on-demand authenticated scan manually initiated by devang.shah (job VS-MAN-2026-0904) — resolves conflict with the Tuesday 02:00 schedule in ENVIRONMENT §8.
3. EVT-028: moved from 2026-09-07 02:10 (a Monday) to 2026-09-08 02:00 IST (Tuesday), matching the weekly Tuesday 02:00 schedule.
4. EVT-026/E-AUTH-009: wording standardized — single failed SMB connect (4625) only.
5. EVT-029 / RH-03: added E-DOC-003 (HR travel approval TRV-2026-0312) as the dedicated rule-out artifact.
6. RH-06 (WSUS patch churn) removed — no candidate-visible WSUS artifact existed; ID retired, not reused.
7. EVT-018: added E-EDR-008B (PowerShell 4104 script-block record) as registered evidence.
8. EVT-021: added E-EDR-015 (session telemetry) as second independent source.
9. EVT-010: added E-NET-006 (NetFlow retention-gap note) reference.
10. IIS conversion note standardized to a single canonical header string.
