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
