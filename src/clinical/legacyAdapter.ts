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
  const sourceRefs = sourceReferencesFor(title);
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
