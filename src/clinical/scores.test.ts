import {describe, expect, it} from 'vitest';
import {calculateChecklistScore, evaluateCanadianCSpine, evaluateNews2} from './scores';
import news2Entry from './entries/16_score_calculators/news2.json';

describe('clinical score completion', () => {
  const criteria = [
    {key: 'a', points: 1},
    {key: 'b', points: 2},
  ];

  it('does not treat unanswered criteria as negative answers', () => {
    expect(calculateChecklistScore(criteria, {})).toEqual({
      score: 0,
      answeredCount: 0,
      complete: false,
    });
  });

  it('scores only explicit yes answers', () => {
    expect(calculateChecklistScore(criteria, {a: 'no', b: 'yes'})).toEqual({
      score: 2,
      answeredCount: 2,
      complete: true,
    });
  });
});

describe('HJH Canadian C-Spine workflow', () => {
  it('does not reach low-risk assessment before high-risk completion', () => {
    const result = evaluateCanadianCSpine({
      applicable: 'yes',
      highRisk: {age: 'no', mechanism: 'unanswered'},
      lowRisk: {sitting: 'yes'},
      rotation45Degrees: 'yes',
    });
    expect(result.state).toBe('high-risk-incomplete');
  });

  it('requires the final 45-degree rotation step', () => {
    const result = evaluateCanadianCSpine({
      applicable: 'yes',
      highRisk: {age: 'no', mechanism: 'no'},
      lowRisk: {sitting: 'yes', tendernessAbsent: 'no'},
      rotation45Degrees: 'unanswered',
    });
    expect(result.state).toBe('rotation-required');
  });
});

describe('evaluateNews2 (RCP escalation table)', () => {
  const KEYS = ['resp_rate', 'spo2', 'supplemental_o2', 'sbp', 'heart_rate', 'consciousness', 'temperature'];
  const allZero = Object.fromEntries(KEYS.map(k => [k, 0]));

  it('scores an entirely normal patient as low risk', () => {
    const result = evaluateNews2(KEYS, allZero);
    expect(result).toMatchObject({total: 0, complete: true, anySingleThree: false, risk: 'low'});
  });

  it('returns no risk band while any parameter is unanswered', () => {
    const result = evaluateNews2(KEYS, {...allZero, sbp: undefined});
    expect(result.complete).toBe(false);
    expect(result.risk).toBeNull();
  });

  it('aggregate 5-6 without a red score is medium risk', () => {
    // RR 21-24 (+2), SpO2 92-93 (+2), on oxygen (+2) = 6
    const result = evaluateNews2(KEYS, {...allZero, resp_rate: 2, spo2: 2, supplemental_o2: 2});
    expect(result.total).toBe(6);
    expect(result.anySingleThree).toBe(false);
    expect(result.risk).toBe('medium');
  });

  it('ENFORCES the red-score rule: a single parameter scoring 3 escalates a low total', () => {
    // SBP <= 90 (+3), everything else normal: total 3 would read "low" on the
    // aggregate bands, but the RCP table mandates urgent review.
    const result = evaluateNews2(KEYS, {...allZero, sbp: 3});
    expect(result.total).toBe(3);
    expect(result.anySingleThree).toBe(true);
    expect(result.risk).toBe('low-medium');
  });

  it('aggregate >= 7 is high risk', () => {
    // RR >= 25 (+3), HR >= 131 (+3), on oxygen (+2) = 8
    const result = evaluateNews2(KEYS, {...allZero, resp_rate: 3, heart_rate: 3, supplemental_o2: 2});
    expect(result.total).toBe(8);
    expect(result.risk).toBe('high');
  });

  it('band boundaries: 4 without red is low, 5 is medium, 7 is high', () => {
    // All values below exist on the printed chart (no parameter reaches 3).
    expect(evaluateNews2(KEYS, {...allZero, resp_rate: 2, spo2: 2}).risk).toBe('low');
    expect(evaluateNews2(KEYS, {...allZero, resp_rate: 2, spo2: 2, heart_rate: 1}).risk).toBe('medium');
    expect(evaluateNews2(KEYS, {...allZero, resp_rate: 2, spo2: 2, heart_rate: 2, temperature: 1}).risk).toBe('high');
  });

  it('carries the RCP SpO2 Scale 2 bands in the calculator entry', () => {
    const record = news2Entry.record as {
      components: Array<{key: string; options: Array<{label: string; value: number}>}>;
      mutually_exclusive_groups?: string[][];
    };
    const scale2 = record.components.find(component => component.key === 'spo2_scale2');
    expect(scale2, 'spo2_scale2 component').toBeDefined();
    const byLabel = Object.fromEntries(scale2!.options.map(option => [option.label, option.value]));
    // RCP NEWS2 chart, Scale 2 (target saturation 88-92%).
    expect(byLabel['<= 83']).toBe(3);
    expect(byLabel['84-85']).toBe(2);
    expect(byLabel['86-87']).toBe(1);
    expect(byLabel['88-92']).toBe(0);
    expect(byLabel['>= 93 on air']).toBe(0);
    expect(byLabel['93-94 on oxygen']).toBe(1);
    expect(byLabel['95-96 on oxygen']).toBe(2);
    expect(byLabel['>= 97 on oxygen']).toBe(3);
    // The two SpO2 scales are mutually exclusive - exactly one is scored.
    expect(record.mutually_exclusive_groups).toContainEqual(['spo2', 'spo2_scale2']);
  });
});
