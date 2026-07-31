import {clinicalData} from '../src/clinical/legacyAdapter.ts';

const doseFields = new Set(['adult_dose','paediatric_dose','adult_settings','paediatric_settings','protocol_dose']);
const uncovered: string[] = [];

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const AMOUNT_UNIT = String.raw`mcg|µg|ug|mg|mmol|g|m[lℓ]|units?|iu|u|meq|j`;
const weightDosePattern = new RegExp(String.raw`(${NUMBER})\s*(?:[-–]\s*(${NUMBER}))?\s*(${AMOUNT_UNIT})\s*/\s*kg(?:\s*/\s*(min|hr|hour))?`, 'gi');

function extractWeightDoseResults(text: string, weight: number): string[] {
  if (!Number.isFinite(weight) || weight <= 0 || !text) return [];
  const results: string[] = [];
  weightDosePattern.lastIndex = 0;
  for (const match of text.matchAll(weightDosePattern)) {
    results.push(match[0]);
  }
  return results;
}

function visit(value: unknown, path: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, [...path, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === 'string' &&
      doseFields.has(key) &&
      /\/\s*kg/i.test(child) &&
      extractWeightDoseResults(child, 70).length === 0
    ) {
      uncovered.push([...path, key].join('.'));
    } else if (typeof child === 'object') {
      visit(child, [...path, key]);
    }
  }
}

visit(clinicalData, []);
console.log(JSON.stringify(uncovered, null, 2));
