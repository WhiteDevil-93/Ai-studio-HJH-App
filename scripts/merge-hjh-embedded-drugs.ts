// Phase 4a: Merge embedded_drugs from the raw gemini-2026-07/HJH transcription
// into the matching canonical src/clinical/entries files. This ensures the
// canonical dataset contains the supplementary dosing/infusion data referenced
// by the HJH protocols, even though the current UI only surfaces it on the
// hospital landing page (which reads the raw archive directly).
//
// Run:
//   node --import tsx scripts/merge-hjh-embedded-drugs.ts [--write]
import fs from 'node:fs';
import path from 'path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const RAW_DIR = path.join(ROOT, 'clinical-sources/raw/gemini-2026-07/HJH');
const WRITE = process.argv.includes('--write');

const MAPPINGS: Record<string, string> = {
  acute_coronary_syndrome_acs_algorithm: 'acute-coronary-syndrome-acs-algorithm',
  acute_heart_failure_ahf: 'acute-heart-failure-ahf',
  acute_ischaemic_stroke: 'acute-ischaemic-stroke',
  asthma_exacerbation: 'asthma-exacerbation',
  atrial_fibrillation_af: 'atrial-fibrillation-af',
  copd_exacerbation: 'copd-exacerbation',
  headache_red_flags_primary_syndromes: 'headache-red-flags-primary-syndromes',
  malaria_uncomplicated_complicated: 'malaria-uncomplicated-complicated',
  sepsis_septic_shock: 'sepsis-septic-shock',
  stemi_equivalents_sgarbossa_criteria: 'stemi-equivalents-sgarbossa-criteria',
  upper_gastrointestinal_bleed_ugib: 'upper-gastrointestinal-bleed-ugib',
  vaginal_bleeding_ed_management: 'vaginal-bleeding-ed-management',
  vascular_emergencies_aaa_dissection_limb_ischaemia: 'vascular-emergencies-aaa-dissection-limb-ischaemia',
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const bySlug = new Map<string, string>();
for (const fp of walk(ENTRIES_DIR)) {
  bySlug.set(path.basename(fp, '.json'), fp);
}

let updated = 0;
let skipped = 0;
const report: string[] = [];

for (const [rawBase, srcSlug] of Object.entries(MAPPINGS)) {
  const rawPath = path.join(RAW_DIR, `${rawBase}.json`);
  const srcPath = bySlug.get(srcSlug);
  if (!srcPath) {
    report.push(`SKIP ${rawBase}: target ${srcSlug} not found`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const entry = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

  const embeddedDrugs = raw.embedded_drugs;
  if (!Array.isArray(embeddedDrugs) || embeddedDrugs.length === 0) {
    report.push(`SKIP ${rawBase}: no embedded_drugs`);
    continue;
  }

  if (JSON.stringify(entry.record.embedded_drugs) === JSON.stringify(embeddedDrugs)) {
    report.push(`SKIP ${rawBase}: already identical`);
    skipped++;
    continue;
  }

  entry.record.embedded_drugs = embeddedDrugs;
  if (WRITE) {
    fs.writeFileSync(srcPath, JSON.stringify(entry, null, 2) + '\n');
  }
  updated++;
  report.push(`UPDATE ${rawBase}: added ${embeddedDrugs.length} embedded_drugs to ${srcSlug}`);
}

console.log(report.join('\n'));
console.log(`\nSummary: ${updated} updated, ${skipped} already identical`);
if (!WRITE) console.log('(dry run - pass --write to apply)');
