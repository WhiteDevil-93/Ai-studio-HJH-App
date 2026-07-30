export type HospitalId = 'hjh' | 'cmjah' | 'chbah' | 'rmmch';

export interface HospitalDefinition {
  id: HospitalId;
  archiveDirectory: 'HJH' | 'CMJAH' | 'CHBAH' | 'RMMCH';
  shortName: string;
  name: string;
  subtitle: string;
  description: string;
  sourceLabel: string;
  accent: 'indigo' | 'violet' | 'amber' | 'rose';
}

export interface HospitalProtocol {
  id: string;
  facilityId: HospitalId;
  archiveDirectory: HospitalDefinition['archiveDirectory'];
  slug: string;
  filename: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  protocolType: string;
  sourceDocument: string;
  sourceAttribution: string;
  pdfPages: number[];
  reviewState: string;
  summary: string;
  searchText: string;
  body: Record<string, unknown>;
  embeddedDrugs: Array<Record<string, unknown>>;
  raw: Record<string, unknown>;
}

export const HOSPITALS: Record<HospitalId, HospitalDefinition> = {
  hjh: {
    id: 'hjh',
    archiveDirectory: 'HJH',
    shortName: 'HJH',
    name: 'Helen Joseph Tertiary Hospital',
    subtitle: 'Emergency Department Clinical Guidelines · January 2026',
    description: 'Adult emergency medicine protocols, algorithms, procedures, toxicology, trauma, and critical-care guidance.',
    sourceLabel: 'HJH ED 2026',
    accent: 'indigo',
  },
  cmjah: {
    id: 'cmjah',
    archiveDirectory: 'CMJAH',
    shortName: 'CMJAH',
    name: 'Charlotte Maxeke Johannesburg Academic Hospital',
    subtitle: 'Emergency Department Protocols · Version 2, December 2020',
    description: 'Adult and paediatric ED protocols, resuscitation pathways, toxicology, triage, procedures, and administrative guidance.',
    sourceLabel: 'CMJAH ED December 2020',
    accent: 'violet',
  },
  chbah: {
    id: 'chbah',
    archiveDirectory: 'CHBAH',
    shortName: 'CHBAH',
    name: 'Chris Hani Baragwanath Academic Hospital',
    subtitle: 'ICU Dosing Card',
    description: 'ICU medication dosing, infusions, antimicrobial regimens, electrolyte replacement, and critical-care reference entries.',
    sourceLabel: 'CHBAH ICU',
    accent: 'amber',
  },
  rmmch: {
    id: 'rmmch',
    archiveDirectory: 'RMMCH',
    shortName: 'RMMCH',
    name: 'Rahima Moosa Mother & Child Hospital',
    subtitle: 'Emergency Medicine Clinical Protocols · Version 5, January 2024',
    description: 'Paediatric and maternal emergency protocols, resuscitation algorithms, airway guidance, and acute-care pathways.',
    sourceLabel: 'RMMCH EM Protocols',
    accent: 'rose',
  },
};

const modules = import.meta.glob<Record<string, unknown>>(
  '../../clinical-sources/raw/all_hospitals_protocols/{HJH,CMJAH,CHBAH,RMMCH}/*.json',
  {
    eager: true,
    import: 'default',
  },
);

const directoryToHospital: Record<HospitalDefinition['archiveDirectory'], HospitalId> = {
  HJH: 'hjh',
  CMJAH: 'cmjah',
  CHBAH: 'chbah',
  RMMCH: 'rmmch',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const asNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry))
    : [];

const titleFromFilename = (filename: string): string =>
  filename
    .replace(/\.json$/i, '')
    .replace(/^(?:chbah|cmjah|rmmch|hjh)[-_]/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

export const categoryLabel = (categoryId: string): string =>
  categoryId
    .replace(/^\d+_/, '')
    .replace(/^ed_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const collectStrings = (value: unknown, collected: string[] = []): string[] => {
  if (typeof value === 'string') {
    collected.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => collectStrings(item, collected));
  } else if (isRecord(value)) {
    Object.values(value).forEach(item => collectStrings(item, collected));
  }
  return collected;
};

const summaryFor = (body: Record<string, unknown>): string => {
  const clinicalFeatures = body.clinical_features;
  const featureText = collectStrings(clinicalFeatures).find(Boolean);
  if (featureText) return featureText;

  const managementSteps = Array.isArray(body.management_steps) ? body.management_steps : [];
  const firstStep = managementSteps.find(isRecord);
  if (firstStep) {
    const action = asString(firstStep.action);
    const details = asString(firstStep.details);
    if (action || details) return [action, details].filter(Boolean).join(' — ');
  }

  const sourceText = asString(body.source_text).replace(/\s+/g, ' ');
  if (sourceText) return sourceText.slice(0, 240);

  const note = asString(body.note);
  return note || 'Open the protocol page for the complete source transcription.';
};

const normalizeProtocol = (
  path: string,
  rawValue: Record<string, unknown>,
): HospitalProtocol | null => {
  const match = path.match(/\/(HJH|CMJAH|CHBAH|RMMCH)\/([^/]+)\.json$/);
  if (!match) return null;

  const archiveDirectory = match[1] as HospitalDefinition['archiveDirectory'];
  const facilityId = directoryToHospital[archiveDirectory];
  const filename = `${match[2]}.json`;
  const slug = match[2];
  const meta = isRecord(rawValue._meta) ? rawValue._meta : {};
  const body = isRecord(rawValue.protocol) ? rawValue.protocol : rawValue;
  const title =
    asString(meta.title) ||
    asString(body.item) ||
    asString(body.drug) ||
    titleFromFilename(filename);
  const categoryId =
    asString(meta.category) ||
    asString(body.categoryHint) ||
    asString(body.protocol_type) ||
    'uncategorized';
  const sourceAttribution =
    asString(meta.source_doc) ||
    asString(body.sourceDoc) ||
    HOSPITALS[facilityId].sourceLabel;
  const embeddedDrugs = Array.isArray(rawValue.embedded_drugs)
    ? rawValue.embedded_drugs.filter(isRecord)
    : [];

  return {
    id: `${facilityId}:${slug}`,
    facilityId,
    archiveDirectory,
    slug,
    filename,
    title,
    categoryId,
    categoryLabel: categoryLabel(categoryId),
    protocolType: asString(body.protocol_type) || asString(meta.type) || 'protocol',
    // The archive directory is the facility boundary. Some supplied _meta
    // fields name multiple upstream references; retain those bytes in `raw`
    // but do not use them to label or group a hospital landing page.
    sourceDocument: HOSPITALS[facilityId].sourceLabel,
    sourceAttribution,
    pdfPages: asNumberArray(body.pdfPages),
    reviewState: asString(meta.review_state) || asString(body.review_state) || 'unreviewed',
    summary: summaryFor(body),
    searchText: collectStrings(body)
      .concat(collectStrings(embeddedDrugs))
      .concat([title, categoryId, HOSPITALS[facilityId].sourceLabel, filename])
      .join(' ')
      .toLocaleLowerCase(),
    body,
    embeddedDrugs,
    raw: rawValue,
  };
};

export const HOSPITAL_PROTOCOLS: HospitalProtocol[] = Object.entries(modules)
  .map(([path, value]) => normalizeProtocol(path, value))
  .filter((value): value is HospitalProtocol => Boolean(value))
  .sort((a, b) =>
    a.facilityId.localeCompare(b.facilityId) ||
    a.categoryLabel.localeCompare(b.categoryLabel) ||
    a.title.localeCompare(b.title),
  );

export const HOSPITAL_PROTOCOLS_BY_FACILITY: Record<HospitalId, HospitalProtocol[]> = {
  hjh: HOSPITAL_PROTOCOLS.filter(protocol => protocol.facilityId === 'hjh'),
  cmjah: HOSPITAL_PROTOCOLS.filter(protocol => protocol.facilityId === 'cmjah'),
  chbah: HOSPITAL_PROTOCOLS.filter(protocol => protocol.facilityId === 'chbah'),
  rmmch: HOSPITAL_PROTOCOLS.filter(protocol => protocol.facilityId === 'rmmch'),
};

export const isHospitalId = (value: string): value is HospitalId =>
  value === 'hjh' || value === 'cmjah' || value === 'chbah' || value === 'rmmch';

export const hospitalProtocolCount = (facilityId: HospitalId): number =>
  HOSPITAL_PROTOCOLS_BY_FACILITY[facilityId].length;

export const findHospitalProtocol = (
  facilityId: HospitalId,
  slug: string,
): HospitalProtocol | undefined =>
  HOSPITAL_PROTOCOLS_BY_FACILITY[facilityId].find(protocol => protocol.slug === slug);
