# HINTS_GUIDE.md — VISTARA-IR-ASSESSMENT-v1.0

**Incident:** INC-2026-0417, Vistara Polymers Pvt. Ltd. (simulation package v1.1)
**Scope of this document:** the complete hint system for all 30 scored tasks — hint philosophy, the per-task penalty table, the exact hint strings (authoritative, taken verbatim from the assessment design kernel), per-task implementation notes, and guardrails for implementers.

---

## 1. Hint Philosophy

- **Guide the investigation, never reveal the answer.** Every hint points the candidate to an evidence source, a correlation technique, or a discriminating test — never to a conclusion. A hint should shorten the *search*, not supply the *finding*.
- **Hints are evidence-anchored.** Each hint names a class of artifact (authentication log, FW-01 session record, task XML, AD snapshot, validation packet) or a comparison to make (cadence vs. benign baseline, source IPs, timestamps, last-logon fields). The candidate must still open the evidence, correlate at least two sources, and derive the deterministic answer themselves.
- **Hints cost points.** Each hint taken deducts the task's `hint_penalty` from that task's earned score (floor 0 per task). Hint usage is logged (task ID, hint number, timestamp) and shown to the reviewer in the post-assessment report.
- **Maximum 2 hints per task.** Q-02-02 defines two hints; all other tasks define one. The second slot exists as policy headroom and must follow the same guardrails if ever populated.

---

## 2. Penalty Table (per task)

| Task | Title | Pts | Hint 1 penalty | Hint 2 penalty | Max possible hint deduction |
|---|---|---:|---:|---:|---:|
| Q-00-01 | Triage & incident declaration | 5 | 1 | — | 1 |
| Q-01-01 | Reading the correlation cluster | 6 | 1 | — | 1 |
| Q-01-02 | Signal vs noise: the vulnerability scanner | 5 | 1 | — | 1 |
| Q-02-01 | The exposure | 6 | 1 | — | 1 |
| Q-02-02 | Initial access determination | 10 | 2 | 2 | 4 |
| Q-02-03 | The web shell | 8 | 2 | — | 2 |
| Q-02-04 | Web/application weakness chain | 6 | 1 | — | 1 |
| Q-03-01 | Credential access chain | 10 | 2 | — | 2 |
| Q-03-02 | First lateral movement & privilege discovery | 8 | 2 | — | 2 |
| Q-03-03 | Identity persistence (rogue account) | 8 | 2 | — | 2 |
| Q-03-04 | Host persistence & C2 (scheduled task) | 8 | 2 | — | 2 |
| Q-03-05 | Domain dominance (DCSync) | 10 | 2 | — | 2 |
| Q-03-06 | Persistence inventory (synthesis) | 6 | 1 | — | 1 |
| Q-04-01 | Rogue account in action | 6 | 1 | — | 1 |
| Q-04-02 | Collection & staging | 8 | 2 | — | 2 |
| Q-04-03 | Exfiltration | 8 | 2 | — | 2 |
| Q-04-04 | Scope discrimination: accessed vs compromised vs probed | 6 | 1 | — | 1 |
| Q-05-01 | Breach scope: host classification table | 10 | 2 | — | 2 |
| Q-05-02 | Breach scope: identities | 8 | 2 | — | 2 |
| Q-05-03 | Timeline reconstruction | 10 | 2 | — | 2 |
| Q-05-04 | ATT&CK mapping | 15 | 3 | — | 3 |
| Q-05-05 | IOC consolidation | 8 | 2 | — | 2 |
| Q-06-01 | Containment decision | 12 | 2 | — | 2 |
| Q-06-02 | Response lifecycle sequencing | 5 | 1 | — | 1 |
| Q-06-03 | Eradication plan | 12 | 2 | — | 2 |
| Q-06-04 | Recovery sequencing & approach | 10 | 2 | — | 2 |
| Q-07-01 | Validation requirements | 8 | 2 | — | 2 |
| Q-07-02 | The safe-state gate (TRAP) | 10 | 2 | — | 2 |
| Q-07-03 | Residual risk & recommendations | 8 | 2 | — | 2 |
| Q-07-04 | Final incident report (structured) | 15 | 3 | — | 3 |

**Deduction mechanics:** `task_score = max(0, earned − Σ penalties of hints taken)`. Penalties never cross task boundaries and never take a task below 0. **Q-07-04 special case:** the 3-point penalty applies to the 10 deterministic report fields only, never to the rubric-scored executive summary. Penalties scale with task weight and difficulty (1 pt on low/medium low-point tasks; 2 pts on high-value correlation tasks; 3 pts on the two 15-point synthesis tasks).

**Scoring context (normative, per SCORING_MODEL.md / kernel v1.0.1 — so no document can yield a different score for the same behavior):** the `earned` value above is computed under equal pooling (points per component = component pool / N; no custom per-component weights). Evidence selection is a candidate-facing scored action (20% tier rule) on the 25 scored evidence-linked tasks — all `evidence_linked: true` tasks EXCEPT **Q-05-01**, which is exempt (40 cells × 0.25 = 10 pts; its evidence requirement is validation/authoring metadata for feedback + CF-3, earning no separate points). Q-05-03, Q-05-04, Q-06-02, and Q-07-04 have no evidence-selection scoring.

---

## 3. Per-Task Hints (exact strings)

> The quoted hint strings below are the authoritative, candidate-facing hint text. They must be reproduced **verbatim** in the implementation. The italic "Implementer note" under each is internal guidance on what the hint should help the candidate do; it is not candidate-facing.

### Phase 0 — Briefing & Triage

**Q-00-01 — Triage & incident declaration** (5 pts)
- **Hint 1 (penalty 1):** "Read the alert's full process lineage and destination, then check whether the dossier or ticket describes any sanctioned activity that matches it."
- *Implementer note:* Should push the candidate to inspect the alerting process tree and external destination in E-ALERT-001 and to rule out sanctioned-activity explanations via the ticket/dossier before declaring a verdict.

### Phase 1 — Detection Validation & Initial Scoping

**Q-01-01 — Reading the correlation cluster** (6 pts)
- **Hint 1 (penalty 1):** "Pull the underlying artifacts the cluster references rather than reading the cluster summary alone; compare the cadence and packet size of the 8443 traffic against known benign service patterns in the dossier."
- *Implementer note:* Should get the candidate past the SIEM summary into E-NET-003/E-EDR-008 and to discriminate beacon cadence from benign service traffic patterns.

**Q-01-02 — Signal vs noise: the vulnerability scanner** (5 pts)
- **Hint 1 (penalty 1):** "Trace the source IP in the asset inventory and read both job headers fully — note which job is on-demand and which is scheduled."
- *Implementer note:* Should lead the candidate to identify the scanner source in the asset inventory and to distinguish the two scanner jobs in E-VULN-001/002, including the on-demand vs. scheduled distinction that rules out the "weekly job" trap option.

### Phase 2 — Initial Access & Compromise Analysis

**Q-02-01 — The exposure** (6 pts)
- **Hint 1 (penalty 1):** "Look at which FW-01 rule allowed the inbound 3389 connections, then search the document store for how and when that rule was created."
- *Implementer note:* Should direct the candidate to correlate the FW-01 ruleset (E-NET-001) with the 2025 vendor email in the document store (E-DOC-001) to explain the rule's origin and persistence.

**Q-02-02 — Initial access determination** (10 pts) — *two hints defined*
- **Hint 1 (penalty 2):** "Filter authentication events on WEB-PRD-01 by source IP and look for the failure burst followed by a Type 10 success; check the DC-01 4776 records in the same minute."
- *Implementer note:* Should teach the brute-force correlation technique: 4625 failure run → 4624 Type 10 success, corroborated by DC-01 NTLM validation records (E-AUTH-001).
- **Hint 2 (penalty 2):** "To eliminate the VPN hypothesis, read the full-window VPN session summary and compare source IPs."
- *Implementer note:* Should help the candidate rule out the VPN vector using the full-window VPN summary (E-AUTH-012) rather than asserting the RDP answer.

**Q-02-03 — The web shell** (8 pts)
- **Hint 1 (penalty 2):** "IIS logs are UTC — convert. Follow the 404 burst on /staging/ to the successful POST, then match the created file on disk; compare timestamps and paths against the 2025 quarantine note."
- *Implementer note:* Should cue the UTC→IST conversion, the 404-burst → POST 200 → GET shell request chain in E-WEB-003, the file-creation match in E-FS-001, and exclusion of the historical 2025 shell via the quarantine note.

**Q-02-04 — Web/application weakness chain** (6 pts)
- **Hint 1 (penalty 1):** "Ask which weakness each attack step needed: reaching the host, getting the password, and regaining access without RDP."
- *Implementer note:* Should get the candidate to map each observed attack step to the weakness it required (exposure, credential, web re-entry) instead of selecting every plausible weakness in the register.

### Phase 3 — Execution, Credentials & Persistence

**Q-03-01 — Credential access chain** (10 pts)
- **Hint 1 (penalty 2):** "Sequence the EDR events on WEB-PRD-01 after the RDP session: recon commands → memory dump → failed 4625 on APP-PRD-01 → file search. The successful pivot one morning later tells you which recovery mattered."
- *Implementer note:* Should help the candidate order the credential-access events, register the failed old-password attempt, and use the next-morning successful pivot to identify which credential recovery actually mattered.

**Q-03-02 — First lateral movement & privilege discovery** (8 pts)
- **Hint 1 (penalty 2):** "Match the 4624 Type 10 on the destination host against EDR session artifacts, then read the next hour of command telemetry for the domain-recon set."
- *Implementer note:* Should point at destination-host authentication × EDR session correlation (E-AUTH-004 × E-EDR-006) and the follow-on domain-discovery command window (E-EDR-007).

**Q-03-03 — Identity persistence (rogue account)** (8 pts)
- **Hint 1 (penalty 2):** "On DC-01, look for 4720/4728/4732 events inside the incident window and check the creator and source workstation fields; confirm current membership in the AD snapshot."
- *Implementer note:* Should direct the candidate to the account-creation/group-change event IDs on DC-01, the creator/source fields, and confirmation of group membership in the AD snapshot (E-AD-001/002/003).

**Q-03-04 — Host persistence & C2 (scheduled task)** (8 pts)
- **Hint 1 (penalty 2):** "Don't trust the task name — export the task XML, decode the -enc payload (the PowerShell Operational log gives you a second copy), and match the FW egress cadence."
- *Implementer note:* Should steer the candidate past the benign-looking task name to the task XML (E-FS-004), the encoded-payload decode with an independent second source (E-EDR-008B), and the FW-01 egress cadence (E-NET-003).

**Q-03-05 — Domain dominance (DCSync)** (10 pts)
- **Hint 1 (penalty 2):** "Look for 4662 directory-replication access on DC-01 from a non-DC source, then read the endpoint telemetry in that session — the command line shows the scope."
- *Implementer note:* Should point to the directory-replication access events from a non-DC source (E-AUTH-006) and the session command line in EDR (E-EDR-009) that reveals the replication scope.

**Q-03-06 — Persistence inventory (synthesis)** (6 pts)
- **Hint 1 (penalty 1):** "Count mechanisms by evidence type: one identity artifact family, one host artifact family, one web artifact family. Don't count capabilities never exercised as active mechanisms."
- *Implementer note:* Should help the candidate structure the inventory as identity + host + web mechanism families and exclude held-in-reserve capabilities (unexercised credential material) from the active-mechanism count.

### Phase 4 — Discovery, Lateral Movement, Collection & Exfiltration

**Q-04-01 — Rogue account in action** (6 pts)
- **Hint 1 (penalty 1):** "Search FILE-PRD-01 authentication events for the rogue account and confirm session continuity in EDR telemetry through the afternoon."
- *Implementer note:* Should point the candidate to destination-host authentication search (E-AUTH-007) plus EDR session continuity (E-EDR-015) to prove actual use of the created identity.

**Q-04-02 — Collection & staging** (8 pts)
- **Hint 1 (penalty 2):** "Correlate the dir/robocopy command lines with SMB file-open audit and the Temp directory writes; the DB questions are answered by a different artifact set (read-only queries ≠ collection)."
- *Implementer note:* Should drive command-line × share-audit × file-write triangulation (E-EDR-010 × E-SHARE-001 × E-FS-005) and the collected-vs-merely-queried distinction for database activity.

**Q-04-03 — Exfiltration** (8 pts)
- **Hint 1 (penalty 2):** "Match archive creation times on each host against FW-01 outbound volume windows; read the NetFlow summary's retention note before assuming a missing flow means no traffic."
- *Implementer note:* Should cue archive-time × outbound-volume matching on both hosts and the retention-based explanation for the absent early flow (E-NET-006), not evidence tampering.

**Q-04-04 — Scope discrimination: accessed vs compromised vs probed** (6 pts)
- **Hint 1 (penalty 1):** "Read the SQL audit for statement types and row counts, and the ERP security log for the exact event count — one failed SMB connect with no following success."
- *Implementer note:* Should get the candidate to classify by evidence detail: read-only statement types/row counts (E-DB-001) = accessed-not-compromised; a single failed logon with no success (E-AUTH-009) = probed only.

### Phase 5 — Full Scoping & Attack-Path Reconstruction

**Q-05-01 — Breach scope: host classification table** (10 pts)
- **Hint 1 (penalty 2):** "For each host demand proof of execution or credential use: a successful logon alone is access, not compromise; a failed logon is a probe; no attacker telemetry at all is benign."
- *Implementer note:* Should supply the four-tier classification rubric (execution/credential-use proof → compromised; logon only → accessed; failed logon → probed; nothing → benign) without classifying any host for the candidate.

**Q-05-02 — Breach scope: identities** (8 pts)
- **Hint 1 (penalty 2):** "For each account ask: is there attacker-controlled use in evidence? Then check the AD snapshot's last-logon field and the VPN full-window summary plus the HR travel record."
- *Implementer note:* Should teach the per-account test (attacker-controlled use in evidence) and point to the rule-out sources for the dormant account (E-AD-003 last-logon) and the two benign VPN users (E-AUTH-012, E-DOC-003).

**Q-05-03 — Timeline reconstruction** (10 pts)
- **Hint 1 (penalty 2):** "Anchor the two exfil-relevant dates (09-03 vs 09-05) and the detection date, then place persistence strictly after the first successful pivot."
- *Implementer note:* Should give the candidate chronological anchors (the two exfil dates and detection) and one ordering constraint (persistence after first pivot) while leaving the full 11-item ordering to them.

**Q-05-04 — ATT&CK mapping** (15 pts)
- **Hint 1 (penalty 3):** "Match each behavior row to the evidence artifact quoted beside it; where two techniques look close (e.g., exfil-over-C2 vs exfil-over-web-service), prefer the channel the evidence actually shows — the same 8443 endpoint as the beacon."
- *Implementer note:* Should push evidence-anchored mapping rather than memorization and resolve the designed near-miss pairs by the channel the evidence shows, without naming any row's technique.

**Q-05-05 — IOC consolidation** (8 pts)
- **Hint 1 (penalty 2):** "An IOC must be attacker-attributable: test each candidate against its evidence — scanner, office-egress IP, and the 2025 shell all fail that test."
- *Implementer note:* Should state the inclusion test (attacker-attributability) and flag the *categories* of look-alikes that fail it, without naming which candidate items are in or out.

### Phase 6 — Containment, Eradication & Recovery

**Q-06-01 — Containment decision** (12 pts)
- **Hint 1 (penalty 2):** "Contain what is proven compromised or attacker-controlled — no more (domain auth and payroll depend on the rest), no less (a beacon is still running)."
- *Implementer note:* Should frame the scoping principle (contain the proven set; respect business dependencies; do not leave live attacker infrastructure up) without listing which hosts/accounts/IPs to act on.

**Q-06-02 — Response lifecycle sequencing** (5 pts)
- **Hint 1 (penalty 1):** "Urgent containment comes first; destructive cleanup must never precede preservation; you cannot validate a state you have not yet restored."
- *Implementer note:* Should state the three ordering constraints (containment first; preservation before eradication; validation after recovery) and let the candidate assemble the five-step sequence.

**Q-06-03 — Eradication plan** (12 pts)
- **Hint 1 (penalty 2):** "Walk your own findings: every persistence mechanism (Q-03-06), both entry weaknesses (Q-02-01, Q-02-03), and every credential whose exposure you proved — including what the /all DCSync scope implies."
- *Implementer note:* Should turn the candidate's own earlier findings into the eradication checklist (persistence mechanisms, entry weaknesses, full credential-reset scope implied by the DCSync scope) without listing the actions.

**Q-06-04 — Recovery sequencing & approach** (10 pts)
- **Hint 1 (penalty 2):** "Identity infrastructure must be trustworthy before anything rejoins it; known-compromised operating systems are rebuilt, not patched; pick the newest backup that PREDATES initial access."
- *Implementer note:* Should supply the three recovery principles (validate identity first; rebuild compromised OSes; newest pre-incident backup) without assigning approaches to hosts.

### Phase 7 — Safe-State Validation & Final Reporting

**Q-07-01 — Validation requirements** (8 pts)
- **Hint 1 (penalty 2):** "A rebuilt host can still carry a re-deployed misconfiguration or a missed artifact — the checklist must verify persistence absence everywhere, identity state, network exposure, log silence, and business function."
- *Implementer note:* Should explain why rebuilt hosts still need persistence re-checks and enumerate the verification *dimensions* (persistence, identity, network, logs, business) without naming the required checklist items.

**Q-07-02 — The safe-state gate (TRAP)** (10 pts)
- **Hint 1 (penalty 2):** "Check the gate against your own Q-07-01 checklist line by line; a SKIPPED line is not a PASS."
- *Implementer note:* Should force a line-by-line comparison of the interim validation packet against the candidate's own checklist and establish that SKIPPED ≠ PASS — without stating the SAFE/NOT SAFE declaration.

**Q-07-03 — Residual risk & recommendations** (8 pts)
- **Hint 1 (penalty 2):** "Map each recommendation to a weakness ID you actually met in evidence; exclude anything already verified closed by eradication."
- *Implementer note:* Should require each selection to trace to an exercised/exposed weakness and to exclude items already closed by the completed eradication, without naming weakness IDs or options.

**Q-07-04 — Final incident report (structured)** (15 pts)
- **Hint 1 (penalty 3 — applies to deterministic fields only):** "Your phase answers are the report's source of truth — do not introduce anything you did not prove."
- *Implementer note:* Should direct the candidate to synthesize strictly from their own prior phase answers (the consistency rule's source set) and avoid unproven additions; must not pre-fill any report field.

---

## 4. Guardrails for Implementers

1. **Never contain a canonical answer.** A hint must not name the host, account, IP, path, technique ID, option letter, or set membership that constitutes the answer.
   - **FORBIDDEN:** "The answer is WEB-PRD-01." (Also forbidden in softer forms: "Take a close look at WEB-PRD-01's 4624 events — especially the successful one from 45.155.90.23." — naming the host + source IP gives away (a) and the destination.)
   - **ALLOWED (the house style):** "Filter authentication events on the web server by source IP and look for the failure burst followed by a Type 10 success." — it names an evidence class and a correlation technique; the candidate must still find the IP, account, and timestamp.
2. **Never state an evidence verdict.** Hints may point at artifacts but must not say what the artifact shows. Forbidden: "E-AUTH-012 proves no attacker used the VPN." Allowed: "read the full-window VPN session summary and compare source IPs."
3. **Never classify a red herring.** Hints must not declare any scanner run, user, account, or historical artifact benign or malicious. Q-01-02's hint is the boundary case done right: it points at the asset inventory and job headers (where the rule-out lives) without saying "the scans are benign."
4. **No cross-task leakage.** A hint for task X must not reveal the canonical answer of task Y. References to a candidate's *own earlier answers* (e.g., Q-06-03's "walk your own findings") are allowed because they leverage work the candidate already did.
5. **One investigative move per hint.** Each hint should unblock exactly one step (find the artifact, apply the conversion, run the comparison). If a task needs two independent unblocking moves, use the second hint slot (Q-02-02 pattern) rather than a compound mega-hint.
6. **Timezone and convention reminders are legitimate hint content** where the artifact header itself declares the convention (e.g., Q-02-03's UTC→IST cue); they teach a skill, not an answer.
7. **Verbatim string rule.** Hint text is candidate-facing graded content: reproduce the strings in §3 exactly. Any wording change requires re-validation against rules 1–4 (answer leak, verdict leak, red-herring classification, cross-task leak).
8. **Penalty enforcement.** The engine must apply `max(0, earned − Σ penalties)` at task level, enforce the 2-hint maximum, and log every hint event for reviewer visibility. Hint penalties never affect critical-failure evaluation, which is based on submitted answers only.
