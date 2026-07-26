export type FormulaKey =
  | 'modified_brooke'
  | 'anion_gap_hjh'
  | 'corrected_na_hjh_page92'
  | 'corrected_na_hjh_page97'
  | 'free_water_deficit'
  | 'sodium_deficit_chbah'
  | 'pf_ratio';

export type NumericInputs = Record<string, number>;

export interface FormulaResult {
  value: number;
  unit: string;
  working: string;
}

const finitePositive = (value: number, field: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
  return value;
};

export function calculateFormula(
  key: FormulaKey,
  inputs: NumericInputs,
): FormulaResult {
  switch (key) {
    case 'modified_brooke': {
      const weight = finitePositive(inputs.weight, 'Weight');
      const tbsa = finitePositive(inputs.tbsa, 'TBSA');
      if (tbsa > 100) throw new Error('TBSA cannot exceed 100%');
      const value = 2 * weight * tbsa;
      return {
        value,
        unit: 'mL over 24 hours',
        working: `2 mL × ${weight} kg × ${tbsa}% TBSA`,
      };
    }
    case 'anion_gap_hjh': {
      const {na, k, cl, hco3} = inputs;
      for (const [label, value] of Object.entries({na, k, cl, hco3})) {
        if (!Number.isFinite(value)) throw new Error(`${label} is required`);
      }
      const value = na + k - (cl + hco3);
      return {
        value,
        unit: 'mmol/L',
        working: `(${na} + ${k}) − (${cl} + ${hco3})`,
      };
    }
    case 'corrected_na_hjh_page92': {
      const sodium = finitePositive(inputs.na, 'Measured sodium');
      const glucose = finitePositive(inputs.glucose, 'Glucose');
      if (glucose < 11) {
        throw new Error('The HJH page 92 rule is stated for glucose from 11 mmol/L');
      }
      const factor = glucose > 22 ? 2.4 : 1.6;
      const value = sodium + factor * ((glucose - 5.5) / 5.5);
      return {
        value,
        unit: 'mmol/L',
        working: `${sodium} + [${factor} × (${glucose} − 5.5) ÷ 5.5]`,
      };
    }
    case 'corrected_na_hjh_page97': {
      const sodium = finitePositive(inputs.na, 'Measured sodium');
      const glucose = finitePositive(inputs.glucose, 'Glucose');
      const value = sodium + 2.4 * ((glucose - 5.4) / 5.4);
      return {
        value,
        unit: 'mmol/L',
        working: `${sodium} + [2.4 × (${glucose} − 5.4) ÷ 5.4]`,
      };
    }
    case 'free_water_deficit': {
      const weight = finitePositive(inputs.weight, 'Weight');
      const sodium = finitePositive(inputs.na, 'Sodium');
      if (sodium <= 150) {
        throw new Error('HJH page 96 applies correction when sodium is above 150 mmol/L');
      }
      const value = 0.6 * weight * ((sodium - 140) / 140);
      return {
        value,
        unit: 'L',
        working: `0.6 × ${weight} × ((${sodium} − 140) ÷ 140)`,
      };
    }
    case 'sodium_deficit_chbah': {
      const weight = finitePositive(inputs.weight, 'Weight');
      const sodium = finitePositive(inputs.na, 'Actual sodium');
      const desiredSodium = finitePositive(inputs.desired_na, 'Desired sodium');
      const value = 0.6 * weight * (desiredSodium - sodium);
      return {
        value,
        unit: 'mmol',
        working: `0.6 × ${weight} × (${desiredSodium} − ${sodium})`,
      };
    }
    case 'pf_ratio': {
      const pao2 = finitePositive(inputs.pao2, 'PaO₂');
      const fio2 = finitePositive(inputs.fio2, 'FiO₂');
      if (fio2 < 0.21 || fio2 > 1) {
        throw new Error('FiO₂ must be entered as a decimal from 0.21 to 1.0');
      }
      return {
        value: pao2 / fio2,
        unit: 'mmHg',
        working: `${pao2} ÷ ${fio2}`,
      };
    }
  }
}
