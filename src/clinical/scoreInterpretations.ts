import type {CriterionAnswer} from './types';
import type {CanadianCSpineResult, News2Risk} from './scores';

export type InterpretationTone = 'neutral' | 'low' | 'moderate' | 'high';

export interface ScoreInterpretation {
  title: string;
  action: string;
  tone: InterpretationTone;
}

export interface ScoreInterpretationBand {
  min: number;
  max: number;
  label: string;
  action: string;
}

export function interpretGcs(
  eye: number,
  verbal: number,
  motor: number,
): ScoreInterpretation | null {
  if (!eye || !verbal || !motor) return null;

  const total = eye + verbal + motor;
  if (total >= 13) {
    return {
      title: 'Mild Head Injury',
      action: 'Perform clinical monitoring. CT head if high-risk features are present.',
      tone: 'low',
    };
  }
  if (total >= 9) {
    return {
      title: 'Moderate Head Injury',
      action: 'Perform urgent CT head and consult Neurosurgery.',
      tone: 'moderate',
    };
  }
  return {
    title: 'Severe Head Injury (GCS ≤ 8)',
    action: 'Intubate for airway protection immediately. Arrange emergent CT brain.',
    tone: 'high',
  };
}

export function interpretNexus(
  answers: Record<string, boolean | undefined>,
  requiredKeys: string[],
): ScoreInterpretation | null {
  if (requiredKeys.some(key => answers[key] === undefined)) return null;

  const isHighRisk = requiredKeys.some(key => answers[key] === true);
  if (isHighRisk) {
    return {
      title: '🔴 C-Spine Imaging Required',
      action:
        'High-risk factors present. Maintain inline spinal stabilization and order non-contrast C-spine CT.',
      tone: 'high',
    };
  }
  return {
    title: '🟢 Clinical Clearance Possible',
    action: 'Meets low-risk criteria. C-spine may be clinically cleared without radiographs.',
    tone: 'low',
  };
}

export const CANADIAN_CSPINE_INTERPRETATIONS: Record<
  CanadianCSpineResult['state'],
  ScoreInterpretation
> = {
  'applicability-required': {
    title: 'Confirm applicability',
    action: 'Confirm applicability before entering criteria.',
    tone: 'neutral',
  },
  'not-applicable': {
    title: 'Not applicable',
    action:
      'The Canadian C-Spine Rule is not applicable. Use clinical assessment and the appropriate imaging pathway.',
    tone: 'high',
  },
  'high-risk-incomplete': {
    title: 'High-risk incomplete',
    action: 'Complete all high-risk criteria first.',
    tone: 'neutral',
  },
  'imaging-high-risk': {
    title: 'High risk factor present',
    action: '🔴 High risk factor present. Do NOT test range of motion. CT C-spine is indicated.',
    tone: 'high',
  },
  'low-risk-incomplete': {
    title: 'Low-risk incomplete',
    action: 'Complete all low-risk criteria.',
    tone: 'neutral',
  },
  'imaging-no-low-risk-factor': {
    title: 'No low-risk factor',
    action: 'No low-risk factor is present. Imaging is indicated in the HJH pathway.',
    tone: 'high',
  },
  'rotation-required': {
    title: 'Low-risk factor present',
    action: 'Can the patient actively rotate the neck 45° left and right?',
    tone: 'low',
  },
  'imaging-failed-rotation': {
    title: 'Unable to rotate',
    action: 'Unable to rotate 45° left and right: imaging is indicated.',
    tone: 'high',
  },
  'no-imaging': {
    title: 'No imaging required',
    action: 'HJH pathway complete: no C-spine imaging required.',
    tone: 'low',
  },
};

export function interpretCanadianCSpine(
  state: CanadianCSpineResult['state'],
): ScoreInterpretation {
  return CANADIAN_CSPINE_INTERPRETATIONS[state];
}

export function interpretBurchWartofsky(
  complete: boolean,
  total: number,
): ScoreInterpretation {
  if (!complete) {
    return {
      title: 'Select values',
      action: 'Select a value for all components to calculate the Thyroid Storm score.',
      tone: 'neutral',
    };
  }
  if (total >= 45) {
    return {
      title: '🔴 Thyroid Storm Highly Probable (≥45)',
      action:
        "Clinical emergency! Admit to ICU immediately. Initiate PTU, Lugol's iodine, beta-blocker, and steroids.",
      tone: 'high',
    };
  }
  if (total >= 25) {
    return {
      title: '🟡 Impending Thyroid Storm (25-44)',
      action:
        'Highly suggestive of developing storm. Initiate aggressive supportive therapy, and consult Endocrine urgently.',
      tone: 'moderate',
    };
  }
  return {
    title: '🟢 Thyroid Storm Unlikely (<25)',
    action:
      'Thyroid storm is unlikely. Perform thyroid function tests and manage underlying symptoms supportively.',
    tone: 'low',
  };
}

export const NEWS2_RISK_INTERPRETATIONS: Record<News2Risk, ScoreInterpretation> = {
  low: {
    title: '🟢 Low clinical risk',
    action: 'Routine ward-based monitoring per local NEWS2 policy.',
    tone: 'low',
  },
  'low-medium': {
    title: '🟠 Low-medium risk — single parameter scoring 3',
    action:
      'A red score in one parameter mandates an urgent ward-based review by a clinician competent in assessing acute illness, regardless of the total.',
    tone: 'moderate',
  },
  medium: {
    title: '🟠 Medium clinical risk (NEWS2 5-6)',
    action:
      'Urgent review by a clinician with core competencies in acute illness; escalate monitoring frequency.',
    tone: 'moderate',
  },
  high: {
    title: '🔴 High clinical risk (NEWS2 ≥ 7)',
    action:
      'Emergency assessment by a team with critical-care competencies; continuous monitoring in a higher-care setting.',
    tone: 'high',
  },
};

export function interpretNews2Risk(risk: News2Risk | null): ScoreInterpretation | null {
  if (!risk) return null;
  return NEWS2_RISK_INTERPRETATIONS[risk];
}

export function interpretCamIcu(
  complete: boolean,
  feature1: CriterionAnswer | undefined,
  feature2: CriterionAnswer | undefined,
  feature3: CriterionAnswer | undefined,
  feature4: CriterionAnswer | undefined,
): ScoreInterpretation | null {
  if (!complete) return null;
  const positive =
    feature1 === 'yes' && feature2 === 'yes' && (feature3 === 'yes' || feature4 === 'yes');
  if (positive) {
    return {
      title: '🔴 CAM-ICU Positive: Delirium present',
      action:
        'Identify and treat underlying causes; review sedation; consider non-pharmacological delirium bundle measures.',
      tone: 'high',
    };
  }
  return {
    title: '🟢 CAM-ICU Negative: No delirium',
    action: 'Reassess at next scheduled sedation/delirium screen.',
    tone: 'low',
  };
}

export function interpretTieredRiskRule(
  complete: boolean,
  triggeredTierKey: 'high' | 'medium' | 'low' | null,
  triggeredTierLabel: string | null,
  interpretation: string,
): ScoreInterpretation | null {
  if (triggeredTierKey && triggeredTierLabel) {
    return {
      title: triggeredTierLabel.replace(' factors', '') + ' present',
      action: interpretation,
      tone: triggeredTierKey === 'high' ? 'high' : 'moderate',
    };
  }
  if (!complete) return null;
  return {
    title: 'No risk factors present',
    action: 'Rule does not mandate imaging based on the criteria entered.',
    tone: 'low',
  };
}

export function interpretGradedScore(
  complete: boolean,
  total: number,
  bands: ScoreInterpretationBand[] | undefined,
): ScoreInterpretation | null {
  if (!complete || !bands) return null;
  const match = bands.find(band => total >= band.min && total <= band.max);
  if (!match) return null;
  const lower = match.label.toLowerCase();
  let tone: InterpretationTone = 'low';
  if (
    lower.includes('high') ||
    lower.includes('severe') ||
    lower.includes('class c') ||
    lower.includes('class iv') ||
    lower.includes('class v')
  ) {
    tone = 'high';
  } else if (
    lower.includes('moderate') ||
    lower.includes('intermediate') ||
    lower.includes('class b') ||
    lower.includes('class iii')
  ) {
    tone = 'moderate';
  }
  return {title: match.label, action: match.action, tone};
}

export function interpretChecklistScore(
  key: string,
  complete: boolean,
  pointsSum: number,
  bands: ScoreInterpretationBand[] | undefined,
): ScoreInterpretation | null {
  if (!complete) return null;

  if (key === 'perc') {
    if (pointsSum === 0) {
      return {
        title: 'PERC Negative',
        action:
          'All eight HJH PERC criteria have been explicitly confirmed as negative. Apply only within the HJH low-risk PE pathway.',
        tone: 'low',
      };
    }
    return {
      title: 'PERC Positive',
      action: `${pointsSum} positive criterion${pointsSum === 1 ? '' : 'a'}. Follow the HJH pulmonary embolism algorithm.`,
      tone: 'moderate',
    };
  }

  if (!bands) {
    return {
      title: 'Low risk',
      action: 'Reference standard guidelines.',
      tone: 'low',
    };
  }

  const match = bands.find(band => pointsSum >= band.min && pointsSum <= band.max);
  if (!match) {
    return {
      title: 'Low risk',
      action: 'Reference standard guidelines.',
      tone: 'low',
    };
  }

  const lowerTitle = match.label.toLowerCase();
  let tone: InterpretationTone = 'low';
  if (
    lowerTitle.includes('high') ||
    lowerTitle.includes('severe') ||
    lowerTitle.includes('probable')
  ) {
    tone = 'high';
  } else if (
    lowerTitle.includes('moderate') ||
    lowerTitle.includes('possible') ||
    lowerTitle.includes('intermediate')
  ) {
    tone = 'moderate';
  }
  return {title: match.label, action: match.action, tone};
}

export interface ParklandPlan {
  totalVolumeMl: number;
  first8hMl: number;
  next16hMl: number;
  hourlyFirst8hMl: number;
  hourlyNext16hMl: number;
  warning: string;
}

export function interpretParkland(totalVolume: number): ParklandPlan {
  const first8hMl = totalVolume / 2;
  const next16hMl = totalVolume / 2;
  return {
    totalVolumeMl: totalVolume,
    first8hMl,
    next16hMl,
    hourlyFirst8hMl: first8hMl / 8,
    hourlyNext16hMl: next16hMl / 16,
    warning:
      '⚠️ HJH initiation thresholds: adults >20% TBSA and children >15% TBSA. Paediatric maintenance fluid is separate.',
  };
}

export function interpretAnionGap(result: number): ScoreInterpretation {
  if (result > 16) {
    return {
      title: '🔴 Elevated Anion Gap',
      action:
        'MUDPILES / GOLD MARK differential: Methanol, Uremia, DKA/Ketoacidosis, Paracetamol/Propofol, Iron/INH, Lactic acidosis, Ethylene glycol, Salicylates.',
      tone: 'high',
    };
  }
  return {
    title: '🟢 Normal Anion Gap',
    action: 'Normal reference range: 8–16 mmol/L.',
    tone: 'low',
  };
}

export function interpretCorrectedSodium(result: number): ScoreInterpretation {
  return {
    title: `Corrected Sodium: ${result.toFixed(1)} mmol/L`,
    action: 'Adjusted for dilutional effect of hyperglycaemia on measured sodium.',
    tone: 'low',
  };
}

export function interpretFreeWaterDeficit(result: number): ScoreInterpretation {
  return {
    title: `Free Water Deficit: ${result.toFixed(1)} Litres`,
    action:
      '⚠️ Correct slowly over 48–72 hours to prevent cerebral edema. Max correction 10–12 mmol/L per 24h.',
    tone: 'high',
  };
}

export function interpretSodiumDeficit(result: number): ScoreInterpretation {
  return {
    title: `Sodium Deficit: ${result.toFixed(0)} mmol`,
    action:
      '⚠️ Correct severe hyponatremia slowly. Avoid correcting too quickly (risk of osmotic demyelination / pontine myelinolysis). Limit to <10 mmol/L in 24 hours.',
    tone: 'high',
  };
}

export function interpretPfRatio(result: number): ScoreInterpretation {
  if (result <= 100) {
    return {
      title: '🔴 Severe hypoxaemia (P/F ≤ 100)',
      action:
        'Meets the Berlin severe-ARDS oxygenation threshold. If ARDS is confirmed: lung-protective ventilation ($V_T$ 6 mL/kg, optimised PEEP, consider proning/paralysis).',
      tone: 'high',
    };
  }
  if (result <= 200) {
    return {
      title: '🟠 Moderate hypoxaemia (P/F 101–200)',
      action:
        'Meets the Berlin moderate-ARDS oxygenation threshold. Consider early ICU referral and a high-PEEP strategy.',
      tone: 'moderate',
    };
  }
  if (result <= 300) {
    return {
      title: '🟡 Mild hypoxaemia (P/F 201–300)',
      action:
        'Meets the Berlin mild-ARDS oxygenation threshold. Monitor respiratory indices and work of breathing closely.',
      tone: 'moderate',
    };
  }
  return {
    title: '🟢 Normal oxygenation (P/F > 300)',
    action: 'Above the ARDS oxygenation threshold.',
    tone: 'low',
  };
}

export const PF_RATIO_ARDS_CAVEAT =
  'P/F ratio alone does not diagnose ARDS. Confirm the Berlin criteria — acute onset ≤ 1 week, bilateral opacities, not fully explained by cardiac failure/fluid overload, measured on PEEP/CPAP ≥ 5 cmH₂O — before applying an ARDS label or management.';

export function interpretPesi(result: number): ScoreInterpretation {
  if (result > 125) {
    return {
      title: 'Class V - Very high risk',
      action: '10.0-24.5% 30-day mortality.',
      tone: 'high',
    };
  }
  if (result > 105) {
    return {
      title: 'Class IV - High risk',
      action: '4.0-11.4% 30-day mortality.',
      tone: 'high',
    };
  }
  if (result > 85) {
    return {
      title: 'Class III - Moderate risk',
      action: '3.2-7.1% 30-day mortality.',
      tone: 'moderate',
    };
  }
  if (result > 65) {
    return {
      title: 'Class II - Low risk',
      action: '1.7-3.5% 30-day mortality.',
      tone: 'moderate',
    };
  }
  return {
    title: 'Class I - Very low risk',
    action: '0-1.6% 30-day mortality.',
    tone: 'low',
  };
}

export function interpretMeld(result: number): ScoreInterpretation {
  if (result >= 40) {
    return {
      title: 'MELD ≥ 40',
      action: 'Approximate 3-month mortality ~71%.',
      tone: 'high',
    };
  }
  if (result >= 30) {
    return {
      title: 'MELD 30–39',
      action: 'Approximate 3-month mortality ~53%.',
      tone: 'high',
    };
  }
  if (result >= 20) {
    return {
      title: 'MELD 20–29',
      action: 'Approximate 3-month mortality ~20%.',
      tone: 'moderate',
    };
  }
  if (result >= 10) {
    return {
      title: 'MELD 10–19',
      action: 'Approximate 3-month mortality ~6%.',
      tone: 'moderate',
    };
  }
  return {
    title: 'MELD < 10',
    action: 'Approximate 3-month mortality < 2%.',
    tone: 'low',
  };
}

export type FormulaInterpretationKey =
  | 'parkland'
  | 'anion_gap'
  | 'corrected_na'
  | 'free_water_deficit'
  | 'sodium_deficit'
  | 'pf_ratio'
  | 'pesi'
  | 'meld';

export function formulaInterpretationKey(calcKey: string): FormulaInterpretationKey | null {
  if (calcKey === 'parkland') return 'parkland';
  if (calcKey === 'anion_gap') return 'anion_gap';
  if (calcKey.startsWith('corrected_na_hjh_')) return 'corrected_na';
  if (calcKey === 'free_water_deficit') return 'free_water_deficit';
  if (calcKey === 'sodium_deficit') return 'sodium_deficit';
  if (calcKey === 'pf_ratio') return 'pf_ratio';
  if (calcKey === 'pesi') return 'pesi';
  if (calcKey === 'meld') return 'meld';
  return null;
}

export function interpretFormulaResult(
  calcKey: string,
  result: number,
): ScoreInterpretation | ParklandPlan | null {
  if (result === null || Number.isNaN(result)) return null;
  const kind = formulaInterpretationKey(calcKey);
  if (!kind) return null;
  switch (kind) {
    case 'parkland':
      return interpretParkland(result);
    case 'anion_gap':
      return interpretAnionGap(result);
    case 'corrected_na':
      return interpretCorrectedSodium(result);
    case 'free_water_deficit':
      return interpretFreeWaterDeficit(result);
    case 'sodium_deficit':
      return interpretSodiumDeficit(result);
    case 'pf_ratio':
      return interpretPfRatio(result);
    case 'pesi':
      return interpretPesi(result);
    case 'meld':
      return interpretMeld(result);
  }
}
