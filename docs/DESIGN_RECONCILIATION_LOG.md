# Design Reconciliation Log

The design package (`assessment.json` v1.0.1 + markdown specs) contained internal
contradictions and under-specified areas. Per the implementation mandate, none were
resolved silently. The resolutions below were **explicitly approved by the project
owner** during planning; assumptions were documented and approved as non-blocking.

## Approved resolutions (user-confirmed)

### R1. Authority precedence
`assessment.json` v1.0.1 together with `SCORING_RECONCILIATION.md` and
`ASSESSMENT_FINAL_VERIFICATION.md` is the single authority for canonical answers,
scoring, and progression. Prose documents supply narrative/dossier content.
Where prose and JSON disagree (e.g. PROGRESSION_LOGIC's "58 artifacts" count vs the
enumerated list, evidence relevance labels catalog-vs-matrix), the JSON/enumerated
form wins.

### R2. Q-07-01 / E-VALID-002 reveal timing (progression-affecting)
Q-07-01's scored evidence selection requires `E-VALID-002`, but PROGRESSION_LOGIC
staged the interim E-VALID-002 packet at Q-07-02 stage 1 — unreachable when Q-07-01
is answered (answers lock on submission). **Resolution:** the interim E-VALID-002
(with the SKIPPED line) reveals at **P7 entry**. The 16:55 re-run still reveals only
after a stage-1 NOT SAFE declaration (or the §4.4 remediation loop after a premature
SAFE). The Q-07-02 trap mechanics are unchanged.

### R3. Q-02-02(e) 5-ID accepted set (scoring-affecting)
`accepted_answers` for Q-02-02(e) lists a 5-ID set (required 4 + E-AUTH-012), but the
evidence tier rule would count E-AUTH-012 as "incorrect" (half credit).
**Resolution:** an exact match to any listed accepted set earns full credit;
otherwise the verbatim tier rule applies (full 2.0 / half 1.0 / 0).

### R4. Evidence materialization
The package ships schemas/templates/prose, not artifact bodies (~12 of 68 complete,
~20 prose-only). Per the package's own generator contract (EVIDENCE_SCHEMAS §14),
bodies were authored under `evidence-src/` preserving every scored fact, verbatim
command lines, timezone conventions, red-herring rule-outs, and 20–30% noise.
No new facts were invented; `tools/build-evidence.mjs` validates the output
(forbidden strings, IIS UTC header, event-ID enum, JSON conventions).

### R5. Q-07-04 report-consistency rule mechanics (SCORING_MODEL §6)
§6 mandates voiding report fields that contradict the candidate's own earlier
answers but defines no field↔answer mapping. **Approved: component-level mapping** —
a field's 1.0 is voided iff the field itself graded correct but its mapped earlier
component did not earn full credit:
(a)↔Q-00-01(b), (b) exempt (provenance), (c)↔Q-02-02(d), (d)↔Q-05-01 WEB-PRD-01 cell,
(e)↔Q-05-02(a), (f)↔Q-05-01 four core-host cells, (g)↔Q-02-02(c), (h)↔Q-04-03(c),
(i)↔Q-02-01(a)+Q-02-04(a), (j)↔Q-03-02(e).

## Documented assumptions (logged, non-blocking)

### A1. Band edge gaps
Spec bands leave (89.5, 90) and (69.5, 70) undefined. Implemented as
Distinction ≥ 90, Pass 70–<90, Near miss 50–<70, Fail <50 or any CF.

### A2. Q-07-04(i) dual accepted sets
{W-01,W-03} and {W-01,W-03,W-02b} are both accepted. Non-exact selections are scored
by the multi-select formula against each accepted set, max taken.

### A3. Q-05-01 40-cell semantics
The binding worked example (SCORING_MODEL §10.2: one misclassified host = 39/40 =
9.75) implies: per host, all 4 cells correct when the chosen class is canonical,
exactly 1 cell lost otherwise. Implemented accordingly (per-host radio UI).

### A4. E-ALERT-001 severity field
Catalog prose says "High"; the SCHEMAS exemplar (and schema) say "critical".
Rendered as `critical` per the exemplar. Cosmetic only — Q-00-01(b) grades severity
per IR-Policy-01 (Sev-1) either way.

### A5. ENVIRONMENT.md stale fragments
The package's own QA report (CONSISTENCY_QA_REPORT U-06/U-07) mandated corrections
that were never applied to the file: the WSUS-01 "red herring candidate" note
(removed — WSUS-01 is a plain uninvolved host), the admin_legacy authoring scratch
text "(disabled? No — enabled)" (rendered as simply enabled), and §12 timezone
wording (per QA-09 all Windows security events are IST; only IIS artifacts are UTC).
The dossier data (`src/data/dossier.json`) applies these QA-directed corrections.

### A6. Hint display strings
HINTS_GUIDE.md §3 is authoritative verbatim for display (per FINAL_VERIFICATION
note 2); assessment.json's ASCII-normalized hint text is used only in grading
metadata. `tools/build-bundles.mjs` enforces verbatim equality at build time.

### A7. Q-05-01 evidence selection UI
The authoritative JSON marks Q-05-01 `evidence_selection.is_candidate_action: false`
(earns 0 points; selection used only for feedback/CF-3 evaluation). The UI therefore
does not present an evidence picker on Q-05-01, per JSON precedence (R1).

### A8. Q-06-03(b) ordering scope
"Order the step-groups you selected": the UI orders the candidate's (a) selections;
correct numerals map to their canonical step strings for Kendall-tau grading,
distractor selections map to their option text (never concordant). Pairs involving
unselected canonical steps count as discordant.

### A9. Matching-control option pools
For pair-map matching sub-answers with empty candidate option lists (Q-04-03(c),
Q-06-04(b)), the option pool is derived from the grading bundle's canonical map
(keys = rows, values = option pool, displayed in a fixed shuffled order). This
exposes the candidate-facing option set without revealing the correct pairing.

### A10. Candidate notes
The assessment does not score or require notes; the state model carries a notes
field but no notes UI is shipped (spec §13: implement only if required).

## Owner-directed product changes (post-delivery requests)

### R8. Immediate per-sub-answer feedback on submit
SCORING_MODEL §1.4 withholds correctness during the run ("opacity of answers";
light feedback at phase end, full feedback at assessment end). The owner
explicitly requested immediate correct/partial/incorrect feedback per sub-answer
on submit. **Approved and implemented** (`src/features/investigation/results.ts`):
post-submit badges per sub-answer (Correct / Partial / Incorrect / Voided /
Pending reviewer), evidence-selection result, and a task score line with
hint-penalty note. Answers lock on submission, so no in-run retry is possible;
the only resubmit paths remain the §4 consequence loops (Q-06-01/Q-06-03),
where seeing the previous result is the intended remediation. Deployment note:
because sessions are client-side, a candidate could still start a fresh session
armed with feedback from a previous attempt — acceptable for training use,
worth considering before high-stakes graded use.

### R9. State-driven risk gauge + dossier drawer + density toggle (UX)
Owner-requested UX additions, all design-faithful: (1) a live "organizational
risk exposure" gauge driven purely by operational state (containment /
eradication / recovery / validation outcomes and §4 consequence events) — it
deliberately never reacts to answer correctness, preserving answer opacity
during the run; (2) the dossier moved from a fixed right column to a slide-over
drawer with search; (3) comfortable typography with a Compact/Comfortable
density toggle.

## Known package artifacts left as-is (no implementation impact)

- Duplicate design-pipeline folders `till 4/` and `4 output/` remain at repo root
  as historical intermediates; the app consumes only the root-level package.
- `SCENARIO_BIBLE.md` / `UPSTREAM_CORRECTIONS.md` are referenced by the package
  manifest but absent; ENVIRONMENT.md serves as the dossier source of truth.
- E-VALID-002 is one evidence ID with two staged bodies (interim + 16:55 re-run);
  the manifest models this via `candidate_view.rerun_path`.
