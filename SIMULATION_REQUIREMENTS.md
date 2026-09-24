# SIMULATION_REQUIREMENTS.md

**Browser-Based Cyber Incident Investigation & Response Simulation — High-Level Architecture and Learning Framework**

**Author:** Agent 1 — Simulation Architect and Learning Experience Designer
**Status:** Requirements baseline for Agent 2 (narrative design) and Agent 3 (implementation)
**Version:** 1.0

---

## 1. Simulation Purpose

This simulation is a five-hour, browser-based, synthetic cyber incident investigation and response exercise for security professionals working in an Indian organizational context. Its purpose is to assess and develop a candidate's ability to investigate a realistic enterprise breach end-to-end — from the first alert through scoping, containment, eradication, recovery, safe-state validation, and final reporting.

The simulation is investigative, not instructional. The candidate is placed inside a plausible incident and must do the work a real responder would do: triage alerts, correlate evidence across multiple sources, reconstruct a timeline, identify the attack path, scope the compromise, make containment and recovery decisions, and produce a defensible incident report. Learning happens through the doing, not through lectures or hints.

The simulation must feel like a real incident: incomplete information, noise alongside signal, red herrings, time pressure, and the need to make defensible decisions under uncertainty. However, every scored decision point must resolve to a deterministic, objectively gradable answer.

---

## 2. Target Audience

- Security Operations Center (SOC) analysts (L2/L3) moving toward incident response work.
- Incident responders and DFIR analysts at the early-to-mid stage of their careers.
- Security engineers and IT administrators with security responsibilities who need to understand how breaches unfold across web, identity, and endpoint layers.
- Candidates preparing for roles that require evidence correlation, attack-path reconstruction, and structured incident reporting.

Assumed baseline knowledge:
- Working familiarity with Windows Active Directory concepts (users, groups, Kerberos/NTLM, privileged tiers).
- Ability to read common log formats (web access logs, Windows event logs, authentication logs, EDR-style process telemetry at a conceptual level).
- Basic understanding of MITRE ATT&CK as a behavior taxonomy.
- Basic incident response vocabulary (containment, eradication, recovery, IOCs).

The simulation must not require deep malware reverse engineering, kernel-level forensics, or exploit development knowledge.

---

## 3. Candidate Role

The candidate plays a **Senior Incident Response Analyst** (or "Incident Commander — Technical") at a fictional Indian mid-sized organization. The candidate is the primary technical decision-maker for this incident, supported by a small virtual team whose work is represented through the simulation's evidence and reference panels.

Specifically, the candidate:
- Receives and triages the initial detection alert.
- Directs the investigation by choosing what evidence to examine and in what order.
- Correlates findings across web, identity, endpoint, and network sources.
- Determines scope, attack path, and business impact.
- Makes and justifies containment, eradication, and recovery decisions.
- Declares systems safe (or not) before restoring services.
- Authors the final incident report.

The candidate is not a passive quiz-taker. The simulation must present the candidate with an investigative workspace in which evidence must be actively examined. However, the scored artifacts are the candidate's answers and decisions, not the path taken to reach them.

---

## 4. Duration

- **Total seated time:** 5 hours (300 minutes), single sitting.
- The simulation is phase-gated but time-aware: the candidate may move freely within a phase and revisit earlier evidence, but progression to the next phase requires completing the phase's required tasks.
- A visible in-simulation clock creates mild time pressure for decision tasks (containment, go/no-go) without hard-failing the candidate for slow investigation.
- Recommended pacing guidance is built into the phase structure (see Section 10) so a candidate spending too long on early phases receives a gentle nudge, not a penalty.
- The experience must be completable in 5 hours by a well-prepared candidate while still challenging a strong candidate. Target: median completion ~4.5 hours for the intended audience.

---

## 5. Learning Outcomes

Upon completing the simulation, the candidate must be able to demonstrate the following capabilities. Each maps to scored assessment areas.

1. **Full-cycle breach analysis** — Analyze a cyber breach from initial alert through final incident understanding.
2. **Reconnaissance discrimination** — Identify reconnaissance activity and distinguish useful signal from benign noise (scanner traffic, vulnerability probing, directory brute force vs. background bots and legitimate crawlers).
3. **Initial access determination** — Determine the initial access / compromise mechanism from evidence.
4. **Execution and post-compromise analysis** — Analyze attacker execution and post-compromise activity on affected systems.
5. **Attack-path chaining** — Understand how moderate weaknesses in web and/or application infrastructure chain into a realistic attack path (no exotic zero-days; the path must be believable with commonly misconfigured technology).
6. **Identity/AD weakness exploitation** — Understand how weaknesses in identity / Active Directory environments contribute to escalation, persistence, privilege abuse, or lateral movement.
7. **Credential compromise identification** — Identify and analyze credential compromise (password reuse, weak service account credentials, credential dumping, token abuse at a conceptual level).
8. **Persistence identification** — Identify persistence mechanisms (accounts, scheduled tasks, services, registry autoruns, web shells, etc.).
9. **Discovery and lateral movement investigation** — Investigate discovery activity and lateral movement using authentication and process evidence.
10. **Collection and exfiltration analysis** — Analyze collection and exfiltration activity, including what was taken and how.
11. **Multi-source correlation** — Correlate evidence from multiple sources rather than relying on a single artifact.
12. **Timeline reconstruction** — Reconstruct an accurate incident timeline with correct sequencing and timestamps.
13. **MITRE ATT&CK mapping** — Map relevant attacker behavior to MITRE ATT&CK technique IDs and names.
14. **IOC identification** — Identify meaningful, defensible IOCs (not every IP is an IOC; candidates must discriminate).
15. **Breach scoping** — Scope a breach: which hosts, accounts, and data are affected.
16. **Containment decision-making** — Make appropriate containment decisions with defensible rationale.
17. **Eradication planning** — Perform eradication planning (remove persistence, close weaknesses, reset credentials in the right order).
18. **Controlled recovery** — Restore critical services in a controlled manner with correct sequencing.
19. **Safe-state validation** — Validate that systems are in a safe operational state before declaring recovery complete.
20. **Defensible reporting** — Produce a final investigation / incident report that a real stakeholder could act on.

---

## 6. Difficulty Level

- **Overall:** Intermediate to upper-intermediate (target: a competent L2 SOC analyst with some IR exposure should complete it; a senior analyst should find it engaging but not trivial).
- **Difficulty levers:**
  - Evidence is realistic and incomplete; no single artifact gives the full answer.
  - Red herrings and benign noise require discrimination.
  - Some answers require sequencing multiple events across time and systems.
  - Containment/eradication/recovery decisions have plausible distractors with real trade-offs.
- **Difficulty must NOT come from:** obscure trivia, unrealistic log formats, giant data volumes, or trick questions. The challenge is investigation, not stamina or guesswork.
- **Scaffolding:** The first phase includes light guidance (an incident briefing, a triage checklist). Guidance tapers as the candidate progresses; later phases assume full independence.

---

## 7. Investigation Philosophy

The simulation is built on these principles:

1. **Evidence-first.** Every conclusion the candidate reaches must be supported by evidence they examined. The simulation tracks which evidence supports each scored answer (for feedback and grading robustness), but the candidate is free to examine evidence in any order.
2. **Correlation over isolation.** No scored question may be answerable from a single artifact unless that artifact is itself the product of correlation (e.g., a timeline entry). Design every task so that the intended answer requires cross-referencing at least two sources.
3. **Signal vs. noise.** The environment contains realistic noise: vulnerability scanner traffic, marketing bots, misconfigured monitoring, legacy systems behaving oddly, and user activity that looks suspicious but is benign. Candidates must demonstrate judgment.
4. **Deterministic answers, investigative effort.** The final answer to every scored question is objective (a hostname, a timestamp, a technique ID, a yes/no). The effort to reach it is investigative. "Short answer" does not mean "easy task."
5. **Consequences without dead ends.** Wrong containment or eradication decisions produce realistic consequences (e.g., a service outage, a persistence mechanism surviving) and may cost points, but the simulation must never soft-lock. The candidate can always recover and continue.
6. **Realism over completeness.** The environment is a plausible mid-sized Indian enterprise — not a textbook diagram. It has legacy systems, exceptions, and messiness, but bounded messiness (see Section 26).

---

## 8. Candidate Journey

The candidate journey follows a coherent attack story. The simulation must make the candidate feel they are living inside this story, not ticking boxes.

**Story spine:**
Weakness / exposure → reconnaissance → initial access → compromise → execution → credential access → persistence → discovery → lateral movement → collection → exfiltration → detection → investigation → containment → eradication → recovery → safe-state validation → final reporting

**Journey stages:**

1. **Arrival & briefing (Phase 0):** The candidate receives an incident ticket: an alert fired (e.g., EDR / IDS / DLP / SOC escalation). A short briefing establishes role, authority, and the first task.
2. **Triage & validation:** Determine whether the alert is a true incident. Validate the detection, identify the likely affected asset(s), and escalate from "alert" to "declared incident."
3. **Deep investigation:** Work through the attack story: find the entry point, trace execution, uncover credential theft, map persistence, follow lateral movement, identify collection and exfiltration.
4. **Scoping:** Determine blast radius: affected hosts, compromised accounts, exposed data.
5. **Response decisions:** Make containment calls, plan eradication, sequence recovery, and validate safe state.
6. **Reporting:** Produce the final incident report and answer executive-level summary questions.

**Emotional arc:** curiosity (triage) → engagement (unraveling the path) → pressure (scoping and containment under time awareness) → satisfaction (clean recovery and defensible report).

---

## 9. Recommended Number of Phases

**Seven phases plus a phase-zero briefing:**

| Phase | Name | Core Question |
|-------|------|---------------|
| 0 | Briefing & Triage | Is this a real incident? What fired? |
| 1 | Detection Validation & Initial Scoping | What's affected? How did they get in? |
| 2 | Initial Access & Compromise Analysis | What weakness was exploited, and how? |
| 3 | Post-Compromise Activity: Execution, Credentials, Persistence | What did the attacker do, steal, and leave behind? |
| 4 | Discovery, Lateral Movement, Collection & Exfiltration | Where did they go, what did they take? |
| 5 | Full Scoping & Attack-Path Reconstruction | The complete picture: timeline, blast radius, ATT&CK mapping |
| 6 | Containment, Eradication & Recovery | Stop the bleeding, remove the foothold, restore safely |
| 7 | Safe-State Validation & Final Reporting | Prove it's clean; report it defensibly |

Rationale: seven phases map naturally onto the attack story and the response lifecycle, keep each phase focused, and allow the time allocations in Section 10 to hold. Phases 1–5 are investigative; Phases 6–7 are response and reporting.

---

## 10. Approximate Time Allocation Across Phases

Total: 300 minutes. Allocations are guidance for pacing, not hard cutoffs (except the final reporting deadline).

| Phase | Duration | Focus |
|-------|----------|-------|
| 0. Briefing & Triage | 15 min | Read briefing, validate alert, declare incident |
| 1. Detection Validation & Initial Scoping | 30 min | Identify affected asset(s), first IOCs, initial timeline seed |
| 2. Initial Access & Compromise Analysis | 45 min | Web/app weakness analysis, entry point, exploitation path |
| 3. Execution, Credentials & Persistence | 60 min | Post-compromise analysis: execution, credential theft, persistence mechanisms |
| 4. Lateral Movement, Collection & Exfiltration | 45 min | Discovery, lateral movement, data staging and exfiltration |
| 5. Scoping & Attack-Path Reconstruction | 30 min | Full timeline, blast radius, ATT&CK mapping, IOC consolidation |
| 6. Containment, Eradication & Recovery | 45 min | Containment decisions, eradication plan, recovery sequencing |
| 7. Safe-State Validation & Reporting | 30 min | Go/no-go validation, final report, executive summary |
| **Total** | **300 min** | |

Buffer logic: strong candidates will finish investigative phases early and bank time for Phase 6–7 decisions. The pacing system nudges candidates who exceed phase guidance by more than ~20%.

---

## 11. Required Candidate Activities

The candidate must perform the following activity types. Each maps to scored tasks.

1. **Alert triage:** Review the triggering alert(s) and determine validity (true/false positive with justification via evidence selection).
2. **Log and evidence review:** Examine web server logs, authentication logs (AD/Kerberos/NTLM conceptually), EDR-style process telemetry, email or messaging artifacts, firewall/DNS records, and documents — within the simulation's evidence panels.
3. **Timeline construction:** Place key events in order (scored as an ordered-sequence task at least once).
4. **IOC extraction:** Identify meaningful IOCs from evidence and distinguish them from noise (multi-select set).
5. **Technique identification:** Map observed behaviors to MITRE ATT&CK technique IDs (fill-in or select from a controlled list — no free-text technique guessing).
6. **Host/account identification:** Name the first compromised host, the compromised accounts, the persistence location, etc. (deterministic string answers).
7. **Scoping:** Select affected hosts, accounts, and data categories from the environment inventory (multi-select with deterministic correct set).
8. **Containment decisions:** Choose containment actions from a decision set (single-choice or multi-select with deterministic correct set and defensible rationale selection).
9. **Eradication planning:** Order eradication steps correctly (ordered sequence) and select all required eradication actions (multi-select).
10. **Recovery sequencing:** Order service restoration steps (ordered sequence) and make go/no-go calls per system (yes/no per system with deterministic basis).
11. **Safe-state validation:** Identify which validation checks must pass before declaring recovery complete (multi-select) and correctly judge given validation results (go/no-go).
12. **Reporting:** Complete a structured incident report (fill-in fields, selections, and one short-answer executive summary with a rubric — the only non-fully-deterministic item; see Section 13).

---

## 12. Expected Candidate Outputs

By the end of the simulation, the candidate must have produced:

1. **Triage determination** — true incident vs. false positive, with the supporting evidence indicated.
2. **Initial scope statement** — affected asset(s) at triage time.
3. **Attack path summary** — the chained weaknesses and steps from exposure to objective (structured fill-in: weakness → access → execution → credentials → persistence → movement → collection → exfiltration).
4. **Incident timeline** — ordered key events with timestamps.
5. **IOC list** — the defensible set of indicators (IPs, domains, hashes/file names, accounts, persistence artifacts).
6. **ATT&CK mapping** — technique IDs/names for each major behavior.
7. **Breach scope** — final affected hosts, accounts, and data categories.
8. **Containment decision record** — actions chosen and rationale.
9. **Eradication plan** — ordered steps and completeness set.
10. **Recovery plan** — restoration sequence and go/no-go outcomes per system.
11. **Safe-state validation record** — checks performed and outcomes.
12. **Final incident report** — structured report with executive summary, timeline, findings, scope, actions taken, and recommendations.

---

## 13. Assessment Philosophy

1. **Deterministic grading for all scored items.** Every scored question resolves to one objectively gradable answer or state (see Section 14). No partial credit ambiguity, no "describe what happened" free-text scoring.
2. **Effort is investigative; answers are objective.** The simulation distinguishes between the work (correlating evidence) and the artifact (the answer). Points reward correct conclusions reached through investigation.
3. **Consequence-aware scoring for decisions.** Containment, eradication, recovery, and go/no-go decisions are scored against the deterministic "best defensible decision" set. Plausible-but-suboptimal decisions earn reduced credit; reckless decisions earn none for that item but do not end the simulation.
4. **One rubric-scored item allowed.** The executive summary in the final report may use a tight rubric (completeness of: what happened, impact, actions, residual risk). All other items are deterministic.
5. **Evidence-linked answers.** For key investigative answers, the candidate indicates which evidence supports the answer (evidence selection). This makes guessing unrewarding and grading auditable.
6. **No negative marking** for investigative answers; decision items may carry consequence-based score reduction (e.g., choosing "wipe everything immediately" costs containment points but not investigative points).
7. **Transparency of standards, opacity of answers.** Candidates know what is expected (e.g., "identify the persistence mechanism") but not the answer. Feedback is given at phase end (light) and at simulation end (full).

---

## 14. Answer Design Requirements

Every scored question MUST conform to one of these deterministic answer types:

- **Exact string** (case-insensitive match with allowed aliases): asset name, hostname, username, IP address, domain, file name, policy name.
- **Timestamp** (ISO 8601 with defined precision and timezone handling — the simulation must state the timezone convention, e.g., IST).
- **Single choice** from 2–6 options (e.g., containment decision).
- **Multiple choice / multi-select** with an exact correct set (e.g., IOC set, affected host set).
- **Ordered sequence** with exact or near-exact ordering (e.g., attack path, eradication steps, recovery sequence).
- **Yes/No** with deterministic basis (e.g., go/no-go per system).
- **MITRE ATT&CK technique** selected from a controlled list or entered as a validated technique ID (e.g., T1059) with name confirmation.

Hard rules:
- NO free-text "explain" or "describe" questions (except the single rubric-scored executive summary).
- NO ambiguous multi-select where "best" is debatable — the correct set must be derivable from evidence.
- NO questions answerable by luck alone; evidence-linked selection required for key items.
- NO trick questions. If two answers seem defensible, the evidence must clearly favor one.
- Every answer key must include the supporting evidence references (artifact IDs) so graders and the implementing agent can verify determinism.

---

## 15. Evidence Correlation Philosophy

1. **Minimum two sources per conclusion.** Design each key finding so that at least two independent evidence sources corroborate it (e.g., web log + EDR process event; authentication log + DLP alert).
2. **Source diversity.** Evidence types must span: web/app logs, AD/authentication telemetry, endpoint/process telemetry, network/DNS/firewall records, DLP/exfiltration signals, and human-context artifacts (tickets, emails, policy documents, org charts in the dossier).
3. **Dossier as context, not answer.** The right panel (organization info, asset inventory, user directory, policies) provides context that makes evidence interpretable (e.g., knowing a host is internet-facing, knowing an account is a service account) but never directly states attack facts.
4. **Timestamps as the backbone.** All evidence must be timestamp-consistent so the timeline task is fair. Timezone handling must be explicit (IST primary, UTC in logs where realistic).
5. **Noise budget.** Roughly 20–30% of raw log volume should be noise (scanners, bots, misconfigurations, benign anomalies). Noise must be plausible and bounded — never a wall of irrelevant data.
6. **Red herring discipline.** Red herrings must be *explainable* — a candidate who investigates a red herring must be able to rule it out with evidence, not by guessing (see Section 24).

---

## 16. Web Infrastructure Learning Requirements

The simulation must teach candidates how moderate web/application weaknesses are discovered and chained. Requirements:

1. **Reconnaissance recognition:** Candidates must identify reconnaissance in web logs (directory probing, parameter fuzzing, scanner user-agents, rate patterns) and distinguish it from benign crawler/bot traffic.
2. **Vulnerability identification:** The initial access must exploit a plausible, commonly misconfigured weakness class — e.g., exposed admin interface, vulnerable upload, injection flaw, default/weak credentials on a web-facing component, or an unpatched public-facing application. No exotic zero-days.
3. **Web shell / foothold analysis:** Candidates must identify the attacker-placed artifact (web shell, malicious upload, rogue scheduled job triggered via web) from file and process evidence.
4. **Log fluency:** Candidates must extract attacker actions from web access logs (paths, methods, status codes, timing, source IPs) and correlate them with downstream endpoint evidence.
5. **Chaining lesson:** The candidate must articulate how the web weakness enabled the next step (e.g., web shell → command execution → credential access). The attack-path task (Section 12, item 3) is where this is scored.
6. **Moderate weakness standard:** The exploited weakness must be realistic for a mid-sized Indian enterprise — a missing patch on a public-facing server, a forgotten admin panel, a test environment exposed to the internet, or a weakly protected service account used by a web application.

---

## 17. AD / Identity Learning Requirements

The simulation must teach candidates how identity weaknesses enable escalation and movement. Requirements:

1. **Credential compromise identification:** Candidates must identify which accounts were compromised and how (password reuse, weak service account password, credential dumping after initial foothold, or abuse of an over-privileged service account).
2. **Privilege escalation path:** The AD environment must contain a realistic escalation path — e.g., a service account with excessive rights, a user in a privileged group inconsistently, weak ACLs on a sensitive group, or an old admin account still enabled. Candidates must identify the escalation mechanism.
3. **Authentication evidence fluency:** Candidates must read authentication-style telemetry (successful/failed logons, logon types conceptually, Kerberos ticket requests at a high level) to identify lateral movement and distinguish it from normal admin activity.
4. **Persistence via identity:** At least one persistence mechanism must be identity-linked (rogue account, password change on a service account, delegation abuse conceptually, or added group membership).
5. **Service account lesson:** The scenario must include at least one service account with a weak or reused password, teaching candidates that non-human accounts are prime targets.
6. **Bounded complexity:** The AD environment must be small enough to reason about (see Section 26) — one domain, a handful of servers, a clear but imperfect privilege structure.

---

## 18. Incident Response Requirements

1. **Lifecycle fidelity:** The simulation must follow a real IR lifecycle: preparation (briefing) → detection & analysis → containment → eradication → recovery → post-incident (reporting + lessons).
2. **Decision realism:** Response decisions must have plausible alternatives with real trade-offs (e.g., isolate the server vs. monitor it; reset all credentials vs. targeted resets; restore from backup vs. rebuild).
3. **Sequencing matters:** Eradication before containment is incomplete; recovery before eradication is dangerous. Ordered-sequence tasks must capture this.
4. **Business awareness:** The dossier must include business context (critical services, business hours in IST, dependent teams) so containment/recovery decisions account for operational impact.
5. **Communication artifacts:** Candidates must produce short decision records (structured selections + rationale choices), mirroring real IR documentation.
6. **No dead ends:** Every decision path must remain completable; wrong decisions cost points and may add remedial tasks, never termination.

---

## 19. Containment Requirements

1. **Deterministic containment set:** The simulation must define the objectively correct containment actions for the incident (e.g., isolate specific hosts, disable specific accounts, block specific IOCs, suspend specific services).
2. **Distractor quality:** Incorrect options must be plausible (e.g., "isolate the entire VLAN" — overbroad; "monitor only" — under-reactive; "shut down the domain controller" — destructive).
3. **Containment scope task:** Candidates must select the containment scope (hosts/accounts/network controls) as a multi-select with a deterministic correct set.
4. **Rationale selection:** Candidates must select the primary rationale for each containment action from a controlled list (e.g., "host exhibits active C2," "account confirmed compromised," "prevent lateral movement").
5. **Consequence modeling:** Choosing under-containment may trigger a simulated escalation (e.g., additional alerts) that the candidate must then handle; over-containment costs business-impact points. Both remain completable.
6. **Time awareness:** Containment decisions are presented with a mild time-pressure framing (attacker may still be active), reinforcing urgency without hard timers.

---

## 20. Eradication Requirements

1. **Completeness set:** Candidates must select ALL required eradication actions (multi-select, deterministic): remove persistence artifacts, close the exploited weakness, reset compromised credentials, remove rogue accounts/access, patch or fix the exploited misconfiguration.
2. **Ordering task:** Candidates must order eradication steps correctly (e.g., contain → remove persistence → reset credentials → patch → validate). Exact or near-exact ordering scored.
3. **No premature closure:** The design must make "restore from backup and done" an explicitly insufficient answer — backups don't remove the entry weakness or reset stolen credentials.
4. **Verification step:** Eradication must include a verification concept (e.g., re-scan, re-check persistence locations) reflected in the safe-state validation phase.
5. **Weakness closure:** Candidates must identify the specific weakness that enabled initial access and select the correct fix (single choice from plausible options).

---

## 21. Recovery Requirements

1. **Sequencing task:** Candidates must order service restoration (ordered sequence) reflecting dependencies (e.g., identity services before application services; validate integrity before reconnecting to network).
2. **Go/no-go per system:** For each affected system, candidates make a go/no-go restore decision based on presented validation results (deterministic basis: e.g., "EDR clean + persistence checks negative + credentials reset = go").
3. **Controlled restoration:** Recovery must be staged — candidates select the correct restoration approach (rebuild vs. restore-from-clean-backup vs. patch-and-monitor) per system with deterministic correctness.
4. **Business sequencing:** The dossier's business context must make one restoration order clearly correct (critical service first, with dependencies respected).
5. **Monitoring requirement:** Post-restore monitoring must be part of the correct recovery set (multi-select includes "enhanced monitoring for X days").

---

## 22. Safe-State Validation Requirements

1. **Validation checklist task:** Candidates must select which checks are required before declaring recovery complete (multi-select, deterministic): persistence re-check, credential reset verification, clean EDR scan, network monitoring baseline, web weakness re-test, log review for recurrence.
2. **Result interpretation:** Candidates must interpret presented validation results and make a final go/no-go declaration per system and overall (yes/no with deterministic basis).
3. **Trap design:** At least one validation result must be subtly insufficient (e.g., "EDR clean" but persistence mechanism still present in an unchecked location), testing whether candidates insist on complete validation. The correct answer must be derivable from evidence.
4. **Declaration task:** The final safe-state declaration is a scored yes/no with evidence-linked justification.
5. **Residual risk acknowledgment:** Candidates must select the correct residual-risk statement from options (deterministic), teaching that recovery includes documented residual risk.

---

## 23. Reporting Requirements

1. **Structured report:** The final report is a structured form (fill-in fields + selections), not a blank document. Fields: incident summary, detection source, attack path, timeline, affected assets/accounts/data, IOCs, ATT&CK mapping, containment actions, eradication actions, recovery actions, validation results, residual risk, recommendations.
2. **Executive summary:** One short-answer field (rubric-scored) requiring a 3–5 sentence summary suitable for a non-technical executive. Rubric: mentions what happened, business impact, actions taken, current status.
3. **Timeline accuracy:** The report's timeline section is scored against the deterministic event sequence.
4. **Recommendations task:** Candidates select the correct set of remediation recommendations from options (multi-select, deterministic) — e.g., patch management, credential hygiene, segmentation, monitoring improvements, policy changes.
5. **Defensibility standard:** The report must be coherent with the candidate's earlier answers — internally inconsistent reports lose points (the implementation should cross-check report fields against phase answers).
6. **Export:** The completed report must be exportable (PDF/print) as a candidate deliverable artifact.

---

## 24. Rules for Red Herrings / False Positives

1. **Explainability rule:** Every red herring must be rule-out-able with evidence available in the simulation. A candidate who investigates it must find a concrete reason it is not the answer (e.g., timestamp mismatch, benign process parent, documented maintenance window, known scanner IP).
2. **Bounded count:** 3–5 major red herrings across the simulation, plus ambient noise. Red herrings must not outnumber real leads.
3. **Types allowed:**
   - A vulnerability scan by the org's own scanner or a known vendor.
   - A benign admin performing unusual-but-legitimate work (e.g., late-night patch deployment).
   - A legacy system with odd behavior that predates the incident.
   - A user account with suspicious-looking but legitimate activity (e.g., traveling user, new device).
   - An old, unrelated compromise indicator (e.g., a previously cleaned web shell from months ago) that must be distinguished from the current incident.
4. **No arbitrary herrings:** Red herrings must not require insider knowledge to dismiss; dismissal evidence must be in the simulation.
5. **False positive option:** The triage phase must include a plausible "false positive" path that is wrong but defensible-looking; the evidence must clearly support "true incident" for the prepared candidate.
6. **Scoring protection:** Key answers must not be guessable by avoiding all red herrings; evidence-linked selection (Section 13.5) enforces this.

---

## 25. Rules for Scenario Consistency

1. **Single coherent incident:** One attack path, one attacker objective, one timeline. No contradictory subplots.
2. **Timestamp integrity:** Every artifact's timestamp must fit the master timeline. The implementing agent must maintain a canonical event list from which all logs are generated.
3. **Character consistency:** Named people (employees, admins, attackers' personas via artifacts) behave consistently with their dossier profiles (role, access, working hours IST).
4. **Technical consistency:** Hostnames, IPs, domains, account names, and file paths must be consistent across every artifact and the dossier. Maintain a canonical asset/account registry.
5. **Scale consistency:** The environment size (hosts, accounts) must match the org's described size (mid-sized enterprise, not a conglomerate).
6. **Causality:** Every attacker action must have a plausible cause and observable effect in evidence. No magic jumps (e.g., attacker gains domain admin with no observable escalation step).
7. **Indian context consistency:** Names, org structure, city references, business hours, and holidays must be plausibly Indian and internally consistent. All fictional.
8. **Difficulty consistency:** The sophistication of the attack must match the described attacker (moderately skilled, opportunistic-to-targeted hybrid — not APT-level exotic, not script-kiddie trivial).

---

## 26. Constraints on Complexity

1. **Environment size:** Approximately 40–80 total hosts visible in the asset inventory, of which only 8–15 are materially relevant to the incident. The dossier may describe the broader org, but investigative evidence focuses on a bounded set.
2. **AD scope:** One AD domain. Approximately 60–120 user accounts in the directory (dossier view), with ~10–15 accounts materially relevant. A small number of servers (file, app, database, domain controller(s) — 1–2 DCs).
3. **Evidence volume:** Enough raw material for 5 hours of investigation, but no giant log dumps. Use summarized views with drill-down. Target: no single artifact over ~200 lines of raw content; most far less.
4. **Technique count:** The full attack path should involve roughly 12–20 distinct MITRE techniques — enough for richness, few enough to remain teachable.
5. **No exotic tech:** No cloud-native complexity (the org is on-prem/hybrid-lite at most), no OT/IoT, no mobile forensics, no custom malware analysis. Focus: web → identity → endpoint → exfil.
6. **Single timezone discipline:** IST for narrative; UTC where logs realistically use it; the simulation must state the convention once and apply it consistently.
7. **Five-hour fit:** Every phase's tasks must be completable within its allocation by a prepared candidate. If content exceeds allocation, cut content, not clarity.

---

## 27. Definition of Successful Candidate Performance

A successful candidate is one who:

1. Correctly validates the alert as a true incident and identifies the initially affected asset(s).
2. Identifies the initial access mechanism and the specific weakness exploited.
3. Reconstructs the attack path accurately from weakness to exfiltration (ordered, with correct techniques).
4. Identifies all compromised accounts and the escalation path.
5. Identifies all persistence mechanisms.
6. Accurately scopes the breach (hosts, accounts, data) — neither under- nor over-scoped.
7. Produces a correct, evidence-supported timeline.
8. Maps key behaviors to correct MITRE ATT&CK techniques.
9. Selects the correct containment scope and actions with sound rationale.
10. Produces a complete, correctly ordered eradication plan.
11. Sequences recovery correctly and makes correct go/no-go decisions per system.
12. Passes the safe-state validation gate (does not declare recovery complete while validation is insufficient).
13. Submits a coherent, defensible final report consistent with their investigation.

**Scoring model (guidance for implementation):**
- Investigative accuracy (Phases 0–5): ~55% of total score.
- Response decisions (Phase 6): ~25%.
- Safe-state validation & reporting (Phase 7): ~20%.
- Suggested pass threshold: 70% overall with no critical failure (declaring recovery complete while persistence remains, or failing to contain an actively compromised host, are critical failures that cap the score regardless of total).

---

## NON-NEGOTIABLE DESIGN RULES

The following rules bind Agent 2 (narrative) and Agent 3 (implementation). No deviation without explicit sign-off.

1. **One coherent incident.** One attack path, one timeline, one attacker objective. No subplots.
2. **Every scored answer is deterministic.** Exact string, timestamp, single choice, multi-select set, ordered sequence, yes/no, or controlled ATT&CK ID. No free-text scored answers except the single rubric-scored executive summary.
3. **Short answer ≠ easy task.** Every key answer requires correlating ≥2 evidence sources. Evidence-linked selection is mandatory for key investigative answers.
4. **Indian fictional context only.** Fictional Indian organization, realistic Indian names for all people/accounts/teams/hosts. No real government names. No generic Western placeholder names.
5. **Bounded environment.** ~40–80 hosts in inventory, 8–15 relevant; one AD domain; 12–20 ATT&CK techniques. No giant enterprises.
6. **Moderate, realistic weaknesses.** The attack chains plausible misconfigurations — no zero-days, no exotic malware, no APT-magic.
7. **Red herrings must be rule-out-able with in-simulation evidence.** 3–5 major red herrings maximum; every one dismissible by evidence, not guesswork.
8. **Timestamp integrity is absolute.** One canonical timeline; IST narrative convention stated explicitly; every artifact consistent with it.
9. **No dead ends, ever.** Wrong decisions cost points and may add remedial work but never terminate or soft-lock the simulation.
10. **Containment/eradication/recovery decisions are scored against a defensible best-answer set.** Plausible distractors exist; the correct set must be derivable from evidence.
11. **Safe-state validation is a gate.** Declaring recovery complete while validation is insufficient is a critical failure.
12. **The dossier informs; it never answers.** Context and reference material support interpretation but never state attack facts.
13. **Five-hour fit is a hard constraint.** Phase allocations in Section 10 are the budget; content that doesn't fit gets cut.
14. **Noise is bounded and plausible.** ~20–30% noise maximum; noise must never obscure the real path, only surround it.
15. **The final report must be internally consistent** with the candidate's phase answers; inconsistency costs points.
16. **All names, hosts, IPs, accounts, and paths come from a single canonical registry** maintained across narrative and implementation to guarantee consistency.
