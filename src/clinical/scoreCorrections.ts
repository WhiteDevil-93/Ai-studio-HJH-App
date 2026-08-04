import type {LegacyClinicalRecord} from './entryNormalize';

// Reviewed runtime-corrections overlay for score calculators.
//
// Some score calculators are SUPPLIED records whose canonical body must mirror
// the immutable, hash-locked raw archive byte-for-byte (enforced by
// referenceCoverage.test.ts). When a validated clinical source diverges from
// the printed HJH text, we must NOT edit the source-mirrored canonical file —
// that would corrupt provenance. Instead a reviewed correction is layered here
// to produce the *effective* runtime record the UI renders, with an explicit
// link to the errata entry and the clinical sign-off that authorised it.
//
// Invariant: effective runtime record === raw canonical record + these
// corrections. Each correction is validated at build time
// (scripts/validate-clinical-data.ts) against the errata register and the
// target entry/component so it can never silently orphan.

export interface ScoreComponentPatch {
  /** `key` of the component within the score record's `components` array. */
  componentKey: string;
  /** Fields to overwrite on the matched component. */
  set: {name?: string};
}

export interface ScoreCorrection {
  /** `<categoryId>/<subcategoryId>` of the target score entry. */
  entryId: string;
  /** Errata entry that records the source divergence. */
  errataId: string;
  /** ISO date of the two-person clinical sign-off. */
  reviewedOn: string;
  /** Human-readable rationale, shown in provenance. */
  note: string;
  componentPatches: ScoreComponentPatch[];
}

export const SCORE_CORRECTIONS: readonly ScoreCorrection[] = [
  {
    entryId: '16_score_calculators/canadian_cspine',
    errataId: 'ERR-HJH-007',
    reviewedOn: '2026-08-04',
    note:
      "HJH page 54 prints 'Age > 65'; the validated Canadian C-Spine Rule " +
      "(Stiell et al., JAMA 2001) uses 'Age >= 65 years'. Reviewed sign-off " +
      'authorised applying the validated threshold via this overlay so a ' +
      'patient of exactly 65 is treated as high-risk while the canonical entry ' +
      'continues to mirror the supplied source.',
    componentPatches: [
      {componentKey: 'age_65', set: {name: 'Age ≥ 65 years'}},
    ],
  },
];

const correctionsByEntryId = new Map(
  SCORE_CORRECTIONS.map(correction => [correction.entryId, correction]),
);

export function scoreCorrectionFor(
  categoryId: string,
  subcategoryId: string,
): ScoreCorrection | undefined {
  return correctionsByEntryId.get(`${categoryId}/${subcategoryId}`);
}

interface ScoreComponent {
  key?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Returns the effective record: the input untouched when no correction applies,
 * otherwise a deep clone with the reviewed patches applied. The input object
 * (an imported, shared canonical module) is never mutated.
 */
export function applyScoreCorrection(
  record: LegacyClinicalRecord,
  correction: ScoreCorrection | undefined,
): LegacyClinicalRecord {
  if (!correction) return record;

  const clone = structuredClone(record) as LegacyClinicalRecord & {
    components?: ScoreComponent[];
  };
  const components = clone.components;
  if (!Array.isArray(components)) {
    throw new Error(
      `${correction.entryId}: score correction expects a components array`,
    );
  }

  for (const patch of correction.componentPatches) {
    const component = components.find(item => item.key === patch.componentKey);
    if (!component) {
      throw new Error(
        `${correction.entryId}: component "${patch.componentKey}" not found for correction ${correction.errataId}`,
      );
    }
    Object.assign(component, patch.set);
  }

  return clone;
}
