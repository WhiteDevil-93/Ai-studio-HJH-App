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
    reviewState: ReviewState;
    warnings: ClinicalWarning[];
    infusionPresetId?: string;
    sourceGroup?: 'bara_icu' | 'edl_phc' | 'hjth' | 'cmjah' | 'rmmch' | 'chbah';
  };
}

export type ReviewState = 'unreviewed' | 'clinical-review' | 'approved' | 'retired';

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

// --- Per-entry-file loading (used by both the Vite loader and the plain-Node
// validator, so the two always agree on the exact same tree). ---

export interface CanonicalEntryFile {
  categoryId: string;
  subcategoryId: string;
  slug: string;
  order: number;
  source: SourceReference & {
    verification: 'page-index' | 'preview' | 'unverifiable' | 'manual';
  };
  sourceGroup: 'bara_icu' | 'edl_phc' | 'hjth' | 'cmjah' | 'rmmch' | 'chbah';
  reviewState: ReviewState;
  errata: string[];
  record: LegacyClinicalRecord;
}

// Score calculators are a flat {calcKey: calculatorObject} map with no _meta
// (App.tsx reads clinicalData['16_score_calculators'][key] directly), so that
// category is 2-level (entries/16_score_calculators/<slug>.json) while every
// other category is 3-level (entries/<categoryId>/<subcategoryId>/<slug>.json).
export const SINGLETON_CATEGORIES = new Set(['16_score_calculators']);

export function parseEntryPath(entryPath: string): {categoryId: string; subcategoryId: string; slug: string} {
  const marker = '/entries/';
  const index = entryPath.indexOf(marker);
  const relative = index >= 0 ? entryPath.slice(index + marker.length) : entryPath;
  const parts = relative.replace(/\.json$/, '').split('/');
  if (parts.length === 3) {
    const [categoryId, subcategoryId, slug] = parts;
    return {categoryId, subcategoryId, slug};
  }
  if (parts.length === 2) {
    const [categoryId, slug] = parts;
    return {categoryId, subcategoryId: slug, slug};
  }
  throw new Error(`Cannot parse entry path: ${entryPath}`);
}

export function annotateEntry(file: CanonicalEntryFile): LegacyClinicalRecord {
  const {categoryId, subcategoryId, slug, record} = file;
  const title = legacyTitle(record);
  if (!title) {
    throw new Error(`Clinical record has no title: ${categoryId}/${subcategoryId}/${slug}`);
  }
  const id = `${categoryId}.${subcategoryId}.${slug}`;
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
      sourceRefs: [file.source],
      reviewState: file.reviewState,
      warnings,
      infusionPresetId: explicitInfusions[`${categoryId}::${title}`],
      sourceGroup: file.sourceGroup,
    },
  };
}

export function buildTreeFromFiles(files: Array<{path: string; file: CanonicalEntryFile}>): LegacyData {
  const tree: LegacyData = {};
  const sorted = [...files].sort((a, b) =>
    (a.file.order ?? 1e6) - (b.file.order ?? 1e6) || a.file.slug.localeCompare(b.file.slug));

  for (const {path: entryPath, file} of sorted) {
    const pos = parseEntryPath(entryPath);
    if (pos.categoryId !== file.categoryId || pos.subcategoryId !== file.subcategoryId || pos.slug !== file.slug) {
      throw new Error(
        `${entryPath}: envelope (${file.categoryId}/${file.subcategoryId}/${file.slug}) disagrees with directory position (${pos.categoryId}/${pos.subcategoryId}/${pos.slug})`,
      );
    }

    const category = (tree[file.categoryId] ??= {});
    if (SINGLETON_CATEGORIES.has(file.categoryId)) {
      category[file.subcategoryId] = file.record;
    } else {
      const bucket = (category[file.subcategoryId] ??= []) as LegacyClinicalRecord[];
      bucket.push(annotateEntry(file));
    }
  }

  return tree;
}
