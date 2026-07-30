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
    name: 'Helen Joseph Hospital',
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

const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
  '07_ed_ent': 'ENT (Ear, Nose & Throat)',
  '06_ed_airway': 'Airway & Ventilation',
  '14_ed_psychiatry': 'Psychiatry & Mental Health',
  '05_ed_pulmonary': 'Pulmonology & Respiratory',
  '04_ed_neurology': 'Neurology',
  '03_ed_cardiovascular': 'Cardiovascular',
  '02_ed_trauma_ortho': 'Trauma & Orthopaedics',
  '12_ed_toxicology': 'Toxicology & Poisoning',
  '13_ed_trauma_surgical': 'Trauma & Surgery',
  '11_ed_medical_emergencies': 'Medical Emergencies',
  '15_ed_procedures': 'Procedures & Skills',
  '10_ed_procedure': 'Procedures & Pain',
  '17_ed_critical_care': 'Critical Care & Resuscitation',
  '16_ed_administration': 'Triage & Administration',
  '08_ed_obstetrics_gynaecology': 'Obstetrics & Gynaecology',
  '14_ed_metabolic': 'Metabolic & Endocrine',
  '15_ed_general_surgery': 'General Surgery',
  '13_ed_infectious_diseases': 'Infectious Diseases',
  'psychiatry': 'Psychiatry & Mental Health',
  'resuscitation': 'Resuscitation & Critical Care',
  'airway': 'Airway & Ventilation',
  'medical_emergencies': 'Medical Emergencies',
  'trauma': 'Trauma',
};

const PROTOCOL_CATEGORY_OVERRIDES: Record<string, string> = {
  'hjh:mental_health_psychosis': '14_ed_psychiatry',
  'hjh:non_invasive_ventilation': '06_ed_airway',
  'hjh:ventilator_guidelines': '06_ed_airway',
  'hjh:ent_emergencies': '07_ed_ent',
};

export const categoryLabel = (categoryId: string): string => {
  if (CATEGORY_LABEL_OVERRIDES[categoryId]) {
    return CATEGORY_LABEL_OVERRIDES[categoryId];
  }
  return categoryId
    .replace(/^\d+_/, '')
    .replace(/^ed_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
};

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

const SUMMARY_MAX_LENGTH = 180;

const conciseSummary = (value: string): string => {
  const firstSegment = value
    .replace(/\r/g, '')
    .split(/\n+|\s+[•▪]\s+/)
    .map(segment => segment.trim())
    .find(Boolean) ?? '';
  const normalized = firstSegment
    .replace(/^[•▪→*–—-]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length <= SUMMARY_MAX_LENGTH) return normalized;

  const candidate = normalized.slice(0, SUMMARY_MAX_LENGTH);
  const lastWordBoundary = candidate.lastIndexOf(' ');
  const clipped = lastWordBoundary >= SUMMARY_MAX_LENGTH * 0.7
    ? candidate.slice(0, lastWordBoundary)
    : candidate;
  return `${clipped.trimEnd()}…`;
};

const summaryFor = (body: Record<string, unknown>): string => {
  const clinicalFeatures = body.clinical_features;
  const featureText = collectStrings(clinicalFeatures).find(Boolean);
  if (featureText) return conciseSummary(featureText);

  const managementSteps = Array.isArray(body.management_steps) ? body.management_steps : [];
  const firstStep = managementSteps.find(isRecord);
  if (firstStep) {
    const action = asString(firstStep.action);
    const details = asString(firstStep.details);
    if (action || details) {
      return conciseSummary([action, details].filter(Boolean).join(' — '));
    }
  }

  const sourceText = asString(body.source_text);
  if (sourceText) return conciseSummary(sourceText);

  const note = asString(body.note);
  return note
    ? conciseSummary(note)
    : 'Open the protocol page for the complete source transcription.';
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
  const protocolId = `${facilityId}:${slug}`;
  const categoryId =
    PROTOCOL_CATEGORY_OVERRIDES[protocolId] ||
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

const SAME_FACILITY_PROTOCOL_REFERENCES: Partial<Record<HospitalProtocol['id'], string>> = {
  'hjh:acs_workup_algorithm': 'acute_coronary_syndrome_acs_algorithm',
  'hjh:hyperglycaemia_flowchart': 'diabetic_ketoacidosis_dka',
  'hjh:jaundice_flowchart': 'liver_failure',
  'hjh:status_epilepticus_algorithm': 'status_epilepticus',
  'hjh:syncope_ecg': 'syncope',
};

const protocolReferenceSlug = (protocol: HospitalProtocol): string | undefined => {
  const explicit = SAME_FACILITY_PROTOCOL_REFERENCES[protocol.id];
  if (explicit) return explicit;

  const note = asString(protocol.body.note);
  const match = note.match(
    /\b(?:see|refer to)\s+([a-z0-9]+(?:_[a-z0-9]+)+)\b/i,
  );
  return match?.[1];
};

export const findReferencedHospitalProtocol = (
  protocol: HospitalProtocol,
): HospitalProtocol | undefined => {
  const referenceSlug = protocolReferenceSlug(protocol);
  if (!referenceSlug) return undefined;
  return HOSPITAL_PROTOCOLS_BY_FACILITY[protocol.facilityId].find(
    candidate => candidate.slug === referenceSlug,
  );
};

const hasValue = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  if (isRecord(value)) return Object.values(value).some(hasValue);
  return value !== null && value !== undefined;
};

export const hasProtocolContent = (protocol: HospitalProtocol): boolean => [
  protocol.body.clinical_features,
  protocol.body.management_steps,
  protocol.body.drugs,
  protocol.body.warnings,
  protocol.body.disposition,
  protocol.body.source_text,
  protocol.body.equipment,
  protocol.embeddedDrugs,
].some(hasValue);

export const HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY: Record<HospitalId, HospitalProtocol[]> = {
  hjh: HOSPITAL_PROTOCOLS_BY_FACILITY.hjh.filter(
    protocol => hasProtocolContent(protocol) || Boolean(findReferencedHospitalProtocol(protocol)),
  ),
  cmjah: HOSPITAL_PROTOCOLS_BY_FACILITY.cmjah.filter(
    protocol => hasProtocolContent(protocol) || Boolean(findReferencedHospitalProtocol(protocol)),
  ),
  chbah: HOSPITAL_PROTOCOLS_BY_FACILITY.chbah.filter(
    protocol => hasProtocolContent(protocol) || Boolean(findReferencedHospitalProtocol(protocol)),
  ),
  rmmch: HOSPITAL_PROTOCOLS_BY_FACILITY.rmmch.filter(
    protocol => hasProtocolContent(protocol) || Boolean(findReferencedHospitalProtocol(protocol)),
  ),
};

export const isHospitalId = (value: string): value is HospitalId =>
  value === 'hjh' || value === 'cmjah' || value === 'chbah' || value === 'rmmch';

export const hospitalProtocolCount = (facilityId: HospitalId): number =>
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY[facilityId].length;

export const findHospitalProtocol = (
  facilityId: HospitalId,
  slug: string,
): HospitalProtocol | undefined =>
  HOSPITAL_PROTOCOLS_BY_FACILITY[facilityId].find(protocol => protocol.slug === slug);
