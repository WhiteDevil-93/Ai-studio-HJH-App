import {describe, expect, it} from 'vitest';
import entry from './entries/5_metabolic_electrolytes_and_nutrition/electrolyte_replacement/hypokalaemia-hjh.json';
import errata from '../../clinical-sources/errata.json';

// ERR-HJH-008. The category-browse hypokalaemia entry previously shipped a
// verbatim copy of the page-96 HYPERNATRAEMIA payload: a clinician looking up
// hypokalaemia was shown sodium-correction instructions ("Aim to correct Na+ by
// 10-12mmol/l in 24hrs"). These tests pin the page-95 potassium content and make
// the specific contamination impossible to reintroduce silently.

const body = JSON.stringify(entry.record);

describe('hypokalaemia entry carries page-95 potassium content', () => {
  it('states the K+ < 3.5 mmol/l definition', () => {
    expect(body).toContain('K+ < 3.5mmol/l');
  });

  it('requires simultaneous potassium and magnesium replacement', () => {
    expect(body).toMatch(/BOTH Potassium & Magnesium need to be replaced simultaneously/);
    expect(body).toMatch(/ATPase pump/);
  });

  it('carries the standard replacement infusion exactly as printed', () => {
    expect(body).toContain('40 mmol KCl + 2g MgSO4 in 200 ml 0.9% Normal Saline over 4 hours');
    expect(body).toContain('50 ml/hr');
  });

  it('carries the life-threatening arrest dose and the re-check instruction', () => {
    expect(body).toContain('20 mEq/mmol KCl (10ml)');
    expect(body).toContain('1ml/min');
    expect(body).toMatch(/re-check potassium level/i);
  });

  it('scopes the arrest dose to cardiac arrest / impending arrest only', () => {
    const warnings = (entry.record as {warnings?: string[]}).warnings ?? [];
    expect(warnings.some(warning => /ONLY to life-threatening/i.test(warning))).toBe(true);
  });
});

describe('hypokalaemia entry is free of the hypernatraemia contamination', () => {
  it('contains no sodium-correction guidance', () => {
    // The exact strings that made the old entry dangerous.
    expect(body).not.toMatch(/correct Na\+ by 10-12mmol/i);
    expect(body).not.toMatch(/Causes of Hypernatraemia/i);
    expect(body).not.toMatch(/Diabetes Insipidus/i);
    expect(body).not.toMatch(/DDAVP/i);
  });

  it('mentions no sodium disorder at all', () => {
    expect(body).not.toMatch(/hypernatraemia|hyponatraemia/i);
  });

  it('is linked to ERR-HJH-008 and marked for clinical review', () => {
    expect((entry as {errata: string[]}).errata).toContain('ERR-HJH-008');
    expect((entry as {reviewState: string}).reviewState).toBe('clinical-review');
    const items = (errata.registers as ReadonlyArray<{items: ReadonlyArray<{id: string; status?: string}>}>)
      .flatMap(register => register.items);
    expect(items.find(item => item.id === 'ERR-HJH-008')?.status).toBe('resolved-from-source');
  });
});
