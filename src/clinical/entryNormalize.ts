import type {ClinicalEntryType, ClinicalWarning, SourceReference} from './types';

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
    sourceRefs: SourceReference[];
    reviewState: 'unreviewed';
    warnings: ClinicalWarning[];
    infusionPresetId?: string;
    sourceGroup?: 'bara_icu' | 'edl_phc' | 'hjth' | 'cmjah';
  };
}

export type LegacyCategory = Record<string, LegacyClinicalRecord[] | LegacyClinicalRecord>;
export type LegacyData = Record<string, LegacyCategory>;

export const explicitInfusions: Record<string, string> = {
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

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const entryType = (
  record: LegacyClinicalRecord,
  categoryId: string,
): ClinicalEntryType => {
  if (record.protocol_type === 'ed_protocol') {
    return categoryId === '15_ed_procedures' ? 'procedure' : 'protocol';
  }
  if (record.formula && !record.adult_dose && !record.paediatric_dose) return 'formula';
  return 'drug';
};

export const warningSeverity = (text: string): ClinicalWarning['severity'] => {
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
