import {describe, expect, it} from 'vitest';
import gbs from './entries/16_score_calculators/glasgow_blatchford.json';
import cSpine from './entries/16_score_calculators/canadian_cspine.json';
import nihss from './entries/16_score_calculators/nihss.json';
import errata from '../../clinical-sources/errata.json';

// Characterization + golden tests for the PR 2 clinical-content corrections.
// Each assertion reproduces a defect the previous data would have failed, so a
// regression that reintroduces the unsafe value is caught in CI.

interface Option {
  label: string;
  value: number;
}
interface Component {
  name: string;
  key: string;
  options?: Option[];
  dangerous?: boolean;
}

const componentByKey = (record: {components: Component[]}, key: string) => {
  const component = record.components.find(c => c.key === key);
  if (!component) throw new Error(`missing component ${key}`);
  return component;
};

describe('Glasgow-Blatchford urea thresholds match the published score', () => {
  const urea = componentByKey(gbs.record as {components: Component[]}, 'bun');

  it('uses blood urea in mmol/L, not "BUN"', () => {
    expect(urea.name).toBe('Blood urea (mmol/L)');
  });

  it('bins urea at the published Blatchford breakpoints (6.5 / 8 / 10 / 25)', () => {
    expect(urea.options).toEqual([
      {label: '< 6.5', value: 0},
      {label: '6.5 - 7.9', value: 2},
      {label: '8.0 - 9.9', value: 3},
      {label: '10.0 - 24.9', value: 4},
      {label: '>= 25.0', value: 6},
    ]);
  });

  it('no longer awards points below the 6.5 mmol/L threshold', () => {
    // Regression guard for the old "4.0 - 5.9 -> 2" band that scored a normal urea.
    const belowThreshold = urea.options!.filter(o => /^(< 6\.5|[0-5]\.)/.test(o.label));
    expect(belowThreshold.every(o => o.value === 0)).toBe(true);
  });
});

describe('Canadian C-Spine Rule age-threshold discrepancy is flagged', () => {
  // canadian_cspine is a SUPPLIED record: its canonical `record` must mirror the
  // immutable, hash-locked raw archive byte-for-byte (enforced by
  // referenceCoverage.test.ts). HJH page 54 prints "Age > 65", but the validated
  // rule (Stiell et al.) is "Age >= 65". Correcting the displayed value therefore
  // has to go through the reviewed runtime-corrections overlay, not a direct edit
  // of the source-mirrored record. Until that lands, this test locks the flagging:
  // the discrepancy is recorded in errata and the entry is marked clinical-review.
  const record = cSpine.record as {components: Component[]};
  const age = componentByKey(record, 'age_65');

  it('still mirrors the supplied source text pending the corrections overlay', () => {
    expect(age.name).toBe('Age > 65 years');
    expect(age.dangerous).toBe(true);
  });

  it('is marked for clinical review and linked to errata ERR-HJH-007', () => {
    expect((cSpine as {reviewState: string}).reviewState).toBe('clinical-review');
    expect((cSpine as {errata: string[]}).errata).toContain('ERR-HJH-007');
  });

  it('records the divergence from the printed HJH source in the errata register', () => {
    const hjh = errata.registers.find(r => r.sourceId === 'hjh-ed-2026-v1');
    const item = hjh?.items.find(i => i.id === 'ERR-HJH-007');
    expect(item).toBeDefined();
    expect(item?.pdfPages).toContain(54);
    expect(item?.issue).toMatch(/>= ?65|≥ ?65/);
  });
});

describe('NIHSS untestable options are not summed into the total', () => {
  const record = nihss.record as {components: Component[]};
  const untestable = record.components
    .flatMap(c => c.options ?? [])
    .filter(o => /untestable/i.test(o.label));

  it('marks the amputation/joint-fusion and intubation options as untestable', () => {
    // items 5a, 5b, 6a, 6b (motor limbs) and 10 (dysarthria)
    expect(untestable).toHaveLength(5);
  });

  it('assigns untestable options a value of 0 (was the sentinel 9 that inflated the total)', () => {
    expect(untestable.every(o => o.value === 0)).toBe(true);
  });

  it('keeps the maximum achievable NIHSS at 42', () => {
    const maxTotal = record.components.reduce((sum, c) => {
      const values = (c.options ?? []).map(o => o.value);
      return sum + (values.length ? Math.max(...values) : 0);
    }, 0);
    expect(maxTotal).toBe(42);
  });
});
