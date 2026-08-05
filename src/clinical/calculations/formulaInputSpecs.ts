import type {FormulaKey} from './formulas';

// One typed description of every formula input, shared by the UI and the
// validator. The renderer uses it to choose the control (a binary input is a
// No/Yes toggle, a bounded input carries its min/max), and the test suite
// asserts it agrees with the fail-closed validation in formulas.ts — so the
// form cannot offer a value the formula would interpret differently, and the
// spec cannot drift from either side without failing CI.

export type FormulaInputSpec =
  | {kind: 'binary'}
  | {kind: 'positive'}
  | {kind: 'bounded'; min: number; max: number};

const BINARY: FormulaInputSpec = {kind: 'binary'};
const POSITIVE: FormulaInputSpec = {kind: 'positive'};

export const FORMULA_INPUT_SPECS: Record<
  FormulaKey,
  Record<string, FormulaInputSpec>
> = {
  modified_brooke: {
    weight: POSITIVE,
    // TBSA is a percentage of body surface: 0 < tbsa <= 100.
    tbsa: {kind: 'bounded', min: 0, max: 100},
  },
  anion_gap_hjh: {
    na: POSITIVE,
    k: POSITIVE,
    cl: POSITIVE,
    hco3: POSITIVE,
  },
  corrected_na_hjh_page92: {
    na: POSITIVE,
    glucose: POSITIVE,
  },
  corrected_na_hjh_page97: {
    na: POSITIVE,
    glucose: POSITIVE,
  },
  free_water_deficit: {
    weight: POSITIVE,
    na: POSITIVE,
  },
  sodium_deficit_chbah: {
    weight: POSITIVE,
    na: POSITIVE,
    desired_na: POSITIVE,
  },
  pf_ratio: {
    pao2: POSITIVE,
    // FiO2 is entered as a decimal fraction of inspired oxygen.
    fio2: {kind: 'bounded', min: 0.21, max: 1},
  },
  pesi: {
    age: POSITIVE,
    male_sex: BINARY,
    cancer: BINARY,
    chf: BINARY,
    copd: BINARY,
    pulse_110: BINARY,
    sbp_100: BINARY,
    rr_30: BINARY,
    temp_36: BINARY,
    altered_mental_status: BINARY,
    spo2_90: BINARY,
  },
  meld: {
    bilirubin: POSITIVE,
    inr: POSITIVE,
    creatinine: POSITIVE,
    on_dialysis: BINARY,
  },
};

export function formulaInputSpec(
  formulaKey: FormulaKey | undefined,
  inputKey: string,
): FormulaInputSpec | undefined {
  if (!formulaKey) return undefined;
  return FORMULA_INPUT_SPECS[formulaKey]?.[inputKey];
}
