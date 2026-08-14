import {describe, expect, it} from 'vitest';
import {calculateChecklistScore, evaluateCanadianCSpine, evaluateNews2} from './scores';
import {
  interpretAnionGap,
  interpretBurchWartofsky,
  interpretCamIcu,
  interpretCanadianCSpine,
  interpretChecklistScore,
  interpretCorrectedSodium,
  interpretFormulaResult,
  interpretFreeWaterDeficit,
  interpretGcs,
  interpretGradedScore,
  interpretMeld,
  interpretNews2Risk,
  interpretNexus,
  interpretParkland,
  interpretPesi,
  interpretPfRatio,
  interpretSodiumDeficit,
  interpretTieredRiskRule,
  PF_RATIO_ARDS_CAVEAT,
  formulaInterpretationKey,
} from './scoreInterpretations';
import {applyScoreCorrection, scoreCorrectionFor} from './scoreCorrections';
import alvarado from './entries/16_score_calculators/alvarado.json';
import wellsDvt from './entries/16_score_calculators/wells_dvt.json';
import wellsPe from './entries/16_score_calculators/wells_pe.json';
import curb65 from './entries/16_score_calculators/curb65.json';
import perc from './entries/16_score_calculators/perc.json';
import rawCSpine from './entries/16_score_calculators/canadian_cspine.json';
import burchWartofsky from './entries/16_score_calculators/burch_wartofsky.json';

interface InterpretationBand {
  min: number;
  max: number;
  label: string;
  action: string;
}

const bandsOf = (entry: {record: {interpretation?: InterpretationBand[]}}) =>
  entry.record.interpretation as InterpretationBand[];

const keysOf = (entry: {record: {components: Array<{key: string}>}}) =>
  entry.record.components.map(component => component.key);

const allNo = (keys: string[]) =>
  Object.fromEntries(keys.map(key => [key, 'no' as const]));

const yesOnly = (keys: string[], yesKeys: string[]) =>
  Object.fromEntries(
    keys.map(key => [key, yesKeys.includes(key) ? ('yes' as const) : ('no' as const)]),
  );

describe('interpretGcs', () => {
  it('yields no interpretation until every component is selected', () => {
    expect(interpretGcs(0, 0, 0)).toBeNull();
    expect(interpretGcs(4, 0, 6)).toBeNull();
    expect(interpretGcs(4, 5, 0)).toBeNull();
  });

  it('locks current GCS wording and thresholds', () => {
    expect(interpretGcs(4, 5, 6)).toEqual({
      title: 'Mild Head Injury',
      action: 'Perform clinical monitoring. CT head if high-risk features are present.',
      tone: 'low',
    });
    expect(interpretGcs(3, 4, 6)).toMatchObject({title: 'Mild Head Injury'});
    expect(interpretGcs(3, 4, 5)).toEqual({
      title: 'Moderate Head Injury',
      action: 'Perform urgent CT head and consult Neurosurgery.',
      tone: 'moderate',
    });
    expect(interpretGcs(2, 3, 4)).toMatchObject({title: 'Moderate Head Injury'});
    expect(interpretGcs(2, 2, 4)).toEqual({
      title: 'Severe Head Injury (GCS ≤ 8)',
      action: 'Intubate for airway protection immediately. Arrange emergent CT brain.',
      tone: 'high',
    });
    expect(interpretGcs(1, 1, 1)).toMatchObject({title: 'Severe Head Injury (GCS ≤ 8)'});
  });
});

describe('interpretNexus', () => {
  const keys = ['midline_tender', 'focal_deficit', 'altered_alertness', 'intoxication', 'distracting_injury'];

  it('fails closed when any criterion is unanswered', () => {
    expect(interpretNexus({}, keys)).toBeNull();
    expect(interpretNexus({midline_tender: false}, keys)).toBeNull();
    expect(
      interpretNexus(
        {
          midline_tender: false,
          focal_deficit: false,
          altered_alertness: false,
          intoxication: false,
        },
        keys,
      ),
    ).toBeNull();
  });

  it('does not treat unanswered criteria as negative', () => {
    expect(
      interpretNexus(
        {
          midline_tender: false,
          focal_deficit: false,
          altered_alertness: false,
          intoxication: false,
        },
        keys,
      ),
    ).toBeNull();
  });

  it('locks current NEXUS wording', () => {
    expect(
      interpretNexus(
        {
          midline_tender: false,
          focal_deficit: false,
          altered_alertness: false,
          intoxication: false,
          distracting_injury: false,
        },
        keys,
      ),
    ).toEqual({
      title: '🟢 Clinical Clearance Possible',
      action: 'Meets low-risk criteria. C-spine may be clinically cleared without radiographs.',
      tone: 'low',
    });
    expect(
      interpretNexus(
        {
          midline_tender: true,
          focal_deficit: false,
          altered_alertness: false,
          intoxication: false,
          distracting_injury: false,
        },
        keys,
      ),
    ).toEqual({
      title: '🔴 C-Spine Imaging Required',
      action:
        'High-risk factors present. Maintain inline spinal stabilization and order non-contrast C-spine CT.',
      tone: 'high',
    });
  });
});

describe('interpretCanadianCSpine (ERR-HJH-007 overlay remains runtime-only)', () => {
  it('locks current recommendation strings for every workflow state', () => {
    expect(interpretCanadianCSpine('applicability-required').action).toBe(
      'Confirm applicability before entering criteria.',
    );
    expect(interpretCanadianCSpine('not-applicable').action).toBe(
      'The Canadian C-Spine Rule is not applicable. Use clinical assessment and the appropriate imaging pathway.',
    );
    expect(interpretCanadianCSpine('high-risk-incomplete').action).toBe(
      'Complete all high-risk criteria first.',
    );
    expect(interpretCanadianCSpine('imaging-high-risk').action).toBe(
      '🔴 High risk factor present. Do NOT test range of motion. CT C-spine is indicated.',
    );
    expect(interpretCanadianCSpine('low-risk-incomplete').action).toBe(
      'Complete all low-risk criteria.',
    );
    expect(interpretCanadianCSpine('imaging-no-low-risk-factor').action).toBe(
      'No low-risk factor is present. Imaging is indicated in the HJH pathway.',
    );
    expect(interpretCanadianCSpine('rotation-required').action).toBe(
      'Can the patient actively rotate the neck 45° left and right?',
    );
    expect(interpretCanadianCSpine('imaging-failed-rotation').action).toBe(
      'Unable to rotate 45° left and right: imaging is indicated.',
    );
    expect(interpretCanadianCSpine('no-imaging').action).toBe(
      'HJH pathway complete: no C-spine imaging required.',
    );
  });

  it('fails closed while high-risk answers are incomplete', () => {
    const result = evaluateCanadianCSpine({
      applicable: 'yes',
      highRisk: {age: 'no', mechanism: 'unanswered'},
      lowRisk: {sitting: 'yes'},
      rotation45Degrees: 'yes',
    });
    expect(result.state).toBe('high-risk-incomplete');
    expect(interpretCanadianCSpine(result.state).title).toBe('High-risk incomplete');
  });

  it('keeps the printed source string as Age > 65 and applies Age ≥ 65 only via overlay', () => {
    const sourceAge = (rawCSpine.record.components as Array<{key: string; name: string}>).find(
      component => component.key === 'age_65',
    );
    expect(sourceAge?.name).toBe('Age > 65 years');
    const runtime = applyScoreCorrection(
      rawCSpine.record as never,
      scoreCorrectionFor('16_score_calculators', 'canadian_cspine'),
    ) as {components: Array<{key: string; name: string}>};
    expect(runtime.components.find(component => component.key === 'age_65')?.name).toBe(
      'Age ≥ 65 years',
    );
  });
});

describe('interpretBurchWartofsky (ERR-HJH-005 130-139 band stays as implemented)', () => {
  const hr = (burchWartofsky.record.components as Array<{
    key: string;
    options: Array<{value: number; label: string}>;
  }>).find(component => component.key === 'cvs');

  it('keeps the intended 130-139 heart-rate band', () => {
    expect(hr?.options.find(option => option.value === 20)?.label).toBe('130 - 139 bpm');
    expect(hr?.options.some(option => option.label.includes('13-139'))).toBe(false);
  });

  it('yields no complete interpretation until every component is selected', () => {
    expect(interpretBurchWartofsky(false, 0)).toEqual({
      title: 'Select values',
      action: 'Select a value for all components to calculate the Thyroid Storm score.',
      tone: 'neutral',
    });
    expect(interpretBurchWartofsky(false, 50).title).toBe('Select values');
  });

  it('locks current Burch-Wartofsky action wording and thresholds', () => {
    expect(interpretBurchWartofsky(true, 24)).toEqual({
      title: '🟢 Thyroid Storm Unlikely (<25)',
      action:
        'Thyroid storm is unlikely. Perform thyroid function tests and manage underlying symptoms supportively.',
      tone: 'low',
    });
    expect(interpretBurchWartofsky(true, 25)).toEqual({
      title: '🟡 Impending Thyroid Storm (25-44)',
      action:
        'Highly suggestive of developing storm. Initiate aggressive supportive therapy, and consult Endocrine urgently.',
      tone: 'moderate',
    });
    expect(interpretBurchWartofsky(true, 44).title).toBe('🟡 Impending Thyroid Storm (25-44)');
    expect(interpretBurchWartofsky(true, 45)).toEqual({
      title: '🔴 Thyroid Storm Highly Probable (≥45)',
      action:
        "Clinical emergency! Admit to ICU immediately. Initiate PTU, Lugol's iodine, beta-blocker, and steroids.",
      tone: 'high',
    });
  });
});

describe('interpretNews2Risk', () => {
  const keys = ['resp_rate', 'spo2', 'supplemental_o2', 'sbp', 'heart_rate', 'consciousness', 'temperature'];
  const allZero = Object.fromEntries(keys.map(key => [key, 0]));

  it('returns no interpretation until every parameter is answered', () => {
    expect(interpretNews2Risk(null)).toBeNull();
    expect(evaluateNews2(keys, {...allZero, sbp: undefined}).risk).toBeNull();
    expect(interpretNews2Risk(evaluateNews2(keys, {...allZero, sbp: undefined}).risk)).toBeNull();
  });

  it('locks current NEWS2 recommendation strings', () => {
    expect(interpretNews2Risk('low')).toEqual({
      title: '🟢 Low clinical risk',
      action: 'Routine ward-based monitoring per local NEWS2 policy.',
      tone: 'low',
    });
    expect(interpretNews2Risk('low-medium')).toEqual({
      title: '🟠 Low-medium risk — single parameter scoring 3',
      action:
        'A red score in one parameter mandates an urgent ward-based review by a clinician competent in assessing acute illness, regardless of the total.',
      tone: 'moderate',
    });
    expect(interpretNews2Risk('medium')).toEqual({
      title: '🟠 Medium clinical risk (NEWS2 5-6)',
      action:
        'Urgent review by a clinician with core competencies in acute illness; escalate monitoring frequency.',
      tone: 'moderate',
    });
    expect(interpretNews2Risk('high')).toEqual({
      title: '🔴 High clinical risk (NEWS2 ≥ 7)',
      action:
        'Emergency assessment by a team with critical-care competencies; continuous monitoring in a higher-care setting.',
      tone: 'high',
    });
  });
});

describe('interpretCamIcu', () => {
  it('fails closed on incomplete answers', () => {
    expect(interpretCamIcu(false, 'yes', 'yes', 'yes', 'no')).toBeNull();
  });

  it('locks current CAM-ICU wording', () => {
    expect(interpretCamIcu(true, 'yes', 'yes', 'yes', 'no')).toEqual({
      title: '🔴 CAM-ICU Positive: Delirium present',
      action:
        'Identify and treat underlying causes; review sedation; consider non-pharmacological delirium bundle measures.',
      tone: 'high',
    });
    expect(interpretCamIcu(true, 'yes', 'no', 'yes', 'yes')).toEqual({
      title: '🟢 CAM-ICU Negative: No delirium',
      action: 'Reassess at next scheduled sedation/delirium screen.',
      tone: 'low',
    });
  });
});

describe('interpretChecklistScore golden wording', () => {
  it('fails closed on incomplete Alvarado / Wells / CURB-65 / PERC input', () => {
    expect(interpretChecklistScore('alvarado', false, 10, bandsOf(alvarado))).toBeNull();
    expect(interpretChecklistScore('wells_dvt', false, 4, bandsOf(wellsDvt))).toBeNull();
    expect(interpretChecklistScore('wells_pe', false, 7, bandsOf(wellsPe))).toBeNull();
    expect(interpretChecklistScore('curb65', false, 3, bandsOf(curb65))).toBeNull();
    expect(interpretChecklistScore('perc', false, 0, undefined)).toBeNull();
  });

  it('does not treat unanswered Alvarado criteria as negative', () => {
    const keys = keysOf(alvarado);
    const partial = calculateChecklistScore(
      alvarado.record.components,
      {migratory: 'no'},
    );
    expect(partial.complete).toBe(false);
    expect(interpretChecklistScore('alvarado', partial.complete, partial.score, bandsOf(alvarado))).toBeNull();
    expect(calculateChecklistScore(alvarado.record.components, {}).complete).toBe(false);
    expect(keys).toHaveLength(8);
  });

  it('locks Alvarado recommendation strings at every band boundary', () => {
    const bands = bandsOf(alvarado);
    expect(interpretChecklistScore('alvarado', true, 0, bands)).toEqual({
      title: 'Appendicitis Unlikely',
      action: 'Consider other causes. Observe if pain persists.',
      tone: 'low',
    });
    expect(interpretChecklistScore('alvarado', true, 4, bands)?.title).toBe('Appendicitis Unlikely');
    expect(interpretChecklistScore('alvarado', true, 5, bands)).toEqual({
      title: 'Appendicitis Possible',
      action: 'Keep NPO, active observation, consider ultrasound.',
      tone: 'moderate',
    });
    expect(interpretChecklistScore('alvarado', true, 6, bands)?.title).toBe('Appendicitis Possible');
    expect(interpretChecklistScore('alvarado', true, 7, bands)).toEqual({
      title: 'Appendicitis Probable/Highly Probable',
      action: 'Urgent surgical consultation. Prepare for appendectomy.',
      tone: 'high',
    });
    expect(interpretChecklistScore('alvarado', true, 10, bands)?.title).toBe(
      'Appendicitis Probable/Highly Probable',
    );
  });

  it('locks Wells DVT recommendation strings at the 0/1 boundary', () => {
    const bands = bandsOf(wellsDvt);
    expect(interpretChecklistScore('wells_dvt', true, 0, bands)).toEqual({
      title: 'DVT Unlikely',
      action: 'Perform D-dimer. If negative, exclude DVT. If positive, perform ultrasound.',
      tone: 'low',
    });
    expect(interpretChecklistScore('wells_dvt', true, 1, bands)).toEqual({
      title: 'DVT Likely',
      action: 'Perform formal compressive ultrasound of lower limb. Cautiously bridge with Clexane.',
      tone: 'low',
    });
  });

  it('locks Wells PE recommendation strings at 1.5 / 2 / 4 / 4.5', () => {
    const bands = bandsOf(wellsPe);
    expect(interpretChecklistScore('wells_pe', true, 1.5, bands)).toEqual({
      title: 'Low Risk',
      action: 'Apply PERC only after confirming the patient is otherwise appropriate for the low-risk pathway.',
      tone: 'low',
    });
    expect(interpretChecklistScore('wells_pe', true, 2, bands)).toEqual({
      title: 'Moderate Risk',
      action: 'Use the HJH pulmonary embolism algorithm, including age-adjusted D-dimer where applicable.',
      tone: 'moderate',
    });
    expect(interpretChecklistScore('wells_pe', true, 4, bands)?.title).toBe('Moderate Risk');
    expect(interpretChecklistScore('wells_pe', true, 4.5, bands)).toEqual({
      title: 'High Risk',
      action: 'Follow the HJH high-risk pathway: assess contraindications, anticoagulation, and CTPA eligibility.',
      tone: 'high',
    });
  });

  it('locks CURB-65 recommendation strings at 1 / 2 / 3', () => {
    const bands = bandsOf(curb65);
    expect(interpretChecklistScore('curb65', true, 1, bands)).toEqual({
      title: 'Low Risk (Mortality <3%)',
      action: 'Outpatient treatment with oral antibiotics (Amoxicillin).',
      tone: 'low',
    });
    expect(interpretChecklistScore('curb65', true, 2, bands)).toEqual({
      title: 'Intermediate Risk (Mortality <9%)',
      action: 'Inpatient admission. Intravenous antibiotics (Augmentin).',
      tone: 'moderate',
    });
    expect(interpretChecklistScore('curb65', true, 3, bands)).toEqual({
      title: 'High Risk (Mortality 15-40%)',
      action: 'Urgent inpatient or ICU admission. Broad-spectrum IV antibiotics + steroid.',
      tone: 'high',
    });
  });

  it('locks PERC wording and never treats unanswered as negative', () => {
    const keys = keysOf(perc);
    expect(calculateChecklistScore(perc.record.components, {}).complete).toBe(false);
    expect(interpretChecklistScore('perc', false, 0, undefined)).toBeNull();
    expect(interpretChecklistScore('perc', true, 0, undefined)).toEqual({
      title: 'PERC Negative',
      action:
        'All eight HJH PERC criteria have been explicitly confirmed as negative. Apply only within the HJH low-risk PE pathway.',
      tone: 'low',
    });
    expect(interpretChecklistScore('perc', true, 1, undefined)).toEqual({
      title: 'PERC Positive',
      action: '1 positive criterion. Follow the HJH pulmonary embolism algorithm.',
      tone: 'moderate',
    });
    expect(interpretChecklistScore('perc', true, 2, undefined)?.action).toBe(
      '2 positive criteriona. Follow the HJH pulmonary embolism algorithm.',
    );
    expect(calculateChecklistScore(perc.record.components, allNo(keys)).complete).toBe(true);
    expect(
      calculateChecklistScore(perc.record.components, yesOnly(keys, ['age'])).score,
    ).toBe(1);
  });
});

describe('interpretGradedScore', () => {
  const bands: InterpretationBand[] = [
    {min: 0, max: 3, label: 'Low risk', action: 'Observe.'},
    {min: 4, max: 6, label: 'Moderate risk', action: 'Investigate.'},
    {min: 7, max: 10, label: 'High risk', action: 'Admit.'},
  ];

  it('fails closed until complete', () => {
    expect(interpretGradedScore(false, 10, bands)).toBeNull();
    expect(interpretGradedScore(true, 5, undefined)).toBeNull();
  });

  it('uses the supplied band wording', () => {
    expect(interpretGradedScore(true, 3, bands)).toEqual({
      title: 'Low risk',
      action: 'Observe.',
      tone: 'low',
    });
    expect(interpretGradedScore(true, 4, bands)?.tone).toBe('moderate');
    expect(interpretGradedScore(true, 7, bands)?.tone).toBe('high');
  });
});

describe('interpretTieredRiskRule', () => {
  it('fails closed when incomplete and no tier has triggered', () => {
    expect(interpretTieredRiskRule(false, null, null, 'CT head indicated.')).toBeNull();
  });

  it('locks current wording', () => {
    expect(interpretTieredRiskRule(true, 'high', 'High-risk factors', 'CT head indicated.')).toEqual({
      title: 'High-risk present',
      action: 'CT head indicated.',
      tone: 'high',
    });
    expect(interpretTieredRiskRule(true, null, null, 'CT head indicated.')).toEqual({
      title: 'No risk factors present',
      action: 'Rule does not mandate imaging based on the criteria entered.',
      tone: 'low',
    });
  });
});

describe('formula interpretation helpers', () => {
  it('keeps page-labelled dual corrected-sodium keys distinct but same wording', () => {
    expect(formulaInterpretationKey('corrected_na_hjh_page92')).toBe('corrected_na');
    expect(formulaInterpretationKey('corrected_na_hjh_page97')).toBe('corrected_na');
    expect(interpretCorrectedSodium(133.2)).toEqual({
      title: 'Corrected Sodium: 133.2 mmol/L',
      action: 'Adjusted for dilutional effect of hyperglycaemia on measured sodium.',
      tone: 'low',
    });
    expect(interpretFormulaResult('corrected_na_hjh_page92', 133.2)).toEqual(
      interpretCorrectedSodium(133.2),
    );
    expect(interpretFormulaResult('corrected_na_hjh_page97', 134.8)).toEqual(
      interpretCorrectedSodium(134.8),
    );
  });

  it('locks Parkland / Modified Brooke plan wording', () => {
    expect(interpretParkland(4200)).toEqual({
      totalVolumeMl: 4200,
      first8hMl: 2100,
      next16hMl: 2100,
      hourlyFirst8hMl: 262.5,
      hourlyNext16hMl: 131.25,
      warning:
        '⚠️ HJH initiation thresholds: adults >20% TBSA and children >15% TBSA. Paediatric maintenance fluid is separate.',
    });
  });

  it('locks anion-gap wording at the 16 boundary', () => {
    expect(interpretAnionGap(16).title).toBe('🟢 Normal Anion Gap');
    expect(interpretAnionGap(16).action).toBe('Normal reference range: 8–16 mmol/L.');
    expect(interpretAnionGap(16.1)).toEqual({
      title: '🔴 Elevated Anion Gap',
      action:
        'MUDPILES / GOLD MARK differential: Methanol, Uremia, DKA/Ketoacidosis, Paracetamol/Propofol, Iron/INH, Lactic acidosis, Ethylene glycol, Salicylates.',
      tone: 'high',
    });
  });

  it('locks free-water and sodium-deficit warning strings', () => {
    expect(interpretFreeWaterDeficit(6).action).toBe(
      '⚠️ Correct slowly over 48–72 hours to prevent cerebral edema. Max correction 10–12 mmol/L per 24h.',
    );
    expect(interpretSodiumDeficit(336).action).toBe(
      '⚠️ Correct severe hyponatremia slowly. Avoid correcting too quickly (risk of osmotic demyelination / pontine myelinolysis). Limit to <10 mmol/L in 24 hours.',
    );
  });

  it('locks P/F ratio oxygenation bands and the ARDS caveat', () => {
    expect(interpretPfRatio(100).title).toBe('🔴 Severe hypoxaemia (P/F ≤ 100)');
    expect(interpretPfRatio(101).title).toBe('🟠 Moderate hypoxaemia (P/F 101–200)');
    expect(interpretPfRatio(200).title).toBe('🟠 Moderate hypoxaemia (P/F 101–200)');
    expect(interpretPfRatio(201).title).toBe('🟡 Mild hypoxaemia (P/F 201–300)');
    expect(interpretPfRatio(300).title).toBe('🟡 Mild hypoxaemia (P/F 201–300)');
    expect(interpretPfRatio(301).title).toBe('🟢 Normal oxygenation (P/F > 300)');
    expect(PF_RATIO_ARDS_CAVEAT).toBe(
      'P/F ratio alone does not diagnose ARDS. Confirm the Berlin criteria — acute onset ≤ 1 week, bilateral opacities, not fully explained by cardiac failure/fluid overload, measured on PEEP/CPAP ≥ 5 cmH₂O — before applying an ARDS label or management.',
    );
  });

  it('locks PESI class wording at 65 / 85 / 105 / 125', () => {
    expect(interpretPesi(65).title).toBe('Class I - Very low risk');
    expect(interpretPesi(65.1).title).toBe('Class II - Low risk');
    expect(interpretPesi(85).title).toBe('Class II - Low risk');
    expect(interpretPesi(85.1).title).toBe('Class III - Moderate risk');
    expect(interpretPesi(105).title).toBe('Class III - Moderate risk');
    expect(interpretPesi(105.1).title).toBe('Class IV - High risk');
    expect(interpretPesi(125).title).toBe('Class IV - High risk');
    expect(interpretPesi(125.1)).toEqual({
      title: 'Class V - Very high risk',
      action: '10.0-24.5% 30-day mortality.',
      tone: 'high',
    });
  });

  it('locks MELD mortality wording at 10 / 20 / 30 / 40', () => {
    expect(interpretMeld(9).action).toBe('Approximate 3-month mortality < 2%.');
    expect(interpretMeld(10).action).toBe('Approximate 3-month mortality ~6%.');
    expect(interpretMeld(20).action).toBe('Approximate 3-month mortality ~20%.');
    expect(interpretMeld(30).action).toBe('Approximate 3-month mortality ~53%.');
    expect(interpretMeld(40).action).toBe('Approximate 3-month mortality ~71%.');
  });

  it('returns no formula interpretation for unknown or NaN results', () => {
    expect(interpretFormulaResult('unknown', 1)).toBeNull();
    expect(interpretFormulaResult('anion_gap', Number.NaN)).toBeNull();
  });
});
