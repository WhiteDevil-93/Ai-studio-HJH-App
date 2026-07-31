// CMJAH archive import script (isolated mode).
// Creates a new canonical entry for every content-bearing CMJAH archive file,
// even if a same-title entry from another source already exists. Each
// hospital's protocol remains independent.
//
// Run:
//   node --import tsx scripts/import-cmjah-archive.ts [--write]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {slugify, type CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const ARCHIVE_DIR = path.join(ROOT, 'clinical-sources/raw/all_hospitals_protocols/CMJAH');
const WRITE = process.argv.includes('--write');

const SOURCE_ID = 'cmjah-ed-protocols-2020-v2';
const SOURCE_GROUP: CanonicalEntryFile['sourceGroup'] = 'cmjah';
const PDF_PAGE_COUNT = 147;

// Corrections verified against cmjah_page_index.txt (see migration-report.md).
const PAGE_CORRECTIONS: Record<string, number[]> = {
  'agitated_patient.json': [131],
  'snakebite.json': [117, 118],
  'toxic_alcohol.json': [135],
  'tca_overdose.json': [143],
};

// Category mapping based on title keywords / categoryHint.
const TITLE_CATEGORY_OVERRIDES: Record<string, [string, string]> = {
  'Acetylcholinesterase Inhibitor (AChE-i) OVERDOSE (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'ACUTE APPENDICITIS (CMJAH)': ['13_ed_trauma_surgical', 'protocols'],
  'ACUTE CHOLECYSTITIS (CMJAH)': ['13_ed_trauma_surgical', 'protocols'],
  'MANAGEMENT OF MYOCARDIAL INFARCTION: STEMI (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'ACUTE HEART FAILURE (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'ACUTE ISCHAEMIC STROKE (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'ANAPHYLAXIS IN THE ED (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'ASTHMA IN THE ED (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'APPROACH TO ATRIAL FIBRILLATION (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'COPD ED MANAGEMENT (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'COMMUNITY ACQUIRED PNEUMONIA (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'CRUSH INJURY (CMJAH)': ['13_ed_trauma_surgical', 'protocols'],
  'Deep Vein Thrombosis (DVT) (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Difficult Airway Approach (CMJAH)': ['15_ed_procedures', 'protocols'],
  'EPISTAXIS IN THE ED (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Gastroenteritis in Paediatrics (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'HYPERKALAEMIA = K + > 5.5mmol/l (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'HYPOKALAEMIA (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'HYPERNATRAEMIA (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'HYPONATRAEMIA (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'Hypertension in the ED (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Hyperglycaemic Emergencies (DKA/HHS) (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'Calcium Channel Blocker and Beta-Blocker Overdose (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'ISONIAZID (INH) OVERDOSE (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'PARACETAMOL OVERDOSE (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'PULMONARY EMBOLISM (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Renal Colic / Kidney Stones (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Scorpion envenomation guideline (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'Sepsis and Septic Shock in the ED (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'Snakebite Pathway (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'Status Epilepticus (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'SUBARACHNOID HAEMORRHAGE (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'The Agitated Patient (CMJAH)': ['11_ed_medical_emergencies', 'protocols'],
  'THYROID EMERGENCIES (CMJAH)': ['14_ed_metabolic', 'protocols'],
  'Toxic Alcohol Ingestion (CMJAH)': ['12_ed_toxicology', 'protocols'],
  'Tricyclic Antidepressant (TCA) Overdose (CMJAH)': ['12_ed_toxicology', 'protocols'],
};

function deriveCategory(archive: any): [string, string] {
  const title = archive.item ?? '';
  if (TITLE_CATEGORY_OVERRIDES[title]) return TITLE_CATEGORY_OVERRIDES[title];
  const hint = archive.categoryHint ?? '';
  if (hint === 'toxicology') return ['12_ed_toxicology', 'protocols'];
  if (hint === 'trauma') return ['13_ed_trauma_surgical', 'protocols'];
  if (hint === 'metabolic') return ['14_ed_metabolic', 'protocols'];
  if (hint === 'airway') return ['15_ed_procedures', 'protocols'];
  return ['11_ed_medical_emergencies', 'protocols'];
}

function deriveSlug(title: string, existingSlugs: Set<string>): string {
  const cleanTitle = title.replace(/\s*\(CMJAH\)\s*$/i, '').trim();
  const base = `${slugify(cleanTitle)}-cmjah`;
  if (!existingSlugs.has(base)) return base;
  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function main() {
  const existingSlugs = new Set(walk(ENTRIES_DIR).map(fp => path.basename(fp, '.json')));

  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(n => n.endsWith('.json'))
    .map(n => path.join(ARCHIVE_DIR, n))
    .sort();

  let created = 0;
  let skipped = 0;
  let pageOutOfRange = 0;
  const report: string[] = [];

  for (const filePath of files) {
    const archive: any = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!archive.item || !Array.isArray(archive.management_steps) || archive.management_steps.length === 0) {
      report.push(`SKIP (empty shell): ${path.basename(filePath)}`);
      skipped++;
      continue;
    }

    const title = archive.item;
    const rawPages = Array.isArray(archive.pdfPages) ? archive.pdfPages : [];
    const pdfPages = PAGE_CORRECTIONS[path.basename(filePath)] ?? rawPages;
    if (pdfPages.some((p: number) => p < 1 || p > PDF_PAGE_COUNT)) {
      pageOutOfRange++;
      report.push(`WARNING page out of range: ${title} -> ${JSON.stringify(pdfPages)}`);
    }

    const [categoryId, subcategoryId] = deriveCategory(archive);
    const slug = deriveSlug(title, existingSlugs);
    existingSlugs.add(slug);

    const {pdfPages: _pdfPages, sourceDoc: _sourceDoc, categoryHint: _categoryHint, review_state: _reviewState, ...record} = archive;

    const entry: CanonicalEntryFile = {
      categoryId,
      subcategoryId,
      slug,
      order: 4000,
      source: {
        sourceId: SOURCE_ID,
        pdfPages,
        sectionTitle: title.replace(/\s*\(CMJAH\)\s*$/i, '').trim(),
        transformation: 'condensed',
        verification: pdfPages.length > 0 ? 'page-index' : 'manual',
      },
      sourceGroup: SOURCE_GROUP,
      reviewState: 'unreviewed',
      errata: [],
      record,
    };

    const dir = path.join(ENTRIES_DIR, categoryId, subcategoryId);
    const outPath = path.join(dir, `${slug}.json`);
    if (WRITE) {
      fs.mkdirSync(dir, {recursive: true});
      fs.writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n');
    }
    created++;
    report.push(`CREATE ${path.basename(filePath)} -> ${categoryId}/${subcategoryId}/${slug}.json (pages: ${JSON.stringify(pdfPages)})`);
  }

  console.log(report.join('\n'));
  console.log(`\nSummary: ${created} created, ${skipped} skipped (empty shells), ${pageOutOfRange} page-range warnings`);
  if (!WRITE) console.log('(dry run - pass --write to apply)');
}

main();
