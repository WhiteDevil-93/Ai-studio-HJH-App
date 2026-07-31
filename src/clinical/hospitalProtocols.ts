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

const rawModules = import.meta.glob<Record<string, unknown>>(
  '../../clinical-sources/raw/all_hospitals_protocols/{HJH,CMJAH,CHBAH,RMMCH}/*.json',
  {
    eager: true,
    import: 'default',
  },
);

const correctionModules = import.meta.glob<Record<string, unknown>>(
  '../../clinical-sources/corrections/{HJH,CMJAH,CHBAH,RMMCH}/*.json',
  {
    eager: true,
    import: 'default',
  },
);

const moduleIdentity = (modulePath: string): string | undefined => {
  const match = modulePath.match(/\/(HJH|CMJAH|CHBAH|RMMCH)\/([^/]+)\.json$/);
  return match ? `${match[1]}/${match[2]}` : undefined;
};

const correctionsByIdentity = new Map(
  Object.entries(correctionModules)
    .map(([modulePath, value]) => {
      const identity = moduleIdentity(modulePath);
      return identity ? [identity, value] as const : undefined;
    })
    .filter(
      (entry): entry is readonly [string, Record<string, unknown>] =>
        entry !== undefined,
    ),
);

const modules = Object.fromEntries(
  Object.entries(rawModules).map(([modulePath, rawValue]) => {
    const identity = moduleIdentity(modulePath);
    return [
      modulePath,
      identity ? correctionsByIdentity.get(identity) ?? rawValue : rawValue,
    ];
  }),
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
  '14_ed_metabolic': 'Metabolic & Electrolytes',
  '15_ed_general_surgery': 'General Surgery',
  '13_ed_infectious_diseases': 'Infectious Diseases',
  'psychiatry': 'Psychiatry & Mental Health',
  // Same wording as `17_ed_critical_care` so one concept has one heading.
  'resuscitation': 'Critical Care & Resuscitation',
  'airway': 'Airway & Ventilation',
  'medical_emergencies': 'Medical Emergencies',
  'trauma': 'Trauma',
  'antimicrobials': 'Antimicrobials',
  'cardiovascular': 'Cardiovascular',
  'sedation': 'Sedation & Analgesia',
  'metabolic': 'Metabolic & Electrolytes',
  'neurology': 'Neurology',
};

const HJH_PROTOCOLS_BY_CATEGORY: Record<string, readonly string[]> = {
  '02_ed_trauma_ortho': [
    'back_pain',
    // Burns and head injury are filed here rather than under the separate
    // trauma-surgical umbrella so that the same topic sits under the same
    // heading as CMJAH's `burns` and RMMCH's `head_injuries`.
    'burns',
    'compartment_syndrome',
    'crush_injury',
    'c_spine_imaging',
    'head_injury',
    'trauma_basics',
  ],
  '03_ed_cardiovascular': [
    'acs_workup_algorithm',
    'actilyse_protocol',
    'acute_coronary_syndrome_acs_algorithm',
    'acute_heart_failure_ahf',
    'atrial_fibrillation_af',
    'hypertension_flowchart',
    'hypertensive_emergencies',
    'intermediate_low_risk_chest_pain',
    'nstemi_management',
    'stemi_equivalents_sgarbossa_criteria',
    'stemi_management',
    'syncope',
    'syncope_ecg',
    'vascular_emergencies_aaa_dissection_limb_ischaemia',
  ],
  '04_ed_neurology': [
    'acute_ischaemic_stroke',
    'dizziness_vertigo_hints_exam',
    'first_onset_seizures',
    'headache_red_flags_primary_syndromes',
    'raised_icp',
    'status_epilepticus',
    'status_epilepticus_algorithm',
    'subarachnoid_haemorrhage',
  ],
  '05_ed_pulmonary': [
    'asthma_exacerbation',
    'asthma_pefr',
    'community_acquired_pneumonia',
    'copd_exacerbation',
    'dvt',
    'pe_algorithm',
    'pulmonary_embolism',
  ],
  '06_ed_airway': [
    'airway_management_checklist_rsi',
    'difficult_airway',
    'non_invasive_ventilation',
    'ventilator_guidelines',
  ],
  '07_ed_ent': ['ent_emergencies'],
  '08_ed_obstetrics_gynaecology': [
    'sexual_assault',
    'vaginal_bleeding_ed_management',
  ],
  '11_ed_medical_emergencies': [
    'gastroenteritis_paediatrics',
    'haematological_emergencies',
    'hyperthermia',
    'hypothermia',
    'liver_failure',
    'oncological_emergencies',
    'ophthalmology_emergencies',
    'renal_colic',
  ],
  '12_ed_toxicology': [
    'acetylcholinesterase_inhibitor_overdose',
    'anaphylaxis',
    'angioedema',
    'ccb_bb_overdose',
    'general_toxicology',
    'isoniazid_overdose',
    'paracetamol_nomogram',
    'paracetamol_overdose',
    'salicylate_overdose',
    'scorpion_envenomation',
    'snakebite',
    'tca_overdose',
    'toxic_alcohol',
    'toxidromes',
    'warfarin_toxicity',
  ],
  '13_ed_infectious_diseases': [
    'malaria_uncomplicated_complicated',
    'meningococcal_prophylaxis',
    'post_exposure_prophylaxis',
    'rabies_animal_bites',
    'tetanus',
  ],
  '14_ed_metabolic': [
    'diabetic_ketoacidosis_dka',
    'hyperglycaemia_flowchart',
    'hyperkalaemia',
    'hypernatraemia',
    'hypoglycaemia',
    'hypokalaemia',
    'hyponatraemia',
    'indications_dialysis',
    'thyroid_emergencies',
  ],
  '14_ed_psychiatry': [
    'agitation_aggression',
    'mental_health_psychosis',
  ],
  '15_ed_general_surgery': [
    'acute_appendicitis',
    'acute_cholecystitis',
    'jaundice_flowchart',
    'upper_gastrointestinal_bleed_ugib',
  ],
  '15_ed_procedures': [
    'femoral_nerve_block',
    'infusions',
    'pain_management',
    'procedural_sedation',
  ],
  '16_ed_administration': [
    'medicolegal_recordkeeping',
    'triage_tews',
  ],
  '17_ed_critical_care': [
    'aha_resuscitation_algorithms',
    'blood_products',
    'brainstem_death',
    'critical_care_principles',
    'sepsis_septic_shock',
  ],
};

const CMJAH_PROTOCOLS_BY_CATEGORY: Record<string, readonly string[]> = {
  '02_ed_trauma_ortho': [
    'back_pain',
    'burns',
    'crush_injury',
  ],
  '03_ed_cardiovascular': [
    'acs_workup_algorithm',
    'actilyse_protocol',
    'acute_heart_failure',
    'atrial_fibrillation',
    'hypertension_approach',
    'hypertension_management',
    'intermediate_low_risk_chest_pain',
    'nstemi_management',
    'stemi_equivalents',
    'stemi_management',
    'syncope',
    'syncope_ecg',
    'vascular_emergencies',
  ],
  '04_ed_neurology': [
    'acute_ischaemic_stroke',
    'dizziness_vertigo',
    'first_onset_seizures',
    'headache',
    'status_epilepticus',
    'status_epilepticus_algorithm',
    'subarachnoid_haemorrhage',
  ],
  '05_ed_pulmonary': [
    'asthma',
    'asthma_pefr',
    'community_acquired_pneumonia',
    'copd',
    'dvt',
    'pe_algorithm',
    'pulmonary_embolism',
  ],
  '06_ed_airway': [
    'difficult_airway',
    'non_invasive_ventilation',
  ],
  '07_ed_ent': ['epistaxis'],
  '08_ed_obstetrics_gynaecology': ['vaginal_bleeding'],
  '09_ed_paediatrics': [
    'antibiotic_guidelines_paediatric',
    'gastroenteritis_paediatrics',
  ],
  '11_ed_medical_emergencies': [
    'haematological_emergencies',
    'hyperthermia',
    'hypothermia',
    'liver_failure',
    'oncological_emergencies',
    'renal_colic',
  ],
  '12_ed_toxicology': [
    'acetylcholinesterase_inhibitor_overdose',
    'anaphylaxis',
    'ccb_bb_overdose',
    'general_toxicology',
    'isoniazid_overdose',
    'paracetamol_nomogram',
    'paracetamol_overdose',
    'salicylate_overdose',
    'scorpion_envenomation',
    'snakebite',
    'tca_overdose',
    'toxic_alcohol',
    'toxidromes',
  ],
  '13_ed_infectious_diseases': [
    'malaria',
    'tetanus',
  ],
  '14_ed_metabolic': [
    'dka_hhs',
    'hyperglycaemia_approach',
    'hyperkalaemia',
    'hypernatraemia',
    'hypokalaemia',
    'hyponatraemia',
    'indications_dialysis',
    'thyroid_emergencies',
  ],
  '14_ed_psychiatry': [
    'agitated_patient',
    'mental_health_psychosis',
  ],
  '15_ed_general_surgery': [
    'acute_appendicitis',
    'acute_cholecystitis',
    'jaundice_approach',
    'ugib',
  ],
  '15_ed_procedures': [
    'femoral_nerve_block',
    'infusions',
    'pain_management',
  ],
  '16_ed_administration': ['triage'],
  '17_ed_critical_care': [
    'aha_resuscitation_algorithms',
    'blood_products',
    'critical_care_principles',
    'sepsis_septic_shock',
  ],
};

const RMMCH_PROTOCOLS_BY_CATEGORY: Record<string, readonly string[]> = {
  '02_ed_trauma_ortho': [
    'c_spine_injuries',
    'ct_c_spine_protocol',
    'head_injuries',
    'rmmch-traumatic-cardiac-arrest',
    'traumatic_cardiac_arrest',
  ],
  '03_ed_cardiovascular': [
    'bradycardia',
    'rmmch-bradycardia',
    'rmmch-pediatric-bradycardia',
    'rmmch-tachycardia',
    'tachycardia',
  ],
  '04_ed_neurology': [
    'ctb_protocol',
    'headaches',
    'neuro_prognostication',
    'rmmch-status-epilepticus',
    'seizures_convulsions',
  ],
  '05_ed_pulmonary': [
    'acute_asthma',
    'rmmch-acute-asthma',
  ],
  '06_ed_airway': [
    'airway_management_advanced',
    'rmmch-advanced-airway-management',
    'rsi_checklist',
  ],
  '09_ed_paediatrics': [
    'rmmch-acute-gastroenteritis-paediatric',
    'rmmch-croup',
  ],
  '11_ed_medical_emergencies': [],
  '12_ed_toxicology': [
    'anaphylaxis',
    'opioid_overdose',
    'rmmch-anaphylaxis',
    'toxidromes',
  ],
  '13_ed_infectious_diseases': [
    'animal_mammalian_bites',
    'notifiable_conditions',
    'rabies_prophylaxis',
    'rmmch-animal-mammalian-bites',
    'rmmch-tetanus-prophylaxis',
    'tetanus_prophylaxis',
  ],
  '14_ed_metabolic': ['hyperthyroidism'],
  '15_ed_general_surgery': [
    'rmmch-upper-git-bleed',
    'upper_git_bleed',
  ],
  '15_ed_procedures': [
    'analgesia',
    'efast',
    'procedural_sedation_analgesia',
    'rmmch-analgesia',
  ],
  '16_ed_administration': [
    'customer_service',
    'medicolegal_documentation',
    'triage',
  ],
  '17_ed_critical_care': [
    'brain_death_testing',
    'cardiac_arrest_adult_paediatric',
    'post_cardiac_arrest_care',
    'reversible_causes_hs_ts',
    'rmmch-cardiac-arrest-adult-and-paediatric',
    'rmmch-neonatal-resuscitation',
    'rmmch-post-cardiac-arrest-care',
    'rmmch-sepsis-and-septic-shock',
    'sepsis_septic_shock',
  ],
};

const CHBAH_PROTOCOLS_BY_CATEGORY: Record<string, readonly string[]> = {
  '03_ed_cardiovascular': [
    'chbah-amiodarone-chbah-icu',
    'chbah-dobutamine-infusion-chbah-icu',
    'chbah-dopamine-infusion-chbah-icu',
    'chbah-esmolol-chbah-icu',
    'chbah-furosemide-chbah-icu',
    'chbah-labetalol-chbah-icu',
    'chbah-milrinone-chbah-icu',
    'chbah-nitroglycerin-infusion-chbah-icu',
    'chbah-noradrenaline-infusion-chbah-icu',
    'chbah-phenylephrine-infusion-chbah-icu',
  ],
  '04_ed_neurology': [
    'chbah-atracurium-chbah-icu',
    'chbah-cisatracurium-chbah-icu',
    'chbah-dexmedetomidine-chbah-icu',
    'chbah-fentanyl-chbah-icu',
    'chbah-ketamine-infusion-chbah-icu',
    'chbah-levetiracetam-keppra-chbah-icu',
    'chbah-mannitol-chbah-icu',
    'chbah-midazolam-chbah-icu',
    'chbah-morphine-chbah-icu',
    'chbah-phenytoin-chbah-icu',
    'chbah-propofol-infusion-chbah-icu',
    'chbah-rocuronium-chbah-icu',
    'chbah-suxamethonium-chbah-icu',
    'chbah-valproate-chbah-icu',
  ],
  '11_ed_medical_emergencies': [
    'chbah-dexamethasone-chbah-icu',
    'chbah-hydrocortisone-chbah-icu',
    'chbah-methylprednisolone-chbah-icu',
  ],
  '12_ed_toxicology': [
    'chbah-flumazenil-anexate-chbah-icu',
    'chbah-naloxone-chbah-icu',
    'chbah-neostigmine-chbah-icu',
  ],
  '13_ed_infectious_diseases': [
    'chbah-acyclovir-chbah-icu',
    'chbah-amikacin-chbah-icu',
    'chbah-amoxicillin-chbah-icu',
    'chbah-amoxicillin-clavulanate-augmentin-chbah-icu',
    'chbah-amphotericin-b-chbah-icu',
    'chbah-ampicillin-chbah-icu',
    'chbah-azithromycin-chbah-icu',
    'chbah-aztreonam-chbah-icu',
    'chbah-caspofungin-chbah-icu',
    'chbah-cefazolin-chbah-icu',
    'chbah-cefepime-chbah-icu',
    'chbah-cefotaxime-chbah-icu',
    'chbah-ceftazidime-chbah-icu',
    'chbah-ceftriaxone-chbah-icu',
    'chbah-cefuroxime-chbah-icu',
    'chbah-ciprofloxacin-chbah-icu',
    'chbah-clarithromycin-chbah-icu',
    'chbah-clindamycin-chbah-icu',
    'chbah-cloxacillin-chbah-icu',
    'chbah-colistin-chbah-icu',
    'chbah-cotrimoxazole-chbah-icu',
    'chbah-doxycycline-chbah-icu',
    'chbah-ertapenem-chbah-icu',
    'chbah-erythromycin-chbah-icu',
    'chbah-fluconazole-chbah-icu',
    'chbah-gentamicin-chbah-icu',
    'chbah-imipenem-chbah-icu',
    'chbah-linezolid-chbah-icu',
    'chbah-meropenem-chbah-icu',
    'chbah-metronidazole-chbah-icu',
    'chbah-moxifloxacin-chbah-icu',
    'chbah-piperacillin-tazobactam-tazocin-chbah-icu',
    'chbah-vancomycin-chbah-icu',
  ],
  '14_ed_metabolic': [
    'chbah-hyperkalaemia-management-chbah-icu',
    'chbah-magnesium-replacement-chbah-icu',
    'chbah-phosphate-replacement-chbah-icu',
    'chbah-potassium-replacement-chbah-icu',
  ],
};

const assignmentsFor = (
  protocolsByCategory: Record<string, readonly string[]>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(protocolsByCategory).flatMap(([categoryId, slugs]) =>
      slugs.map(slug => [slug, categoryId]),
    ),
  );

export const FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS: Record<
  HospitalId,
  Record<string, string>
> = {
  hjh: assignmentsFor(HJH_PROTOCOLS_BY_CATEGORY),
  cmjah: assignmentsFor(CMJAH_PROTOCOLS_BY_CATEGORY),
  rmmch: assignmentsFor(RMMCH_PROTOCOLS_BY_CATEGORY),
  chbah: {},
};

export const HJH_PROTOCOL_CATEGORY_ASSIGNMENTS =
  FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS.hjh;

const PROTOCOL_CATEGORY_OVERRIDES: Record<string, string> = Object.fromEntries(
  Object.entries(FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS).flatMap(
    ([facilityId, assignments]) =>
      Object.entries(assignments).map(([slug, categoryId]) => [
        `${facilityId}:${slug}`,
        categoryId,
      ]),
  ),
);

/**
 * Titles the supplied archive stores with characters the extraction dropped.
 * Keyed by `facilityId:slug`; the wording otherwise matches the source record.
 */
const PROTOCOL_TITLE_OVERRIDES: Record<string, string> = {
  // Archive title begins `-Blocker`; the leading beta symbol did not survive.
  'hjh:ccb_bb_overdose': 'β-Blocker & Calcium-Channel Blocker Overdose',
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
  const protocolId = `${facilityId}:${slug}`;
  const title =
    PROTOCOL_TITLE_OVERRIDES[protocolId] ||
    asString(meta.title) ||
    asString(body.item) ||
    asString(body.drug) ||
    titleFromFilename(filename);
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
