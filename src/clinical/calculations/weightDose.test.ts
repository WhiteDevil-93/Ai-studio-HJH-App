import {describe, expect, it} from 'vitest';
import {clinicalData} from '../legacyAdapter';
import {
  extractWeightDoseResults,
  infusionDefinitionFromDoseText,
} from './weightDose';

describe('weight-based dose extraction', () => {
  it('calculates single doses and ranges from the displayed protocol text', () => {
    expect(extractWeightDoseResults('Ketamine 1-2mg/kg IV', 70)[0])
      .toMatchObject({minimum: 70, maximum: 140, resultUnit: 'mg'});
    expect(extractWeightDoseResults('Alteplase 0.9 mg/kg IV', 70)[0])
      .toMatchObject({minimum: 63, maximum: 63, resultUnit: 'mg'});
  });

  it('preserves rate units for weight-based infusions', () => {
    expect(extractWeightDoseResults('0.05-1 ug/kg/min IV', 70)[0])
      .toMatchObject({minimum: 3.5, maximum: 70, resultUnit: 'mcg/min'});
    expect(extractWeightDoseResults('18units/kg/hr', 70)[0])
      .toMatchObject({minimum: 1260, maximum: 1260, resultUnit: 'units/hr'});
  });

  it('returns no result until a valid patient weight is supplied', () => {
    expect(extractWeightDoseResults('1mg/kg IV', 0)).toEqual([]);
    expect(extractWeightDoseResults('1mg/kg IV', Number.NaN)).toEqual([]);
  });

  it('tokenises per-day and per-dose bases with the full resulting unit', () => {
    expect(extractWeightDoseResults('Gentamicin 5-7mg/kg/day IV', 70)[0])
      .toMatchObject({minimum: 350, maximum: 490, resultUnit: 'mg/day'});
    expect(extractWeightDoseResults('Paracetamol 15mg/kg/dose PO q6h', 20)[0])
      .toMatchObject({minimum: 300, maximum: 300, resultUnit: 'mg/dose'});
  });

  it('rejects expressions with an untokenised trailing unit instead of partial-matching', () => {
    // "mg/kg/week" must not silently render as a plain 5 mg/kg stat dose.
    expect(extractWeightDoseResults('5mg/kg/week SC', 70)).toEqual([]);
  });

  it('attaches an unambiguous printed maximum without capping the computed value', () => {
    const [result] = extractWeightDoseResults('Amiodarone 5mg/kg (Max 300mg) IV', 70);
    expect(result).toMatchObject({
      minimum: 350,
      maximum: 350,
      resultUnit: 'mg',
      printedMax: {value: 300, unit: 'mg'},
    });
  });

  it('leaves the maximum unattached when the association would be ambiguous', () => {
    // Two dose expressions, one max clause: attribution is unclear, so no
    // printedMax is attached (the generic printed-maximum note still shows).
    const results = extractWeightDoseResults(
      'Load 1mg/kg then 0.5mg/kg, max 100mg',
      70,
    );
    expect(results).toHaveLength(2);
    expect(results.every(result => result.printedMax === undefined)).toBe(true);
    // Mismatched units also stay unattached.
    const [mismatch] = extractWeightDoseResults('0.1mmol/kg (max 20 ml)', 70);
    expect(mismatch.printedMax).toBeUndefined();
  });

  it('covers every weight-based adult, paediatric, settings, and protocol dose field', () => {
    const doseFields = new Set([
      'adult_dose',
      'paediatric_dose',
      'adult_settings',
      'paediatric_settings',
      'protocol_dose',
    ]);
    const uncovered: string[] = [];

    const visit = (value: unknown, path: string[]): void => {
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
    };

    visit(clinicalData, []);
    expect(uncovered).toEqual([]);
  });
});

describe('infusion definition extraction', () => {
  it('builds a concentration-confirmed calculator from a weight-based rate', () => {
    expect(infusionDefinitionFromDoseText(
      'heparin',
      'Heparin infusion',
      'Loading: 80units/kg IV; Maint: 18units/kg/hr',
      '25,000 units in 50 mL',
      'chbah',
      [],
    )).toMatchObject({
      doseUnit: 'units/kg/hr',
      minimumDose: 18,
      maximumDose: 18,
      concentrationUnit: 'units/mL',
      requiresWeight: true,
    });
  });

  it('does not mistake an infusion duration for a dose rate', () => {
    expect(infusionDefinitionFromDoseText(
      'antibiotic',
      'Antibiotic',
      '5mg/kg IV over 30min',
      undefined,
      'source',
      [],
    )).toBeUndefined();
  });
});
