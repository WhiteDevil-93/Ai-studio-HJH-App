// RMMCH archive import script (isolated mode).
// Creates a new canonical entry for every content-bearing rmmch-*.json file,
// even if a same-title entry from another source already exists. Each
// hospital's protocol remains independent.
//
// Run:
//   node --import tsx scripts/import-rmmch-archive.ts [--write]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {slugify, type CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const ARCHIVE_DIR = path.join(ROOT, 'clinical-sources/raw/all_hospitals_protocols/RMMCH');
const WRITE = process.argv.includes('--write');

const SOURCE_ID = 'rmmch-paediatric-protocols';
const SOURCE_GROUP: CanonicalEntryFile['sourceGroup'] = 'rmmch';
const PDF_PAGE_COUNT = 200;

// Category mapping based on title keywords / categoryHint.
const TITLE_CATEGORY_OVERRIDES: Record<string, [string, string]> = {
  'Airway management - advanced (RMMCH)': ['15_ed_procedures', 'protocols'],
  'Analgesia (RMMCH)': ['3_sedation_analgesia_and_neurology', 'protocols'],
  'Animal / Mammalian Bites (RMMCH)': ['12_ed_toxicology', 'protocols'],
  'Advanced Cardiac Arrest Algorithm Adult and Paediatric (RMMCH)': ['1_resuscitation_fluids_and_inotropes', 'protocols'],
  'Neonatal Resuscitation (RMMCH)': ['1_resuscitation_fluids_and_inotropes', 'protocols'],
  'Tetanus Prophylaxis Protocol (RMMCH)': ['4_antimicrobials_and_infectious_diseases', 'protocols'],
  'Trauma Cardiac Arrest Algorithm (RMMCH)': ['13_ed_trauma_surgical', 'protocols'],
};

function deriveCategory(archive: any): [string, string] {
  const title = archive.item ?? '';
  if (TITLE_CATEGORY_OVERRIDES[title]) return TITLE_CATEGORY_OVERRIDES[title];
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('trauma')) return ['13_ed_trauma_surgical', 'protocols'];
  if (lowerTitle.includes('resuscitation') || lowerTitle.includes('cardiac arrest') || lowerTitle.includes('rosc')) return ['1_resuscitation_fluids_and_inotropes', 'protocols'];
  if (lowerTitle.includes('tetanus') || lowerTitle.includes('rabies') || lowerTitle.includes('meningococcal')) return ['4_antimicrobials_and_infectious_diseases', 'protocols'];
  if (lowerTitle.includes('airway') || lowerTitle.includes('rsi') || lowerTitle.includes('intubation')) return ['15_ed_procedures', 'protocols'];
  if (lowerTitle.includes('analgesia') || lowerTitle.includes('sedation')) return ['3_sedation_analgesia_and_neurology', 'protocols'];
  if (lowerTitle.includes('toxidrome') || lowerTitle.includes('overdose') || lowerTitle.includes('bite')) return ['12_ed_toxicology', 'protocols'];
  return ['11_ed_medical_emergencies', 'protocols'];
}

function deriveSlug(title: string, existingSlugs: Set<string>): string {
  const cleanTitle = title.replace(/\s*\(RMMCH\)\s*$/i, '').trim();
  const base = `${slugify(cleanTitle)}-rmmch`;
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
  const allFiles = walk(ENTRIES_DIR);
  const existingSlugs = new Set(allFiles.map(fp => path.basename(fp, '.json')));

  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(n => n.endsWith('.json') && n.startsWith('rmmch-'))
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
    const pdfPages = Array.isArray(archive.pdfPages) ? archive.pdfPages : [];
    if (pdfPages.some((p: number) => p < 1 || p > PDF_PAGE_COUNT)) {
      pageOutOfRange++;
      report.push(`WARNING page out of range: ${title} -> ${JSON.stringify(pdfPages)}`);
    }

    const [categoryId, subcategoryId] = deriveCategory(archive);
    const slug = deriveSlug(title, existingSlugs);
    existingSlugs.add(slug);

    const {pdfPages: _pdfPages, sourceDoc: _sourceDoc, categoryHint: _categoryHint, ...record} = archive;

    const entry: CanonicalEntryFile = {
      categoryId,
      subcategoryId,
      slug,
      order: 3000,
      source: {
        sourceId: SOURCE_ID,
        pdfPages,
        sectionTitle: title.replace(/\s*\(RMMCH\)\s*$/i, '').trim(),
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
