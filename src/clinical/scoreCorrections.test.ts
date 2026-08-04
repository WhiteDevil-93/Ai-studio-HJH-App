import {describe, expect, it} from 'vitest';
import {clinicalData} from './legacyAdapter';
import {
  SCORE_CORRECTIONS,
  applyScoreCorrection,
  scoreCorrectionFor,
} from './scoreCorrections';
import rawCSpine from './entries/16_score_calculators/canadian_cspine.json';
import errata from '../../clinical-sources/errata.json';
import type {LegacyClinicalRecord} from './entryNormalize';

interface Component {
  key: string;
  name: string;
}
const ageName = (record: {components: Component[]}) =>
  record.components.find(c => c.key === 'age_65')!.name;

describe('reviewed score-corrections overlay', () => {
  it('leaves the source-mirrored canonical record untouched (still "Age > 65")', () => {
    // referenceCoverage.test.ts enforces this file mirrors the raw archive.
    expect(ageName(rawCSpine.record as {components: Component[]})).toBe(
      'Age > 65 years',
    );
  });

  it('applies the validated "Age ≥ 65" threshold to the effective runtime record', () => {
    const runtime = clinicalData['16_score_calculators'][
      'canadian_cspine'
    ] as unknown as {components: Component[]};
    expect(ageName(runtime)).toBe('Age ≥ 65 years');
  });

  it('does not mutate the input record when applying a correction', () => {
    const input = rawCSpine.record as unknown as LegacyClinicalRecord;
    const before = ageName(input as unknown as {components: Component[]});
    const output = applyScoreCorrection(
      input,
      scoreCorrectionFor('16_score_calculators', 'canadian_cspine'),
    );
    expect(output).not.toBe(input);
    expect(ageName(input as unknown as {components: Component[]})).toBe(before);
    expect(ageName(output as unknown as {components: Component[]})).toBe(
      'Age ≥ 65 years',
    );
  });

  it('returns the same reference when no correction applies (identity)', () => {
    const record = {components: []} as unknown as LegacyClinicalRecord;
    expect(applyScoreCorrection(record, undefined)).toBe(record);
  });

  it('links every correction to a resolved errata entry', () => {
    const registers = errata.registers as ReadonlyArray<{
      items: ReadonlyArray<{id: string; status?: string}>;
    }>;
    const items = registers.flatMap(r => r.items);
    const knownErrataIds = new Set(items.map(i => i.id));
    for (const correction of SCORE_CORRECTIONS) {
      expect(knownErrataIds.has(correction.errataId), correction.errataId).toBe(
        true,
      );
    }
    expect(items.find(i => i.id === 'ERR-HJH-007')?.status).toBe(
      'resolved-in-runtime',
    );
  });
});
