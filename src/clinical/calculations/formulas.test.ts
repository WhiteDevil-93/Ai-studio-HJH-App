import {describe, expect, it} from 'vitest';
import {calculateFormula} from './formulas';

describe('source-backed formula calculations', () => {
  it('calculates the HJH Modified Brooke volume', () => {
    const result = calculateFormula('modified_brooke', {weight: 70, tbsa: 30});
    expect(result.value).toBe(4200);
    expect(result.unit).toBe('mL over 24 hours');
  });

  it('rejects TBSA above 100%', () => {
    expect(() =>
      calculateFormula('modified_brooke', {weight: 70, tbsa: 101}),
    ).toThrow('TBSA cannot exceed 100%');
  });

  it('uses the HJH potassium-inclusive anion gap', () => {
    const result = calculateFormula('anion_gap_hjh', {
      na: 140,
      k: 4,
      cl: 104,
      hco3: 24,
    });
    expect(result.value).toBe(16);
  });

  it('keeps both page-labelled HJH corrected-sodium equations', () => {
    expect(calculateFormula('corrected_na_hjh_page92', {
      na: 130,
      glucose: 16.5,
    }).value).toBeCloseTo(133.2, 8);
    expect(calculateFormula('corrected_na_hjh_page92', {
      na: 130,
      glucose: 27.5,
    }).value).toBeCloseTo(139.6, 8);
    expect(calculateFormula('corrected_na_hjh_page97', {
      na: 130,
      glucose: 16.2,
    }).value).toBeCloseTo(134.8, 8);
  });

  it('retains the Bara sodium-deficit formula with an explicit target', () => {
    expect(calculateFormula('sodium_deficit_chbah', {
      weight: 70,
      na: 120,
      desired_na: 128,
    }).value).toBeCloseTo(336, 8);
  });

  it('requires FiO2 as a decimal', () => {
    expect(() => calculateFormula('pf_ratio', {pao2: 80, fio2: 21}))
      .toThrow('FiO₂ must be entered as a decimal');
    expect(calculateFormula('pf_ratio', {pao2: 80, fio2: 0.4}).value).toBe(200);
  });

  it('applies the HJH free-water correction threshold', () => {
    expect(() =>
      calculateFormula('free_water_deficit', {weight: 70, na: 150}),
    ).toThrow('above 150 mmol/L');
    expect(
      calculateFormula('free_water_deficit', {weight: 70, na: 160}).value,
    ).toBeCloseTo(6, 8);
  });
});
