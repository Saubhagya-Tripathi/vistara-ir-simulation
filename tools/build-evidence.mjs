#!/usr/bin/env node
// build-evidence.mjs — validate evidence-src/ and publish public/evidence/
// Usage: node tools/build-evidence.mjs [--src <dir>] [--out <dir>]
//   --src  source root containing manifest.src.json + artifact bodies (default: <repo>/evidence-src)
//   --out  output root for the published tree             (default: <repo>/public/evidence)
// Exits non-zero if any validation fails. Missing bodies fail but do not stop the run,
// so partially-authored trees still produce a full report.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null;
}
const SRC = arg('--src') || path.join(REPO, 'evidence-src');
const OUT = arg('--out') || path.join(REPO, 'public', 'evidence');

// ---------------------------------------------------------------- constants

const TYPE_ENUM = new Set([
  'siem_alert', 'ticket', 'iis_access_log', 'windows_security', 'edr_process',
  'edr_session', 'powershell_log', 'firewall_log', 'netflow_summary', 'proxy_log',
  'ad_snapshot', 'sql_audit', 'vpn_log', 'vuln_scan_job', 'smb_file_audit',
  'document', 'fs_event', 'response_record', 'validation_record', 'report',
]);

const ALLOWED_PHASES = new Set([0, 1, 6, 7]);

const ALLOWED_EVENT_IDS = new Set([4624, 4625, 4662, 4720, 4725, 4726, 4728, 4732, 4776]);

const IIS_HEADER = '# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.';

const FORBIDDEN_STRINGS = [
  'decisive', 'corroborating', 'expected significance', 'correct answer',
  'attack event id', 'red herring', 'rule-out', 'rh-0', 'evt-0',
];
const FORBIDDEN_EXACT = ['4628'];

const EVENT_ID_PATTERNS = [/event id[:\s]+(\d+)/gi, /EventID[":\s]+(\d+)/gi];

const ISO_IST = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+05:30$/;

const SUBDIRS = new Set(['alerts', 'web', 'auth', 'edr', 'fs', 'net', 'ad', 'db', 'vuln', 'docs', 'response']);

const WARN_LINES = 80;
const MAX_LINES = 220;

// Canonical artifact bodies (68 manifest entries; E-VALID-002 has an interim + rerun body).
// Drill-down CSVs are listed separately — they are referenced, not manifest entries.
const CANONICAL_PATHS = [
  'alerts/E-ALERT-001_siem-01_edr_alert.json',
  'alerts/E-ALERT-002_siem-01_correlation_cluster.json',
  'alerts/E-TICKET-001_inc-2026-0417_ticket.json',
  'web/E-WEB-001_web-prd-01_ambient_0902.log',
  'web/E-WEB-002_web-prd-01_gobuster_staging.log',
  'web/E-WEB-003_web-prd-01_upload_imgshell.log',
  'web/E-WEB-004_web-prd-01_portal_orders.log',
  'auth/E-AUTH-001_web-prd-01_rdp_bruteforce.log',
  'auth/E-AUTH-002_app-prd-01_ntlm_failure.log',
  'auth/E-AUTH-003_app-prd-01_4625_from_web.log',
  'auth/E-AUTH-004_app-prd-01_4624_type10.log',
  'auth/E-AUTH-005_dc-01_ldap_binds.log',
  'auth/E-AUTH-006_dc-01_4662_dcsync.log',
  'auth/E-AUTH-007_file-prd-01_4624_svcmon.log',
  'auth/E-AUTH-008_db-prd-01_4624_type3.log',
  'auth/E-AUTH-009_erp-app-01_4625_smb.log',
  'auth/E-AUTH-010_vpn-gw-01_pranav_joshi.log',
  'auth/E-AUTH-011_vpn-gw-01_ananya_iyer.log',
  'auth/E-AUTH-012_vpn-gw-01_full_window.log',
  'edr/E-EDR-001_web-prd-01_post_logon.json',
  'edr/E-EDR-002_web-prd-01_compress_archive.json',
  'edr/E-EDR-003_web-prd-01_host_recon.json',
  'edr/E-EDR-004_web-prd-01_procdump.json',
  'edr/E-EDR-005_web-prd-01_cred_search.json',
  'edr/E-EDR-006_app-prd-01_rdp_session.json',
  'edr/E-EDR-007_app-prd-01_ad_discovery.json',
  'edr/E-EDR-008_app-prd-01_schtasks_beacon.json',
  'edr/E-EDR-008B_app-prd-01_ps4104.log',
  'edr/E-EDR-009_dc-01_dcsync_process.json',
  'edr/E-EDR-010_file-prd-01_collection.json',
  'edr/E-EDR-011_file-prd-01_compress_archive.json',
  'edr/E-EDR-012_file-prd-01_exfil_post.json',
  'edr/E-EDR-013_app-prd-01_erp_probe.json',
  'edr/E-EDR-014_app-prd-01_antiforensics.json',
  'edr/E-EDR-015_file-prd-01_svcmon_session.json',
  'fs/E-FS-001_web-prd-01_img_aspx.json',
  'fs/E-FS-002_web-prd-01_staging_zip.json',
  'fs/E-FS-003_web-prd-01_passwords_txt.json',
  'fs/E-FS-004_app-prd-01_task_xml.log',
  'fs/E-FS-005_file-prd-01_temp_collect.log',
  'fs/E-FS-006_file-prd-01_order_export.json',
  'fs/E-FS-007_web-prd-01_upload_bak.json',
  'fs/E-SHARE-001_file-prd-01_smb_audit.log',
  'net/E-NET-001_fw-01_scan_rdp.log',
  'net/E-NET-002_fw-01_outbound_0903.log',
  'net/E-NET-003_fw-01_beacon_8443.log',
  'net/E-NET-004_fw-01_outbound_0905.log',
  'net/E-NET-005_fw-01_rdp_session.log',
  'net/E-NET-006_netflow_summary.log',
  'net/E-PROXY-001_egress_absence.log',
  'ad/E-AD-001_dc-01_4720_svcmon.log',
  'ad/E-AD-002_dc-01_group_adds.log',
  'ad/E-AD-003_dc-01_snapshot.json',
  'ad/E-AD-004_dc-01_disable_delete.log',
  'db/E-DB-001_db-prd-01_sql_audit.log',
  'vuln/E-VULN-001_vuln-01_on_demand.log',
  'vuln/E-VULN-002_vuln-01_weekly.log',
  'docs/E-WIKI-001_service_account_register.md',
  'docs/E-DOC-001_vendor_rdp_email_2025.md',
  'docs/E-DOC-002_quarantine_note_2025.md',
  'docs/E-DOC-003_hr_travel_TRV-2026-0312.md',
  'response/E-RESP-001_containment_record.json',
  'response/E-RESP-002_preservation_record.json',
  'response/E-RESP-003_eradication_checklist.json',
  'response/E-RESP-004_recovery_log.json',
  'response/E-VALID-001_interim_validation.json',
  'response/E-VALID-002_safestate_interim.json',
  'response/E-VALID-002_safestate_rerun.json',
  'response/E-REPORT-001_final_report_template.md',
];
const DRILLDOWN_PATHS = [
  'auth/E-AUTH-001_drilldown.csv',
  'fs/E-SHARE-001_drilldown.csv',
  'net/E-NET-003_drilldown_beacon_flows.csv',
];
const RERUN_PATH = 'response/E-VALID-002_safestate_rerun.json';

// ---------------------------------------------------------------- reporting

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

// ---------------------------------------------------------------- manifest

const manifestPath = path.join(SRC, 'manifest.src.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`FATAL: ${manifestPath} not found`);
  process.exit(1);
}
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error(`FATAL: manifest.src.json is not valid JSON: ${e.message}`);
  process.exit(1);
}
const artifacts = manifest.artifacts;
if (!Array.isArray(artifacts)) {
  console.error('FATAL: manifest.src.json has no "artifacts" array');
  process.exit(1);
}

// ------------------------------------------------------- manifest validation

const seenIds = new Set();
const seenPaths = new Set();
const REQUIRED_CV = ['evidence_id', 'path', 'type', 'source', 'timezone', 'window_ist', 'reveal_phase', 'synthetic', 'drilldown', 'title'];
const REQUIRED_IM = ['evt_refs', 'rh_refs', 'red_herring', 'rule_out', 'corroborates', 'relevance', 'expected_significance'];

for (const a of artifacts) {
  const cv = a.candidate_view || {};
  const im = a.internal_metadata || {};
  const id = cv.evidence_id || '(missing evidence_id)';
  const where = `manifest entry ${id}`;

  for (const f of REQUIRED_CV) if (!(f in cv)) err(`${where}: candidate_view.${f} missing`);
  for (const f of REQUIRED_IM) if (!(f in im)) err(`${where}: internal_metadata.${f} missing`);

  if (seenIds.has(id)) err(`${where}: duplicate evidence_id`);
  seenIds.add(id);

  if (typeof cv.path === 'string') {
    if (seenPaths.has(cv.path)) err(`${where}: duplicate path ${cv.path}`);
    seenPaths.add(cv.path);
    const dir = cv.path.split('/')[0];
    if (!SUBDIRS.has(dir)) err(`${where}: path ${cv.path} not under a known evidence subdirectory`);
    const base = cv.path.split('/').pop() || '';
    if (!base.startsWith(id + '_')) err(`${where}: filename ${base} does not start with "${id}_"`);
  } else {
    err(`${where}: candidate_view.path must be a string`);
  }

  if (!TYPE_ENUM.has(cv.type)) err(`${where}: type "${cv.type}" not in the closed 20-value enum`);
  if (typeof cv.source !== 'string' || !cv.source) err(`${where}: candidate_view.source must be a non-empty string`);
  if (!(typeof cv.host === 'string' || cv.host === null)) err(`${where}: candidate_view.host must be a string or null`);
  if (typeof cv.timezone !== 'string' || !cv.timezone) err(`${where}: candidate_view.timezone must be a non-empty string`);
  if (typeof cv.title !== 'string' || !cv.title) err(`${where}: candidate_view.title must be a non-empty string`);

  const w = cv.window_ist || {};
  if (!ISO_IST.test(w.start || '')) err(`${where}: window_ist.start "${w.start}" is not ISO-8601 with +05:30`);
  if (!ISO_IST.test(w.end || '')) err(`${where}: window_ist.end "${w.end}" is not ISO-8601 with +05:30`);
  if (ISO_IST.test(w.start || '') && ISO_IST.test(w.end || '') && w.end < w.start)
    err(`${where}: window_ist.end is before window_ist.start`);

  if (!Number.isInteger(cv.reveal_phase) || !ALLOWED_PHASES.has(cv.reveal_phase))
    err(`${where}: reveal_phase ${cv.reveal_phase} not in {0,1,6,7}`);
  if (cv.synthetic !== true) err(`${where}: candidate_view.synthetic must be true`);
  if ('drilldown' in cv && cv.drilldown !== null && typeof cv.drilldown !== 'string')
    err(`${where}: candidate_view.drilldown must be a string or null`);

  if (!Array.isArray(im.evt_refs)) err(`${where}: internal_metadata.evt_refs must be an array`);
  if (!Array.isArray(im.rh_refs)) err(`${where}: internal_metadata.rh_refs must be an array`);
  if (typeof im.red_herring !== 'boolean') err(`${where}: internal_metadata.red_herring must be boolean`);
  if (im.red_herring === true) {
    if (!Array.isArray(im.rh_refs) || im.rh_refs.length === 0)
      err(`${where}: red_herring=true requires non-empty rh_refs`);
    if (typeof im.rule_out !== 'string' || !im.rule_out)
      err(`${where}: red_herring=true requires a non-null rule_out`);
  }
  if (!Array.isArray(im.corroborates)) err(`${where}: internal_metadata.corroborates must be an array`);

  // retired identifiers must never appear anywhere in the manifest
  const blob = JSON.stringify(a);
  if (/RH-06/.test(blob)) err(`${where}: contains retired herring ID RH-06`);
  if (/4628/.test(blob)) err(`${where}: contains retired event ID 4628`);
}

// canonical path set: every canonical body exactly once, nothing extra
{
  const expected = new Set(CANONICAL_PATHS.filter((p) => p !== RERUN_PATH)); // rerun body is not a manifest entry
  for (const p of seenPaths) if (!expected.has(p)) err(`manifest path not in canonical file list: ${p}`);
  for (const p of expected) if (!seenPaths.has(p)) err(`canonical artifact missing from manifest: ${p}`);
}
if (artifacts.length !== 68) err(`manifest has ${artifacts.length} artifacts; expected 68`);

// E-VALID-002 rerun pointer
{
  const v2 = artifacts.find((a) => a.candidate_view?.evidence_id === 'E-VALID-002');
  if (v2) {
    if (v2.candidate_view.path !== 'response/E-VALID-002_safestate_interim.json')
      err(`E-VALID-002: candidate_view.path must be response/E-VALID-002_safestate_interim.json`);
    if (v2.candidate_view.rerun_path !== RERUN_PATH)
      err(`E-VALID-002: candidate_view.rerun_path must be ${RERUN_PATH}`);
  } else {
    err('E-VALID-002 missing from manifest');
  }
}

// ----------------------------------------------------------- body validation

function containsSyntheticTrue(value) {
  if (value === true) return false; // handled by caller via key name
  if (Array.isArray(value)) return value.some(containsSyntheticTrue);
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([k, v]) => (k === 'synthetic' && v === true) || containsSyntheticTrue(v));
  }
  return false;
}

function validateJsonBody(rel, text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    err(`${rel}: invalid JSON — ${e.message}`);
    return;
  }
  if (!containsSyntheticTrue(parsed)) err(`${rel}: JSON body must contain "synthetic": true`);
  const hashRe = /"([A-Za-z0-9_]*(?:hash|sha256|sha1|md5)[A-Za-z0-9_]*)"\s*:\s*"([^"]*)"/gi;
  let m;
  while ((m = hashRe.exec(text)) !== null) {
    if (!m[2].startsWith('SYNTHETIC-'))
      err(`${rel}:${lineOf(text, m.index)} — hash field "${m[1]}" value must start with "SYNTHETIC-"`);
  }
}

function validateBody(rel, artifactType) {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) {
    err(`${rel}: body file missing under ${path.basename(SRC)}/ (not yet authored)`);
    return false;
  }
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const lineCount = text.endsWith('\n') ? lines.length - 1 : lines.length;
  const ext = path.extname(rel).toLowerCase();

  // forbidden strings (any casing), with file + line
  lines.forEach((line, i) => {
    const low = line.toLowerCase();
    for (const s of FORBIDDEN_STRINGS) {
      if (low.includes(s)) err(`${rel}:${i + 1} — forbidden string "${s}" in candidate-visible body`);
    }
    for (const s of FORBIDDEN_EXACT) {
      if (line.includes(s)) err(`${rel}:${i + 1} — forbidden string "${s}" in candidate-visible body`);
    }
  });

  // IIS artifacts must carry the exact canonical UTC header line
  if (rel.startsWith('web/') && ext === '.log') {
    if (!lines.some((l) => l.replace(/\r$/, '') === IIS_HEADER))
      err(`${rel}: missing exact IIS header line: ${IIS_HEADER}`);
  }

  // windows_security / ad .log files: only allowed event IDs
  if (ext === '.log' && (artifactType === 'windows_security' || rel.startsWith('ad/'))) {
    for (const re of EVENT_ID_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const idNum = Number(m[1]);
        if (!ALLOWED_EVENT_IDS.has(idNum))
          err(`${rel}:${lineOf(text, m.index)} — event ID ${idNum} not in allowed set {${[...ALLOWED_EVENT_IDS].join(',')}}`);
      }
    }
  }

  if (ext === '.json') validateJsonBody(rel, text);

  // .log/.md bodies must open with at least one "#" header line
  if ((ext === '.log' || ext === '.md') && !lines.some((l) => l.trim() !== '' && l.trim().startsWith('#')))
    err(`${rel}: .log/.md body must start with at least one "#" header line`);

  // length discipline
  if (lineCount > MAX_LINES) err(`${rel}: ${lineCount} lines exceeds the ${MAX_LINES}-line cap`);
  else if (lineCount > WARN_LINES) warn(`${rel}: ${lineCount} lines (> ${WARN_LINES}; target 20–80)`);

  return true;
}

function validateDrilldown(rel) {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) {
    err(`${rel}: drill-down file missing under ${path.basename(SRC)}/ (not yet authored)`);
    return false;
  }
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const low = line.toLowerCase();
    for (const s of FORBIDDEN_STRINGS) {
      if (low.includes(s)) err(`${rel}:${i + 1} — forbidden string "${s}" in candidate-visible body`);
    }
    for (const s of FORBIDDEN_EXACT) {
      if (line.includes(s)) err(`${rel}:${i + 1} — forbidden string "${s}" in candidate-visible body`);
    }
  });
  if (!lines[0] || !lines[0].includes(',')) warn(`${rel}: drill-down CSV should open with a header row`);
  return true; // drill-downs are exempt from the line cap and the "#" header rule
}

const copied = [];
for (const a of artifacts) {
  const cv = a.candidate_view || {};
  if (typeof cv.path !== 'string') continue;
  const ok = validateBody(cv.path, cv.type);
  if (ok) copied.push(cv.path);

  if (cv.drilldown) {
    const okD = validateDrilldown(cv.drilldown);
    if (okD) copied.push(cv.drilldown);
  }
  if (cv.evidence_id === 'E-VALID-002' && cv.rerun_path) {
    const okR = validateBody(cv.rerun_path, cv.type);
    if (okR) copied.push(cv.rerun_path);
  }
}

// every referenced drill-down must be one of the canonical drill-downs
for (const a of artifacts) {
  const d = a.candidate_view?.drilldown;
  if (d && !DRILLDOWN_PATHS.includes(d)) err(`${a.candidate_view.evidence_id}: drilldown ${d} is not a canonical drill-down path`);
}

// ------------------------------------------------------------------- publish

const README = `# Evidence Workspace — INC-2026-0417

**ALL CONTENT IN THIS DIRECTORY IS SYNTHETIC / FICTIONAL TRAINING DATA. NO REAL DATA.**

## Timezone rules

- All timestamps in this evidence set are **IST (UTC+05:30)** unless the artifact says otherwise.
- **IIS access logs (\`web/\`) are the one exception: they are recorded in UTC.** Every IIS
  artifact carries this exact header line:

  \`# Synthetic training data. IIS timestamps are UTC. Convert to IST by adding +05:30.\`

  To compare an IIS log line with any other source, add +05:30 to the IIS timestamp first.
  Example: \`2026-09-03 07:32:41\` in an IIS log = \`13:02:41 IST\`.

## Artifact formats

- \`.log\` — raw-looking log text (W3C IIS, Windows Security text export, firewall syslog,
  SQL audit). Header comment lines (\`# ...\`) state the source system, timezone, and the
  query/collection window.
- \`.json\` — structured telemetry (EDR process/session events, SIEM alerts, AD snapshot,
  file-system metadata, response/validation records). All hashes are prefixed \`SYNTHETIC-\`.
- \`.md\` — human-context documents (wiki pages, emails, reports).
- \`.csv\` — drill-down tables (see below).

## Drill-down convention

High-volume sources are summarized: the primary artifact carries a \`# SUMMARY:\` line with
the true totals plus a representative excerpt, and a \`# DRILL-DOWN: <file>\` pointer to the
full listing. Drill-down files:

- \`auth/E-AUTH-001_drilldown.csv\` — full failed-logon listing for the RDP brute-force window.
- \`fs/E-SHARE-001_drilldown.csv\` — full SMB file-open listing for the collection window.
- \`net/E-NET-003_drilldown_beacon_flows.csv\` — every outbound beacon connection, full cadence.

Drill-down CSVs share their parent artifact's timezone.

## Index

\`manifest.json\` is the machine-readable index of every artifact: id, path, type, source,
host, timezone, IST window, and the simulation phase at which the artifact becomes available.
`;

fs.mkdirSync(OUT, { recursive: true });
for (const rel of copied) {
  const from = path.join(SRC, rel);
  const to = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'README.md'), README);

// ------------------------------------------------------------------- summary

const byType = {};
const byPhase = {};
for (const a of artifacts) {
  const cv = a.candidate_view || {};
  byType[cv.type] = (byType[cv.type] || 0) + 1;
  byPhase[cv.reveal_phase] = (byPhase[cv.reveal_phase] || 0) + 1;
}

console.log('\n=== evidence build summary ===');
console.log(`source: ${SRC}`);
console.log(`output: ${OUT}`);
console.log(`artifacts in manifest: ${artifacts.length}`);
console.log(`files copied:          ${copied.length} (of ${CANONICAL_PATHS.length + DRILLDOWN_PATHS.length} expected bodies + drill-downs)`);
console.log('\ncount by type:');
for (const t of Object.keys(byType).sort()) console.log(`  ${t.padEnd(18)} ${byType[t]}`);
console.log('count by reveal_phase:');
for (const p of Object.keys(byPhase).sort()) console.log(`  phase ${p}: ${byPhase[p]}`);

if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
}
if (errors.length) {
  console.error(`\nerrors (${errors.length}):`);
  for (const e of errors) console.error(`  FAIL  ${e}`);
  console.error('\nbuild FAILED');
  process.exit(1);
}
console.log('\nbuild OK');
