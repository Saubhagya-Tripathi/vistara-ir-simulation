# Vistara Polymers — Cyber-Incident Investigation & Response Simulation

A browser-based, offline-first DFIR training simulation implementing the validated
**VISTARA-IR-ASSESSMENT-v1.0** package (case INC-2026-0417): a ~5-hour, 30-task,
255-point assessed incident investigation covering triage, evidence correlation,
scoping, containment, eradication, recovery, safe-state validation, and final
reporting.

Everything runs client-side: static assets + local JSON + `localStorage` state.
No backend, no external APIs.

## Quick start

```bash
npm install          # requires Node 16+ (built against Node 16.14)
npm run build:data   # generate evidence files + data bundles from source
npm run dev          # dev server (Vite)
```

Then open the printed URL, enter a candidate name, and begin.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Full data build + typecheck + production bundle (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Data build + all engine/progression/walkthrough tests (Vitest) |
| `npm run verify` | Data build + content-integrity audit |
| `npm run build:data` | Regenerate `public/evidence/` + `src/data/generated/` |

## Project layout

```
assessment.json            # authoritative assessment definition (v1.0.1)
*.md                       # validated design package (scenario, evidence specs,
                           #   scoring, progression, hints, QA reports)
evidence-src/              # authored evidence bodies + manifest.src.json
tools/
  build-evidence.mjs       # validates + materializes evidence into public/evidence/
  build-bundles.mjs        # splits assessment.json into candidate/grading bundles
  verify-content.mjs       # content-integrity audit (spec §35)
src/
  types/                   # shared data model
  engine/
    loader.ts              # data access boundary (candidate vs grading data)
    progression/           # phase gates, evidence reveal, consequence paths
    grading/               # deterministic per-answer-type graders
    scoring/               # task totals, hints, CFs, dimensions, bands, consistency
    state/                 # zustand store + localStorage persistence
  components/              # header, phase navigator, dossier, banners
  features/
    evidence/              # evidence browser, per-type viewers, search
    investigation/         # task workspace: question controls, activities, hints
    reporting/             # final reviewer summary
tests/                     # engine + scoring + progression + state + walkthrough
docs/DESIGN_RECONCILIATION_LOG.md  # every approved spec-resolution decision
```

## Data folders

- `evidence-src/` is the source of truth for the 68 synthetic artifacts.
  `tools/build-evidence.mjs` validates them (forbidden answer-leak strings, the
  IIS UTC header convention, the allowed Windows event-ID set, JSON conventions,
  drill-down links) and copies them to `public/evidence/` with `manifest.json`.
- `src/data/generated/` holds `candidate.bundle.json` (no answers — a build-time
  forbidden-key scan enforces this) and `grading.bundle.json` (canonical answers
  and scoring config; consumed by the engine, never rendered by candidate UI).

## Grading model (summary)

255 points: 240 deterministic task points + 10 deterministic report-field points
+ 5 human-rubric executive-summary points. Multi-select uses `P × max(0, TP−FP)/|C|`
(0.5 rounding); ordered sequences use Kendall-tau; the Q-05-01 scope table scores
40 cells × 0.25 without re-rounding; evidence selections follow the full/half/zero
tier rule; hints deduct per-task (floor 0); three critical failures (unsafe
safe-state declaration, failure to contain, missed major compromise) cap the run
at 49%. Final score is the weighted dimension roll-up (D1 40 / D2 15 / D3 10 /
D4 10 / D5 8 / D6 12 / D7 5). Pass = ≥ 70% AND zero critical failures.
See `SCORING_MODEL.md` and `docs/DESIGN_RECONCILIATION_LOG.md`.

## Deployment (GitHub Pages)

```bash
npm run build
# publish dist/ — e.g.:
npx gh-pages -d dist        # or wire dist/ to any static host
```

The Vite config uses a relative base (`./`), so `dist/` works from any subpath.

## Adding another simulation

1. Drop the new `assessment.json` at the repo root (same schema).
2. Author the evidence under `evidence-src/` (follow `evidence-src/AUTHORING_GUIDE.md`)
   with a new `manifest.src.json`.
3. Replace the dossier content in `src/data/dossier.json` and hint text source in
   `tools/build-bundles.mjs`.
4. `npm run verify && npm test && npm run build`.

The engine (progression, grading, scoring, state) and all UI features are
data-driven; no component embeds scenario facts.

## A note on answer secrecy

This is a fully client-side training application: a determined user with browser
dev tools can inspect shipped assets. The build separates candidate data from
grading data, never renders internal metadata, and ships no answer-key field names
in candidate-facing state — this prevents *accidental* leakage during normal use.
It is not a substitute for proctored/remote assessment infrastructure.
