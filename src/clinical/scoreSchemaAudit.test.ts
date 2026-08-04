import {describe, expect, it} from 'vitest';
import type {CanonicalEntryFile} from './entryNormalize';

// Deterministic structural audit over every score calculator. These invariants
// are the bug *classes* found during the clinical audit (e.g. the NIHSS sentinel
// that inflated the total past the top interpretation band). Encoding them here
// turns a one-off review into a permanent guard: any future score that ships a
// duplicate component key, an overlapping/gapped interpretation band, or a total
// that can exceed its top band fails CI.

const scoreFiles = import.meta.glob<CanonicalEntryFile>(
  './entries/16_score_calculators/*.json',
  {eager: true, import: 'default'},
);

interface Option {
  value?: number;
  points?: number;
}
interface Component {
  key?: string;
  name?: string;
  points?: number;
  options?: Option[];
}
interface Band {
  min: number;
  max: number;
}
interface ScoreRecord {
  calculator_type?: string;
  components?: Component[];
  interpretation?: unknown;
  mutually_exclusive_groups?: string[][];
}

const optionValues = (component: Component): number[] => {
  if (Array.isArray(component.options) && component.options.length > 0) {
    return component.options.map(o => o.value ?? o.points ?? 0);
  }
  // binary checklist component: absent (0) or its point value
  return [0, component.points ?? 1];
};

const componentKey = (component: Component): string =>
  component.key ?? component.name ?? '';

// Achievable total accounting for mutually-exclusive groups, mirroring the
// scorer in App.tsx: within an exclusive group only the single best (max) or
// least (min) member is counted, not the sum.
const achievable = (record: ScoreRecord, pick: 'min' | 'max'): number => {
  const components = record.components ?? [];
  const per = new Map<string, number>();
  for (const component of components) {
    const values = optionValues(component);
    per.set(componentKey(component), pick === 'max' ? Math.max(...values) : Math.min(...values));
  }
  let total = 0;
  for (const value of per.values()) total += value;
  for (const group of record.mutually_exclusive_groups ?? []) {
    const members = group.map(k => per.get(k) ?? 0);
    if (members.length > 1) {
      const kept = pick === 'max' ? Math.max(...members) : Math.min(...members);
      const summed = members.reduce((a, b) => a + b, 0);
      total -= summed - kept;
    }
  }
  return total;
};

const numericBands = (record: ScoreRecord): Band[] | null => {
  const interp = record.interpretation;
  if (!Array.isArray(interp) || interp.length === 0) return null;
  if (!interp.every(b => typeof b?.min === 'number' && typeof b?.max === 'number')) {
    return null; // condition-based (e.g. NEXUS all_no/any_yes) — not a numeric ladder
  }
  return [...(interp as Band[])].sort((a, b) => a.min - b.min);
};

const entries = Object.entries(scoreFiles).map(([path, file]) => ({
  slug: path.split('/').pop()!.replace('.json', ''),
  record: file.record as unknown as ScoreRecord,
}));

describe('score calculator structural audit', () => {
  it('covers the whole score library', () => {
    expect(entries.length).toBeGreaterThan(40);
  });

  for (const {slug, record} of entries) {
    if (record.calculator_type === 'formula') continue;
    const components = record.components;
    if (!Array.isArray(components) || components.length === 0) continue;

    describe(slug, () => {
      it('has unique component keys', () => {
        const keys = components.map(componentKey);
        expect(new Set(keys).size, `${slug} duplicate keys: ${keys}`).toBe(keys.length);
      });

      const bands = numericBands(record);
      if (bands) {
        it('has non-overlapping, gap-free interpretation bands', () => {
          for (let i = 1; i < bands.length; i++) {
            const prev = bands[i - 1];
            const cur = bands[i];
            expect(cur.min, `${slug}: band overlap`).toBeGreaterThan(prev.max);
            expect(cur.min, `${slug}: band gap after ${prev.max}`).toBeLessThanOrEqual(prev.max + 1);
          }
        });

        it('interpretation bands cover the full achievable score range', () => {
          const lo = achievable(record, 'min');
          const hi = achievable(record, 'max');
          // A total above the top band would render with no interpretation —
          // this is the class of defect the NIHSS sentinel produced.
          expect(bands[bands.length - 1].max, `${slug}: max achievable ${hi} exceeds top band`).toBeGreaterThanOrEqual(hi);
          expect(bands[0].min, `${slug}: min achievable ${lo} below first band`).toBeLessThanOrEqual(lo);
        });
      }
    });
  }
});
