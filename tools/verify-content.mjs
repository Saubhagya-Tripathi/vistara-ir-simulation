#!/usr/bin/env node
/**
 * Content-integrity verification (spec §35). Fails the build on any violation:
 *  - all 30 assessment IDs exist in both bundles
 *  - every referenced evidence ID exists in the manifest (required_evidence,
 *    evidence_selection.required_set, reveal schedule)
 *  - every referenced attack event (EVT-xxx) exists in ATTACK_TIMELINE_v1.1.md
 *  - every phase/task reference resolves; no question is unreachable; no dead ends
 *  - no answer-key keys in the candidate bundle
 *  - no retired RH-06 and no invalid Event ID 4628 anywhere in shipped content
 *  - total scoring = 255; phase totals match the specification
 *  - supporting structures internally consistent (timeline, ATT&CK, IOCs, report)
 * Run after `npm run build:data` (or via `npm run verify`, which builds first).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const fail = [];
const ok = (cond, msg) => {
  if (!cond) fail.push(msg);
};

const assessment = JSON.parse(readFileSync(join(root, "assessment.json"), "utf8"));
const candidate = JSON.parse(readFileSync(join(root, "src/data/generated/candidate.bundle.json"), "utf8"));
const grading = JSON.parse(readFileSync(join(root, "src/data/generated/grading.bundle.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "public/evidence/manifest.json"), "utf8"));
const timelineDoc = readFileSync(join(root, "ATTACK_TIMELINE_v1.1.md"), "utf8");

// --- 1. all 30 assessment IDs -------------------------------------------------
const TASK_IDS = assessment.items.map((i) => i.id);
ok(TASK_IDS.length === 30, `expected 30 tasks, found ${TASK_IDS.length}`);
ok(candidate.items.length === 30, "candidate bundle must contain 30 items");
ok(grading.items.length === 30, "grading bundle must contain 30 items");
for (const id of TASK_IDS) {
  ok(candidate.items.some((i) => i.id === id), `candidate bundle missing ${id}`);
  ok(grading.items.some((i) => i.id === id), `grading bundle missing ${id}`);
}

// --- 2. evidence references resolve -------------------------------------------
const evidenceIds = new Set(manifest.artifacts.map((a) => a.candidate_view.evidence_id));
ok(evidenceIds.size === 68, `manifest should list 68 artifacts, found ${evidenceIds.size}`);
const referencedEvidence = new Set();
for (const item of assessment.items) {
  for (const id of item.required_evidence ?? []) referencedEvidence.add(id);
  for (const id of item.reference_evidence ?? []) referencedEvidence.add(id);
  for (const id of item.evidence_selection?.required_set ?? []) referencedEvidence.add(id);
}
const schedule = assessment.progression.evidence_reveal_schedule;
for (const list of [schedule.phase_0, schedule.phase_1, schedule.phase_6, schedule.phase_7]) {
  for (const id of list) referencedEvidence.add(id);
}
for (const id of referencedEvidence) {
  ok(evidenceIds.has(id), `referenced evidence ${id} missing from manifest`);
}
// every manifested artifact is reachable via the reveal schedule
const scheduled = new Set([...schedule.phase_0, ...schedule.phase_1, ...schedule.phase_6, ...schedule.phase_7]);
for (const id of evidenceIds) {
  ok(scheduled.has(id), `manifested artifact ${id} never revealed by the schedule`);
}
// artifact bodies exist
for (const a of manifest.artifacts) {
  const p = join(root, "public/evidence", a.candidate_view.path);
  ok(existsSync(p), `missing evidence body ${a.candidate_view.path}`);
  if (a.candidate_view.drilldown) {
    ok(
      existsSync(join(root, "public/evidence", a.candidate_view.drilldown)),
      `missing drilldown ${a.candidate_view.drilldown}`,
    );
  }
  if (a.candidate_view.rerun_path) {
    ok(
      existsSync(join(root, "public/evidence", a.candidate_view.rerun_path)),
      `missing rerun body ${a.candidate_view.rerun_path}`,
    );
  }
}

// --- 3. attack-event references resolve ---------------------------------------
const knownEvents = new Set([...timelineDoc.matchAll(/EVT-\d{3}/g)].map((m) => m[0]));
ok(knownEvents.size === 38, `expected 38 EVT ids in ATTACK_TIMELINE, found ${knownEvents.size}`);
for (const item of assessment.items) {
  for (const evt of item.attack_events ?? []) {
    ok(knownEvents.has(evt), `${item.id} references unknown event ${evt}`);
  }
  for (const sa of item.sub_answers ?? []) {
    for (const evt of sa.attack_events ?? []) {
      ok(knownEvents.has(evt), `${item.id}${sa.key} references unknown event ${evt}`);
    }
  }
}

// --- 4. phase/task graph: reachability, no dead ends ---------------------------
const phaseTaskIds = new Set(assessment.phases.flatMap((p) => p.tasks));
for (const id of TASK_IDS) ok(phaseTaskIds.has(id), `${id} not assigned to any phase`);
for (const p of assessment.phases) {
  for (const t of p.tasks) ok(TASK_IDS.includes(t), `phase ${p.id} references unknown task ${t}`);
}
// linear phase gates make everything reachable in order; verify chain sanity
ok(assessment.phases.length === 8, "expected 8 phases");
ok(assessment.phases[0].tasks.includes("Q-00-01"), "P0 must start with Q-00-01");
ok(assessment.phases[7].tasks.includes("Q-07-04"), "P7 must end with Q-07-04");

// --- 5. no answer key in candidate bundle --------------------------------------
const FORBIDDEN_KEYS = new Set([
  "canonical_answer", "accepted_answers", "attack_events", "evidence_correlation",
  "common_wrong_answer", "critical_failure_link", "required_set", "evt_refs",
  "rh_refs", "red_herring", "rule_out", "corroborates", "expected_significance",
]);
(function scan(obj, path) {
  if (Array.isArray(obj)) return obj.forEach((v, i) => scan(v, `${path}[${i}]`));
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      ok(!FORBIDDEN_KEYS.has(k), `candidate bundle leaks key ${k} at ${path}`);
      scan(v, `${path}.${k}`);
    }
  }
})(candidate, "candidate");

// --- 6. retired content never appears ------------------------------------------
const shippedText = [
  JSON.stringify(candidate),
  ...manifest.artifacts.map((a) =>
    readFileSync(join(root, "public/evidence", a.candidate_view.path), "utf8"),
  ),
].join("\n");
ok(!shippedText.includes("RH-06"), "retired RH-06 appears in shipped content");
ok(!/4628/.test(shippedText), "invalid Event ID 4628 appears in shipped content");

// --- 7. scoring totals ----------------------------------------------------------
const EXPECTED_PHASE_TOTALS = { P0: 5, P1: 11, P2: 30, P3: 50, P4: 28, P5: 51, P6: 39, P7: 41 };
const byPhase = {};
for (const item of assessment.items) byPhase[item.phase] = (byPhase[item.phase] ?? 0) + item.points;
for (const [p, pts] of Object.entries(EXPECTED_PHASE_TOTALS)) {
  ok(byPhase[p] === pts, `phase ${p} totals ${byPhase[p]}, expected ${pts}`);
  ok(assessment.scoring.raw_points_by_phase[p] === pts, `scoring.raw_points_by_phase.${p} mismatch`);
}
const total = assessment.items.reduce((a, i) => a + i.points, 0);
ok(total === 255, `total points ${total}, expected 255`);
ok(assessment.scoring.raw_points_by_phase.total === 255, "scoring total mismatch");
// per-item point invariant (equal pooling + evidence split)
for (const item of assessment.items) {
  const subSum = item.sub_answers.reduce((a, s) => a + s.points, 0);
  const ev = item.evidence_selection;
  const evPoints = ev?.earns_points && !ev.expressed_as ? ev.points : 0;
  ok(
    Math.abs(subSum + evPoints - item.points) < 1e-6,
    `${item.id}: components ${subSum} + evidence ${evPoints} != ${item.points}`,
  );
}
// dimension model
const dims = assessment.scoring.dimensions;
ok(dims.reduce((a, d) => a + d.weight_pct, 0) === 100, "dimension weights must sum to 100");
ok(dims.reduce((a, d) => a + d.raw_points, 0) === 255, "dimension raw points must sum to 255");
ok(assessment.scoring.critical_failures.length === 3, "expected 3 critical-failure rules");

// --- 8. supporting structures ----------------------------------------------------
const ss = assessment.supporting_structures;
ok(ss.timeline_items.length === 11, "timeline must have 11 items");
ok(
  new Set(ss.timeline_items.map((t) => t.canonical_position)).size === 11,
  "timeline canonical_position must be a permutation of 1..11",
);
for (const t of ss.timeline_items) {
  for (const evt of t.evt ?? []) ok(knownEvents.has(evt), `timeline ${t.key} references ${evt}`);
}
ok(ss.attack_mappings.length === 15, "ATT&CK mappings must have 15 rows");
const techniqueIds = new Set(ss.attack_controlled_list.map((t) => t.id));
ok(techniqueIds.size === 18, "ATT&CK controlled list must have 18 techniques");
for (const m of ss.attack_mappings) {
  ok(techniqueIds.has(m.canonical_technique), `mapping uses unlisted technique ${m.canonical_technique}`);
}
ok(ss.host_classification.length === 10, "host classification must cover 10 hosts");
ok(ss.ioc_set.canonical.length === 8 && ss.ioc_set.distractors.length === 6, "IOC set must be 8 canonical + 6 distractors");
ok(ss.eradication_steps.length === 7, "eradication must have 7 steps");
ok(ss.recovery_sequence.length === 4, "recovery sequence must have 4 steps");
ok(ss.safe_state_checks.length === 9, "safe-state checklist must have 9 checks");
ok(ss.report_fields.length === 10, "report must have 10 deterministic fields");
ok(ss.exec_summary_rubric.length === 5, "exec summary rubric must have 5 criteria");

// --- result ----------------------------------------------------------------------
if (fail.length > 0) {
  console.error(`CONTENT INTEGRITY: FAIL (${fail.length} problem(s))`);
  for (const f of fail) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("CONTENT INTEGRITY: PASS");
console.log(`  30 tasks | 68 artifacts | 38 events | 255 points | phases ${Object.values(EXPECTED_PHASE_TOTALS).join("/")}`);
