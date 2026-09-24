# Evidence Authoring Conventions (binding for all evidence-src content)

This directory holds the authored bodies of the 68 synthetic evidence artifacts.
`tools/build-evidence.mjs` copies them to `public/evidence/` and validates them against
`EVIDENCE_DIRECTORY_SPEC_v1.1.md` and `EVIDENCE_SCHEMAS_TEMPLATES_v1.1.md`.

## Ground truth (read before authoring anything)

- `EVIDENCE_CATALOG_v1.1.md` — per-artifact purpose, fields, reveal phase, red-herring/rule-out info
- `EVIDENCE_SCHEMAS_TEMPLATES_v1.1.md` — per-type schemas + exemplar templates (verbatim seeds)
- `EVIDENCE_DIRECTORY_SPEC_v1.1.md` — tree, naming, headers, noise, drill-down, manifest rules
- `ATTACK_TIMELINE_v1.1.md` — canonical event facts (times, hosts, users, commands)
- `ENVIRONMENT.md` — canonical host/user/IP/name registry (§11)

## Hard rules

1. Every fact that any scored answer depends on must appear verbatim and unambiguously
   (IPs 185.220.101.47, 45.155.90.23; hosts WEB-PRD-01/APP-PRD-01/FILE-PRD-01/DC-01 etc.;
   accounts svc_portal, rajesh.kulkarni, svc_mon; paths
   C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx,
   C:\ProgramData\Microsoft\Crypto\RSA\staging.zip, C:\Windows\Temp\collect\,
   order_export_2026.zip; task MicrosoftEdgeUpdateTaskMachineCore; times per ATTACK_TIMELINE).
2. Timezone: all artifacts IST, EXCEPT IIS (E-WEB-*) which are UTC and MUST carry this exact
   header line: `# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.`
3. Non-IIS text artifacts start with 2–4 `#` comment header lines: source system, timezone IST,
   query/collection window, and (for high-volume sources) a `# SUMMARY:` line plus
   `# DRILL-DOWN: <file>` pointer where a drill-down CSV exists.
4. Windows events are plain text lines, NEVER XML. Allowed event IDs only:
   4624, 4625, 4662, 4720, 4725, 4726, 4728, 4732, 4776. Event ID 4628 must never appear.
   RH-06 must never appear.
5. JSON artifacts carry `"synthetic": true`; hashes prefixed `SYNTHETIC-`.
6. Forbidden strings in ANY candidate-visible body (any casing): "decisive", "corroborating",
   "expected significance", "correct answer", "attack event id", "red herring", "rule-out",
   "EVT-", "RH-0". Diegetic pointers only ("quarantined per IR-2025-011 note",
   "see HR travel approval TRV-2026-0312", "registered static IP - see asset inventory").
7. Never reveal significance: no "suspicious"/"malicious"/"attacker" labels from an omniscient
   narrator. Sources speak in their own voice (SIEM rules, log lines, ticket text may say
   what that system would say, e.g. an EDR rule name).
8. Length: typically 20–80 lines, max ~200. High-volume sources (E-AUTH-001, E-SHARE-001,
   E-NET-001, E-NET-003) use `# SUMMARY:` + representative lines + drill-down CSV.
9. Interleave 20–30% plausible benign noise lines (business-hours user activity, system noise,
   ambient scanners for E-AUTH-001/E-NET-001, benign bot traffic for E-WEB-001).
   Noise must never contradict canonical facts.
10. EDR JSON: array of event objects (≤ ~12/file) with ts_ist (or ts_utc for nothing — EDR is IST),
    host, user, pid, process, cmdline, parent, sha256 (SYNTHETIC-...). Attacker command lines
    verbatim per SCHEMAS §14 (whoami, ipconfig /all, net user, quser, netstat -ano, tasklist,
    wmic ..., appcmd list site, procdump, type/findstr passwords, net group "Domain Admins",
    nltest /dclist, schtasks /create, powershell -enc ..., lsadump::dcsync /domain:vistara.local /all,
    robocopy, Compress-Archive, Invoke-WebRequest, Clear-History etc. — exactly as the
    templates/timeline specify).
11. Drill-down CSVs: header row + plausible rows consistent with the parent artifact's summary.
12. Do NOT create manifest.json — the manifest is authored centrally in `evidence-src/manifest.src.json`.
13. File placement: `evidence-src/<subdir>/<FILENAME>` where subdir ∈
    alerts, web, auth, edr, fs, net, ad, db, vuln, docs, response.
    FILENAME must exactly match the assigned list you were given.
