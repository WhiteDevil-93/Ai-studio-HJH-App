// Phase 3: Resolve HJH source provenance for score calculators whose HJH page
// citations are already recorded in raw/reference/formulae/*.json or in
// source-map.json. Only updates the `source` envelope and sourceGroup;
// the calculator definitions are left unchanged.
//
// Run:
//   node --import tsx scripts/resolve-hjh-score-provenance.ts [--write]
import fs from 'node:fs';
import path from 'path';
import {fileURLToPath} from 'node:url';
import type {CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCORE_DIR = path.join(ROOT, 'src/clinical/entries/16_score_calculators');
const REF_DIR = path.join(ROOT, 'clinical-sources/raw/gemini-2026-07/reference/formulae');
const WRITE = process.argv.includes('--write');

// Map calculator slug -> verified HJH PDF pages.
const HJH_PAGES: Record<string, number[]> = {
  anion_gap: [92],
  canadian_cspine: [54],
  nexus: [54],
  curb65: [58],
  wells_dvt: [63],
  free_water_deficit: [96],
  corrected_na_hjh_page92: [92],
  corrected_na_hjh_page97: [97],
  wells_pe: [159, 160],
  perc: [159, 160],
  burch_wartofsky: [189, 190],
  gcs: [89],
  parkland: [51, 52, 53],
  alvarado: [7],
};

// Calculators that should explicitly stay as source-unresolved (global scores
// with no HJH page in the source document).
const STAY_UNRESOLVED = new Set<string>([
  'apgar', 'asa', 'bishop', 'bova', 'canadian_ct_head', 'centor', 'cha2ds2_vasc',
  'child_pugh', 'ciwa', 'dic_isth', 'four_score', 'glasgow_blatchford', 'grace',
  'has_bled', 'heart_score', 'hestia', 'hunt_hess', 'ich_score', 'killip',
  'light_criteria', 'meld', 'mews', 'news2', 'nihss', 'ottawa_ankle', 'ottawa_knee',
  'ottawa_sah', 'pesi', 'rass', 'rcri', 'sf_syncope', 'sirs', 'sofa', 'spesi',
  'timi_ua', 'years', 'abcd2',
]);

interface RefMeta {
  _meta?: {source_doc?: string; title?: string};
  source_pages?: number[];
}

function loadRefPages(slug: string): number[] | undefined {
  const file = path.join(REF_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return undefined;
  const ref: RefMeta = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (ref.source_pages?.length) return ref.source_pages;
  return undefined;
}

let updated = 0;
let unchanged = 0;
const report: string[] = [];

for (const entryName of fs.readdirSync(SCORE_DIR).filter(n => n.endsWith('.json'))) {
  const slug = path.basename(entryName, '.json');
  const filePath = path.join(SCORE_DIR, entryName);
  const entry: CanonicalEntryFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (entry.source?.sourceId !== 'source-unresolved') {
    report.push(`SKIP ${slug}: already ${entry.source?.sourceId}`);
    continue;
  }
  if (STAY_UNRESOLVED.has(slug)) {
    report.push(`LEAVE ${slug}: global score with no HJH page`);
    continue;
  }

  const pages = HJH_PAGES[slug] ?? loadRefPages(slug);
  if (!pages || pages.length === 0) {
    report.push(`NO-PAGE ${slug}: no HJH page found; remains unresolved`);
    continue;
  }

  entry.source = {
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: pages,
    sectionTitle: entry.record?.name as string ?? slug,
    transformation: 'combined',
    verification: 'page-index',
  };
  entry.sourceGroup = 'hjth';

  if (WRITE) {
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2) + '\n');
  }
  updated++;
  report.push(`UPDATE ${slug}: source-unresolved -> hjh-ed-2026-v1 @ [${pages.join(',')}]`);
}

console.log(report.join('\n'));
console.log(`\nSummary: ${updated} updated, ${report.length - updated} skipped/left unresolved`);
if (!WRITE) console.log('(dry run - pass --write to apply)');
