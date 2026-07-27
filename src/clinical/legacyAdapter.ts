import legacyData from '../data.json';
import {sourceReferencesFor} from './sourceRegistry';
import type {ClinicalEntryType, ClinicalWarning} from './types';

export interface LegacyClinicalRecord extends Record<string, unknown> {
  item?: string;
  drug?: string;
  condition_or_drug?: string;
  poison_or_drug?: string;
  antidote_treatment?: string;
  product?: string;
  protocol_type?: string;
  warnings?: string[];
  management_steps?: unknown[];
  equipment?: string[];
  checklist_items?: string[];
  _meta?: {
    id: string;
    type: ClinicalEntryType;
    categoryId: string;
    subcategoryId: string;
    title: string;
    sourceRefs: ReturnType<typeof sourceReferencesFor>;
    reviewState: 'unreviewed';
    warnings: ClinicalWarning[];
    infusionPresetId?: string;
    sourceGroup?: 'bara_icu' | 'edl_phc' | 'hjth' | 'cmjah';
  };
}

type LegacyCategory = Record<string, LegacyClinicalRecord[] | LegacyClinicalRecord>;
type LegacyData = Record<string, LegacyCategory>;

const CATEGORY_REASSIGNMENTS = [
  '12_ed_toxicology',
  '13_ed_trauma_surgical',
  '14_ed_metabolic',
  '15_ed_procedures',
] as const;

const explicitInfusions: Record<string, string> = {
  '1_resuscitation_fluids_and_inotropes::Amiodarone': 'amiodarone',
  '1_resuscitation_fluids_and_inotropes::Phenylephrine': 'phenylephrine',
  '7_useful_formulae::Adrenaline': 'adrenaline',
  '7_useful_formulae::Noradrenaline': 'noradrenaline',
  '7_useful_formulae::Dobutamine': 'dobutamine',
  '3_sedation_analgesia_and_neurology::Propofol': 'propofol',
  '3_sedation_analgesia_and_neurology::Ketamine': 'ketamine',
  '3_sedation_analgesia_and_neurology::Morphine': 'morphine',
  '3_sedation_analgesia_and_neurology::Midazolam': 'midazolam',
  '8_cardiovascular::Labetalol': 'labetalol',
  '6_poisoning_and_toxicology::Organophosphates': 'atropine_percent',
  '7_useful_formulae::Esmolol': 'esmolol',
  '7_useful_formulae::Isosorbide Dinitrate': 'isosorbide_low',
  '7_useful_formulae::Nitroglycerin': 'nitroglycerin',
  '7_useful_formulae::Morphine + Midazolam': 'morphine_midazolam',
};

// Page citations for entries transcribed from the CMJAH ED Protocols source
// (clinical-sources/source-manifest.json id "cmjah-ed-protocols-2020-v2").
// These entries are identified by an explicit "(CMJAH)" title suffix rather
// than title-matching, since several titles intentionally overlap with
// existing HJH/Bara entries in the same category (e.g. both hospitals have
// an "Anaphylaxis" protocol) — the suffix keeps them distinct.
const cmjahPageRefs: Record<string, number[]> = {
  'Sepsis and Septic Shock (CMJAH)': [114, 115, 116],
  'Status Epilepticus (CMJAH)': [119, 120],
  'Anaphylaxis (CMJAH)': [31],
  'Scorpion Envenomation (CMJAH)': [113],
  'Snakebite Pathway (CMJAH)': [117, 118],
  'Hyperglycaemic Emergencies (DKA/HHS) (CMJAH)': [69],
};

export const legacyTitle = (record: LegacyClinicalRecord): string =>
  String(
    record.item ??
    record.drug ??
    record.condition_or_drug ??
    record.poison_or_drug ??
    record.antidote_treatment ??
    record.product ??
    '',
  ).trim();

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const entryType = (
  record: LegacyClinicalRecord,
  categoryId: string,
): ClinicalEntryType => {
  if (record.protocol_type === 'ed_protocol') {
    return categoryId === '15_ed_procedures' ? 'procedure' : 'protocol';
  }
  if (record.formula && !record.adult_dose && !record.paediatric_dose) return 'formula';
  return 'drug';
};

const warningSeverity = (text: string): ClinicalWarning['severity'] => {
  const normalized = text.toLocaleLowerCase();
  if (
    normalized.includes('do not') ||
    normalized.includes('never') ||
    normalized.includes('contraindicat') ||
    normalized.includes('life-threatening') ||
    normalized.includes('catastrophic')
  ) {
    return 'critical';
  }
  if (
    normalized.includes('avoid') ||
    normalized.includes('caution') ||
    normalized.includes('monitor')
  ) {
    return 'caution';
  }
  return 'information';
};

function annotateRecord(
  record: LegacyClinicalRecord,
  categoryId: string,
  subcategoryId: string,
  duplicateIndex: number,
): LegacyClinicalRecord {
  const title = legacyTitle(record);
  if (!title) {
    throw new Error(`Clinical record has no title: ${categoryId}/${subcategoryId}`);
  }

  const baseId = `${categoryId}.${subcategoryId}.${slugify(title)}`;
  const id = duplicateIndex > 0 ? `${baseId}.${duplicateIndex + 1}` : baseId;
  const cmjahPages = cmjahPageRefs[title];
  const sourceRefs = cmjahPages
    ? [{
      sourceId: 'cmjah-ed-protocols-2020-v2',
      pdfPages: cmjahPages,
      sectionTitle: title,
      transformation: 'condensed' as const,
    }]
    : sourceReferencesFor(title);
  const warnings = (record.warnings ?? []).map((text, index) => ({
    id: `${id}.warning.${index + 1}`,
    severity: warningSeverity(text),
    text,
  }));

  return {
    ...record,
    _meta: {
      id,
      type: entryType(record, categoryId),
      categoryId,
      subcategoryId,
      title,
      sourceRefs,
      reviewState: 'unreviewed',
      warnings,
      infusionPresetId: explicitInfusions[`${categoryId}::${title}`],
      // Four independent labels, allowed to overlap on the same entry:
      // - 'cmjah': title is in cmjahPageRefs (explicit, page-cited).
      // - 'hjth': title resolves to the hjh-ed-2026-v1 source map (verified,
      //   wherever the entry lives) — drives the dedicated "Helen" tab.
      // - 'edl_phc': categories 11-15, the ED protocol/algorithm section of
      //   the app, kept as its own tab regardless of per-item HJH match.
      // - 'bara_icu': fallback for everything in categories 1-10/16 that
      //   isn't HJH-matched — there is no per-item Bara source map, so this
      //   bucket is not independently verified per entry.
      sourceGroup: cmjahPages
        ? 'cmjah'
        : sourceRefs.some(s => s.sourceId === 'hjh-ed-2026-v1')
        ? 'hjth'
        : (
          categoryId.startsWith('11_ed_') ||
          categoryId.startsWith('12_ed_') ||
          categoryId.startsWith('13_ed_') ||
          categoryId.startsWith('14_ed_') ||
          categoryId.startsWith('15_ed_')
        ) ? 'edl_phc' : 'bara_icu',
    },
  };
}

function annotateCategory(categoryId: string, category: LegacyCategory): LegacyCategory {
  const seen = new Map<string, number>();
  const result: LegacyCategory = {};

  for (const [subcategoryId, value] of Object.entries(category)) {
    if (!Array.isArray(value)) {
      const title = legacyTitle(value);
      if (!title) continue;
      const count = seen.get(title) ?? 0;
      seen.set(title, count + 1);
      result[subcategoryId] = annotateRecord(value, categoryId, subcategoryId, count);
      continue;
    }

    result[subcategoryId] = value.map(record => {
      const title = legacyTitle(record);
      const count = seen.get(title) ?? 0;
      seen.set(title, count + 1);
      return annotateRecord(record, categoryId, subcategoryId, count);
    });
  }

  return result;
}

export function buildClinicalData(): LegacyData {
  const cloned = structuredClone(legacyData) as unknown as LegacyData;
  const medicalEmergencies = cloned['11_ed_medical_emergencies'];

  if (!medicalEmergencies) throw new Error('Missing ED medical emergencies category');

  for (const categoryId of CATEGORY_REASSIGNMENTS) {
    const nested = medicalEmergencies[categoryId];
    if (nested && !Array.isArray(nested) && typeof nested === 'object') {
      cloned[categoryId] = nested as LegacyCategory;
    }
    delete medicalEmergencies[categoryId];
  }

  const result: LegacyData = {};
  for (const [categoryId, category] of Object.entries(cloned)) {
    if (categoryId === '16_score_calculators') {
      result[categoryId] = category;
      continue;
    }
    result[categoryId] = annotateCategory(categoryId, category);
  }

  return result;
}

export const clinicalData = buildClinicalData();

// Comprehensive Bidirectional Disease <-> Drug / Infusion Mappings
export const DISEASE_DRUG_PAIRINGS: Record<string, string[]> = {
  'Acute Coronary Syndrome (ACS) Algorithm': [
    'Adrenalin', 'Amiodarone', 'Aspirin', 'Clopidogrel', 'Nitroglycerin', 'Isosorbide Dinitrate',
    'Morphine', 'Fentanyl', 'Clexane', 'Heparin', 'Simvastatin', 'Atenolol', 'Alteplase', 'Tenectaplase'
  ],
  'STEMI Equivalents & Sgarbossa Criteria': [
    'Aspirin', 'Clopidogrel', 'Nitroglycerin', 'Clexane', 'Heparin', 'Alteplase', 'Tenectaplase'
  ],
  'Acute Ischaemic Stroke': [
    'Alteplase', 'Labetalol', 'Esmolol', 'Nitroglycerin', 'Tranexamic Acid'
  ],
  'Acute Heart Failure (AHF)': [
    'Furosemide', 'Nitroglycerin', 'Isosorbide Dinitrate', 'Morphine', 'Dobutamine',
    'Noradrenaline', 'Captopril', 'Perindopril', 'Enalapril', 'Digoxin'
  ],
  'Atrial Fibrillation (AF)': [
    'Amiodarone', 'Esmolol', 'Labetalol', 'Digoxin', 'Propanolol', 'Atenolol'
  ],
  'Asthma Exacerbation': [
    'Salbutamol', 'Atrovent', 'Hydrocortisone', 'Methylprednisolone', 'Prednisone',
    'Magnesium', 'Aminophylline', 'Ketamine', 'Adrenalin'
  ],
  'COPD Exacerbation': [
    'Salbutamol', 'Atrovent', 'Prednisone', 'Hydrocortisone', 'Amoxicillin', 'Augmentin', 'Azithromycin'
  ],
  'Sepsis & Septic Shock': [
    'Noradrenaline', 'Adrenalin', 'Hydrocortisone', 'Augmentin', 'Ceftriaxone',
    'Tazocin', 'Meropenem', 'Amikacin', 'Vancomycin', 'Colistin'
  ],
  'Upper Gastrointestinal Bleed (UGIB)': [
    'Pantoprazole', 'Octreotide', 'Ceftriaxone', 'Tranexamic Acid', 'Packed cells', 'FFP', 'Platelets'
  ],
  'Vaginal Bleeding (ED Management)': [
    'Tranexamic Acid', 'Oxytocin', 'Misoprostol', 'Packed cells'
  ],
  'Vascular Emergencies (AAA, Dissection, Limb Ischaemia)': [
    'Labetalol', 'Esmolol', 'Fentanyl', 'Morphine', 'Heparin', 'Clexane'
  ],
  'Malaria (Uncomplicated & Complicated)': [
    'Artesunate', 'Quinine', 'Doxycycline', 'Paracetamol'
  ],
  'Headache (Red Flags & Primary Syndromes)': [
    'Paracetamol', 'Diclofenac', 'Prochloperazine', 'Promethazine', 'Morphine'
  ],
  'Dizziness & Vertigo (HINTS Exam)': [
    'Prochloperazine', 'Promethazine', 'Diazepam'
  ],
  'Status Epilepticus': [
    'Lorazepam', 'Diazepam', 'Midazolam', 'Clonazepam', 'Phenytoin', 'Valproate',
    'Phenobarbitone', 'Thiopentone', 'Propofol', 'Ketamine', 'Paraldehyde'
  ],
  'Hyperkalaemia': [
    '10% Calcium Chloride', '10% Calcium Gluconate', 'Actrapid', 'Salbutamol',
    'NaHCO3 8.5%', 'Furosemide', 'Kayexalate'
  ],
  'Organophosphates': [
    'Atropine', 'Diazepam', 'Midazolam'
  ],
  'Paracetamol': [
    'Acetylcysteine'
  ],
};

// Reverse mapping: Drug -> list of associated Emergency Issues
export function getAssociatedDiseasesForDrug(drugName: string): string[] {
  const norm = drugName.toLowerCase().trim();
  const matched: string[] = [];

  for (const [disease, drugs] of Object.entries(DISEASE_DRUG_PAIRINGS)) {
    if (drugs.some(d => d.toLowerCase().includes(norm) || norm.includes(d.toLowerCase()))) {
      matched.push(disease);
    }
  }

  return matched;
}

// Find paired drug records for a given disease title
export function getPairedDrugsForDisease(diseaseTitle: string): LegacyClinicalRecord[] {
  const pairedNames = DISEASE_DRUG_PAIRINGS[diseaseTitle] || [];
  if (pairedNames.length === 0) return [];

  const found: LegacyClinicalRecord[] = [];
  const added = new Set<string>();

  for (const [catKey, category] of Object.entries(clinicalData)) {
    if (catKey === '16_score_calculators') continue;
    for (const subCat of Object.values(category as LegacyCategory)) {
      const records = Array.isArray(subCat) ? subCat : [subCat];
      for (const rec of records) {
        const title = legacyTitle(rec);
        if (!title || added.has(title)) continue;

        const isMatch = pairedNames.some(pName =>
          title.toLowerCase().includes(pName.toLowerCase()) ||
          pName.toLowerCase().includes(title.toLowerCase())
        );

        if (isMatch) {
          found.push(rec);
          added.add(title);
        }
      }
    }
  }

  return found;
}

