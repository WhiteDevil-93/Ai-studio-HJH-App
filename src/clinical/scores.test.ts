import {describe, expect, it} from 'vitest';
import {calculateChecklistScore, evaluateCanadianCSpine} from './scores';

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
