#!/usr/bin/env node
// build-bundles.mjs — derives the runtime data bundles for the Vistara IR simulation.
//
// Inputs (read-only):
//   assessment.json        authoritative task/grading model (30 items)
//   HINTS_GUIDE.md         §3 hint strings are AUTHORITATIVE for candidate display
//                          (assessment.json hint text is ASCII-normalized; grading keeps it)
//   src/data/dossier.json  candidate-facing right-panel dossier (authored from ENVIRONMENT.md)
//
// Outputs:
//   src/data/generated/candidate.bundle.json  candidate-facing only — NO answers/grading metadata
//   src/data/generated/grading.bundle.json    grading-side (loaded by engine, never rendered)
//
// The build FAILS (exit 1) if:
//   - any of the 30 assessment task IDs is missing from either bundle
//   - any forbidden answer/grading key appears anywhere in the candidate bundle
//   - candidate hint texts are not exactly the HINTS_GUIDE.md §3 verbatim strings

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const assessment = readJson('assessment.json');
const hintsGuide = fs.readFileSync(path.join(ROOT, 'HINTS_GUIDE.md'), 'utf8');
const dossier = readJson('src/data/dossier.json');

const problems = [];
const fail = (msg) => problems.push(msg);

// ---------------------------------------------------------------------------
// 1. Parse HINTS_GUIDE.md §3 — authoritative verbatim hint strings per task.
//    Headings look like:  **Q-02-02 — Initial access determination** (10 pts) ...
//    Hint lines look like: - **Hint 1 (penalty 2):** "...."
// ---------------------------------------------------------------------------
const guideHints = new Map(); // taskId -> [{ text, penalty }]
{
  let current = null;
  for (const line of hintsGuide.split('\n')) {
    const heading = line.match(/^\*\*(Q-\d{2}-\d{2})\s/);
    if (heading) {
      current = heading[1];
      if (!guideHints.has(current)) guideHints.set(current, []);
      continue;
    }
    const hint = line.match(/^- \*\*Hint (\d+) \(penalty (\d+)[^)]*\):\*\* "(.*)"\s*$/);
    if (hint) {
      if (!current) fail(`Hint line before any task heading: ${line.slice(0, 60)}`);
      else guideHints.get(current).push({ text: hint[3], penalty: Number(hint[2]) });
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Bundle-wide expectations
// ---------------------------------------------------------------------------
const items = assessment.items;
const itemById = new Map(items.map((i) => [i.id, i]));
const sub = (taskId, key) => {
  const s = itemById.get(taskId).sub_answers.find((x) => x.key === key);
  if (!s) fail(`Missing sub_answer ${key} on ${taskId}`);
  return s;
};

const EXPECTED_TASK_COUNT = 30;
if (items.length !== EXPECTED_TASK_COUNT) {
  fail(`assessment.json has ${items.length} items, expected ${EXPECTED_TASK_COUNT}`);
}

const FORBIDDEN_KEYS = new Set([
  'canonical_answer',
  'accepted_answers',
  'attack_events',
  'evidence_correlation',
  'common_wrong_answer',
  'critical_failure_link',
  'required_set',
  'evt_refs',
  'rh_refs',
  'red_herring',
  'rule_out',
  'corroborates',
  'expected_significance',
]);

function scanForbiddenKeys(node, trail, hits) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => scanForbiddenKeys(v, `${trail}[${i}]`, hits));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (FORBIDDEN_KEYS.has(k)) hits.push(`${trail}.${k}`);
      scanForbiddenKeys(v, `${trail}.${k}`, hits);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Candidate bundle — items (whitelist projection, no grading fields)
// ---------------------------------------------------------------------------
function candidateSubAnswer(s) {
  const out = {
    key: s.key,
    question: s.question,
    answer_type: s.answer_type,
  };
  if (Array.isArray(s.options) && s.options.length > 0) out.options = s.options;
  out.points = s.points;
  if (s.cell_count !== undefined) out.cell_count = s.cell_count;
  if (s.cell_points !== undefined) out.cell_points = s.cell_points;
  return out;
}

function candidateItem(item) {
  const guide = guideHints.get(item.id);
  if (!guide || guide.length === 0) {
    fail(`No HINTS_GUIDE.md §3 hints parsed for ${item.id}`);
  } else {
    if (guide.length !== item.hints.length) {
      fail(`${item.id}: guide has ${guide.length} hints, assessment.json has ${item.hints.length}`);
    }
    item.hints.forEach((h, i) => {
      if (guide[i] && guide[i].penalty !== h.penalty) {
        fail(`${item.id} hint ${i + 1}: penalty mismatch (guide ${guide[i].penalty} vs assessment ${h.penalty})`);
      }
    });
  }
  if (!Array.isArray(item.required_evidence) || !item.required_evidence.every((e) => typeof e === 'string')) {
    fail(`${item.id}: required_evidence is not an array of ID strings`);
  }

  const out = {
    id: item.id,
    phase: item.phase,
    title: item.title,
    instructions: item.instructions,
    task_type: item.task_type,
    answer_type: item.answer_type,
    points: item.points,
    difficulty: item.difficulty,
    evidence_linked: item.evidence_linked,
    unlock: item.unlock,
    required_evidence: item.required_evidence,
  };
  if (item.reference_evidence) out.reference_evidence = item.reference_evidence;
  out.learning_outcomes = item.learning_outcomes;
  out.hints = (guide || []).map((g, i) => ({ text: g.text, penalty: item.hints[i] ? item.hints[i].penalty : g.penalty }));
  out.hint_penalty = item.hint_penalty;
  out.evidence_selection = {
    is_candidate_action: item.evidence_selection.is_candidate_action,
    earns_points: item.evidence_selection.earns_points,
    points: item.evidence_selection.points,
  };
  out.sub_answers = item.sub_answers.map(candidateSubAnswer);
  return out;
}

// ---------------------------------------------------------------------------
// 4. Candidate bundle — activities
// ---------------------------------------------------------------------------
const ss = assessment.supporting_structures;

// Q-05-03 timeline cards: FIXED display order mandated by the bundle contract.
// Cards carry only a displayId, the description, and an opaque token; the
// canonical chronology lives solely in the grading bundle
// (timeline_position_by_key) and is never present in this file.
const TIMELINE_DISPLAY_ORDER = ['TL-09', 'TL-08', 'TL-04', 'TL-11', 'TL-02', 'TL-07', 'TL-01', 'TL-10', 'TL-05', 'TL-03', 'TL-06'];
const timelineByKey = new Map(ss.timeline_items.map((t) => [t.key, t]));
for (const k of TIMELINE_DISPLAY_ORDER) if (!timelineByKey.has(k)) fail(`timeline_items missing ${k}`);
if (ss.timeline_items.length !== TIMELINE_DISPLAY_ORDER.length) {
  fail(`timeline_items has ${ss.timeline_items.length} entries, display order lists ${TIMELINE_DISPLAY_ORDER.length}`);
}
const timeline_display = TIMELINE_DISPLAY_ORDER.map((key, i) => ({
  displayId: `M${i + 1}`,
  description: timelineByKey.get(key).description,
  token: key,
}));

// IOC candidate pool (Q-05-05): 8 canonical + 6 distractors = 14 display
// strings. Deterministic FIXED interleave (not randomized): canonical entries
// in source order with the six distractors inserted at fixed positions
// (2nd, 5th, 8th, 10th, 12th, 14th). Documented here per contract; the
// canonical/distractor split exists only in the grading bundle.
const iocCanonical = ss.ioc_set.canonical;
const iocDistractors = ss.ioc_set.distractors;
const ioc_candidates = [
  iocCanonical[0],
  iocDistractors[0],
  iocCanonical[1],
  iocCanonical[2],
  iocDistractors[1],
  iocCanonical[3],
  iocCanonical[4],
  iocDistractors[2],
  iocCanonical[5],
  iocDistractors[3],
  iocCanonical[6],
  iocDistractors[4],
  iocCanonical[7],
  iocDistractors[5],
];

// Q-06-04 recovery activity. The four restoration steps are displayed in a
// documented fixed scramble (indices 2,0,3,1 of the source list) so the
// candidate-facing order never reveals the canonical sequence; likewise the
// host list is alphabetical and the approach options use a fixed order that
// does not correspond positionally to the host list.
const RECOVERY_STEP_DISPLAY_INDICES = [2, 0, 3, 1];
const recoveryStepsSource = ss.recovery_sequence;
const recoveryApproach = ss.recovery_approach;
const recovery_options = {
  sequence_steps: RECOVERY_STEP_DISPLAY_INDICES.map((i) => recoveryStepsSource[i]),
  host_approach_hosts: ['APP-PRD-01', 'DC-01', 'FILE-PRD-01', 'WEB-PRD-01'],
  host_approach_options: [
    recoveryApproach['WEB-PRD-01'],
    recoveryApproach['FILE-PRD-01'],
    recoveryApproach['DC-01'],
    recoveryApproach['APP-PRD-01'],
  ],
  backup_date_options: sub('Q-06-04', '(c)').options,
  enhanced_monitoring_options: sub('Q-06-04', '(d)').options,
};

const activities = {
  timeline_display,
  attack_behaviors: ss.attack_mappings.map((m) => m.behavior),
  attack_techniques: ss.attack_controlled_list.map((t) => ({ id: t.id, name: t.name })),
  host_classification_hosts: ss.host_classification.map((h) => h.host),
  host_classification_classes: sub('Q-05-01', '(a)').options,
  ioc_candidates,
  containment_options: {
    isolate_hosts: sub('Q-06-01', '(a)').options,
    disable_accounts: sub('Q-06-01', '(b)').options,
    block_ips: sub('Q-06-01', '(c)').options,
    suspend_paths: sub('Q-06-01', '(d)').options,
  },
  eradication_options: sub('Q-06-03', '(a)').options,
  recovery_options,
  safe_state_check_options: sub('Q-07-01', '(a)').options,
  residual_risk_options: sub('Q-07-03', '(a)').options,
  recommendation_options: sub('Q-07-03', '(b)').options,
  report_fields: [
    ...itemById.get('Q-07-04').sub_answers.map((s) => {
      const f = { key: s.key, question: s.question, answer_type: s.answer_type };
      if (Array.isArray(s.options) && s.options.length > 0) f.options = s.options;
      return f;
    }),
    {
      key: 'exec_summary_rubric',
      question: 'Reviewer rubric criteria applied to the executive summary (field (k)).',
      answer_type: 'rubric',
      criteria: ss.exec_summary_rubric,
    },
  ],
};

const meta = assessment.metadata;
const candidateBundle = {
  metadata: {
    assessment_id: meta.assessment_id,
    title: meta.title,
    incident: meta.incident,
    duration_minutes: meta.duration_minutes,
    pass_threshold_pct: meta.pass_threshold_pct,
    total_points: meta.total_points,
    task_count: meta.task_count,
    version: meta.version,
    timezone_convention: meta.timezone_convention,
  },
  phases: assessment.phases,
  items: items.map(candidateItem),
  activities,
  dossier,
};

// ---------------------------------------------------------------------------
// 5. Grading bundle — full fidelity
// ---------------------------------------------------------------------------
const gradingBundle = {
  items: assessment.items,
  supporting_structures: assessment.supporting_structures,
  scoring: assessment.scoring,
  progression: assessment.progression,
  timeline_position_by_key: Object.fromEntries(ss.timeline_items.map((t) => [t.key, t.canonical_position])),
};

// ---------------------------------------------------------------------------
// 6. Validation
// ---------------------------------------------------------------------------
const candidateIds = new Set(candidateBundle.items.map((i) => i.id));
const gradingIds = new Set(gradingBundle.items.map((i) => i.id));
for (const item of items) {
  if (!candidateIds.has(item.id)) fail(`Candidate bundle missing task ${item.id}`);
  if (!gradingIds.has(item.id)) fail(`Grading bundle missing task ${item.id}`);
}
if (candidateBundle.items.length !== EXPECTED_TASK_COUNT) {
  fail(`Candidate bundle has ${candidateBundle.items.length} items, expected ${EXPECTED_TASK_COUNT}`);
}

const forbiddenHits = [];
scanForbiddenKeys(candidateBundle, 'candidate', forbiddenHits);
if (forbiddenHits.length > 0) {
  fail(`Forbidden keys in candidate bundle:\n  ${forbiddenHits.join('\n  ')}`);
}

// Hint text verification: candidate bundle hints must equal the HINTS_GUIDE §3
// verbatim strings (they are sourced from the guide; this re-checks equality
// and guards against any future normalization drift in the pipeline).
for (const item of candidateBundle.items) {
  const guide = guideHints.get(item.id) || [];
  if (item.hints.length !== guide.length) {
    fail(`${item.id}: candidate bundle hint count ${item.hints.length} != guide ${guide.length}`);
    continue;
  }
  item.hints.forEach((h, i) => {
    if (h.text !== guide[i].text) {
      fail(`${item.id} hint ${i + 1}: text does not match HINTS_GUIDE.md §3 verbatim string`);
    }
  });
}

const DOSSIER_SECTIONS = [
  'caseSummary', 'organization', 'network', 'hosts', 'users', 'webApp',
  'activeDirectory', 'securityControls', 'policies', 'externalContext', 'timezoneNote',
];
for (const section of DOSSIER_SECTIONS) {
  if (!(section in dossier)) fail(`dossier.json missing section: ${section}`);
}

// ---------------------------------------------------------------------------
// 7. Write output (only when clean)
// ---------------------------------------------------------------------------
if (problems.length > 0) {
  console.error(`BUILD FAILED — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const outDir = path.join(ROOT, 'src/data/generated');
fs.mkdirSync(outDir, { recursive: true });

const candidateJson = JSON.stringify(candidateBundle, null, 2) + '\n';
const gradingJson = JSON.stringify(gradingBundle, null, 2) + '\n';
fs.writeFileSync(path.join(outDir, 'candidate.bundle.json'), candidateJson);
fs.writeFileSync(path.join(outDir, 'grading.bundle.json'), gradingJson);

console.log('BUILD OK');
console.log(`  candidate.bundle.json  ${candidateJson.length} bytes  (${candidateBundle.items.length} items, ${timeline_display.length} timeline cards, ${ioc_candidates.length} IOC candidates)`);
console.log(`  grading.bundle.json    ${gradingJson.length} bytes  (${gradingBundle.items.length} items)`);
console.log('  forbidden-key scan: PASS (candidate bundle)');
console.log('  hint verbatim check: PASS (HINTS_GUIDE.md §3)');
console.log('  task coverage: PASS (30/30 in both bundles)');
