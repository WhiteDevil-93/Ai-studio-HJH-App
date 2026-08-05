import {describe, expect, it} from 'vitest';
import {FORMULA_INPUT_SPECS} from './formulaInputSpecs';
import {calculateFormula, type FormulaKey, type NumericInputs} from './formulas';
import type {CanonicalEntryFile} from '../entryNormalize';

// The input spec is the single description of every formula input, consumed by
// both the UI renderer (control choice) and — via these tests — held in exact
// agreement with the JSON calculator entries and the fail-closed validator in
// formulas.ts. Drift on any side fails CI.

const scoreFiles = import.meta.glob<CanonicalEntryFile>(
  '../entries/16_score_calculators/*.json',
  {eager: true, import: 'default'},
);

interface FormulaEntryRecord {
  calculator_type?: string;
  formula_id?: string;
  disabled_reason?: string;
  inputs?: Array<{key: string}>;
}

const formulaEntries = Object.entries(scoreFiles)
  .map(([path, file]) => ({path, record: file.record as FormulaEntryRecord}))
  .filter(
    ({record}) =>
      record.calculator_type === 'formula' &&
      typeof record.formula_id === 'string' &&
      !record.disabled_reason,
  );

// A known-valid input set per formula, used as the baseline each probe mutates.
const VALID_BASELINES: Record<FormulaKey, NumericInputs> = {
  modified_brooke: {weight: 70, tbsa: 30},
  anion_gap_hjh: {na: 140, k: 4, cl: 104, hco3: 24},
  corrected_na_hjh_page92: {na: 130, glucose: 16},
  corrected_na_hjh_page97: {na: 130, glucose: 16},
  free_water_deficit: {weight: 70, na: 160},
  sodium_deficit_chbah: {weight: 70, na: 120, desired_na: 128},
  pf_ratio: {pao2: 80, fio2: 0.4},
  pesi: {
    age: 60, male_sex: 0, cancer: 0, chf: 0, copd: 0, pulse_110: 0,
    sbp_100: 0, rr_30: 0, temp_36: 0, altered_mental_status: 0, spo2_90: 0,
  },
  meld: {bilirubin: 3, inr: 2, creatinine: 2, on_dialysis: 0},
};

describe('formula input specs stay in sync with the calculator entries', () => {
  it('covers every enabled formula calculator', () => {
    expect(formulaEntries.length).toBeGreaterThanOrEqual(9);
  });

  for (const {path, record} of formulaEntries) {
    it(`${path.split('/').pop()}: entry inputs exactly match the spec`, () => {
      const spec = FORMULA_INPUT_SPECS[record.formula_id as FormulaKey];
      expect(spec, `no spec for ${record.formula_id}`).toBeDefined();
      const entryKeys = (record.inputs ?? []).map(input => input.key).sort();
      expect(entryKeys).toEqual(Object.keys(spec).sort());
    });
  }
});

describe('formula input specs agree with the fail-closed validator', () => {
  for (const [formulaKey, specs] of Object.entries(FORMULA_INPUT_SPECS) as Array<
    [FormulaKey, (typeof FORMULA_INPUT_SPECS)[FormulaKey]]
  >) {
    const baseline = VALID_BASELINES[formulaKey];

    it(`${formulaKey}: baseline itself is accepted`, () => {
      expect(() => calculateFormula(formulaKey, baseline)).not.toThrow();
    });

    for (const [inputKey, spec] of Object.entries(specs)) {
      if (spec.kind === 'binary') {
        it(`${formulaKey}.${inputKey}: binary — accepts exactly 0/1, rejects everything else`, () => {
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: 0}),
          ).not.toThrow();
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: 1}),
          ).not.toThrow();
          for (const bad of [0.5, 2, -1, Number.NaN]) {
            expect(
              () => calculateFormula(formulaKey, {...baseline, [inputKey]: bad}),
              `${inputKey} should reject ${bad}`,
            ).toThrow();
          }
        });
      } else if (spec.kind === 'bounded') {
        it(`${formulaKey}.${inputKey}: bounded — rejects out-of-range values`, () => {
          const belowMin = spec.min === 0 ? 0 : spec.min - (spec.min - 0) / 2;
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: belowMin}),
          ).toThrow();
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: spec.max * 1.5}),
          ).toThrow();
        });
      } else {
        it(`${formulaKey}.${inputKey}: positive — rejects zero and NaN`, () => {
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: 0}),
          ).toThrow();
          expect(() =>
            calculateFormula(formulaKey, {...baseline, [inputKey]: Number.NaN}),
          ).toThrow();
        });
      }
    }
  }
});
