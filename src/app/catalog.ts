import {
  PARSED_GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
} from '../clinical/globalReferenceDocuments';
import {
  isHospitalId,
  type HospitalId,
} from '../clinical/hospitalProtocols';
import {
  TRIALS_REFERENCE,
  type TrialReferenceEntry,
} from '../clinical/trialsReference';

export const POCKET_GUIDE_COUNT = PARSED_GLOBAL_REFERENCE_DOCUMENTS.pocket.entries.length;
export const GLOBAL_REFERENCE_CATEGORY_IDS = [
  'landmark_studies',
  'international_guidelines',
  'pocket_guides',
] as const;
export const GLOBAL_REFERENCE_COUNTS: Partial<Record<string, number>> = {
  landmark_studies: TRIALS_REFERENCE.length,
  international_guidelines: SUPPLIED_GUIDELINE_LINK_AUDIT.guidelineCount,
  pocket_guides: POCKET_GUIDE_COUNT,
};

export const TRIAL_TYPE_PRESENTATION: Record<
  TrialReferenceEntry['type'],
  {label: string; className: string}
> = {
  clinical_trial: {
    label: 'Trial',
    className: 'bg-sky-950/60 text-sky-300 border-sky-800/40',
  },
  clinical_decision_rule: {
    label: 'Decision Rule',
    className: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
  },
  guideline: {
    label: 'Guideline',
    className: 'bg-violet-950/60 text-violet-300 border-violet-800/40',
  },
  observational_study: {
    label: 'Observational',
    className: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40',
  },
  ongoing_trial: {
    label: 'Ongoing Trial',
    className: 'bg-orange-950/60 text-orange-300 border-orange-800/40',
  },
  methodology: {
    label: 'Methodology',
    className: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

// Category mapping keys
export const CATEGORIES: Record<string, string> = {
  home: 'Home',
  favourites: 'Favourites',
  recently_viewed: 'Recently Viewed',
  bara_icu_card: 'Bara ICU Dosing Card',
  helen_guidelines: 'Helen Joseph Guidelines',
  cmjah_guidelines: 'CMJAH Guidelines',
  rmmch_guidelines: 'RMMCH Guidelines',
  edl_phc_guidelines: 'SA EDL / PHC Guidelines',
  landmark_studies: 'Landmark Studies',
  international_guidelines: 'International Guidelines',
  pocket_guides: 'Pocket Guides',
  mindmaps: 'Resuscitation Mind Maps',
  policies: 'Hospital SOPs & Policies',
  all: 'All Categories',
  '1_resuscitation_fluids_and_inotropes': 'Resuscitation',
  '2_airway_and_ventilation': 'Airway & Ventilation',
  '3_sedation_analgesia_and_neurology': 'Sedation & Neurology',
  '4_antimicrobials_and_infectious_diseases': 'Antimicrobials',
  '5_metabolic_electrolytes_and_nutrition': 'Metabolic & Nutrition',
  '6_poisoning_and_toxicology': 'Toxicology',
  '7_useful_formulae': 'Useful Formulae',
  '8_cardiovascular': 'Cardiovascular',
  '9_blood_products': 'Blood Products',
  '10_endocrine_and_other': 'Endocrine & Other',
  '11_ed_medical_emergencies': 'ED Medical Emergencies',
  '12_ed_toxicology': 'ED Toxicology',
  '13_ed_trauma_surgical': 'ED Trauma & Surgical',
  '14_ed_metabolic': 'ED Metabolic',
  '15_ed_procedures': 'ED Procedures',
  '16_score_calculators': 'Score Calculators',
  '17_phc_primary_care': 'Primary Health Care'
};

export const CATEGORY_ICONS: Record<string, string> = {
  home: '🏠',
  favourites: '⭐',
  recently_viewed: '⏱️',
  bara_icu_card: '🏥',
  helen_guidelines: '🩺',
  cmjah_guidelines: '🏨',
  rmmch_guidelines: '👶',
  edl_phc_guidelines: '🇿🇦',
  landmark_studies: '🔬',
  international_guidelines: '🌐',
  pocket_guides: '📘',
  mindmaps: '⚡',
  policies: '📑',
  all: '📋',
  '1_resuscitation_fluids_and_inotropes': '💉',
  '2_airway_and_ventilation': '🫁',
  '3_sedation_analgesia_and_neurology': '🧠',
  '4_antimicrobials_and_infectious_diseases': '🦠',
  '5_metabolic_electrolytes_and_nutrition': '⚗️',
  '6_poisoning_and_toxicology': '☠️',
  '7_useful_formulae': '📐',
  '8_cardiovascular': '❤️',
  '9_blood_products': '🩸',
  '10_endocrine_and_other': '🔬',
  '11_ed_medical_emergencies': '🩺',
  '12_ed_toxicology': '☣️',
  '13_ed_trauma_surgical': '🚑',
  '14_ed_metabolic': '🧬',
  '15_ed_procedures': '🛠️',
  '16_score_calculators': '📊',
  '17_phc_primary_care': '💊'
};

// Source preference order used when grouping/sorting entries within a category.
// Entries are shown institution-by-institution so duplicates across hospitals
// are easy to scan and compare while remaining independent.
export const SOURCE_GROUP_ORDER = ['hjh', 'rmmch', 'cmjah', 'chbah', 'bara_icu', 'edl_phc'];

export const ORDER = [
  'home',
  'landmark_studies',
  'international_guidelines',
  'pocket_guides',
  'favourites',
  'recently_viewed',
  'bara_icu_card',
  'helen_guidelines',
  'cmjah_guidelines',
  'rmmch_guidelines',
  'edl_phc_guidelines',
  'mindmaps',
  'policies',
  'all',
  '1_resuscitation_fluids_and_inotropes',
  '2_airway_and_ventilation',
  '3_sedation_analgesia_and_neurology',
  '4_antimicrobials_and_infectious_diseases',
  '5_metabolic_electrolytes_and_nutrition',
  '6_poisoning_and_toxicology',
  '7_useful_formulae',
  '8_cardiovascular',
  '9_blood_products',
  '10_endocrine_and_other',
  '11_ed_medical_emergencies',
  '12_ed_toxicology',
  '13_ed_trauma_surgical',
  '14_ed_metabolic',
  '15_ed_procedures',
  '16_score_calculators',
  '17_phc_primary_care'
];

// Facility/pillar categories - each is its own protocol set and must never
// share the quick-access bar with another facility's protocols.
export const PILLAR_CATEGORY_IDS = [
  'helen_guidelines',
  'cmjah_guidelines',
  'bara_icu_card',
  'rmmch_guidelines',
  'edl_phc_guidelines',
] as const;

export const NUMBERED_CATEGORY_IDS = ORDER.filter(categoryId => /^\d+_/.test(categoryId));

export const UTILITY_CATEGORY_IDS = [
  'favourites',
  'recently_viewed',
  'mindmaps',
  'policies',
  'all',
] as const;

// Passed to renderCategorySect to select which entries render, by their
// per-item _meta.sourceGroup: a single value (the Helen/CMJAH pillars, which
// need an exact source match) or a list of values (Bara/EDL, whose pillars
// each cover more than one sourceGroup - see renderBaraIcuCardView).
export type SourceGroupFilter = 'hjth' | 'cmjah' | 'rmmch' | ReadonlyArray<'bara_icu' | 'chbah' | 'edl_phc'> | undefined;

// Explicit protocol-title -> mind map id links, for the protocols that have a
// genuine matching interactive flowchart. Most protocols don't have one yet —
// this is intentionally a short, curated list rather than a fuzzy title match.
export const PROTOCOL_MINDMAP_LINKS: Record<string, string> = {
  'Acute Coronary Syndrome (ACS) Algorithm': 'acs_stemi_flowchart',
  'STEMI Equivalents & Sgarbossa Criteria': 'acs_stemi_flowchart',
  'Acute Ischaemic Stroke': 'stroke_thrombolysis',
  'Diabetic Ketoacidosis (DKA)': 'dka_hhs_flowchart',
  'Diabetic Ketoacidosis (DKA) & HHS': 'dka_hhs_flowchart',
  // Hypertension, PE and syncope titles previously linked to ids that only
  // exist in the protocol-page flowchart registry (or nowhere, for syncope),
  // so the viewer silently fell back to the adult cardiac arrest map. Those
  // links are removed; the pathways render on their own protocol pages.
  'Hyperglycaemia Flowchart': 'dka_hhs_flowchart',
  'Jaundice Flowchart': 'jaundice_flowchart',
  'Liver Failure': 'jaundice_flowchart',
  'Status Epilepticus': 'status_epilepticus',
  'Status Epilepsy Anticonvulsant Therapy Algorithm': 'status_epilepticus',
  'Anaphylaxis': 'anaphylaxis_flowchart',
  'Agitation & Aggression': 'psychosis_flowchart',
  'Mental Health / Psychosis': 'psychosis_flowchart',
  // RMMCH title variants that share the same interactive pathways.
  'Anaphylaxis (RMMCH)': 'anaphylaxis_flowchart',
  'Seizures / Convulsions - Status Epilepticus (RMMCH)': 'status_epilepticus',
  // CMJAH title variants that share existing interactive pathways.
  'Anaphylaxis (CMJAH)': 'anaphylaxis_flowchart',
  'Status Epilepticus (CMJAH)': 'status_epilepticus',
  'Hyperglycaemic Emergencies (DKA/HHS) (CMJAH)': 'dka_hhs_flowchart',
  'Snakebite Pathway (CMJAH)': 'snakebite_pathway',
  'The Agitated Patient (CMJAH)': 'psychosis_flowchart',
};

export const FACILITY_CATEGORY: Record<HospitalId, string> = {
  hjh: 'helen_guidelines',
  cmjah: 'cmjah_guidelines',
  chbah: 'bara_icu_card',
  rmmch: 'rmmch_guidelines',
};

export const CATEGORY_FACILITY: Record<string, HospitalId | undefined> = {
  helen_guidelines: 'hjh',
  cmjah_guidelines: 'cmjah',
  bara_icu_card: 'chbah',
  rmmch_guidelines: 'rmmch',
};

// Source group labels and colour classes used throughout the UI to identify
// which institution a clinical entry belongs to.
export const SOURCE_GROUP_META: Record<string, { label: string; short: string; emoji: string; badgeClass: string; lightBadgeClass: string }> = {
  hjh: {
    label: 'Helen Joseph Hospital (HJH)',
    short: 'HJH',
    emoji: '🩺',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/40',
    lightBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  cmjah: {
    label: 'Charlotte Maxeke Academic Hospital (CMJAH)',
    short: 'CMJAH',
    emoji: '🏨',
    badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-800/40',
    lightBadgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  rmmch: {
    label: 'Rahima Moosa Mother & Child Hospital (RMMCH)',
    short: 'RMMCH',
    emoji: '👶',
    badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-800/40',
    lightBadgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  chbah: {
    label: 'Chris Hani Baragwanath Academic Hospital (CHBAH / Bara)',
    short: 'Bara',
    emoji: '🏥',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40',
    lightBadgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  bara_icu: {
    label: 'Bara ICU Dosing Card',
    short: 'Bara ICU',
    emoji: '🏥',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40',
    lightBadgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  edl_phc: {
    label: 'SA EDL / PHC Guidelines',
    short: 'EDL/PHC',
    emoji: '🇿🇦',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/40',
    lightBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

export const getSourceGroupMeta = (group?: string, fallbackLabel?: string) => {
  const meta = SOURCE_GROUP_META[group || ''];
  if (meta) return meta;
  return {
    label: fallbackLabel || group || 'Clinical reference',
    short: fallbackLabel || group || 'Reference',
    emoji: '📋',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    lightBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };
};

export const parseHospitalHash = (): {facilityId: HospitalId; slug?: string} | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.hash.match(/^#\/hospital\/(hjh|cmjah|chbah|rmmch)(?:\/([^/?#]+))?$/);
  if (!match || !isHospitalId(match[1])) return null;
  return {
    facilityId: match[1],
    slug: match[2] ? decodeURIComponent(match[2]) : undefined,
  };
};
