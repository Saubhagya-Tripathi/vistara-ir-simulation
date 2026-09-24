# EVIDENCE_DIRECTORY_SPEC.md

**Vistara Polymers Incident — Evidence Directory Specification**
**Version:** 1.1 — Agent 3.5 consistency pass (2026-09-11)
**Sources of truth:** SIMULATION_REQUIREMENTS.md, SCENARIO_BIBLE.md, ATTACK_TIMELINE.md, ENVIRONMENT.md (v1.1 consistency pass). **Edit authority:** V1_1_CHANGE_SPEC.md (binding).
**Scope:** Defines the browser-simulation `evidence/` directory: layout, naming, formats, manifest structure, and volume discipline. Companion to EVIDENCE_SCHEMAS_TEMPLATES.md.
**ALL CONTENT IS SYNTHETIC / FICTIONAL TRAINING DATA. NO REAL DATA.**

---

## 1. Purpose

The `evidence/` directory is the candidate-visible corpus of the investigation workspace. Every artifact is deterministically derivable from the canonical event list in ATTACK_TIMELINE.md (EVT-001 … EVT-038, RH-01 … RH-05 and RH-07) and the canonical registry in ENVIRONMENT.md §11. Evidence exists to be correlated: per SIMULATION_REQUIREMENTS §15, every key finding must be corroborated by ≥2 independent artifacts.

## 2. Directory Layout (by source type)

```
evidence/
├── manifest.json                  # Master index of ALL artifacts (see §5)
├── README.md                      # Timezone convention + drill-down rules (candidate-visible)
├── alerts/                        # SIEM alerts, correlation views, tickets
│   ├── E-ALERT-001_siem_alert_inc-2026-0417.json
│   ├── E-ALERT-002_siem_correlation_view.json
│   └── E-TICKET-001_servicenow_inc-2026-0417.json
├── web/                           # IIS access logs (WEB-PRD-01)
│   ├── E-WEB-001_iis_recon_window.log          # + .meta.json sidecar
│   ├── E-WEB-002_iis_gobuster_staging.log
│   ├── E-WEB-003_iis_upload_and_shell_callbacks.log
│   └── E-WEB-004_iis_benign_orders_pranav.log
├── auth/                          # Windows Security event excerpts (per host/window)
│   ├── E-AUTH-001_web-prd-01_4625_4624_bruteforce.log
│   ├── E-AUTH-002_app-prd-01_ntlm_fail_old_password.log
│   ├── E-AUTH-003_app-prd-01_4625_source_web-prd-01.log
│   ├── E-AUTH-004_app-prd-01_4624_type10_rajesh.log
│   ├── E-AUTH-005_dc-01_ldap_binds_app-prd-01.log
│   ├── E-AUTH-006_dc-01_4662_dcsync.log
│   ├── E-AUTH-007_file-prd-01_4624_svc_mon.log
│   ├── E-AUTH-008_db-prd-01_4624_from_file-prd-01.log
│   ├── E-AUTH-009_erp-app-01_failed_smb_probe.log
│   ├── E-AUTH-010_vpn-gw-01_pranav_ahmedabad.log   # RH-02
│   ├── E-AUTH-011_vpn-gw-01_ananya_ahmedabad.log   # RH-03
│   └── E-AUTH-012_vpn-gw-01_full_window_summary.log # full-window VPN summary (negative evidence)
├── edr/                           # SentinelNode process/telemetry JSON (one file per host-window)
│   ├── E-EDR-001_web-prd-01_host_orient.json        # whoami/ipconfig/net user/quser
│   ├── E-EDR-002_web-prd-01_compress_archive.json
│   ├── E-EDR-003_web-prd-01_host_recon.json         # netstat/tasklist/wmic/appcmd
│   ├── E-EDR-004_web-prd-01_w3wp_dump.json
│   ├── E-EDR-005_web-prd-01_findstr_creds.json
│   ├── E-EDR-006_app-prd-01_rdp_session_artifacts.json
│   ├── E-EDR-007_app-prd-01_ad_discovery.json
│   ├── E-EDR-008_app-prd-01_schtasks_beacon.json
│   ├── E-EDR-008B_app-prd-01_beacon_scriptblock.log  # PowerShell 4104 script-block of encoded beacon
│   ├── E-EDR-009_dc-01_dcsync_process.json
│   ├── E-EDR-010_file-prd-01_robocopy_collection.json
│   ├── E-EDR-011_file-prd-01_compress_archive.json
│   ├── E-EDR-012_file-prd-01_exfil_iwr.json
│   ├── E-EDR-013_app-prd-01_wmic_erp_probe.json
│   ├── E-EDR-014_app-prd-01_antiforensics.json
│   └── E-EDR-015_file-prd-01_svc_mon_session.json   # RDP session telemetry (collection→archive→exfil)
├── fs/                            # File-system events / file metadata + content excerpts
│   ├── E-FS-001_img_aspx_created.json
│   ├── E-FS-002_staging_zip_created.json
│   ├── E-FS-003_passwords_txt.json                  # metadata + content excerpt
│   ├── E-FS-004_scheduled_task_xml.log              # raw task XML
│   ├── E-FS-005_file-prd-01_collect_dir_events.log
│   ├── E-FS-006_order_export_2026_zip_created.json
│   ├── E-FS-007_upload_bak_aspx_2025_quarantine.json # RH-05
│   ├── E-SHARE-001_file-prd-01_smb_file_audit.log     # SMB session + file-open audit (summarized)
│   └── E-SHARE-001_drilldown.csv                      # drill-down (full file-open listing)
├── net/                           # FW-01 logs + NetFlow summaries + egress proxy record
│   ├── E-NET-001_fw01_scan_and_rdp_allow.log
│   ├── E-NET-002_fw01_exfil_web-prd-01_0903.log
│   ├── E-NET-003_fw01_beacon_8443_app-prd-01.log    # summarized + drill-down CSV
│   ├── E-NET-003_drilldown_beacon_flows.csv         # drill-down (full 30-min cadence)
│   ├── E-NET-004_fw01_exfil_file-prd-01_0905.log
│   ├── E-NET-005_fw01_rdp_session_0903.log          # FW-01 connection/session log (TCP 3389, 2026-09-03)
│   ├── E-NET-006_netflow_summary_7day_retention.log # summary + retention-gap note
│   └── E-PROXY-001_egress_proxy_absence.log         # explicit negative proxy record (not an empty file)
├── ad/                            # AD security events and snapshots (DC-01)
│   ├── E-AD-001_dc-01_4720_svc_mon_created.log
│   ├── E-AD-002_dc-01_4728_4732_group_adds.log
│   ├── E-AD-003_ad_snapshot_domain_admins.json
│   └── E-AD-004_dc-01_4725_4726_disable_delete.log
├── db/                            # SQL Server audit
│   └── E-DB-001_sql_audit_readonly_enum.log
├── vuln/                          # Vulnerability scanner job logs (RH-01)
│   ├── E-VULN-001_vuln01_scan_job_2026-09-04.log    # on-demand scan, operator devang.shah
│   └── E-VULN-002_vuln01_scan_job_2026-09-08.log    # weekly scheduled scan (Tuesday 02:00 IST)
├── docs/                          # Human-context artifacts
│   ├── E-WIKI-001_service_account_wiki.md
│   ├── E-DOC-001_vendor_rdp_email_2025.md
│   ├── E-DOC-002_prior_ir_quarantine_note_2025.md
│   └── E-DOC-003_hr_travel_approval_TRV-2026-0312.md # HR travel approval (in-world context)
└── response/                      # Phase F artifacts (revealed as candidate acts)
    ├── E-RESP-001_isolation_records.json
    ├── E-RESP-002_evidence_preservation.json
    ├── E-RESP-003_eradication_checklist.json
    ├── E-RESP-004_restore_logs.json
    ├── E-VALID-001_recovery_validation.json
    ├── E-VALID-002_safe_state_report.json
    └── E-REPORT-001_final_incident_report.md
```

## 3. File Naming Convention

`<EV-ID>_<host-or-source>_<short-slug>.<ext>` where:

- **EV-ID** is exactly the E-code from ATTACK_TIMELINE.md / SCENARIO_BIBLE Appendix B (e.g., `E-AUTH-004`). One EV-ID = one artifact (plus at most one sidecar and one drill-down file). Suffix variants (e.g., `E-EDR-008B`) denote an additional artifact of a different type covering the same underlying event.
- **Slug** is lowercase, hyphen/underscore-separated, descriptive enough to browse (e.g., `_4624_type10_rajesh`).
- **Extensions:** `.log` = raw-looking log text; `.json` = structured telemetry/metadata; `.csv` = drill-down tables; `.md` = human-context documents.
- Sidecars: `<name>.meta.json` (see §4).

## 4. Per-File Format

Two formats, chosen per artifact:

1. **Raw-log text (`.log`, `.csv`, `.md`):** mimics the native source format (W3C IIS, Windows Event Log text export, iptables syslog, SQL audit text). Header block of 2–4 comment lines carrying: `# SYNTHETIC TRAINING DATA`, timezone convention, source host, extraction window. Raw-log artifacts **may** carry a JSON metadata sidecar (`*.meta.json`) — required for any `.log` artifact referenced by a scored answer.
2. **Structured JSON (`.json`):** EDR telemetry, SIEM alerts, AD snapshots, FS metadata, response records. JSON artifacts are self-describing (embedded `"artifact"` block) and need no sidecar.

**IIS timezone header (canonical, mandatory):** every IIS `.log` artifact's first comment lines MUST include the exact string below, verbatim, with no variants:

```
# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.
```

README.md (candidate-visible) repeats this convention verbatim in its timezone section so candidates always see the same instruction.

**Candidate-view vs internal-metadata separation (applies to sidecars and manifest):** every metadata record is split into two blocks:

- **`candidate_view`** — rendered to candidates by the browser UI: `evidence_id`, `path`, `type`, `source`, `host`, `timezone`, `window_ist`, `reveal_phase`, `synthetic`, and the optional `drilldown` pointer.
- **`internal_metadata`** — authoring/grading only, never rendered to candidates: `evt_refs`, `rh_refs`, `red_herring`, `rule_out`, `corroborates`, `relevance`, `expected_significance`.

**Explicit rendering rule:** the browser UI renders ONLY `candidate_view` plus the artifact body. `internal_metadata` ships in a separate grading manifest that is never exposed to candidates. Candidate-visible artifact bodies carry only diegetic (in-world) pointers (e.g., "travel approval TRV-2026-0312 on file", "quarantined per IR-2025-011 note") — never authoring classifications.

**Sidecar schema (`*.meta.json`):**

```json
{
  "candidate_view": {
    "evidence_id": "E-WEB-003",
    "path": "web/E-WEB-003_iis_upload_and_shell_callbacks.log",
    "type": "iis_access_log",
    "source": "IIS W3SVC1, W3C extended logging",
    "host": "WEB-PRD-01",
    "timezone": "UTC — header carries: Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.",
    "window_ist": {
      "start": "2026-09-03T12:55:00+05:30",
      "end": "2026-09-03T14:30:00+05:30"
    },
    "reveal_phase": 1,
    "synthetic": true,
    "drilldown": null
  },
  "internal_metadata": {
    "evt_refs": ["EVT-008"],
    "rh_refs": [],
    "red_herring": false,
    "rule_out": null,
    "corroborates": ["E-FS-001", "E-EDR-002"],
    "relevance": "Webshell upload and first shell callbacks on WEB-PRD-01 (initial execution).",
    "expected_significance": "Supports the initial-access and execution findings when correlated with FS and EDR artifacts."
  }
}
```

## 5. manifest.json Structure

`evidence/manifest.json` is the single machine-readable index the browser UI renders the evidence tree from. Each artifact entry uses the same `candidate_view` / `internal_metadata` split defined in §4. Structure:

```json
{
  "manifest_version": "1.1",
  "generated_for": "INC-2026-0417 (SYNTHETIC)",
  "timezone_convention": "All timestamps IST (UTC+05:30) except IIS access logs, which are UTC. Every IIS artifact header carries verbatim: Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.",
  "artifacts": [
    {
      "candidate_view": {
        "evidence_id": "E-ALERT-001",
        "path": "alerts/E-ALERT-001_siem_alert_inc-2026-0417.json",
        "type": "siem_alert",
        "source": "Wazuh SIEM (SIEM-01)",
        "host": "APP-PRD-01",
        "timezone": "IST (UTC+05:30)",
        "window_ist": {
          "start": "2026-09-09T09:47:12+05:30",
          "end": "2026-09-09T09:47:12+05:30"
        },
        "reveal_phase": 0,
        "synthetic": true,
        "drilldown": null
      },
      "internal_metadata": {
        "evt_refs": ["EVT-031"],
        "rh_refs": [],
        "red_herring": false,
        "rule_out": null,
        "corroborates": ["E-ALERT-002", "E-EDR-008", "E-NET-003"],
        "relevance": "Opening SIEM alert that anchors the investigation start.",
        "expected_significance": "Entry point; must be corroborated by independent telemetry types."
      }
    }
  ]
}
```

**Field definitions:**

- `candidate_view.evidence_id` — string, required, unique; EV-ID from the timeline.
- `candidate_view.path` — string, required; path relative to `evidence/`.
- `candidate_view.type` — string, required; one of the enum below.
- `candidate_view.source` — string, required; the generating system/host.
- `candidate_view.host` — string|null; primary host the artifact is about.
- `candidate_view.timezone` — string, required; IIS artifacts use the canonical header string per §4.
- `candidate_view.window_ist` — object, required; `{start, end}` in ISO-8601 with +05:30 offset.
- `candidate_view.reveal_phase` — integer, required; earliest simulation phase in which the artifact is visible.
- `candidate_view.synthetic` — boolean; always `true`.
- `candidate_view.drilldown` — string|null; relative path of the drill-down file when present.
- `internal_metadata.evt_refs` — array of canonical event IDs.
- `internal_metadata.rh_refs` — array of RH IDs if the artifact is/contains a red herring.
- `internal_metadata.red_herring` — boolean, required.
- `internal_metadata.rule_out` — string|null; REQUIRED when `red_herring` is true: pointer to the in-simulation evidence that rules it out.
- `internal_metadata.corroborates` — array of artifact IDs that independently support the same finding.
- `internal_metadata.relevance` / `internal_metadata.expected_significance` — free-text authoring/grading notes; never rendered to candidates.

**`type` enum (closed set):**

`siem_alert` | `ticket` | `iis_access_log` | `windows_security` | `edr_process` | `edr_session` | `powershell_log` | `firewall_log` | `netflow_summary` | `proxy_log` | `ad_snapshot` | `sql_audit` | `vpn_log` | `vuln_scan_job` | `smb_file_audit` | `document` | `fs_event` | `response_record` | `validation_record` | `report`

Every E-code in the §2 tree resolves to a class in this enum, e.g.: E-ALERT-001/002 → `siem_alert`; E-TICKET-001 → `ticket`; E-WEB-* → `iis_access_log`; E-AUTH-001…009 and E-AD-001/002/004 → `windows_security`; E-AUTH-010/011/012 → `vpn_log`; E-EDR-001…014 → `edr_process`; E-EDR-015 → `edr_session`; E-EDR-008B → `powershell_log`; E-FS-* → `fs_event`; E-NET-001…005 → `firewall_log`; E-NET-006 → `netflow_summary`; E-PROXY-001 → `proxy_log`; E-AD-003 → `ad_snapshot`; E-DB-001 → `sql_audit`; E-VULN-001/002 → `vuln_scan_job`; E-WIKI-001 and E-DOC-001/002/003 → `document`; E-RESP-001…004 → `response_record`; E-VALID-001/002 → `validation_record`; E-REPORT-001 → `report`.

**Manifest rules:**

- Every file under `evidence/` except `README.md`, drill-down files, and `manifest.json` itself MUST appear in `artifacts`.
- **Drill-down rule:** drill-down files are referenced from their parent's `candidate_view.drilldown` field (e.g., `"drilldown": "net/E-NET-003_drilldown_beacon_flows.csv"` on E-NET-003).
- **Corroboration rule:** `internal_metadata.corroborates` must satisfy SIMULATION_REQUIREMENTS §15: for each key finding (initial access, pivot credential, each persistence mechanism, DCSync, each exfil, detection), at least two artifacts of different types list each other.
- **Red-herring rule:** every red-herring artifact (E-AUTH-010, E-AUTH-011, E-VULN-001, E-VULN-002, E-FS-007, plus ambient-noise log segments) has `internal_metadata.red_herring: true`, its `internal_metadata.rh_refs` set, and a non-null `internal_metadata.rule_out` naming the concrete dismissing evidence (per the ATTACK_TIMELINE RH ledger). These fields live ONLY in `internal_metadata`; candidate-visible content carries only diegetic pointers.
- **Rendering rule (repeated for emphasis):** the browser UI renders only `candidate_view` + the artifact body; `internal_metadata` ships in a separate grading manifest never exposed to candidates.

## 6. Volume Discipline

Per SIMULATION_REQUIREMENTS §26.3 and ATTACK_TIMELINE "Notes for Evidence Generator" #5:

1. **No artifact exceeds ~200 lines of raw content.** Target: most artifacts 20–80 lines.
2. **Summarized views with drill-down convention.** When real volume would exceed the cap (e.g., 10,000-port nmap scan, 30-minute beacon cadence over 5 days, 90 minutes of file copies), the primary artifact contains: (a) a `# SUMMARY` header line stating the true total (e.g., "9,846 SYN probes; 74 representative lines follow"), (b) a representative excerpt preserving the signal rows verbatim, and (c) a `# DRILL-DOWN:` pointer to the full CSV/expanded file. Drill-down files are exempt from the 200-line cap but must be machine-generated and uniformly formatted.
3. **Noise budget 20–30%** of raw log lines: benign 404s, Googlebot/UptimeRobot hits, RH-07 background 3389 scanners, background 4625 noise from benign service accounts. Noise is interleaved, never in a separate "noise" section.
4. **Windows Event excerpts** are exported as text with one line per field block (Event ID, Time IST, Logon Type, Account, Source, Status/Substatus) — never full XML.
5. **EDR JSON** files contain at most ~12 process events each; each event is a compact single object (see EVIDENCE_SCHEMAS_TEMPLATES.md §3).

## 7. Coverage Guarantees (generator checklist)

- Every EVT-001…EVT-038 row maps to ≥1 artifact; EVT-005, EVT-014, EVT-017, EVT-018, EVT-019, EVT-024, EVT-031 map to ≥2 of different types.
- Every attacker command in ATTACK_TIMELINE.md (nmap, RDP client, gobuster, whoami/ipconfig/net user/quser, Compress-Archive ×2, netstat/tasklist/wmic/appcmd, procdump-style dump, type/findstr, net group/nltest/net view, net user /add + net localgroup, schtasks /create with `powershell -enc`, DCSync/lsadump, robocopy, Invoke-WebRequest exfil, wmic/net use probes, Clear-History) appears verbatim in at least one telemetry template (EDR, IIS, PowerShell log, or security log).
- Anti-forensics (EVT-030) never removes SIEM-retained copies; cleared-history artifact (E-EDR-014) is itself evidence.
- NetFlow 7-day retention gap: E-NET-006 explicitly notes the 2026-09-03 exfil is absent from NetFlow (retained only 7 days; today is 2026-09-09) and visible only in FW-01 logs + EDR — the intended teaching point. E-NET-002's FW-01 connection logs survive the NetFlow expiry; see E-NET-006.
- The following v1.1-registered artifacts are present in the §2 tree and in `manifest.json` with full `candidate_view` + `internal_metadata` entries:
  - **E-EDR-008B** (`powershell_log`) — PowerShell 4104 script-block record of the encoded beacon; second telemetry source alongside E-EDR-008 / E-FS-004 / E-NET-003.
  - **E-EDR-015** (`edr_session`) — svc_mon RDP session telemetry on FILE-PRD-01 spanning collection → archive → exfil.
  - **E-NET-005** (`firewall_log`) — FW-01 connection/session log for the 2026-09-03 TCP 3389 session; corroborates the initial-access logon window.
  - **E-NET-006** (`netflow_summary`) — NetFlow 7-day summary with the retention-gap note above.
  - **E-AUTH-012** (`vpn_log`) — full-window VPN session summary; negative evidence closing the "initial access via VPN?" question.
  - **E-DOC-003** (`document`) — HR travel-approval record TRV-2026-0312; in-world context artifact containing no attack facts.
  - **E-FS-007** (`fs_event`) — 2025 quarantined webshell-variant metadata artifact.
  - **E-PROXY-001** (`proxy_log`) — explicit negative proxy record: rendered as an explicit "no matching entries" summary, never as an empty file; corroboration targets E-NET-002 + E-FS-002.
  - **E-SHARE-001** (`smb_file_audit`) — SMB session + file-open audit on FILE-PRD-01 (summarized + drill-down CSV); share-level collection record for EVT-022.

---

## 8. v1.1 change log

Applied per V1_1_CHANGE_SPEC.md (binding edit specification). No new attack facts were introduced.

- **CHG-01** — Renamed `E-VULN-002_vuln01_scan_job_2026-09-07.log` → `E-VULN-002_vuln01_scan_job_2026-09-08.log` (weekly Tuesday 02:00 IST schedule); E-VULN-001 annotated as the on-demand scan (operator devang.shah).
- **CHG-02** — Resolved the E-NET-005 ID collision: E-NET-005 is now the FW-01 connection/session log (`E-NET-005_fw01_rdp_session_0903.log`); the NetFlow 7-day-retention summary is renumbered to E-NET-006 (`E-NET-006_netflow_summary_7day_retention.log`); §7 NetFlow sentence updated to reference E-NET-006.
- **CHG-03** — Registered previously-orphan artifacts in the tree and manifest eligibility: E-AUTH-012, E-EDR-015, E-EDR-008B, E-PROXY-001, E-DOC-003 (E-FS-007 was already present and is retained).
- **POST-VERIFICATION FIX** — Added E-SHARE-001 to the `fs/` tree (`E-SHARE-001_file-prd-01_smb_file_audit.log` + `E-SHARE-001_drilldown.csv`) and §7 coverage list; it was present in catalog/matrix/schemas but missing from the directory tree (found by independent verification).
- **CHG-04** — Removed the invalid third event ID from the E-AUTH-001 brute-force artifact's filename, which now reads `E-AUTH-001_web-prd-01_4625_4624_bruteforce.log` (4625 failures + 4624 Type 10 success, with DC-01 4776 NTLM validation as corroboration per the change spec).
- **CHG-05** — Split §4 sidecar and §5 manifest schemas into `candidate_view` vs `internal_metadata`; added the explicit rule that the browser UI renders only `candidate_view` + artifact body and that `internal_metadata` ships in a separate grading manifest never exposed to candidates; example JSON blocks rewritten accordingly; manifest rules (drilldown, corroboration via `internal_metadata.corroborates`, red-herring via `internal_metadata.red_herring`/`rule_out`) retained.
- **CHG-06 (enum part)** — Added `edr_session` and `proxy_log` to the manifest `type` enum; added a tree↔enum resolution note so every E-code in the tree resolves to an existing artifact class.
- **CHG-08** — Removed the retired WSUS-churn noise reference from §6 noise examples (that herring ID is retired and not reused; WSUS-01 the host remains in inventory as benign and unremarkable).
- **CHG-10** — Standardized the IIS timezone convention: §4 sidecar `timezone` field and every IIS `.log` artifact header (and README.md guidance) use the exact canonical string `Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`
- **§7 coverage update** — Coverage guarantees now enumerate E-EDR-008B, E-EDR-015, E-NET-005, E-NET-006, E-AUTH-012, E-DOC-003, E-FS-007, and E-PROXY-001 as registered artifacts.
