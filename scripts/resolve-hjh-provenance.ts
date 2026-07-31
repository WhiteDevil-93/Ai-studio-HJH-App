// Phase 1 HJH provenance resolution: for each raw gemini-2026-07/HJH entry,
// find the matching src/clinical/entries/**.json file and, if it is currently
// marked source-unresolved, upgrade it to hjh-ed-2026-v1 with verified page
// citations from pdf_page_index.txt. Records (clinical content) are unchanged
// - only the `source`, `sourceGroup`, and (where relevant) the top-level
// envelope provenance fields are touched.
//
// Run:
//   node --import tsx scripts/resolve-hjh-provenance.ts [--write]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const WRITE = process.argv.includes('--write');

interface Mapping {
  rawSlug: string;
  srcSlug: string;
  pages: number[];
  sectionTitle: string;
}

// Verified against pdf_page_index.txt (see analysis in the preceding report).
const MAPPINGS: Mapping[] = [
  {rawSlug: 'acute_coronary_syndrome_acs_algorithm', srcSlug: 'acute-coronary-syndrome-acs-algorithm', pages: [9, 10, 11], sectionTitle: 'Acute Coronary Syndrome'},
  {rawSlug: 'acute_heart_failure_ahf', srcSlug: 'acute-heart-failure-ahf', pages: [16], sectionTitle: 'Acute Heart Failure'},
  {rawSlug: 'acute_ischaemic_stroke', srcSlug: 'acute-ischaemic-stroke', pages: [17, 18], sectionTitle: 'Acute Ischaemic Stroke'},
  {rawSlug: 'airway_management_checklist_rsi', srcSlug: 'airway-management-checklist-edict', pages: [22, 23], sectionTitle: 'Airway Management Checklists'},
  {rawSlug: 'anaphylaxis', srcSlug: 'anaphylaxis', pages: [41], sectionTitle: 'Anaphylaxis'},
  {rawSlug: 'angioedema', srcSlug: 'angioedema', pages: [42], sectionTitle: 'Angioedema'},
  {rawSlug: 'asthma_exacerbation', srcSlug: 'asthma-exacerbation', pages: [43, 44, 45], sectionTitle: 'Asthma'},
  {rawSlug: 'atrial_fibrillation_af', srcSlug: 'atrial-fibrillation-af', pages: [46, 47], sectionTitle: 'Atrial Fibrillation'},
  {rawSlug: 'burns', srcSlug: 'burns-brooke-formula-escharotomy', pages: [51, 52, 53], sectionTitle: 'Burns'},
  {rawSlug: 'copd_exacerbation', srcSlug: 'copd-exacerbation', pages: [56, 57], sectionTitle: 'COPD'},
  {rawSlug: 'diabetic_ketoacidosis_dka', srcSlug: 'diabetic-ketoacidosis-dka-hhs', pages: [92, 93], sectionTitle: 'Hyperglycaemia: DKA & HHS'},
  {rawSlug: 'dizziness_vertigo_hints_exam', srcSlug: 'dizziness-vertigo-hints-exam', pages: [67], sectionTitle: 'Dizziness and Vertigo'},
  {rawSlug: 'head_injury', srcSlug: 'head-injury-radiography-guidelines', pages: [87, 88, 90], sectionTitle: 'Head Injury'},
  {rawSlug: 'headache_red_flags_primary_syndromes', srcSlug: 'headache-red-flags-primary-syndromes', pages: [86], sectionTitle: 'Headache'},
  {rawSlug: 'malaria_uncomplicated_complicated', srcSlug: 'malaria-uncomplicated-complicated', pages: [126, 127], sectionTitle: 'Malaria'},
  {rawSlug: 'sepsis_septic_shock', srcSlug: 'sepsis-septic-shock', pages: [170, 171, 172], sectionTitle: 'Sepsis and Septic Shock'},
  {rawSlug: 'stemi_equivalents_sgarbossa_criteria', srcSlug: 'stemi-equivalents-sgarbossa-criteria', pages: [12], sectionTitle: 'STEMI Equivalents'},
  {rawSlug: 'upper_gastrointestinal_bleed_ugib', srcSlug: 'upper-gastrointestinal-bleed-ugib', pages: [196, 198], sectionTitle: 'Upper Gastrointestinal Bleed'},
  {rawSlug: 'vaginal_bleeding_ed_management', srcSlug: 'vaginal-bleeding-ed-management', pages: [199], sectionTitle: 'Vaginal Bleeding'},
  {rawSlug: 'vascular_emergencies_aaa_dissection_limb_ischaemia', srcSlug: 'vascular-emergencies-aaa-dissection-limb-ischaemia', pages: [200], sectionTitle: 'Vascular Emergencies'},
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const allFiles = walk(ENTRIES_DIR);
const bySlug = new Map<string, string[]>();
for (const fp of allFiles) {
  const base = path.basename(fp, '.json');
  const list = bySlug.get(base) ?? [];
  list.push(fp);
  bySlug.set(base, list);
}

let updated = 0, alreadyMapped = 0, missing = 0;
const report: string[] = [];

for (const m of MAPPINGS) {
  const candidates = bySlug.get(m.srcSlug) ?? [];
  if (candidates.length === 0) {
    missing++;
    report.push(`MISSING  ${m.srcSlug}  (raw: ${m.rawSlug})`);
    continue;
  }
  for (const fp of candidates) {
    const entry = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const cur = entry.source?.sourceId;
    if (cur === 'hjh-ed-2026-v1') {
      alreadyMapped++;
      report.push(`OK       ${m.srcSlug}  already hjh-ed-2026-v1 at ${path.relative(ROOT, fp)}`);
      continue;
    }
    // Upgrade provenance. Preserve the rest of the record verbatim.
    entry.source = {
      sourceId: 'hjh-ed-2026-v1',
      pdfPages: m.pages,
      sectionTitle: m.sectionTitle,
      transformation: 'condensed',
      verification: 'page-index',
    };
    entry.sourceGroup = 'hjth';
    if (WRITE) {
      fs.writeFileSync(fp, JSON.stringify(entry, null, 2) + '\n');
    }
    updated++;
    report.push(`UPDATED  ${m.srcSlug}  [${cur}] -> hjh-ed-2026-v1 @ [${m.pages.join(',')}]  (${path.relative(ROOT, fp)})`);
  }
}

console.log(report.join('\n'));
console.log(`\nSummary: ${updated} updated, ${alreadyMapped} already mapped, ${missing} missing (no src file found)`);
if (!WRITE) console.log('(dry run - pass --write to apply)');
