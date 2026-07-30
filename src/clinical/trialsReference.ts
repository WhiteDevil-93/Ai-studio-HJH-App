import currentReference from '../trials-reference.json';
import reviewedV2Reference from '../trials-reference-v2.json';
import reviewedV3Reference from '../trials-reference-v3.json';

export interface TrialReferenceEntry {
  id: string;
  type:
    | 'clinical_trial'
    | 'clinical_decision_rule'
    | 'guideline'
    | 'observational_study'
    | 'ongoing_trial'
    | 'methodology';
  title: string;
  reference: string;
  source_url?: string;
  evidence_status?: 'published' | 'historical' | 'ongoing' | 'methodology';
  domain: string;
  the_hook: string;
  if_consultant_asks: string;
  killer_stat: string;
  shift_action?: string;
  review_note?: string;
}

export const TRIAL_REFERENCE_ALIASES: Readonly<Record<string, string>> = {
  'adapt-trial': 'adapt-2hr-adp',
  'process-trial': 'process-sepsis',
  'arise-trial': 'arise-sepsis',
  'promise-trial': 'promise-sepsis',
};

const mergedByCanonicalId = new Map<string, TrialReferenceEntry>();

for (const entry of [
  ...currentReference,
  ...reviewedV2Reference,
  ...reviewedV3Reference,
] as TrialReferenceEntry[]) {
  const canonicalId = TRIAL_REFERENCE_ALIASES[entry.id] ?? entry.id;
  mergedByCanonicalId.set(canonicalId, {...entry, id: canonicalId});
}

export const TRIALS_REFERENCE = [...mergedByCanonicalId.values()];
