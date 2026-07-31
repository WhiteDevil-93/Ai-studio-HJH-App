// Phase 2: Import every protocol from clinical-sources/raw/all_hospitals_protocols/HJH
// into src/clinical/entries/, mapping the archive's schema to the canonical entry
// envelope and assigning HJH source provenance with verified page citations.
//
// Run:
//   node --import tsx scripts/import-hjh-archive.ts [--write]
import fs from 'node:fs';
import path from 'path';
import {fileURLToPath} from 'node:url';
import {slugify, type CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const ARCHIVE_DIR = path.join(ROOT, 'clinical-sources/raw/all_hospitals_protocols/HJH');
const PAGE_INDEX = path.join(ROOT, 'pdf_page_index.txt');
const WRITE = process.argv.includes('--write');

interface ArchiveMeta {
  id: string;
  type: 'protocol' | 'procedure' | 'reference';
  category: string;
  subcategory: string;
  title: string;
  source_doc: string;
  review_state?: string;
}

interface ArchiveFile {
  _meta: ArchiveMeta;
  protocol: Record<string, unknown>;
}

// Map archive _meta.category values to the application's 17 canonical categories.
const ARCHIVE_CATEGORY_MAP: Record<string, [string, string]> = {
  '02_ed_trauma_ortho': ['13_ed_trauma_surgical', 'protocols'],
  '03_ed_cardiovascular': ['11_ed_medical_emergencies', 'protocols'],
  '04_ed_neurology': ['11_ed_medical_emergencies', 'protocols'],
  '05_ed_pulmonary': ['11_ed_medical_emergencies', 'protocols'],
  '06_ed_airway': ['15_ed_procedures', 'protocols'],
  '07_ed_ent': ['15_ed_procedures', 'protocols'],
  '08_ed_obstetrics_gynaecology': ['11_ed_medical_emergencies', 'protocols'],
  '10_ed_procedure': ['15_ed_procedures', 'protocols'],
  '11_ed_medical_emergencies': ['11_ed_medical_emergencies', 'protocols'],
  '12_ed_toxicology': ['12_ed_toxicology', 'protocols'],
  '13_ed_infectious_diseases': ['4_antimicrobials_and_infectious_diseases', 'protocols'],
  '13_ed_trauma_surgical': ['13_ed_trauma_surgical', 'protocols'],
  '14_ed_metabolic': ['14_ed_metabolic', 'protocols'],
  '14_ed_psychiatry': ['11_ed_medical_emergencies', 'protocols'],
  '15_ed_general_surgery': ['11_ed_medical_emergencies', 'protocols'],
  '16_ed_administration': ['15_ed_procedures', 'protocols'],
  '17_ed_critical_care': ['11_ed_medical_emergencies', 'protocols'],
};

// Per-title overrides when the archive's own category is too coarse.
const TITLE_OVERRIDES: Record<string, [string, string]> = {
  'Acetylcholinesterase Inhibitor (Ache-I) Overdose': ['12_ed_toxicology', 'protocols'],
  'AHA Resuscitation Algorithms 2020': ['11_ed_medical_emergencies', 'protocols'],
  'Airway Management Checklist & RSI': ['15_ed_procedures', 'protocols'],
  'Back Pain in the ED': ['13_ed_trauma_surgical', 'protocols'],
  'Blood and Blood Products': ['9_blood_products', 'products'],
  'Brainstem Death Testing': ['15_ed_procedures', 'protocols'],
  'Burns': ['13_ed_trauma_surgical', 'protocols'],
  'C-Spine Imaging in Trauma': ['13_ed_trauma_surgical', 'protocols'],
  'Calcium Channel Blocker and Beta-Blocker Overdose': ['12_ed_toxicology', 'protocols'],
  'Community Acquired Pneumonia': ['11_ed_medical_emergencies', 'protocols'],
  'Crush Injury & Syndrome': ['13_ed_trauma_surgical', 'protocols'],
  'Deep Vein Thrombosis (DVT)': ['11_ed_medical_emergencies', 'protocols'],
  'ENT Emergencies': ['15_ed_procedures', 'protocols'],
  'Femoral Nerve Block': ['15_ed_procedures', 'protocols'],
  'First Onset Seizures': ['11_ed_medical_emergencies', 'protocols'],
  'Gastroenteritis in Paediatrics': ['11_ed_medical_emergencies', 'protocols'],
  'General Management Principles of a Poisoned Patient': ['12_ed_toxicology', 'protocols'],
  'Haematological Emergencies': ['11_ed_medical_emergencies', 'protocols'],
  'Head Injury: general management, radiography, GCS, DC advice sheet': ['13_ed_trauma_surgical', 'protocols'],
  'Hyperglycaemia Flowchart': ['11_ed_medical_emergencies', 'protocols'],
  'Hyperkalaemia': ['5_metabolic_electrolytes_and_nutrition', 'hyperkalaemia_management'],
  'Hypokalaemia': ['5_metabolic_electrolytes_and_nutrition', 'electrolyte_replacement'],
  'Hypernatraemia': ['5_metabolic_electrolytes_and_nutrition', 'electrolyte_replacement'],
  'Hyponatraemia': ['5_metabolic_electrolytes_and_nutrition', 'electrolyte_replacement'],
  'Hyperthermia': ['14_ed_metabolic', 'protocols'],
  'Hypothermia': ['14_ed_metabolic', 'protocols'],
  'Hypoglycaemia': ['14_ed_metabolic', 'protocols'],
  'Indications for Dialysis': ['14_ed_metabolic', 'protocols'],
  'Infusions': ['1_resuscitation_fluids_and_inotropes', 'inotropes'],
  'Intermediate and Low Risk Chest Pain Management': ['11_ed_medical_emergencies', 'protocols'],
  'Jaundice Flowchart': ['14_ed_metabolic', 'protocols'],
  'Liver Failure': ['14_ed_metabolic', 'protocols'],
  'Meningococcal Prophylaxis': ['4_antimicrobials_and_infectious_diseases', 'protocols'],
  'Mental Health / Psychosis': ['11_ed_medical_emergencies', 'protocols'],
  'Non-Invasive Ventilation (NIV)': ['2_airway_and_ventilation', 'niv'],
  'NSTE-ACS / NSTEMI Management': ['11_ed_medical_emergencies', 'protocols'],
  'Oncological Emergencies': ['11_ed_medical_emergencies', 'protocols'],
  'Ophthalmology Emergencies': ['15_ed_procedures', 'protocols'],
  'Pain Management in the ED': ['3_sedation_analgesia_and_neurology', 'protocols'],
  'Paracetamol Overdose': ['12_ed_toxicology', 'protocols'],
  'PE Algorithm': ['11_ed_medical_emergencies', 'protocols'],
  'Post Exposure Prophylaxis (PEP)': ['4_antimicrobials_and_infectious_diseases', 'protocols'],
  'Procedural Sedation & Analgesia': ['15_ed_procedures', 'protocols'],
  'Pulmonary Embolism': ['11_ed_medical_emergencies', 'protocols'],
  'Rabies / Animal Bites': ['12_ed_toxicology', 'protocols'],
  'Raised ICP': ['11_ed_medical_emergencies', 'protocols'],
  'Renal Colic': ['13_ed_trauma_surgical', 'protocols'],
  'Salicylate Overdose': ['12_ed_toxicology', 'protocols'],
  'Scorpion Envenomation': ['12_ed_toxicology', 'protocols'],
  'Sexual Assault': ['11_ed_medical_emergencies', 'protocols'],
  'Snakebite': ['12_ed_toxicology', 'protocols'],
  'Status Epilepticus': ['11_ed_medical_emergencies', 'protocols'],
  'Status Epilepsy Anticonvulsant Therapy Algorithm': ['11_ed_medical_emergencies', 'protocols'],
  'Subarachnoid Haemorrhage': ['11_ed_medical_emergencies', 'protocols'],
  'Syncope': ['11_ed_medical_emergencies', 'protocols'],
  'Syncope ECG': ['11_ed_medical_emergencies', 'protocols'],
  'Tetanus': ['4_antimicrobials_and_infectious_diseases', 'protocols'],
  'Thyroid Emergencies': ['14_ed_metabolic', 'protocols'],
  'Toxic Alcohol Ingestion': ['12_ed_toxicology', 'protocols'],
  'Toxidromes': ['12_ed_toxicology', 'protocols'],
  'Trauma Basics & Pearls': ['13_ed_trauma_surgical', 'protocols'],
  'Triage: TEWS Calculator': ['15_ed_procedures', 'protocols'],
  'Ventilator Guidelines': ['15_ed_procedures', 'protocols'],
};

// Verified page citations against pdf_page_index.txt.
// Empty arrays are used when the topic is not present in the HJH TOC (e.g. content
// extracted from an algorithm image or from a neighbouring document); these entries
// remain incorporated but unpage-mapped, which the validator allows for HJH.
// Explicit slug overrides for cleaner filenames.
const SLUG_OVERRIDES: Record<string, string> = {
  rabies_animal_bites: 'rabies-animal-bites',
  raised_icp: 'raised-icp-hjh',
  status_epilepticus_algorithm: 'status-epilepticus-algorithm',
  stemi_management: 'stemi-management-hjh',
  toxic_alcohol: 'toxic-alcohol-ingestion',
  toxidromes: 'toxidromes',
  trauma_basics: 'trauma-basics-pearls',
  triage_tews: 'triage-tews-calculator',
  ventilator_guidelines: 'ventilator-guidelines-hjh',
  warfarin_toxicity: 'warfarin-toxicity-hjh',
  acute_appendicitis: 'acute-appendicitis-hjh',
  blood_products: 'blood-products-hjh',
  brainstem_death: 'brainstem-death-testing',
  c_spine_imaging: 'c-spine-imaging-trauma',
  critical_care_principles: 'critical-care-principles',
  ent_emergencies: 'ent-emergencies-hjh',
  haematological_emergencies: 'haematological-emergencies-hjh',
  head_injury: 'head-injury-hjh',
  hyperglycaemia_flowchart: 'hyperglycaemia-flowchart',
  hyperkalaemia: 'hyperkalaemia-hjh',
  hypernatraemia: 'hypernatraemia-hjh',
  hypertension_flowchart: 'hypertension-flowchart-hjh',
  hypertensive_emergencies: 'hypertensive-emergencies-hjh',
  hypokalaemia: 'hypokalaemia-hjh',
  hyponatraemia: 'hyponatraemia-hjh',
  hypothermia: 'hypothermia-hjh',
  indications_dialysis: 'indications-for-dialysis',
  intermediate_low_risk_chest_pain: 'intermediate-low-risk-chest-pain-hjh',
  jaundice_flowchart: 'jaundice-flowchart',
  liver_failure: 'liver-failure-hjh',
  meningococcal_prophylaxis: 'meningococcal-prophylaxis-hjh',
  mental_health_psychosis: 'mental-health-psychosis',
  non_invasive_ventilation: 'non-invasive-ventilation-hjh',
  nstemi_management: 'nstemi-management-hjh',
  oncological_emergencies: 'oncological-emergencies-hjh',
  ophthalmology_emergencies: 'ophthalmology-emergencies-hjh',
  pain_management: 'pain-management-hjh',
  paracetamol_nomogram: 'paracetamol-nomogram-hjh',
  paracetamol_overdose: 'paracetamol-overdose-hjh',
  pe_algorithm: 'pe-algorithm-hjh',
  post_exposure_prophylaxis: 'post-exposure-prophylaxis-hjh',
  pulmonary_embolism: 'pulmonary-embolism-hjh',
  renal_colic: 'renal-colic-kidney-stones-hjh',
  salicylate_overdose: 'salicylate-overdose-hjh',
  scorpion_envenomation: 'scorpion-envenomation-hjh',
  sexual_assault: 'sexual-assault-protocol',
  snakebite: 'snakebite-pathway-emct-hjh',
  status_epilepticus: 'status-epilepticus-hjh',
  subarachnoid_haemorrhage: 'subarachnoid-haemorrhage-hjh',
  syncope: 'syncope-hjh',
  syncope_ecg: 'syncope-ecg-causes',
  tca_overdose: 'tricyclic-antidepressant-overdose-hjh',
  thyroid_emergencies: 'thyroid-emergencies-hjh',
  aha_resuscitation_algorithms: 'aha-resuscitation-algorithms',
  airway_management_checklist_rsi: 'airway-management-checklist-rsi-hjh',
  asthma_pefr: 'asthma-pefr',
  back_pain: 'back-pain-red-flags',
  ccb_bb_overdose: 'ccb-beta-blocker-overdose-hjh',
  community_acquired_pneumonia: 'community-acquired-pneumonia-hjh',
  crush_injury: 'crush-injury-hjh',
  diabetic_ketoacidosis_dka: 'diabetic-ketoacidosis-dka-hjh',
  difficult_airway: 'difficult-airway-hjh',
  dvt: 'wells-score-dvt-hjh',
  femoral_nerve_block: 'femoral-nerve-block-hjh',
  first_onset_seizures: 'first-onset-seizures',
  gastroenteritis_paediatrics: 'gastroenteritis-paediatrics-hjh',
  general_toxicology: 'general-toxicology-antidotes-hjh',
  agitation_aggression: 'agitation-aggression',
  acs_workup_algorithm: 'acs-workup-algorithm',
  actilyse_protocol: 'actilyse-protocol-hjh',
  acetylcholinesterase_inhibitor_overdose: 'acetylcholinesterase-inhibitor-overdose-hjh',
  infusions: 'hjh-infusion-reference-table',
  isoniazid_overdose: 'isoniazid-overdose-hjh',
  medicolegal_recordkeeping: 'medicolegal-recordkeeping',
};

const PAGE_MAP: Record<string, number[]> = {
  acetylcholinesterase_inhibitor_overdose: [6],
  acs_workup_algorithm: [9, 10, 13, 14],
  actilyse_protocol: [15],
  acute_appendicitis: [7],
  agitation_aggression: [19, 20, 21],
  aha_resuscitation_algorithms: [26, 27, 28, 29, 30, 31, 34, 35, 36, 37, 38, 39],
  airway_management_checklist_rsi: [22, 23],
  asthma_pefr: [45],
  back_pain: [48],
  blood_products: [49],
  brainstem_death: [50],
  burns: [51, 52, 53],
  c_spine_imaging: [54],
  ccb_bb_overdose: [55],
  community_acquired_pneumonia: [58],
  critical_care_principles: [60],
  crush_injury: [],
  diabetic_ketoacidosis_dka: [92, 93],
  difficult_airway: [64, 65],
  dvt: [63],
  ent_emergencies: [69, 70, 71, 72, 73, 74],
  femoral_nerve_block: [197],
  first_onset_seizures: [75],
  gastroenteritis_paediatrics: [76],
  general_toxicology: [77],
  haematological_emergencies: [78, 79, 80, 81, 82, 83, 84, 85],
  head_injury: [87, 88, 90],
  hyperglycaemia_flowchart: [91],
  hyperkalaemia: [94],
  hypernatraemia: [96],
  hypertension_flowchart: [98, 99],
  hypertensive_emergencies: [98, 99],
  hyperthermia: [100],
  hypokalaemia: [95],
  hyponatraemia: [97],
  hypothermia: [101, 102, 103],
  indications_dialysis: [],
  infusions: [105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117],
  intermediate_low_risk_chest_pain: [13, 14],
  isoniazid_overdose: [246, 247],
  jaundice_flowchart: [119, 120],
  liver_failure: [120, 121, 122, 123],
  medicolegal_recordkeeping: [223, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239],
  meningococcal_prophylaxis: [130, 131],
  mental_health_psychosis: [129],
  non_invasive_ventilation: [132],
  nstemi_management: [13, 14],
  oncological_emergencies: [133, 134, 135, 136, 137],
  ophthalmology_emergencies: [138, 139, 140],
  pain_management: [141, 142],
  paracetamol_nomogram: [143],
  paracetamol_overdose: [143],
  pe_algorithm: [159, 160],
  post_exposure_prophylaxis: [145, 146, 147, 148, 149, 150, 151, 152],
  procedural_sedation: [158],
  pulmonary_embolism: [159, 160],
  rabies_animal_bites: [161, 163, 164],
  raised_icp: [165, 166],
  renal_colic: [167],
  salicylate_overdose: [168],
  sexual_assault: [5, 72, 175],
  snakebite: [5, 176],
  status_epilepticus: [5, 75, 177, 178, 179],
  status_epilepticus_algorithm: [5, 177, 178],
  stemi_management: [10, 11, 12, 15],
  subarachnoid_haemorrhage: [179],
  syncope: [180, 181],
  syncope_ecg: [181, 182, 183, 184, 185, 186, 187],
  tca_overdose: [244, 245, 246, 247],
  thyroid_emergencies: [189, 190],
  toxic_alcohol: [],
  toxidromes: [19, 192],
  trauma_basics: [193],
  triage_tews: [194, 195],
  ventilator_guidelines: [202, 203],
};

// Every archive file is imported as an isolated HJH entry, even if another
// source already has a same-title entry. Duplicate detection is disabled so
// each hospital's protocol remains independent.

function loadPageIndex(): string {
  return fs.readFileSync(PAGE_INDEX, 'utf8');
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

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function deriveSlug(
  archiveId: string,
  title: string,
  existingSlugs: Set<string>,
): string {
  const preferred = SLUG_OVERRIDES[archiveId];
  const base = preferred ?? slugify(title);

  // Always create a hospital-suffixed isolated entry. If the preferred slug
  // already ends in -hjh, use it directly; otherwise append -hjh. If that
  // collides with a previously created entry in this run, append a counter.
  const hospitalVariant = base.endsWith('-hjh') ? base : `${base}-hjh`;
  if (!existingSlugs.has(hospitalVariant)) return hospitalVariant;

  let counter = 2;
  while (existingSlugs.has(`${hospitalVariant}-${counter}`)) counter++;
  return `${hospitalVariant}-${counter}`;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(v => String(v));
  if (typeof value === 'string') return [value];
  return [];
}

function synthesizeManagementSteps(record: Record<string, unknown>): {step_number: string; action: string; details: string}[] {
  const steps: {step_number: string; action: string; details: string}[] = [];
  const sourceText = String(record.source_text ?? '').trim();
  const note = String(record.note ?? '').trim();
  const warnings = asStringArray(record.warnings);
  const drugs = Array.isArray(record.drugs) ? record.drugs : [];

  if (sourceText) {
    // Break huge source_text into a single consolidated step so the card renders.
    steps.push({step_number: String(steps.length + 1), action: 'Reference / Guidance', details: sourceText});
  }
  if (note) {
    steps.push({step_number: String(steps.length + 1), action: 'Key Information', details: note});
  }
  for (const w of warnings) {
    steps.push({step_number: String(steps.length + 1), action: 'Warning', details: w.trim()});
  }
  for (const d of drugs as Record<string, unknown>[]) {
    const drugText = Object.entries(d)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    if (drugText) {
      steps.push({step_number: String(steps.length + 1), action: String(d.item ?? d.drug ?? 'Drug Guidance'), details: drugText});
    }
  }
  if (steps.length === 0) {
    // Last resort: include the item text so the entry is not empty.
    steps.push({step_number: '1', action: 'Protocol Reference', details: String(record.item ?? '')});
  }
  return steps;
}

function transformRecord(protocol: Record<string, unknown>): Record<string, unknown> {
  // The archive's `protocol` object is structurally identical to the canonical
  // `record`. Strip any archive-only metadata keys if present.
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(protocol)) {
    record[key] = value;
  }
  // The validator requires at least one management step for protocols/procedures.
  if (
    record.protocol_type === 'ed_protocol' &&
    (!Array.isArray(record.management_steps) || record.management_steps.length === 0)
  ) {
    record.management_steps = synthesizeManagementSteps(record);
  }
  return record;
}

function main() {
  const pageIndex = loadPageIndex();
  const existingSlugs = new Set<string>();
  for (const fp of walk(ENTRIES_DIR)) {
    const existing: CanonicalEntryFile = JSON.parse(fs.readFileSync(fp, 'utf8'));
    existingSlugs.add(existing.slug);
  }

  const orderCounters = new Map<string, number>();
  let created = 0;
  let skipped = 0;
  let pageOutOfRange = 0;
  const report: string[] = [];

  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(n => n.endsWith('.json'))
    .map(n => path.join(ARCHIVE_DIR, n))
    .sort();

  for (const filePath of files) {
    const archive: ArchiveFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const id = archive._meta.id;
    const title = archive._meta.title;

    const mappedCategory = TITLE_OVERRIDES[title] ?? ARCHIVE_CATEGORY_MAP[archive._meta.category];
    if (!mappedCategory) {
      report.push(`SKIP (unknown category mapping): ${id} -> ${archive._meta.category}`);
      continue;
    }
    const [categoryId, subcategoryId] = mappedCategory;

    const slug = deriveSlug(id, title, existingSlugs);
    existingSlugs.add(slug);

    const pdfPages = PAGE_MAP[id] ?? [];
    if (pdfPages.some(p => p < 1 || p > 247)) {
      pageOutOfRange++;
      report.push(`WARNING page out of range: ${id} -> ${JSON.stringify(pdfPages)}`);
    }

    const verification: CanonicalEntryFile['source']['verification'] =
      pdfPages.length === 0 ? 'manual' : 'page-index';

    const order = 2000 + (orderCounters.get(`${categoryId}.${subcategoryId}`) ?? 0);
    orderCounters.set(`${categoryId}.${subcategoryId}`, (orderCounters.get(`${categoryId}.${subcategoryId}`) ?? 0) + 1);

    const entry: CanonicalEntryFile = {
      categoryId,
      subcategoryId,
      slug,
      order,
      source: {
        sourceId: 'hjh-ed-2026-v1',
        pdfPages,
        sectionTitle: title,
        transformation: 'condensed',
        verification,
      },
      sourceGroup: 'hjth',
      reviewState: 'unreviewed',
      errata: [],
      record: transformRecord(archive.protocol),
    };

    const dir = path.join(ENTRIES_DIR, categoryId, subcategoryId);
    const outPath = path.join(dir, `${slug}.json`);
    if (WRITE) {
      fs.mkdirSync(dir, {recursive: true});
      fs.writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n');
    }
    created++;
    report.push(`CREATE ${id} -> ${categoryId}/${subcategoryId}/${slug}.json (pages: ${JSON.stringify(pdfPages) || 'none'})`);
  }

  console.log(report.join('\n'));
  console.log(`\nSummary: ${created} created, ${skipped} skipped (already imported from raw corpus), ${pageOutOfRange} page-range warnings`);
  if (!WRITE) console.log('(dry run - pass --write to apply)');
}

main();
