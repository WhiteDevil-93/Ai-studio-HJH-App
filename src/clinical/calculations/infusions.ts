export type InfusionDoseUnit =
  | 'mcg/kg/min'
  | 'mcg/kg/hr'
  | 'mg/kg/min'
  | 'mg/kg/hr'
  | 'units/kg/min'
  | 'units/kg/hr'
  | 'mcg/min'
  | 'mcg/hr'
  | 'mg/hr'
  | 'mg/min'
  | 'units/min'
  | 'units/hr';

export interface InfusionDefinition {
  id: string;
  title: string;
  doseUnit: InfusionDoseUnit;
  concentration: number;
  concentrationUnit: 'mg/mL' | 'units/mL';
  requiresWeight: boolean;
  minimumDose: number;
  maximumDose: number;
  preparation: string;
  sourceId: string;
  pdfPages: number[];
  status: 'available' | 'blocked';
  blockedReason?: string;
  warnings: string[];
}

export const INFUSION_DEFINITIONS: Record<string, InfusionDefinition> = {
  amiodarone: {
    id: 'amiodarone',
    title: 'Amiodarone continuation infusion',
    doseUnit: 'mg/hr',
    concentration: 4.13,
    concentrationUnit: 'mg/mL',
    requiresWeight: false,
    minimumDose: 900 / 23,
    maximumDose: 900 / 23,
    preparation: '900 mg in 200 mL 5% dextrose; protocol rate 9.5 mL/hr over 23 hours',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [105],
    status: 'available',
    warnings: ['Continuously monitor vital signs.'],
  },
  ketamine: {
    id: 'ketamine',
    title: 'Ketamine infusion',
    doseUnit: 'mg/kg/hr',
    concentration: 1,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.05,
    maximumDose: 1,
    preparation: '200 mg ketamine in a final volume of 200 mL normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [106],
    status: 'available',
    warnings: [
      'The rate is calculated from the confirmed prepared concentration (source: 200 mg in 200 mL = 1 mg/mL).',
      'Several 60 kg cells in the page 106 table are inconsistent with the stated 1 mg/mL concentration and must not be used; confirm the actual prepared concentration before administering.',
    ],
  },
  morphine: {
    id: 'morphine',
    title: 'Morphine infusion for the intubated patient',
    doseUnit: 'mg/kg/hr',
    concentration: 0.5,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.025,
    maximumDose: 0.4,
    preparation: '90 mg morphine in a final volume of 180 mL normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [107],
    status: 'available',
    warnings: ['For continuous infusion in the intubated patient.'],
  },
  esmolol: {
    id: 'esmolol',
    title: 'Esmolol infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 10,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 50,
    maximumDose: 300,
    preparation: 'Five 100 mg/10 mL ampoules, undiluted in a 50 mL syringe',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [108],
    status: 'available',
    warnings: ['Give the protocol fluid bolus before escalation where indicated.'],
  },
  adrenaline: {
    id: 'adrenaline',
    title: 'Adrenaline infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 0.06,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.05,
    maximumDose: 1,
    preparation: '12 mg in a final volume of 200 mL normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [109],
    status: 'available',
    warnings: ['Confirm the prepared concentration before calculating.'],
  },
  dobutamine: {
    id: 'dobutamine',
    title: 'Dobutamine infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 1.25,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 2.5,
    maximumDose: 40,
    preparation: '250 mg in a final volume of 200 mL normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [110],
    status: 'available',
    warnings: ['Higher doses may paradoxically worsen hypotension.'],
  },
  phenylephrine: {
    id: 'phenylephrine',
    title: 'Phenylephrine infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 0.1,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.1,
    maximumDose: 6,
    preparation: '20 mg in a final volume of 200 mL normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [111],
    status: 'available',
    warnings: [
      'Never administer undiluted phenylephrine.',
      'The source table contains arithmetic discrepancies; rates are calculated from the stated concentration.',
    ],
  },
  labetalol: {
    id: 'labetalol',
    title: 'Labetalol infusion',
    doseUnit: 'mg/min',
    concentration: 0.76,
    concentrationUnit: 'mg/mL',
    requiresWeight: false,
    minimumDose: 1,
    maximumDose: 2,
    preparation: '180 mg labetalol in 200 mL 0.9% normal saline',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [112],
    status: 'available',
    warnings: ['Start after the printed 20 mg bolus and titrate to the clinical target.'],
  },
  isosorbide_low: {
    id: 'isosorbide-low',
    title: 'Isosorbide dinitrate infusion',
    doseUnit: 'mg/hr',
    concentration: 0.1,
    concentrationUnit: 'mg/mL',
    requiresWeight: false,
    minimumDose: 1,
    maximumDose: 50,
    preparation: '20 mg in 200 mL normal saline or 5% dextrose (0.1 mg/mL)',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [113],
    status: 'available',
    warnings: ['The protocol also prints a 100 mg/200 mL high-concentration preparation.'],
  },
  nitroglycerin: {
    id: 'nitroglycerin',
    title: 'Nitroglycerin infusion',
    doseUnit: 'mcg/min',
    concentration: 0.05,
    concentrationUnit: 'mg/mL',
    requiresWeight: false,
    minimumDose: 10,
    maximumDose: 200,
    preparation: '10 mg in 200 mL normal saline (50 mcg/mL)',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [114],
    status: 'available',
    warnings: ['This is not a weight-based infusion.'],
  },
  morphine_midazolam: {
    id: 'morphine-midazolam',
    title: 'Combined morphine and midazolam infusion',
    doseUnit: 'mg/kg/hr',
    concentration: 0.5,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.05,
    maximumDose: 0.5,
    preparation: '90 mg morphine plus 90 mg midazolam in a final volume of 180 mL (0.5 mg/mL of each)',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [115],
    status: 'available',
    warnings: ['Ventilated patients only; the entered dose applies to each drug.'],
  },
  midazolam: {
    id: 'midazolam',
    title: 'Midazolam continuation infusion',
    doseUnit: 'mg/kg/hr',
    concentration: 2,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.05,
    maximumDose: 1,
    preparation: '90 mg midazolam in a final volume of 45 mL',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [116],
    status: 'available',
    warnings: ['Typical range is 0.05–0.3 mg/kg/hr; higher doses require expert consultation.'],
  },
  noradrenaline: {
    id: 'noradrenaline',
    title: 'Noradrenaline infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 0.05,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 0.05,
    maximumDose: 1,
    preparation: '10 mg in 200 mL normal saline',
    sourceId: 'chbah-icu-dosing-card-2024',
    pdfPages: [],
    status: 'available',
    warnings: ['Bara ICU dosing entry retained pending scheduled clinical review.'],
  },
  propofol: {
    id: 'propofol',
    title: 'Propofol infusion',
    doseUnit: 'mg/kg/hr',
    concentration: 20,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 1,
    maximumDose: 15,
    preparation: 'Protocol text: 400 mg in 40 mL; printed concentration: 20 mg/mL',
    sourceId: 'hjh-ed-2026-v1',
    pdfPages: [117],
    status: 'available',
    warnings: [
      'Enter the actual prepared concentration. The printed concentration and protocol rate table require review.',
      'Rates above 4 mg/kg/hr are not recommended for prolonged sedation.',
    ],
  },
  dopamine: {
    id: 'dopamine',
    title: 'Dopamine infusion',
    doseUnit: 'mcg/kg/min',
    concentration: 1,
    concentrationUnit: 'mg/mL',
    requiresWeight: true,
    minimumDose: 2,
    maximumDose: 20,
    preparation: '200 mg dopamine in a final volume of 200 mL normal saline (1 mg/mL)',
    sourceId: 'chbah-icu-dosing-card-2024',
    pdfPages: [],
    status: 'available',
    warnings: ['Bara ICU dosing entry retained pending scheduled clinical review.'],
  },
};

export interface InfusionInput {
  dose: number;
  concentration: number;
  weight?: number;
}

export interface InfusionResult {
  mlPerHour: number;
  outsideRecommendedRange: boolean;
  working: string;
}

export function calculateInfusionRate(
  definition: InfusionDefinition,
  input: InfusionInput,
): InfusionResult {
  if (definition.status === 'blocked') {
    throw new Error(definition.blockedReason ?? 'This infusion is awaiting review');
  }
  if (!Number.isFinite(input.dose) || input.dose <= 0) {
    throw new Error('Dose must be greater than zero');
  }
  if (!Number.isFinite(input.concentration) || input.concentration <= 0) {
    throw new Error('Concentration must be greater than zero');
  }

  const weight = input.weight;
  if (
    definition.requiresWeight &&
    (!Number.isFinite(weight) || (weight ?? 0) <= 0)
  ) {
    throw new Error('A patient weight is required');
  }

  let mlPerHour: number;
  let numerator: string;
  switch (definition.doseUnit) {
    case 'mcg/kg/min':
      mlPerHour = (input.dose * (weight as number) * 60) / (input.concentration * 1000);
      numerator = `${input.dose} mcg/kg/min × ${weight} kg × 60`;
      break;
    case 'mcg/kg/hr':
      mlPerHour = (input.dose * (weight as number)) / (input.concentration * 1000);
      numerator = `${input.dose} mcg/kg/hr × ${weight} kg`;
      break;
    case 'mg/kg/min':
      mlPerHour = (input.dose * (weight as number) * 60) / input.concentration;
      numerator = `${input.dose} mg/kg/min × ${weight} kg × 60`;
      break;
    case 'mg/kg/hr':
    case 'units/kg/hr':
      mlPerHour = (input.dose * (weight as number)) / input.concentration;
      numerator = `${input.dose} ${definition.doseUnit} × ${weight} kg`;
      break;
    case 'units/kg/min':
      mlPerHour = (input.dose * (weight as number) * 60) / input.concentration;
      numerator = `${input.dose} units/kg/min × ${weight} kg × 60`;
      break;
    case 'mcg/min':
      mlPerHour = (input.dose * 60) / (input.concentration * 1000);
      numerator = `${input.dose} mcg/min × 60`;
      break;
    case 'mcg/hr':
      mlPerHour = input.dose / (input.concentration * 1000);
      numerator = `${input.dose} mcg/hr`;
      break;
    case 'mg/min':
      mlPerHour = (input.dose * 60) / input.concentration;
      numerator = `${input.dose} mg/min × 60`;
      break;
    case 'mg/hr':
      mlPerHour = input.dose / input.concentration;
      numerator = `${input.dose} mg/hr`;
      break;
    case 'units/min':
      mlPerHour = (input.dose * 60) / input.concentration;
      numerator = `${input.dose} units/min × 60`;
      break;
    case 'units/hr':
      mlPerHour = input.dose / input.concentration;
      numerator = `${input.dose} units/hr`;
      break;
  }

  return {
    mlPerHour,
    outsideRecommendedRange:
      input.dose < definition.minimumDose || input.dose > definition.maximumDose,
    working: `${numerator} ÷ ${input.concentration} ${definition.concentrationUnit}`,
  };
}
