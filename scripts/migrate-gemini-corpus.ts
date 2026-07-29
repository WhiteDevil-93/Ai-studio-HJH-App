// One-time migration script: converts src/data.json (legacy monolith) and the
// vendored Gemini transcription corpus (clinical-sources/raw/gemini-2026-07/)
// into the per-entry file corpus under src/clinical/entries/.
//
// Not part of `npm run check` - run manually, once, per mode:
//   node --import tsx scripts/migrate-gemini-corpus.ts --mode=legacy-only --write
//   node --import tsx scripts/migrate-gemini-corpus.ts --mode=import-corpus --write
// Omit --write to dry-run (prints the report only, writes nothing).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {legacyTitle, slugify, type CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';
import {sourceReferencesFor} from '../src/clinical/sourceRegistry.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const CORPUS_DIR = path.join(ROOT, 'clinical-sources/raw/gemini-2026-07');
const CMJAH_PAGE_INDEX = path.join(ROOT, 'cmjah_page_index.txt');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const MODE = [...args].find(a => a.startsWith('--mode='))?.split('=')[1] ?? '';
if (MODE !== 'legacy-only' && MODE !== 'import-corpus') {
  console.error('Usage: --mode=legacy-only|import-corpus [--write]');
  process.exit(1);
}

const SINGLETON_CATEGORIES = new Set(['16_score_calculators']);

const report: string[] = ['# Migration report', ''];
const log = (line: string) => report.push(line);

function writeEntry(file: CanonicalEntryFile): string {
  // Singleton categories (score calculators) are flat: entries/<categoryId>/<slug>.json.
  // Every other category is 3-level: entries/<categoryId>/<subcategoryId>/<slug>.json.
  const dir = SINGLETON_CATEGORIES.has(file.categoryId)
    ? path.join(ENTRIES_DIR, file.categoryId)
    : path.join(ENTRIES_DIR, file.categoryId, file.subcategoryId);
  const filePath = path.join(dir, `${file.slug}.json`);
  if (WRITE) {
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(filePath, JSON.stringify(file, null, 2) + '\n');
  }
  return filePath;
}

// ---------------------------------------------------------------------------
// Mode: legacy-only - convert data.json into per-entry files, unchanged content.
// ---------------------------------------------------------------------------

const CATEGORY_REASSIGNMENTS = [
  '12_ed_toxicology',
  '13_ed_trauma_surgical',
  '14_ed_metabolic',
  '15_ed_procedures',
] as const;

const cmjahPageRefs: Record<string, number[]> = {
  'Sepsis and Septic Shock (CMJAH)': [114, 115, 116],
  'Status Epilepticus (CMJAH)': [119, 120],
  'Anaphylaxis (CMJAH)': [31],
  'Scorpion Envenomation (CMJAH)': [113],
  'Snakebite Pathway (CMJAH)': [117, 118],
  'Hyperglycaemic Emergencies (DKA/HHS) (CMJAH)': [69],
};

function deriveLegacySource(title: string) {
  const cmjahPages = cmjahPageRefs[title];
  if (cmjahPages) {
    return {
      sourceId: 'cmjah-ed-protocols-2020-v2',
      pdfPages: cmjahPages,
      sectionTitle: title,
      transformation: 'condensed' as const,
      verification: 'page-index' as const,
    };
  }
  const [ref] = sourceReferencesFor(title);
  return {
    sourceId: ref.sourceId,
    pdfPages: ref.pdfPages,
    sectionTitle: ref.sectionTitle,
    transformation: ref.transformation,
    verification: ref.sourceId === 'source-unresolved' ? ('unverifiable' as const) : ('preview' as const),
  };
}

function deriveLegacySourceGroup(categoryId: string, source: ReturnType<typeof deriveLegacySource>, cmjahMatched: boolean): CanonicalEntryFile['sourceGroup'] {
  if (cmjahMatched) return 'cmjah';
  if (source.sourceId === 'hjh-ed-2026-v1') return 'hjth';
  if (
    categoryId.startsWith('11_ed_') || categoryId.startsWith('12_ed_') ||
    categoryId.startsWith('13_ed_') || categoryId.startsWith('14_ed_') ||
    categoryId.startsWith('15_ed_')
  ) return 'edl_phc';
  return 'bara_icu';
}

function runLegacyOnly() {
  const legacyData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data.json'), 'utf8'));
  const medicalEmergencies = legacyData['11_ed_medical_emergencies'];
  for (const categoryId of CATEGORY_REASSIGNMENTS) {
    const nested = medicalEmergencies[categoryId];
    if (nested && !Array.isArray(nested) && typeof nested === 'object') {
      legacyData[categoryId] = nested;
    }
    delete medicalEmergencies[categoryId];
  }

  let written = 0;
  const singletonNormalized: string[] = [];

  for (const [categoryId, category] of Object.entries(legacyData) as [string, Record<string, unknown>][]) {
    if (categoryId === '16_score_calculators') {
      let order = 0;
      for (const [calcKey, calc] of Object.entries(category as Record<string, unknown>)) {
        const file: CanonicalEntryFile = {
          categoryId, subcategoryId: calcKey, slug: calcKey, order: order++,
          source: {sourceId: 'source-unresolved', pdfPages: [], sectionTitle: calcKey, transformation: 'combined', verification: 'unverifiable'},
          sourceGroup: 'bara_icu', reviewState: 'unreviewed', errata: [],
          record: calc as Record<string, unknown>,
        };
        writeEntry(file);
        written++;
      }
      continue;
    }

    for (const [subcategoryId, rawValue] of Object.entries(category)) {
      let value = rawValue;
      if (!Array.isArray(value)) {
        // Singleton subcategory (e.g. 1_resuscitation_fluids_and_inotropes.targets)
        // - normalize to a 1-element array so every non-score category is array-valued.
        singletonNormalized.push(`${categoryId}.${subcategoryId}`);
        value = [value];
      }
      const records = value as Record<string, unknown>[];
      const seen = new Map<string, number>();

      records.forEach((record, index) => {
        const title = legacyTitle(record as never);
        if (!title) return;
        const count = seen.get(title) ?? 0;
        seen.set(title, count + 1);
        const slug = count > 0 ? `${slugify(title)}-${count + 1}` : slugify(title);

        const source = deriveLegacySource(title);
        const cmjahMatched = Boolean(cmjahPageRefs[title]);
        const sourceGroup = deriveLegacySourceGroup(categoryId, source, cmjahMatched);

        const file: CanonicalEntryFile = {
          categoryId, subcategoryId, slug, order: index,
          source, sourceGroup, reviewState: 'unreviewed', errata: [],
          record,
        };
        writeEntry(file);
        written++;
      });
    }
  }

  log(`## legacy-only mode`);
  log(`Wrote ${written} entry files from data.json.`);
  log(`Singleton subcategories normalized to arrays: ${singletonNormalized.join(', ') || '(none)'}`);
}

// ---------------------------------------------------------------------------
// Mode: import-corpus - map the vendored Gemini corpus into entry files.
// ---------------------------------------------------------------------------

interface SchemaAFile {
  sourceDoc: string;
  pdfPages: number[];
  item: string;
  categoryHint: string;
  protocol_type: string;
  review_state?: string;
  clinical_features?: unknown;
  management_steps?: {step_number: string; action: string; details: string}[];
  warnings?: string[];
}

const SOURCE_BY_DOC: Record<string, {sourceId: string; sourceGroup: CanonicalEntryFile['sourceGroup']}> = {
  RMMCH: {sourceId: 'rmmch-paediatric-protocols', sourceGroup: 'rmmch'},
  CMJAH: {sourceId: 'cmjah-ed-protocols-2020-v2', sourceGroup: 'cmjah'},
  CHBAH_ICU: {sourceId: 'chbah-icu-dosing-card-2024', sourceGroup: 'chbah'},
  EDL_PHC: {sourceId: 'sa-edl-phc-2020', sourceGroup: 'edl_phc'},
};

// categoryHint -> [categoryId, subcategoryId], keyed by (sourceDoc, protocol_type, hint).
const ED_PROTOCOL_MAP: Record<string, [string, string]> = {
  resuscitation: ['11_ed_medical_emergencies', 'protocols'],
  medical_emergencies: ['11_ed_medical_emergencies', 'protocols'],
  cardiovascular: ['11_ed_medical_emergencies', 'protocols'],
  neurology: ['11_ed_medical_emergencies', 'protocols'],
  toxicology: ['12_ed_toxicology', 'protocols'],
  trauma: ['13_ed_trauma_surgical', 'protocols'],
  surgical_emergencies: ['13_ed_trauma_surgical', 'protocols'],
  metabolic: ['14_ed_metabolic', 'protocols'],
  airway: ['15_ed_procedures', 'protocols'],
  dental: ['17_phc_primary_care', 'dental_and_oral'],
  dermatology: ['17_phc_primary_care', 'dermatology'],
  pediatrics: ['17_phc_primary_care', 'dental_and_oral'],
  infectious: ['17_phc_primary_care', 'dental_and_oral'],
};

const ED_PROTOCOL_TITLE_OVERRIDES: Record<string, [string, string]> = {
  'Croup (Laryngotracheobronchitis) (RMMCH)': ['11_ed_medical_emergencies', 'protocols'],
  'Advanced Airway Management (RMMCH)': ['15_ed_procedures', 'protocols'],
  'Difficult Airway Approach (CMJAH)': ['15_ed_procedures', 'protocols'],
};

const ICU_DOSING_MAP: Record<string, [string, string]> = {
  antimicrobials: ['4_antimicrobials_and_infectious_diseases', 'icu_dosing'],
  sedation: ['3_sedation_analgesia_and_neurology', 'icu_dosing'],
  metabolic: ['5_metabolic_electrolytes_and_nutrition', 'icu_dosing'],
  resuscitation: ['1_resuscitation_fluids_and_inotropes', 'inotropes'],
  cardiovascular: ['8_cardiovascular', 'icu_dosing'],
  airway: ['2_airway_and_ventilation', 'icu_dosing'],
  neurology: ['3_sedation_analgesia_and_neurology', 'seizures'],
};

const EDL_MAP: Record<string, [string, string]> = {
  antimicrobials: ['4_antimicrobials_and_infectious_diseases', 'edl_phc'],
  cardiovascular: ['8_cardiovascular', 'edl_phc'],
  metabolic: ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  dermatology: ['17_phc_primary_care', 'dermatology'],
  resuscitation: ['1_resuscitation_fluids_and_inotropes', 'edl_phc'],
  blood_products: ['9_blood_products', 'edl_phc'],
};

// The EDL 'dosing' catch-all hint - explicit per-title table (19 entries).
const EDL_DOSING_OVERRIDES: Record<string, [string, string]> = {
  'Amethocaine (EDL)': ['3_sedation_analgesia_and_neurology', 'edl_phc'],
  'Tetracaine (EDL)': ['3_sedation_analgesia_and_neurology', 'edl_phc'],
  'Lidocaine (EDL)': ['3_sedation_analgesia_and_neurology', 'edl_phc'],
  'Lidocaine with adrenaline (epinephrine) (EDL)': ['3_sedation_analgesia_and_neurology', 'edl_phc'],
  'Paracetamol (EDL)': ['3_sedation_analgesia_and_neurology', 'edl_phc'],
  'Lactulose (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Loperamide (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Sennosides A and B (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Metoclopramide (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Pantoprazole (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Hyoscine butylbromide (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Bismuth subgallate compound (EDL)': ['5_metabolic_electrolytes_and_nutrition', 'edl_phc'],
  'Cetirizine (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Chlorphenamine (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Promethazine (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Aqueous cream (UEA) (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Emulsifying ointment (UE) (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Calamine lotion (EDL)': ['17_phc_primary_care', 'phc_general'],
  'Oxytocin (EDL)': ['10_endocrine_and_other', 'edl_phc'],
};

// Two corpus files that are near-duplicates of already-existing, page-verified
// legacy entries under a different title (so they wouldn't collide by slug).
// Keep the legacy version (carried forward from --mode=legacy-only); skip these.
const CMJAH_SKIP_NEAR_DUPLICATES = new Set([
  'Scorpion envenomation guideline (CMJAH)',
  'Sepsis and Septic Shock in the ED (CMJAH)',
]);

function mapCategory(file: SchemaAFile): [string, string] | undefined {
  if (ED_PROTOCOL_TITLE_OVERRIDES[file.item]) return ED_PROTOCOL_TITLE_OVERRIDES[file.item];
  if (file.protocol_type === 'ed_protocol') return ED_PROTOCOL_MAP[file.categoryHint];
  if (file.sourceDoc === 'CHBAH_ICU') return ICU_DOSING_MAP[file.categoryHint];
  if (file.sourceDoc === 'EDL_PHC') {
    if (file.categoryHint === 'dosing') return EDL_DOSING_OVERRIDES[file.item];
    return EDL_MAP[file.categoryHint];
  }
  return undefined;
}

// Dose-field synthesis for non-protocol Schema-A entries (CHBAH icu_dosing,
// EDL drug_entry/weight_based_dose/continuous_infusion): their content lives
// entirely in management_steps, but renderDrugCard reads adult_dose /
// paediatric_dose / notes_updates / standard_dilutions - without this, these
// entries would render as empty cards and be invisible to the weight/infusion
// calculators.
const ADULT_PAED = /\bAdult\s*[:.]?\s*(.+?)[;.]\s*Paediatric\s*[:.]?\s*(.+)$/i;

function synthesizeDoseFields(steps: SchemaAFile['management_steps']): Record<string, string> {
  const prep: string[] = [];
  const dose: string[] = [];
  const notes: string[] = [];

  for (const step of steps ?? []) {
    const action = (step.action ?? '').trim();
    const details = (step.details ?? '').trim();
    if (!details) continue;
    const a = action.toLocaleLowerCase();
    if (/prepar|strength|dilution/.test(a)) {
      prep.push(details);
    } else if (/monitor|^notes?$/.test(a)) {
      notes.push(details);
    } else if (/maximum/.test(a)) {
      notes.push(`Maximum dose: ${details}`);
    } else if (action) {
      dose.push(`${action}: ${details}`);
    } else {
      dose.push(details);
    }
  }

  const out: Record<string, string> = {};
  if (prep.length) out.standard_dilutions = prep.join(' ');
  if (notes.length) out.notes_updates = notes.join(' ');

  const doseText = dose.join(' ');
  const split = doseText.match(ADULT_PAED);
  if (split) {
    out.adult_dose = split[1].trim();
    out.paediatric_dose = split[2].trim();
  } else if (doseText) {
    out.adult_dose = doseText;
  }
  return out;
}

function loadCmjahPageIndex(): Map<number, string> {
  const text = fs.readFileSync(CMJAH_PAGE_INDEX, 'utf8');
  const pages = new Map<number, string>();
  const parts = text.split(/=====\s*PAGE\s+(\d+)\s*=====/);
  for (let i = 1; i < parts.length; i += 2) {
    pages.set(Number(parts[i]), parts[i + 1] ?? '');
  }
  return pages;
}

// Manually verified against cmjah_page_index.txt for corpus entries with no
// existing app counterpart (so no fallback in cmjahPageRefs) whose corpus
// pdfPages failed the keyword check - see clinical-sources/migration-report.md.
const CMJAH_VERIFIED_CORRECTIONS: Record<string, number[]> = {
  'Subarachnoid Haemorrhage (CMJAH)': [121],
  'The Agitated Patient (CMJAH)': [131],
  'Thyroid Emergencies (CMJAH)': [133, 134],
  'Toxic Alcohol Ingestion (CMJAH)': [135],
  'Tricyclic Antidepressant (TCA) Overdose (CMJAH)': [143],
};

const STOPWORDS = new Set(['CMJAH', 'the', 'and', 'for', 'with', 'guideline', 'pathway', 'management']);

function titleTokens(title: string): string[] {
  return title
    .replace(/\(CMJAH\)/gi, '')
    .split(/[^a-zA-Z]+/)
    .filter(t => t.length >= 4 && !STOPWORDS.has(t));
}

function verifyCmjahPages(
  title: string,
  pdfPages: number[],
  pageIndex: Map<number, string>,
): {pages: number[]; verification: CanonicalEntryFile['source']['verification']; note?: string} {
  const known = cmjahPageRefs[title];
  const tokens = titleTokens(title).map(t => t.toLocaleLowerCase());

  const pagesContainToken = (pages: number[]) => {
    const text = pages.map(p => pageIndex.get(p) ?? '').join(' ').toLocaleLowerCase();
    return tokens.some(t => text.includes(t));
  };

  if (pagesContainToken(pdfPages)) {
    return {pages: pdfPages, verification: 'page-index'};
  }
  const fallback = known ?? CMJAH_VERIFIED_CORRECTIONS[title];
  if (fallback) {
    return {
      pages: fallback,
      verification: 'manual',
      note: `corrected pdfPages for "${title}": corpus said ${JSON.stringify(pdfPages)}, verified pages are ${JSON.stringify(fallback)}`,
    };
  }
  return {
    pages: pdfPages,
    verification: 'manual',
    note: `UNVERIFIED pdfPages for "${title}": ${JSON.stringify(pdfPages)} - no title keyword found on those pages in cmjah_page_index.txt; needs manual page lookup`,
  };
}

function walkCorpus(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkCorpus(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

// Index every already-written entry file by slug -> categoryId, so a corpus
// file that maps to a different category than an existing (legacy-derived or
// already-imported) entry with the same slug can be detected as a duplicate
// of the same clinical topic rather than silently creating a second card.
function indexExistingSlugs(): Map<string, string> {
  const bySlug = new Map<string, string>();
  if (!fs.existsSync(ENTRIES_DIR)) return bySlug;
  for (const filePath of walkCorpus(ENTRIES_DIR)) {
    const existing: CanonicalEntryFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    bySlug.set(existing.slug, existing.categoryId);
  }
  return bySlug;
}

function runImportCorpus() {
  const pageIndex = loadCmjahPageIndex();
  const orderCounters = new Map<string, number>();
  const existingSlugs = indexExistingSlugs();
  let written = 0;
  let skipped = 0;
  const unmapped: string[] = [];
  const corrections: string[] = [];

  const files = walkCorpus(CORPUS_DIR).filter(f =>
    !f.includes(`${path.sep}reference${path.sep}`) && !f.includes(`${path.sep}HJH${path.sep}`),
  );

  for (const filePath of files.sort()) {
    const raw: SchemaAFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (CMJAH_SKIP_NEAR_DUPLICATES.has(raw.item)) {
      skipped++;
      log(`- Skipped near-duplicate corpus entry (legacy version kept): "${raw.item}"`);
      continue;
    }

    const mapped = mapCategory(raw);
    if (!mapped) {
      unmapped.push(`${path.relative(CORPUS_DIR, filePath)}: sourceDoc=${raw.sourceDoc} hint=${raw.categoryHint} item="${raw.item}"`);
      continue;
    }
    const [categoryId, subcategoryId] = mapped;
    const slug = slugify(raw.item);

    const existingCategoryId = existingSlugs.get(slug);
    if (existingCategoryId !== undefined && existingCategoryId !== categoryId) {
      skipped++;
      log(`- Skipped cross-category duplicate: "${raw.item}" already exists under ${existingCategoryId}, corpus mapped it to ${categoryId} - kept the existing entry, no new one written`);
      continue;
    }

    const bucketKey = `${categoryId}.${subcategoryId}`;
    const order = 1000 + (orderCounters.get(bucketKey) ?? 0);
    orderCounters.set(bucketKey, (orderCounters.get(bucketKey) ?? 0) + 1);

    const doc = SOURCE_BY_DOC[raw.sourceDoc];
    if (!doc) {
      unmapped.push(`${path.relative(CORPUS_DIR, filePath)}: unknown sourceDoc "${raw.sourceDoc}"`);
      continue;
    }

    let pdfPages = raw.pdfPages ?? [];
    let verification: CanonicalEntryFile['source']['verification'] = 'unverifiable';
    let transformation: CanonicalEntryFile['source']['transformation'] = 'condensed';

    if (raw.sourceDoc === 'CMJAH') {
      const verified = verifyCmjahPages(raw.item, pdfPages, pageIndex);
      pdfPages = verified.pages;
      verification = verified.verification;
      if (verified.note) corrections.push(verified.note);
    } else if (raw.sourceDoc === 'CHBAH_ICU') {
      pdfPages = [];
      transformation = 'externally-sourced';
      verification = 'unverifiable';
    }

    const record: Record<string, unknown> = {
      item: raw.item,
      protocol_type: raw.protocol_type,
      clinical_features: raw.clinical_features,
      management_steps: raw.management_steps,
      warnings: raw.warnings ?? [],
    };

    if (raw.protocol_type !== 'ed_protocol') {
      Object.assign(record, synthesizeDoseFields(raw.management_steps));
    }

    const file: CanonicalEntryFile = {
      categoryId, subcategoryId, slug, order,
      source: {
        sourceId: doc.sourceId,
        pdfPages,
        sectionTitle: raw.item,
        transformation,
        verification,
      },
      sourceGroup: doc.sourceGroup,
      reviewState: (raw.review_state as CanonicalEntryFile['reviewState']) ?? 'unreviewed',
      errata: [],
      record,
    };

    writeEntry(file);
    written++;
  }

  log(`## import-corpus mode`);
  log(`Wrote ${written} entry files from the corpus (${skipped} near-duplicates skipped).`);
  log('');
  log(`### Unmapped files (${unmapped.length})`);
  unmapped.forEach(u => log(`- ${u}`));
  log('');
  log(`### CMJAH page-citation corrections/flags (${corrections.length})`);
  corrections.forEach(c => log(`- ${c}`));
}

if (MODE === 'legacy-only') runLegacyOnly();
else runImportCorpus();

const reportPath = path.join(ROOT, 'clinical-sources/migration-report.md');
if (WRITE) {
  const existing = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') + '\n' : '';
  fs.writeFileSync(reportPath, existing + report.join('\n') + '\n');
}
console.log(report.join('\n'));
if (!WRITE) console.log('\n(dry run - pass --write to actually write files)');
