import type {
  InfusionDefinition,
  InfusionDoseUnit,
} from './infusions';

export interface WeightDoseResult {
  sourceExpression: string;
  minimum: number;
  maximum: number;
  resultUnit: string;
}

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const AMOUNT_UNIT = String.raw`mcg|µg|ug|mg|mmol|g|m[lℓ]|units?|iu|u|meq|j`;
const weightDosePattern = new RegExp(
  String.raw`(${NUMBER})\s*(?:[-–]\s*(${NUMBER}))?\s*(${AMOUNT_UNIT})\s*\/\s*kg(?:\s*\/\s*(min|hr|hour))?`,
  'gi',
);
const infusionRatePattern = new RegExp(
  String.raw`(${NUMBER})\s*(?:[-–]\s*(${NUMBER}))?\s*(mcg|µg|ug|mg|units?|iu|u)\s*\/\s*(?:(kg)\s*\/\s*)?(min|hr|hour)`,
  'i',
);

const normalizeAmountUnit = (unit: string): string => {
  const normalized = unit.toLocaleLowerCase();
  if (['mcg', 'µg', 'ug'].includes(normalized)) return 'mcg';
  if (['unit', 'units', 'iu', 'u'].includes(normalized)) return 'units';
  if (normalized === 'ml' || normalized === 'mℓ') return 'mL';
  if (normalized === 'meq') return 'mEq';
  return normalized;
};

const normalizeTimeUnit = (unit: string): 'min' | 'hr' =>
  unit.toLocaleLowerCase() === 'min' ? 'min' : 'hr';

export function extractWeightDoseResults(
  text: string,
  weight: number,
): WeightDoseResult[] {
  if (!Number.isFinite(weight) || weight <= 0 || !text) return [];

  const results: WeightDoseResult[] = [];
  const seen = new Set<string>();
  weightDosePattern.lastIndex = 0;

  for (const match of text.matchAll(weightDosePattern)) {
    const sourceExpression = match[0].replace(/\s+/g, ' ').trim();
    const key = sourceExpression.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const low = Number(match[1]);
    const high = Number(match[2] ?? match[1]);
    const amountUnit = normalizeAmountUnit(match[3]);
    const timeUnit = match[4] ? normalizeTimeUnit(match[4]) : undefined;

    results.push({
      sourceExpression,
      minimum: low * weight,
      maximum: high * weight,
      resultUnit: timeUnit ? `${amountUnit}/${timeUnit}` : amountUnit,
    });
  }

  return results;
}

const supportedDoseUnit = (
  amountUnit: string,
  weightBased: boolean,
  timeUnit: 'min' | 'hr',
): InfusionDoseUnit | undefined => {
  const candidate = `${amountUnit}${weightBased ? '/kg' : ''}/${timeUnit}`;
  const supported: InfusionDoseUnit[] = [
    'mcg/kg/min',
    'mcg/kg/hr',
    'mg/kg/min',
    'mg/kg/hr',
    'units/kg/min',
    'units/kg/hr',
    'mcg/min',
    'mcg/hr',
    'mg/min',
    'mg/hr',
    'units/min',
    'units/hr',
  ];
  return supported.find(unit => unit === candidate);
};

export function infusionDefinitionFromDoseText(
  id: string,
  title: string,
  text: string,
  preparation: string | undefined,
  sourceId: string,
  pdfPages: number[],
): InfusionDefinition | undefined {
  const match = infusionRatePattern.exec(text);
  if (!match) return undefined;

  const minimumDose = Number(match[1]);
  const maximumDose = Number(match[2] ?? match[1]);
  const amountUnit = normalizeAmountUnit(match[3]);
  const requiresWeight = Boolean(match[4]);
  const timeUnit = normalizeTimeUnit(match[5]);
  const doseUnit = supportedDoseUnit(amountUnit, requiresWeight, timeUnit);
  if (!doseUnit) return undefined;

  return {
    id,
    title,
    doseUnit,
    concentration: 0,
    concentrationUnit: amountUnit === 'units' ? 'units/mL' : 'mg/mL',
    requiresWeight,
    minimumDose,
    maximumDose,
    preparation: preparation || 'Enter the actual prepared concentration',
    sourceId,
    pdfPages,
    status: 'available',
    warnings: ['Confirm the prescribed dose and actual prepared concentration.'],
  };
}
