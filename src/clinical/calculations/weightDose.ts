import type {
  InfusionDefinition,
  InfusionDoseUnit,
} from './infusions';

export interface WeightDoseResult {
  sourceExpression: string;
  minimum: number;
  maximum: number;
  resultUnit: string;
  /**
   * The printed maximum dose, attached only when it can be associated
   * unambiguously (exactly one weight-dose expression and exactly one
   * matching-unit maximum clause in the text). The computed value is never
   * silently capped — the UI shows both and flags when computed > printed max,
   * because silently clamping would hide a prescribing error.
   */
  printedMax?: {value: number; unit: string};
}

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const AMOUNT_UNIT = String.raw`mcg|µg|ug|mg|mmol|g|m[lℓ]|units?|iu|u|meq|j`;
// The trailing negative lookahead makes the parser fail closed: an expression
// followed by a further "/..." segment we did not tokenise (e.g. "mg/kg/week")
// is rejected outright rather than partially matched as a plain "mg/kg" dose —
// a partial match would silently misrepresent a per-week dose as a stat dose.
const weightDosePattern = new RegExp(
  String.raw`(${NUMBER})\s*(?:[-–]\s*(${NUMBER}))?\s*(${AMOUNT_UNIT})\s*\/\s*kg(?:\s*\/\s*(min|hr|hour|day|dose))?(?!\s*\/)`,
  'gi',
);
const printedMaxPattern = new RegExp(
  String.raw`\bmax(?:imum)?\s*(?:dose\s*)?(?:of\s*)?[:=]?\s*(${NUMBER})\s*(${AMOUNT_UNIT})\b`,
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

const normalizeTimeUnit = (unit: string): 'min' | 'hr' | 'day' | 'dose' => {
  const normalized = unit.toLocaleLowerCase();
  if (normalized === 'min') return 'min';
  if (normalized === 'day') return 'day';
  if (normalized === 'dose') return 'dose';
  return 'hr';
};

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

  // Attach the printed maximum only when the association is unambiguous:
  // exactly one dose expression and exactly one max clause whose unit matches
  // the dose's amount unit. Anything else stays unattached — the generic
  // "apply the printed maximum" note still renders for those texts.
  if (results.length === 1) {
    printedMaxPattern.lastIndex = 0;
    const maxMatches = [...text.matchAll(printedMaxPattern)];
    if (maxMatches.length === 1) {
      const maxUnit = normalizeAmountUnit(maxMatches[0][2]);
      const doseAmountUnit = results[0].resultUnit.split('/')[0];
      if (maxUnit === doseAmountUnit) {
        results[0].printedMax = {value: Number(maxMatches[0][1]), unit: maxUnit};
      }
    }
  }

  return results;
}

const supportedDoseUnit = (
  amountUnit: string,
  weightBased: boolean,
  // day/dose bases never form a supported continuous-infusion unit, so they
  // fall through to undefined and no auto-calculator is offered.
  timeUnit: 'min' | 'hr' | 'day' | 'dose',
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
