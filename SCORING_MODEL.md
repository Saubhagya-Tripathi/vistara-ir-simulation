# SCORING_MODEL.md — VISTARA-IR-ASSESSMENT-v1.0

**Incident:** INC-2026-0417, Vistara Polymers Pvt. Ltd. (simulation package v1.1)
**Scope of this document:** the complete, deterministic scoring model for the 30 scored tasks (255 raw points), the weighted dimension model, hint penalties, critical failures, pass/fail logic, and a worked scoring example.
**Authoritative source:** all values in this document are taken from the assessment design kernel; no number herein may be altered without a kernel change.

---

## 1. Scoring Philosophy

1. **Deterministic grading.** Every scored item resolves to exactly one objectively gradable answer or state. There is no partial-credit ambiguity and no "describe what happened" free-text scoring. The single exception is the Q-07-04 executive summary, scored against a fixed 5-point rubric (§8).
2. **Effort is investigative; answers are objective.** The assessment distinguishes the *work* (correlating evidence) from the *artifact* (the answer). A candidate may spend 10–15 minutes in evidence before producing a one-word answer; points reward correct conclusions reached through investigation, not typing.
3. **Consequence-aware decision scoring.** Containment, eradication, recovery, and safe-state decisions are scored against the deterministic best-defensible-decision set. Plausible-but-suboptimal decisions earn reduced credit on that item; reckless decisions earn none for that item but never terminate the assessment (consequence paths offer remediation, not dead ends).
4. **Transparency of standards, opacity of answers.** Candidates know exactly what is expected of each task ("identify the persistence mechanism") but never the answer. Light feedback is given at phase end; full feedback at assessment end.
5. **No negative marking on investigative items.** A wrong investigative answer scores 0 for that component; it never subtracts points earned elsewhere. Decision items lose their own points only (consequence-based reduction), per SIM_REQ §13. The only deductions that cross component boundaries are (a) hint penalties, capped at the task's earned score, and (b) critical-failure score caps (§7).
6. **Evidence-linked answers.** 26 of 30 tasks are `evidence_linked: true`; for **25** of them (all except **Q-05-01**) the candidate must also select the evidence IDs supporting the answer, and 20% of the task's points ride on that selection — evidence selection IS a candidate-facing, scored action. Q-05-01 is exempt: its full 10 pts ride on the 40-cell classification table and its evidence requirement is validation/authoring metadata (feedback + CF-3 evaluation), earning no separate points. Q-05-03, Q-05-04, Q-06-02, and Q-07-04 are not evidence-linked and have no evidence-selection scoring (Q-05-04's per-row evidence references are authoring/validation metadata only).

---

## 2. Raw Points Model (255 points, 30 tasks)

| Task | Title | Points | Answer type(s) | Evidence-linked |
|---|---|---:|---|---|
| **P0 — Briefing & Triage** | | **5** | | |
| Q-00-01 | Triage & incident declaration | 5 | single choice ×2, asset, IP | yes |
| **P1 — Detection Validation & Initial Scoping** | | **11** | | |
| Q-01-01 | Reading the correlation cluster | 6 | multi-select, single choice | yes |
| Q-01-02 | Signal vs noise: the vulnerability scanner | 5 | single choice, multi-select | yes |
| **P2 — Initial Access & Compromise Analysis** | | **30** | | |
| Q-02-01 | The exposure | 6 | single choice ×2 | yes |
| Q-02-02 | Initial access determination | 10 | IP, username, timestamp, single choice + evidence selection | yes |
| Q-02-03 | The web shell | 8 | path, URI, timestamp, single choice | yes |
| Q-02-04 | Web/application weakness chain | 6 | multi-select, artifact | yes |
| **P3 — Execution, Credentials & Persistence** | | **50** | | |
| Q-03-01 | Credential access chain | 10 | process, username ×2, single choice, path, string | yes |
| Q-03-02 | First lateral movement & privilege discovery | 8 | asset, username, single choice ×2, timestamp | yes |
| Q-03-03 | Identity persistence (rogue account) | 8 | username, string, multi-select, account+host, timestamp | yes |
| Q-03-04 | Host persistence & C2 (scheduled task) | 8 | string, asset, account, single choice, URL | yes |
| Q-03-05 | Domain dominance (DCSync) | 10 | ATT&CK ID, asset ×2, username, window, string | yes |
| Q-03-06 | Persistence inventory (synthesis) | 6 | multi-select, single choice | yes |
| **P4 — Discovery, Lateral Movement, Collection & Exfiltration** | | **28** | | |
| Q-04-01 | Rogue account in action | 6 | asset ×2, timestamp, single choice | yes |
| Q-04-02 | Collection & staging | 8 | multi-select, path, single choice | yes |
| Q-04-03 | Exfiltration | 8 | filename, IP:port, matching, single choice | yes |
| Q-04-04 | Scope discrimination: accessed vs compromised vs probed | 6 | single choice ×2, username | yes |
| **P5 — Full Scoping & Attack-Path Reconstruction** | | **51** | | |
| Q-05-01 | Breach scope: host classification table | 10 | classification table (10 hosts × 4 classes) | yes |
| Q-05-02 | Breach scope: identities | 8 | multi-select, yes/no, single choice ×2 | yes |
| Q-05-03 | Timeline reconstruction | 10 | ordered sequence (11 milestones) | no |
| Q-05-04 | ATT&CK mapping | 15 | 15 × controlled-list technique mappings | no |
| Q-05-05 | IOC consolidation | 8 | multi-select, single choice | yes |
| **P6 — Containment, Eradication & Recovery** | | **39** | | |
| Q-06-01 | Containment decision | 12 | multi-select ×2, single choice ×3 | yes |
| Q-06-02 | Response lifecycle sequencing | 5 | ordered sequence (5 actions) | no |
| Q-06-03 | Eradication plan | 12 | multi-select + ordered sequence (7 step-groups) | yes |
| Q-06-04 | Recovery sequencing & approach | 10 | ordered sequence, matching, single choice, yes/no | yes |
| **P7 — Safe-State Validation & Final Reporting** | | **41** | | |
| Q-07-01 | Validation requirements | 8 | multi-select | yes |
| Q-07-02 | The safe-state gate (TRAP) | 10 | single choice ×3 (two-stage go/no-go) | yes |
| Q-07-03 | Residual risk & recommendations | 8 | multi-select ×2 | yes |
| Q-07-04 | Final incident report (structured) | 15 | 10 deterministic fields + 5-pt rubric executive summary | no |
| **GRAND TOTAL** | | **255** | | |

Phase subtotals: **P0 5 | P1 11 | P2 30 | P3 50 | P4 28 | P5 51 | P6 39 | P7 41 = 255.**

---

## 3. Grading Formulas (normative, implementable)

All grading is machine-computed. General conventions:

- **Normalization:** string matching is case-insensitive with whitespace trimmed; canonical aliases are accepted exactly as listed per task in the question bank (e.g., `APP-PRD-01` ≡ `10.10.20.21`; `svc_portal` ≡ `VISTARA\svc_portal` ≡ `vistara\svc_portal`; paths accept `/` or `\`; `SYSTEM` ≡ `NT AUTHORITY\SYSTEM`).
- **Timestamps:** accepted in IST at minute precision (HH:MM). For IIS-derived items (Q-02-03(c)), the equivalent UTC value is also accepted (e.g., `2026-09-03 13:02 IST` ≡ `2026-09-03 07:32 UTC`). Any correct rendering of the canonical minute (e.g., `2026-09-03T11:47+05:30`) is accepted.
- **Component pooling (EQUAL POOLING — authoritative, normative):** all scored sub-answers/components within a task are EQUALLY weighted — points per component = component pool / N. No task uses custom per-component weights; any per-component value in any artifact MUST equal this equal-pooling split. For `evidence_linked: true` tasks, the answer components share 80% of task points (split equally) and the evidence-selection component carries 20% (§3.6). QUESTION_BANK.md states the resulting per-task split on a **Points split** line in every task entry.
- **Rounding:** multi-select and ordered-sequence component results are rounded to the nearest 0.5. Task totals are rounded to the nearest 0.5 — except the Q-05-01 classification-table total, which is exact at 0.25 granularity (40 cells × 0.25) and is not re-rounded.

### 3.1 Single answer / exact string / single choice / yes-no
All-or-nothing per sub-answer: `earned = component_points` if the response matches the canonical answer or a listed accepted alias, else `0`.

### 3.2 Timestamp
All-or-nothing per §3.1 with the timestamp acceptance rules above (minute precision IST; UTC equivalent accepted for IIS-derived items; defined tolerance only where the kernel states one, e.g., Q-07-04 field 7 dwell time accepts `6 days`, `~6 days`, `5.9 days`, or any hour value in the inclusive range 140–144 hours = 142h ±2h, e.g. `142 hours`, `140h`, `144 hours`).

### 3.3 Multi-select (exact correct set)
For a component worth `P` points with correct set `C`, candidate selection `S`:

```
TP = |S ∩ C|        FP = |S \ C|
earned = P × max(0, TP − FP) / |C|      rounded to nearest 0.5
```

False positives cancel true positives one-for-one, so over-selection is penalized but can never drive a component below 0. Examples: Q-01-01(a), Q-02-04(a), Q-03-06(a), Q-05-02(a), Q-05-05(a), Q-06-01(a)/(b), Q-06-03(a), Q-07-01(a), Q-07-03(a)/(b).

### 3.4 Classification table (Q-05-01)
Per-cell all-or-nothing. With 10 hosts × 4 classes = 40 cells and 10 task points, each cell is worth `10 / 40 = 0.25`. `earned = 0.25 × (# cells classified to the canonical column)`. **Q-05-01 is EXEMPT from the 80/20 evidence-selection split: all 10 pts ride on the cells; its required evidence is validation/authoring metadata (feedback + CF-3 evaluation) and earns no separate points.** (Critical-failure check CF-3 is applied separately, §7.)

### 3.5 Ordered sequence (Q-05-03, Q-06-02, Q-06-03(b), Q-06-04(a))
Kendall-tau concordance against the canonical sequence of `n` items:

```
total_pairs = n(n−1)/2
concordant_pairs = pairs in the same relative order as canonical
earned = P × concordant_pairs / total_pairs      rounded to nearest 0.5
```

### 3.6 Evidence-selection component (evidence-linked tasks, 20% of task points)
**Scope (authoritative, v1.0.1):** this component applies to exactly **25** tasks — every `evidence_linked: true` task EXCEPT **Q-05-01** (§3.4 exemption: evidence is validation/authoring metadata, not scored). Evidence selection IS a candidate action: each scored evidence-linked task presents a candidate-facing "select the evidence" sub-question (Q-02-02 surfaces it as explicit sub-question (e); (e) = 2.0 pts under the tier rule below and IS the 20% evidence component — no additional rescale). **No evidence-selection scoring exists on Q-05-03, Q-05-04, Q-06-02, or Q-07-04** (evidence_linked: false; Q-05-04's per-row evidence references are authoring/validation metadata only).

For required evidence set `R` and candidate selection `S`:

| Condition | Evidence credit |
|---|---|
| `S ⊇ R` and `S \ R` contains **zero** incorrect IDs | full 20% |
| `S ⊇ R` with **≤ 2** incorrect IDs | half (10%) |
| otherwise (missing any required ID, or > 2 incorrect) | 0 |

The remaining 80% of task points are distributed across the answer components per §3.1–3.5.

### 3.7 Matching (Q-04-03(c), Q-06-04(b))
Per-pair all-or-nothing: each correctly matched pair earns `component_points / #pairs`; incorrect pairs earn 0.

---

## 4. Weighted Dimension Model (final score)

Raw task scores roll up into seven dimensions. The final score is a weighted sum of per-dimension attainment:

```
final_score(%) = Σ_dimensions ( earned_dimension / max_dimension ) × weight
```

| Dim | Name | Tasks included | Max raw pts | Weight |
|---|---|---|---:|---:|
| D1 | Investigation accuracy & evidence correlation | All P0–P4 tasks (Q-00-01 … Q-04-04) | 124 | 40% |
| D2 | Scoping & attack reconstruction | All P5 tasks (Q-05-01 … Q-05-05) | 51 | 15% |
| D3 | Containment | Q-06-01, Q-06-02 | 17 | 10% |
| D4 | Eradication | Q-06-03 | 12 | 10% |
| D5 | Recovery | Q-06-04 | 10 | 8% |
| D6 | Safe-state validation | Q-07-01, Q-07-02 | 18 | 12% |
| D7 | Reporting & risk communication | Q-07-03, Q-07-04 | 23 | 5% |
| | **Total** | | **255** | **100%** |

**Alignment with SIM_REQ §27 guidance (~55 / 25 / 20):**

| SIM_REQ §27 guidance | Guidance | This model | Value |
|---|---:|---|---:|
| Investigative accuracy (Phases 0–5) | ~55% | D1 + D2 | **55%** |
| Response decisions (Phase 6) | ~25% | D3 + D4 + D5 | **28%** |
| Safe-state validation & reporting (Phase 7) | ~20% | D6 + D7 | **17%** |

The dimension structure also guarantees the spec requirement that a candidate cannot obtain a high score through easy early questions alone: P0–P1 carry only 16 of 255 raw points, and 45% of the final weight (D3–D7) sits in the response, validation, and reporting phases at the end of the assessment.

---

## 5. Hint Policy

- **Maximum 2 hints per task.** (Only Q-02-02 currently defines two hints; all other tasks define one. The second-hint slot exists per policy.)
- **Penalty:** each hint taken deducts that task's `hint_penalty` points (see HINTS_GUIDE.md for the per-task table) from the task's earned score: `task_score = max(0, earned − Σ hint_penalties)`. **Floor is 0 per task** — hints can never push a task negative or touch other tasks' points.
- **Q-07-04 special case:** the hint penalty (3 pts) applies to the deterministic fields only; the rubric-scored executive summary is not reduced by hints.
- **Logging:** every hint request is logged (task ID, hint number, timestamp) and surfaced to the reviewer in the post-assessment report, so hint-assisted passes are visible during human review.
- Hints guide investigation only; they never contain canonical answers (guardrails in HINTS_GUIDE.md §4).

---

## 6. Report-Consistency Rule (Q-07-04)

The 10 deterministic fields of the final report are auto-cross-checked against the candidate's own earlier phase answers (Q-00-01, Q-02-01/02/03, Q-03-*, Q-05-01/02, Q-07-02). **Each contradiction between a report field and the candidate's corresponding earlier answer voids that report field's point**, even if the report field happens to match the canonical answer. Rationale: the report must be a faithful synthesis of the candidate's investigation, not a corrected-after-the-fact restatement; a candidate who reports canon but investigated wrongly (or vice versa) has produced an internally inconsistent record. The rubric-scored executive summary is exempt from cross-checking (it is human-scored).

---

## 7. Critical Failures (score cap)

Three failures represent unacceptable real-world risk. Any one of them **caps the total score at 49%** (i.e., `final = min(computed_score, 49)`), regardless of the weighted score, and forces a Fail band.

| ID | Trigger | Detection |
|---|---|---|
| **CF-1** | **Unsafe safe-state declaration** — Q-07-02 stage 1 answered `SAFE` while the validation packet still shows the persistence re-check SKIPPED on rebuilt APP-PRD-01 and the AD audit not re-run. | Q-07-02(a) = SAFE |
| **CF-2** | **Failure to contain known active attacker infrastructure / compromised host** — containment set omits the FW-01 block of `185.220.101.47` **or** omits isolation of any of {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}. | Q-06-01(a)/(c) |
| **CF-3** | **Missed major compromise** — any of {WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01} classified as anything other than `Compromised` in the scope table. | Q-05-01 cells |

Notes: over-selection (e.g., also isolating DB-PRD-01 or disabling admin_legacy) is **not** a critical failure; it costs component points via the multi-select formula and triggers the over-containment consequence path. CF checks are evaluated on the submitted answers, after any consequence-path remediation: a candidate who initially under-contains but completes the remedial containment still triggered CF-2 on the submission that omitted the C2 block.

---

## 8. The Single Rubric-Scored Item (Q-07-04 executive summary, 5 pts)

Everything in the assessment is machine-graded **except** the Q-07-04 executive summary (3–5 sentences for a non-technical executive), scored by a human reviewer against this fixed rubric — 1 point each:

1. **What happened** — states the web-facing server was breached via exposed remote access + a weak service-account password.
2. **Business impact** — states ≈698 MB stolen incl. client designs and payroll data; ~6-day attacker presence.
3. **Actions taken** — states containment, eradication, rebuild/restore, and safe-state validation occurred.
4. **Current status** — states services restored and safe state verified (2026-09-09 17:30 IST).
5. **Residual risk / next steps** — states data-exposure management and the credential-hygiene / MFA / retention program.

All other 250 points are deterministic: 240 machine-graded points across the tasks other than Q-07-04, plus the 10 deterministic Q-07-04 report fields (subject to §6). Decomposition of the 255 total: 240 deterministic task points + 10 deterministic report-field points + 5 rubric-scored executive-summary points.

---

## 9. Pass/Fail and Performance Bands

- **Pass condition:** final weighted score **≥ 70% AND zero critical failures**.
- **Bands:**

| Band | Condition |
|---|---|
| Distinction | ≥ 90% and zero CFs |
| Pass | 70–89.5% and zero CFs |
| Near miss | 50–69.5% and zero CFs |
| Fail | < 50%, **or any critical failure** (score capped at 49%) |

---

## 10. Worked Scoring Example (hypothetical candidate "K")

### 10.1 Fully derived task scores

**Q-01-01 (6 pts, evidence-linked → 80% answers = 4.8, 20% evidence = 1.2).**
Answer pool split equally across 2 components: (a) multi-select 2.4, (b) single choice 2.4.
- (a) Correct set {WEB-PRD-01, APP-PRD-01, FILE-PRD-01, DC-01}; K selects those four **plus ERP-APP-01** → TP = 4, FP = 1 → `2.4 × (4−1)/4 = 1.8` → rounded → **2.0**.
- (b) K answers B (correct) → **2.4**.
- Evidence: K selects exactly {E-ALERT-002, E-NET-003, E-EDR-008} = required set, zero incorrect → full 20% → **1.2**.
- **Task score = 2.0 + 2.4 + 1.2 = 5.6 → 5.5 / 6.** No hint.

**Q-02-02 (10 pts, evidence-linked → answers 8.0, evidence 2.0).**
Four answer components (a)–(d) at 2.0 each (the 80% pool, equally pooled); sub-question (e) IS the 2.0-pt evidence component under the tier rule — no additional rescale applies.
- (a) `45.155.90.23` correct → 2.0; (b) `svc_portal` correct → 2.0; (c) `2026-09-03 11:47 IST` correct → 2.0; (d) K chooses **B (VPN)** — wrong → 0.
- Evidence (e): required {E-AUTH-001, E-NET-005, E-NET-001, E-EDR-001}; K selects all four **plus one incorrect ID** → ⊇ required with ≤ 2 incorrect → half credit → **1.0**.
- Subtotal 7.0. K used **Hint 1** (penalty 2) → `max(0, 7.0 − 2)` = **5.0 / 10**.

**Q-05-03 (10 pts, ordered sequence, not evidence-linked).**
n = 11 milestones → total pairs = 11×10/2 = 55. K's ordering has **5 discordant pairs** → concordant = 50.
`earned = 10 × 50/55 = 9.09` → rounded → **9.0 / 10.**

**Q-06-01 (12 pts, evidence-linked → answers 9.6 across 5 components = 1.92 each; evidence 2.4).**
- (a) Correct isolation set {WEB-PRD-01, APP-PRD-01, FILE-PRD-01}; K selects those three **plus DB-PRD-01** → TP = 3, FP = 1 → `1.92 × 2/3 = 1.28` → rounded → **1.5**.
- (b), (c), (d), (e) all correct → 4 × 1.92 = 7.68.
- Evidence: full → 2.4. Task total `1.5 + 7.68 + 2.4 = 11.58` → **11.5 / 12**.
- **CF-2 check:** all three required isolations present and the `185.220.101.47` block selected → **no CF-2**. The DB-PRD-01 over-isolation costs points via the formula and triggers the over-containment consequence path, but is not a critical failure.

### 10.2 K's full scorecard

| Phase / task | Earned / Max | Note |
|---|---:|---|
| P0: Q-00-01 | 5.0 / 5 | |
| P1: Q-01-01, Q-01-02 | 5.5 / 6, 5.0 / 5 | Q-01-01 derived in §10.1 |
| P2: Q-02-01, Q-02-02, Q-02-03, Q-02-04 | 6.0 / 6, 5.0 / 10, 8.0 / 8, 5.0 / 6 | Q-02-02 derived in §10.1; Q-02-04(a) included W-08 (TP 3, FP 1 → 1.5) |
| P3: Q-03-01…Q-03-06 | 10/10, 8/8, 8/8, 6.5/8, 6.5/10, 6/6 | Q-03-04(d) interval wrong; Q-03-05(f) krbtgt missed + 1 hint (−2) |
| P4: Q-04-01…Q-04-04 | 6/6, 8/8, 6.5/8, 6/6 | Q-04-03(d) wrong (chose NetFlow tampering) |
| P5: Q-05-01, Q-05-02, Q-05-03, Q-05-04, Q-05-05 | 9.75/10, 6.0/8, 9.0/10, 10.0/15, 8/8 | Q-05-01: 1 wrong cell (DB-PRD-01 marked Compromised; all four truly compromised hosts correct → no CF-3); Q-05-04: 13/15 mappings, hint used (−3) |
| P6: Q-06-01, Q-06-02, Q-06-03, Q-06-04 | 11.5/12, 5/5, 11.0/12, 8.0/10 | Q-06-01 derived in §10.1; Q-06-03(a) included "reboot all servers" (TP 7, FP 1 → 4.0), (b) one swapped pair (4.5); Q-06-04(c) chose the 09-04 backup |
| P7: Q-07-01, Q-07-02, Q-07-03, Q-07-04 | 6.5/8, 10/10, 8/8, 12/15 | Q-07-02 stage 1 = NOT SAFE → no CF-1; Q-07-04: 8/10 deterministic fields (2 contradictions voided per §6) + 4/5 rubric |

### 10.3 Dimension roll-up and final score

| Dim | Earned / Max | Attainment | Weight | Contribution |
|---|---:|---:|---:|---:|
| D1 (P0–P4) | (5.0 + 10.5 + 24.0 + 45.0 + 26.5) = 111.0 / 124 | 0.8952 | 40% | 35.81 |
| D2 (P5) | (9.75 + 6.0 + 9.0 + 10.0 + 8.0) = 42.75 / 51 | 0.8382 | 15% | 12.57 |
| D3 | (11.5 + 5.0) = 16.5 / 17 | 0.9706 | 10% | 9.71 |
| D4 | 11.0 / 12 | 0.9167 | 10% | 9.17 |
| D5 | 8.0 / 10 | 0.8000 | 8% | 6.40 |
| D6 | (6.5 + 10.0) = 16.5 / 18 | 0.9167 | 12% | 11.00 |
| D7 | (8.0 + 12.0) = 20.0 / 23 | 0.8696 | 5% | 4.35 |
| **Final** | | | **100%** | **≈ 89.0%** |

**Critical-failure check:** CF-1 no (stage 1 = NOT SAFE); CF-2 no (C2 block + all 3 isolations present); CF-3 no (all four compromised hosts classified Compromised).
**Result: 89.0%, zero critical failures → PASS** (Pass band, 70–89.5%). Note how the Q-05-04 hint (−3) and the Q-07-04 consistency voids (−2) are what keep K below the Distinction threshold despite strong response-phase work — and had K declared SAFE at Q-07-02 stage 1, the same performance would have been capped at 49% (Fail) under CF-1.
