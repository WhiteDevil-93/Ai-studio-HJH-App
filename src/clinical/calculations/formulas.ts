export type FormulaKey =
  | 'modified_brooke'
  | 'anion_gap_hjh'
  | 'corrected_na_hjh_page92'
  | 'corrected_na_hjh_page97'
  | 'free_water_deficit'
  | 'sodium_deficit_chbah'
  | 'pf_ratio'
  | 'meld'
  | 'pesi';

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

// Fail-closed binary: a risk-factor input must be exactly 0 (no) or 1 (yes).
// Any other value — blank (NaN), 0.5, 2, -1 — throws rather than being silently
// coerced to "absent", which would understate the score.
const binary = (value: number, field: string): 0 | 1 => {
  if (value === 0) return 0;
  if (value === 1) return 1;
  throw new Error(`${field} must be entered as 0 (no) or 1 (yes)`);
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
      // Electrolytes must be present and physiologically positive; a zero or
      // negative concentration is a data-entry error, not a real result.
      const na = finitePositive(inputs.na, 'Sodium');
      const k = finitePositive(inputs.k, 'Potassium');
      const cl = finitePositive(inputs.cl, 'Chloride');
      const hco3 = finitePositive(inputs.hco3, 'Bicarbonate');
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
    case 'pesi': {
      const age = finitePositive(inputs.age, 'Age');
      // Every risk factor is required and must be an exact 0/1 — a missing or
      // non-binary factor would silently lower the class and mortality estimate.
      const factor = (value: number, field: string, weight: number) =>
        binary(value, field) * weight;
      const points =
        factor(inputs.male_sex, 'Male sex', 10) +
        factor(inputs.cancer, 'History of cancer', 30) +
        factor(inputs.chf, 'Chronic heart failure', 10) +
        factor(inputs.copd, 'Chronic pulmonary disease', 10) +
        factor(inputs.pulse_110, 'Pulse ≥ 110', 20) +
        factor(inputs.sbp_100, 'Systolic BP < 100', 30) +
        factor(inputs.rr_30, 'Respiratory rate ≥ 30', 20) +
        factor(inputs.temp_36, 'Temperature < 36 °C', 20) +
        factor(inputs.altered_mental_status, 'Altered mental status', 60) +
        factor(inputs.spo2_90, 'SpO₂ < 90%', 20);
      const value = Math.round(age) + points;
      return {
        value,
        unit: 'PESI points',
        working: `${Math.round(age)} (age) + ${points} (risk factor points)`,
      };
    }
    case 'meld': {
      const bilirubin = finitePositive(inputs.bilirubin, 'Bilirubin');
      const inr = finitePositive(inputs.inr, 'INR');
      // Dialysis status is required and binary; it drives the creatinine cap,
      // so an unspecified value must not default to "no dialysis".
      const dialysis = binary(inputs.on_dialysis, 'Dialysis status') === 1;
      // Standard MELD rules: lab values below 1.0 are floored to 1.0 to avoid
      // negative logarithms, and creatinine is floored at 1.0 and capped at
      // 4.0 (or set to 4.0 outright) if the patient had dialysis twice in the
      // past week, since dialysis clears creatinine independent of native
      // renal function. The raw formula result is rounded and clamped to the
      // standard UNOS/OPTN reporting range of 6-40.
      const bilirubinAdj = Math.max(bilirubin, 1.0);
      const inrAdj = Math.max(inr, 1.0);
      const creatinineRaw = dialysis ? 4.0 : Math.max(finitePositive(inputs.creatinine, 'Creatinine'), 1.0);
      const creatinineAdj = Math.min(creatinineRaw, 4.0);
      const rawScore = 3.78 * Math.log(bilirubinAdj) + 11.2 * Math.log(inrAdj) + 9.57 * Math.log(creatinineAdj) + 6.43;
      const value = Math.min(40, Math.max(6, Math.round(rawScore)));
      return {
        value,
        unit: 'MELD points',
        working: `3.78×ln(${bilirubinAdj}) + 11.2×ln(${inrAdj}) + 9.57×ln(${creatinineAdj}) + 6.43 = ${rawScore.toFixed(1)}, clamped to 6-40`,
      };
    }
  }
}
