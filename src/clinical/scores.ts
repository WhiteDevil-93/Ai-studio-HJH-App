import type {CriterionAnswer} from './types';

export interface PointCriterion {
  key: string;
  points?: number;
}

export interface ChecklistScoreResult {
  score: number;
  answeredCount: number;
  complete: boolean;
}

export function calculateChecklistScore(
  criteria: PointCriterion[],
  answers: Record<string, CriterionAnswer>,
): ChecklistScoreResult {
  let score = 0;
  let answeredCount = 0;

  for (const criterion of criteria) {
    const answer = answers[criterion.key] ?? 'unanswered';
    if (answer === 'unanswered') continue;
    answeredCount += 1;
    if (answer === 'yes') score += criterion.points ?? 1;
  }

  return {
    score,
    answeredCount,
    complete: answeredCount === criteria.length,
  };
}

export interface CanadianCSpineResult {
  state:
    | 'applicability-required'
    | 'not-applicable'
    | 'high-risk-incomplete'
    | 'imaging-high-risk'
    | 'low-risk-incomplete'
    | 'imaging-no-low-risk-factor'
    | 'rotation-required'
    | 'imaging-failed-rotation'
    | 'no-imaging';
}

export function evaluateCanadianCSpine(input: {
  applicable: CriterionAnswer;
  highRisk: Record<string, CriterionAnswer>;
  lowRisk: Record<string, CriterionAnswer>;
  rotation45Degrees: CriterionAnswer;
}): CanadianCSpineResult {
  if (input.applicable === 'unanswered') return {state: 'applicability-required'};
  if (input.applicable === 'no') return {state: 'not-applicable'};

  const highAnswers = Object.values(input.highRisk);
  if (highAnswers.some(answer => answer === 'unanswered')) {
    return {state: 'high-risk-incomplete'};
  }
  if (highAnswers.some(answer => answer === 'yes')) {
    return {state: 'imaging-high-risk'};
  }

  const lowAnswers = Object.values(input.lowRisk);
  if (lowAnswers.some(answer => answer === 'unanswered')) {
    return {state: 'low-risk-incomplete'};
  }
  if (!lowAnswers.some(answer => answer === 'yes')) {
    return {state: 'imaging-no-low-risk-factor'};
  }
  if (input.rotation45Degrees === 'unanswered') return {state: 'rotation-required'};
  if (input.rotation45Degrees === 'no') return {state: 'imaging-failed-rotation'};
  return {state: 'no-imaging'};
}

// --- NEWS2 (RCP National Early Warning Score 2) ---
//
// NEWS2 is not a plain additive score: the RCP escalation table adds a
// "red score" trigger — ANY single parameter scoring 3 mandates at least an
// urgent ward-based review even when the aggregate is in the low band — and an
// SpO₂ Scale 2 used only when a clinician has formally designated a target
// saturation of 88–92% (hypercapnic respiratory failure). This evaluator keeps
// that logic pure and testable; the UI supplies the answers for whichever
// scale is active.

export type News2Risk = 'low' | 'low-medium' | 'medium' | 'high';

export interface News2Result {
  total: number;
  answeredCount: number;
  complete: boolean;
  /** True when any single answered parameter scores 3 (a "red score"). */
  anySingleThree: boolean;
  /** Risk band per the RCP escalation table; null until every parameter is answered. */
  risk: News2Risk | null;
}

export function evaluateNews2(
  requiredKeys: string[],
  answers: Record<string, number | undefined>,
): News2Result {
  let total = 0;
  let answeredCount = 0;
  let anySingleThree = false;

  for (const key of requiredKeys) {
    const value = answers[key];
    if (value === undefined) continue;
    answeredCount += 1;
    total += value;
    if (value === 3) anySingleThree = true;
  }

  const complete = answeredCount === requiredKeys.length;
  let risk: News2Risk | null = null;
  if (complete) {
    if (total >= 7) risk = 'high';
    else if (total >= 5) risk = 'medium';
    else if (anySingleThree) risk = 'low-medium';
    else risk = 'low';
  }

  return {total, answeredCount, complete, anySingleThree, risk};
}
