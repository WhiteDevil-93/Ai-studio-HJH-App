export interface FlowchartOption {
  label: string;
  targetNodeId: string;
  variant?: 'danger' | 'warning' | 'success' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'neutral';
  description?: string;
}

export interface FlowchartNode {
  id: string;
  type: 'decision' | 'action' | 'warning' | 'outcome' | 'info';
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: 'rose' | 'amber' | 'emerald' | 'indigo' | 'sky' | 'violet';
  bullets?: string[];
  options?: FlowchartOption[];
  nextStepId?: string;
  linkProtocolId?: string;
  linkProtocolTitle?: string;
}

export interface FlowchartData {
  id: string;
  title: string;
  subtitle?: string;
  initialNodeId: string;
  nodes: Record<string, FlowchartNode>;
}

export const HYPERTENSION_FLOWCHART_DATA: FlowchartData = {
  id: 'hypertension_flowchart',
  title: 'Hypertension Flowchart (ED Assessment & Management)',
  subtitle: 'HJH Emergency Department Guidelines 2026 · Page 98',
  initialNodeId: 'assess_tod',
  nodes: {
    assess_tod: {
      id: 'assess_tod',
      type: 'decision',
      title: 'Initial End-Organ Damage Assessment',
      subtitle: 'Does the patient have ACUTE, LIFE-THREATENING Target Organ Damage (TOD)?',
      accent: 'indigo',
      badge: 'DECISION NODE 1',
      bullets: [
        'Hypertensive encephalopathy & retinopathy',
        'Haemorrhagic / Ischaemic Stroke (CVA)',
        'Acute Coronary Syndrome (STEMI / NSTE-ACS)',
        'Acute LV dysfunction / Congestive heart failure',
        'Acute pulmonary oedema (SCAPE)',
        'Acute aortic dissection',
        'Acute renal failure',
        'Eclampsia / Pre-eclampsia',
      ],
      options: [
        {
          label: 'YES — Acute TOD Present',
          targetNodeId: 'hypertensive_emergency',
          variant: 'danger',
          description: 'Elevated BP (>180/110) WITH acute life-threatening end-organ damage',
        },
        {
          label: 'NO — No Acute TOD',
          targetNodeId: 'uncontrolled_hypertension',
          variant: 'warning',
          description: 'Elevated BP (>180/110) WITHOUT acute life-threatening end-organ damage',
        },
      ],
    },

    hypertensive_emergency: {
      id: 'hypertensive_emergency',
      type: 'warning',
      title: 'Hypertensive Emergency',
      subtitle: 'Elevated BP (>180/110) WITH Acute Target Organ Damage',
      accent: 'rose',
      badge: 'IMMEDIATE ED IV THERAPY REQUIRED',
      bullets: [
        'Immediate IV antihypertensive therapy in the ED (Labetalol or Isosorbide Dinitrate infusion)',
        'ABC Resuscitation: A – Definitive airway if depressed GCS; B – Non-invasive ventilation if acute pulmonary oedema (SCAPE); C – Fluid bolus with Balsol/Ringers Lactate @ 10ml/kg prior to IV antihypertensive',
        'Treatment Goal (1st hour): Reduce MAP by 20–25% ONLY; DBP not less than 110 mmHg',
        'Aortic Dissection Exception: Goal Systolic BP < 100–120 mmHg within 20 minutes if tolerated',
        'Disposition: Immediate Internal Medicine / ICU / High Care referral with serial ECG & VBG monitoring',
      ],
      linkProtocolId: 'hypertensive_emergencies',
      linkProtocolTitle: 'Open Hypertensive Emergencies IV Protocol (Page 99)',
    },

    uncontrolled_hypertension: {
      id: 'uncontrolled_hypertension',
      type: 'decision',
      title: 'Uncontrolled or Poorly Controlled Hypertension',
      subtitle: 'Elevated BP (>180/110) WITHOUT Acute End-Organ Damage',
      accent: 'amber',
      badge: 'ED URGENCY / NON-EMERGENT',
      bullets: [
        'Exclude Reversible Causes: Incorrect cuff size/technique, pain, anxiety/stress, full bladder, missing regular meds',
        'CRITICAL RULE: No role in the ED for stat oral antihypertensives!',
      ],
      options: [
        {
          label: 'Proceed to Management & Discharge Plan',
          targetNodeId: 'outpatient_management',
          variant: 'indigo',
        },
      ],
    },

    outpatient_management: {
      id: 'outpatient_management',
      type: 'outcome',
      title: 'ED Management & Outpatient Discharge Plan',
      subtitle: 'Step-by-step discharge protocol for non-emergent hypertension',
      accent: 'emerald',
      badge: 'OUTPATIENT MANAGEMENT PLAN',
      bullets: [
        'Treat initial presenting complaint (e.g., analgesia for pain, reassurance for anxiety)',
        'Screen for Target Organ Damage (TOD) — likely true HT if present',
        'True HT: Discharge on oral antihypertensive agents — HCTZ + ACE-inhibitor or Calcium Channel Blocker (CCB)',
        'Reactive HT: Reassure patient, no TTO (treatment to take out) required',
        'Follow-Up: Refer to local primary care clinic for repeat BP check and medication continuation within 3 to 7 days',
      ],
    },
  },
};

export const HYPERGLYCAEMIA_FLOWCHART_DATA: FlowchartData = {
  id: 'hyperglycaemia_flowchart',
  title: 'Hyperglycaemia Flowchart (DKA & HHS Triage Algorithm)',
  subtitle: 'HJH ED Guidelines 2026 · Page 92',
  initialNodeId: 'assess_hgt',
  nodes: {
    assess_hgt: {
      id: 'assess_hgt',
      type: 'decision',
      title: 'Initial Blood Glucose Assessment',
      subtitle: 'Is HGT > 11.0 mmol/L with symptoms of DKA or HHS?',
      accent: 'indigo',
      badge: 'TRIAGE DECISION',
      bullets: [
        'Polyuria, polydipsia, weight loss',
        'Nausea, vomiting, abdominal pain',
        'Altered level of consciousness / Lethargy',
        'Kussmaul breathing / Acetone breath odor',
        'Dehydration signs (dry mucous membranes, delayed CRT, tachycardia)',
      ],
      options: [
        {
          label: 'YES — DKA / HHS Suspected',
          targetNodeId: 'dka_hhs_diagnostic',
          variant: 'danger',
          description: 'HGT > 11 mmol/L with ketoacidosis or hyperosmolar signs',
        },
        {
          label: 'NO — Simple Hyperglycaemia',
          targetNodeId: 'simple_hyperglycaemia',
          variant: 'warning',
          description: 'Asymptomatic high HGT without ketoacidosis',
        },
      ],
    },
    dka_hhs_diagnostic: {
      id: 'dka_hhs_diagnostic',
      type: 'decision',
      title: 'Diagnostic Differentiation: DKA vs HHS',
      subtitle: 'Evaluate Blood Gas (VBG/ABG), Ketones & Osmolality',
      accent: 'amber',
      badge: 'DIAGNOSTIC CRITERIA',
      bullets: [
        'Diabetic Ketoacidosis (DKA): HGT > 11 mmol/L, pH < 7.30 or HCO3 < 15 mmol/L, Blood Ketones > 3.0 mmol/L (or urine ketones ++/+++)',
        'Hyperosmolar Hyperglycaemic State (HHS): HGT > 30 mmol/L, sOsmolality > 320 mOsm/kg, severe dehydration, pH > 7.30, mild/no ketonemia',
      ],
      options: [
        {
          label: 'DKA Confirmed',
          targetNodeId: 'dka_resuscitation',
          variant: 'danger',
        },
        {
          label: 'HHS Confirmed',
          targetNodeId: 'hhs_resuscitation',
          variant: 'warning',
        },
      ],
    },
    dka_resuscitation: {
      id: 'dka_resuscitation',
      type: 'action',
      title: 'DKA Resuscitation & Management',
      subtitle: 'Fluids, Electrolytes & Fixed Rate Insulin Infusion',
      accent: 'rose',
      badge: 'ED MANAGEMENT PROTOCOL',
      bullets: [
        'Fluid Resuscitation: 1L 0.9% NaCl over 1st hour. Then 500ml/hr for 2 hours, then 250ml/hr.',
        'Potassium Replacement: Check K+ BEFORE starting insulin. If K+ < 3.5, HOLD insulin and replace K+ stat! Add 20-40 mmol KCl per litre NaCl once K+ < 5.5.',
        'Insulin Infusion: Actrapid @ 0.1 units/kg/hour fixed rate (do NOT give IV bolus).',
        'Substrate Change: Add 5% Dextrose once HGT falls below 14 mmol/L while continuing insulin infusion.',
      ],
      linkProtocolId: 'diabetic_ketoacidosis_dka',
      linkProtocolTitle: 'Open Full DKA & HHS Resuscitation Protocol',
    },
    hhs_resuscitation: {
      id: 'hhs_resuscitation',
      type: 'action',
      title: 'HHS Resuscitation & Management',
      subtitle: 'Gradual Dehydration Correction & Thromboprophylaxis',
      accent: 'amber',
      badge: 'ED MANAGEMENT PROTOCOL',
      bullets: [
        'Fluid Replacement: Slower, gradual rehydration over 48 hours with 0.9% NaCl (1L over 1-2 hours).',
        'Insulin Therapy: Low dose Actrapid 0.05 units/kg/hour ONLY after fluid resuscitation started.',
        'Anticoagulation: Prophylactic Clexane 40mg SC daily (High risk of thromboembolism).',
        'ICU / High Care Referral: Monitor osmolality drop (max 3 mOsm/kg/hour).',
      ],
    },
    simple_hyperglycaemia: {
      id: 'simple_hyperglycaemia',
      type: 'outcome',
      title: 'Simple Hyperglycaemia ED Pathway',
      subtitle: 'Outpatient Education & Follow-Up',
      accent: 'emerald',
      badge: 'OUTPATIENT DISCHARGE',
      bullets: [
        'Screen for underlying triggers (Infection, non-compliance, skipped doses).',
        'No insulin without meals! (Most common cause of presentation).',
        'Re-establish home oral hypoglycaemic or subcutaneous insulin regimen.',
        'Discharge to local diabetic clinic / dietician with clear follow-up plan.',
      ],
    },
  },
};

export const STATUS_EPILEPTICUS_FLOWCHART_DATA: FlowchartData = {
  id: 'status_epilepticus_algorithm',
  title: 'Status Epilepticus Anticonvulsant Therapy Algorithm',
  subtitle: 'HJH ED Guidelines 2026 · Emergency Seizure Pathway',
  initialNodeId: 'triage_0_5min',
  nodes: {
    triage_0_5min: {
      id: 'triage_0_5min',
      type: 'decision',
      title: '0–5 Minutes: Initial Stabilization & Assessment',
      subtitle: 'Is seizure activity ongoing at 5 minutes?',
      accent: 'indigo',
      badge: 'TIME 0–5 MIN',
      bullets: [
        'ABC Resuscitation & High-flow O2 via non-rebreather mask',
        'Check HGT immediately! (Give 50ml 50% Dextrose IV if glucose < 4 mmol/L)',
        'Establish IV access & draw bloods (U&E, Ca, Mg, anticonvulsant levels, VBG)',
        'Monitor ECG, SpO2, and Blood Pressure',
      ],
      options: [
        {
          label: 'Seizure Continues (>5 min)',
          targetNodeId: 'first_line_benzo',
          variant: 'danger',
          description: 'Proceed immediately to 1st-line Benzodiazepine',
        },
        {
          label: 'Seizure Terminated',
          targetNodeId: 'post_ictal_care',
          variant: 'success',
          description: 'Patient post-ictal, airway stable',
        },
      ],
    },
    first_line_benzo: {
      id: 'first_line_benzo',
      type: 'decision',
      title: '5–10 Minutes: 1st-Line Benzodiazepine Therapy',
      subtitle: 'Administer STAT Benzodiazepine dose',
      accent: 'rose',
      badge: '1ST LINE THERAPY',
      bullets: [
        'Lorazepam 4mg IV over 2 minutes (0.1 mg/kg) OR',
        'Diazepam 10mg IV over 2 minutes (0.2 mg/kg) OR',
        'Midazolam 10mg IM (if no IV access established)',
        'Repeat dose ONCE at 10 minutes if seizure continues.',
      ],
      options: [
        {
          label: 'Seizure Continues at 10–20 min',
          targetNodeId: 'second_line_aed',
          variant: 'danger',
          description: 'Status epilepticus established — proceed to 2nd-line AED',
        },
        {
          label: 'Seizure Terminated',
          targetNodeId: 'post_ictal_care',
          variant: 'success',
        },
      ],
    },
    second_line_aed: {
      id: 'second_line_aed',
      type: 'decision',
      title: '10–30 Minutes: 2nd-Line Antiepileptic Infusion',
      subtitle: 'Choose ONE non-sedating IV Antiepileptic Agent',
      accent: 'amber',
      badge: '2ND LINE THERAPY',
      bullets: [
        'Sodium Valproate: 40 mg/kg IV (max 3000mg) over 5-10 minutes OR',
        'Levetiracetam (Keppra): 60 mg/kg IV (max 4500mg) over 10 minutes OR',
        'Phenytoin: 20 mg/kg IV (max 1500mg) @ max rate 50 mg/min with cardiac monitoring.',
      ],
      options: [
        {
          label: 'Seizure Continues >30 min (Refractory)',
          targetNodeId: 'third_line_rsi',
          variant: 'danger',
          description: 'Refractory Status Epilepticus — General Anaesthesia required',
        },
        {
          label: 'Seizure Terminated',
          targetNodeId: 'post_ictal_care',
          variant: 'success',
        },
      ],
    },
    third_line_rsi: {
      id: 'third_line_rsi',
      type: 'warning',
      title: '>30 Minutes: Refractory Status Epilepticus (ICU)',
      subtitle: 'Rapid Sequence Intubation & Continuous Sedative Infusion',
      accent: 'rose',
      badge: 'REFRACTORY STATUS EPILEPTICUS',
      bullets: [
        'Prepare for RSI & definitive airway immediately.',
        'Propofol: 1–2 mg/kg IV bolus, followed by 2–10 mg/kg/hr infusion OR',
        'Midazolam Infusion: 0.2 mg/kg loading, then 0.05–2 mg/kg/hr OR',
        'Ketamine: 1.5–3 mg/kg IV loading, then 1–5 mg/kg/hr infusion.',
        'Urgent ICU admission & continuous EEG monitoring.',
      ],
      linkProtocolId: 'status_epilepticus',
      linkProtocolTitle: 'Open Full Status Epilepticus Protocol',
    },
    post_ictal_care: {
      id: 'post_ictal_care',
      type: 'outcome',
      title: 'Post-Ictal Recovery & Workup',
      subtitle: 'Identify underlying cause and prevent recurrence',
      accent: 'emerald',
      badge: 'POST-ICTAL MANAGEMENT',
      bullets: [
        'Maintain clear airway, lateral recovery position, supplemental O2.',
        'Investigate triggers: Non-compliance, infection, metabolic, stroke, tox.',
        'CT Brain for first-onset seizure, persistent focal deficit, or head trauma.',
        'Resume regular anti-seizure medication.',
      ],
    },
  },
};

export const PE_ALGORITHM_FLOWCHART_DATA: FlowchartData = {
  id: 'pe_algorithm',
  title: 'Pulmonary Embolism Diagnostic & Management Algorithm',
  subtitle: 'HJH ED Guidelines 2026 · PE Risk Stratification',
  initialNodeId: 'assess_stability',
  nodes: {
    assess_stability: {
      id: 'assess_stability',
      type: 'decision',
      title: 'Initial Hemodynamic Stability Assessment',
      subtitle: 'Is the patient Hemodynamically Unstable (Shock / SBP < 90 mmHg)?',
      accent: 'indigo',
      badge: 'TRIAGE ASSESSMENT',
      bullets: [
        'Obvious hypotension (SBP < 90 mmHg or drop ≥ 40 mmHg for > 15 min)',
        'Obstructive shock / Cardiac arrest',
        'Severe acute dyspnoea & hypoxaemia',
      ],
      options: [
        {
          label: 'YES — Unstable / Shock Present',
          targetNodeId: 'high_risk_pe',
          variant: 'danger',
          description: 'High-Risk PE (Massive PE) — Resuscitation & Thrombolysis',
        },
        {
          label: 'NO — Hemodynamically Stable',
          targetNodeId: 'stable_pe_wells',
          variant: 'indigo',
          description: 'Stable PE — Clinical probability scoring',
        },
      ],
    },
    high_risk_pe: {
      id: 'high_risk_pe',
      type: 'warning',
      title: 'High-Risk PE (Massive Pulmonary Embolism)',
      subtitle: 'Emergency Resuscitation & STAT Thrombolysis',
      accent: 'rose',
      badge: 'EMERGENCY THROMBOLYSIS',
      bullets: [
        'Bedside Focused ECHO: RV strain / dilation, D-shaped left ventricle, McConnell sign.',
        'STAT Thrombolysis: Actilyse (Alteplase) 100mg IV over 2 hours (or 50mg IV bolus if cardiac arrest imminent).',
        'Unfractionated Heparin: 80 units/kg IV bolus, then 18 units/kg/hr infusion.',
        'Avoid aggressive fluid loading (max 500ml NaCl bolus; RV overload risk!).',
        'Immediate ICU / Cardiology referral.',
      ],
      linkProtocolId: 'pulmonary_embolism',
      linkProtocolTitle: 'Open Full Pulmonary Embolism Protocol',
    },
    stable_pe_wells: {
      id: 'stable_pe_wells',
      type: 'decision',
      title: 'Stable PE: Wells PE Score Stratification',
      subtitle: 'Calculate Wells Score for Pulmonary Embolism',
      accent: 'amber',
      badge: 'CLINICAL PROBABILITY SCORE',
      bullets: [
        'Clinical signs of DVT (+3.0)',
        'PE most likely diagnosis (+3.0)',
        'Heart rate > 100 bpm (+1.5)',
        'Immobilisation/Surgery in past 4 wks (+1.5)',
        'Previous DVT/PE (+1.5)',
        'Haemoptysis (+1.0)',
        'Malignancy (+1.0)',
      ],
      options: [
        {
          label: 'Wells > 4.0 (PE Likely)',
          targetNodeId: 'ctpa_pathway',
          variant: 'danger',
          description: 'Direct to CTPA + Therapeutic Anticoagulation',
        },
        {
          label: 'Wells ≤ 4.0 (PE Unlikely)',
          targetNodeId: 'ddimer_pathway',
          variant: 'success',
          description: 'D-Dimer testing or PERC Rule',
        },
      ],
    },
    ctpa_pathway: {
      id: 'ctpa_pathway',
      type: 'action',
      title: 'PE Likely: CTPA & Anticoagulation',
      subtitle: 'Definitive Imaging & Anticoagulation',
      accent: 'indigo',
      badge: 'IMAGING & TREATMENT',
      bullets: [
        'Commence therapeutic anticoagulation immediately while awaiting CTPA: Clexane 1.5mg/kg SC daily (or 1mg/kg 12-hourly).',
        'Perform STAT CT Pulmonary Angiogram (CTPA).',
        'If CTPA Positive: Admit Internal Medicine; assess PESI score for disposition.',
      ],
    },
    ddimer_pathway: {
      id: 'ddimer_pathway',
      type: 'outcome',
      title: 'PE Unlikely: D-Dimer Rule-Out',
      subtitle: 'Quantitative D-Dimer Assay',
      accent: 'emerald',
      badge: 'RULE-OUT PATHWAY',
      bullets: [
        'Order High-Sensitivity D-Dimer assay (Age-adjusted cutoff if > 50 years: Age × 10 μg/L).',
        'D-Dimer Negative (< Cutoff): PE safely excluded. No imaging or anticoagulation required.',
        'D-Dimer Positive (≥ Cutoff): Proceed to CTPA.',
      ],
    },
  },
};

export const JAUNDICE_FLOWCHART_DATA: FlowchartData = {
  id: 'jaundice_flowchart',
  title: 'Jaundice Diagnostic & Management Flowchart',
  subtitle: 'HJH ED Guidelines 2026 · Page 119-120',
  initialNodeId: 'fractionate_bilirubin',
  nodes: {
    fractionate_bilirubin: {
      id: 'fractionate_bilirubin',
      type: 'decision',
      title: 'Bilirubin Fractionation & Urine Dipstick',
      subtitle: 'Is Hyperbilirubinemia Conjugated (Direct) or Unconjugated (Indirect)?',
      accent: 'indigo',
      badge: 'LABORATORY ASSESSMENT',
      bullets: [
        'Check LFTs (Total & Direct Bilirubin, ALT, AST, ALP, GGT)',
        'Urine Dipstick: Bilirubin present = Conjugated; Urobilinogen elevated = Unconjugated / Haemolysis',
      ],
      options: [
        {
          label: 'Conjugated (Direct > 20%)',
          targetNodeId: 'lft_pattern',
          variant: 'amber',
          description: 'Dark urine, pale stools, hepatic/biliary cause',
        },
        {
          label: 'Unconjugated (Direct < 20%)',
          targetNodeId: 'haemolysis_workup',
          variant: 'indigo',
          description: 'Normal urine color, haemolysis / Gilbert syndrome',
        },
      ],
    },
    lft_pattern: {
      id: 'lft_pattern',
      type: 'decision',
      title: 'LFT Pattern: Hepatocellular vs Cholestatic',
      subtitle: 'Evaluate Transaminases (ALT/AST) vs Cholestatic Markers (ALP/GGT)',
      accent: 'amber',
      badge: 'PATTERN RECOGNITION',
      bullets: [
        'Hepatocellular Pattern: Predominant ALT/AST elevation (Viral hepatitis, Paracetamol toxicity, Ischaemic hepatitis, Alcohol).',
        'Cholestatic Pattern: Predominant ALP & GGT elevation (Biliary obstruction, drugs, sepsis).',
      ],
      options: [
        {
          label: 'Cholestatic Pattern (Elevated ALP/GGT)',
          targetNodeId: 'biliary_ultrasound',
          variant: 'amber',
        },
        {
          label: 'Hepatocellular Pattern (Elevated ALT/AST)',
          targetNodeId: 'liver_failure_assessment',
          variant: 'danger',
        },
      ],
    },
    biliary_ultrasound: {
      id: 'biliary_ultrasound',
      type: 'decision',
      title: 'Abdominal Ultrasound: Duct Dilatation',
      subtitle: 'Are intra/extra-hepatic bile ducts dilated on ultrasound?',
      accent: 'sky',
      badge: 'IMAGING ASSESSMENT',
      bullets: [
        'Common Bile Duct (CBD) diameter > 6mm (+1mm per decade over 60)',
        'Intrahepatic biliary ductal dilatation ("Double barrel sign")',
      ],
      options: [
        {
          label: 'YES — Ducts Dilated',
          targetNodeId: 'extrahepatic_obstruction',
          variant: 'danger',
          description: 'Extrahepatic Biliary Obstruction (Gallstones, Tumor, Stricture)',
        },
        {
          label: 'NO — Ducts Normal',
          targetNodeId: 'intrahepatic_cholestasis',
          variant: 'emerald',
          description: 'Intrahepatic Cholestasis (Medications, Sepsis, Pregnancy)',
        },
      ],
    },
    extrahepatic_obstruction: {
      id: 'extrahepatic_obstruction',
      type: 'action',
      title: 'Extrahepatic Obstruction (Surgical Jaundice)',
      subtitle: 'Gallstones / Choledocholithiasis / Malignancy',
      accent: 'rose',
      badge: 'SURGICAL REFERRAL',
      bullets: [
        'Check for Charcot Triad (Jaundice + Fever + RUQ pain) or Reynolds Pentad (add Shock + Confusion) = Acute Cholangitis!',
        'If Cholangitis: STAT IV Antimicrobials (Ceftriaxone + Metronidazole), aggressive fluid resuscitation, urgent ERCP/decompression.',
        'Urgent General Surgery / Gastroenterology referral.',
      ],
    },
    liver_failure_assessment: {
      id: 'liver_failure_assessment',
      type: 'action',
      title: 'Acute Liver Injury / Acute Liver Failure',
      subtitle: 'Screen for Encephalopathy & Coagulopathy (INR > 1.5)',
      accent: 'rose',
      badge: 'CRITICAL CARE PATHWAY',
      bullets: [
        'Check INR & Blood Glucose STAT!',
        'West Haven Encephalopathy Grading (Grade I: Mild confusion; Grade IV: Coma).',
        'Tox Screen: Check STAT Serum Paracetamol level.',
        'N-Acetylcysteine (NAC) Infusion: Give NAC immediately if Paracetamol overdose suspected or acute liver failure of unknown cause.',
      ],
      linkProtocolId: 'liver_failure',
      linkProtocolTitle: 'Open Full Liver Failure Protocol',
    },
    haemolysis_workup: {
      id: 'haemolysis_workup',
      type: 'outcome',
      title: 'Unconjugated Hyperbilirubinemia Pathway',
      subtitle: 'Haemolysis & Genetic Conjugation Deficiencies',
      accent: 'emerald',
      badge: 'HAEMATOLOGY PATHWAY',
      bullets: [
        'Haemolysis Screen: Full Blood Count, Reticulocyte count, LDH, Haptoglobin, Blood Film, Direct Coombs Test.',
        'Gilbert Syndrome: Benign isolated unconjugated jaundice triggered by fasting, stress, illness.',
      ],
    },
    intrahepatic_cholestasis: {
      id: 'intrahepatic_cholestasis',
      type: 'outcome',
      title: 'Intrahepatic Cholestasis Pathway',
      subtitle: 'Drug-Induced Liver Injury / Medical Cholestasis',
      accent: 'emerald',
      badge: 'MEDICAL REFERRAL',
      bullets: [
        'Review all medications: Stop potential hepatotoxic drugs (Augmentin, TB meds, ARVs, anabolic steroids).',
        'Internal Medicine referral for workup (AMA, ANA, viral serology).',
      ],
    },
  },
};

export const BUILTIN_FLOWCHARTS: Record<string, FlowchartData> = {
  // Existing underscore-key aliases (used by legacy pages and tests).
  hypertension_flowchart: HYPERTENSION_FLOWCHART_DATA,
  hypertension_management: HYPERTENSION_FLOWCHART_DATA,
  hypertension_approach: HYPERTENSION_FLOWCHART_DATA,
  hyperglycaemia_flowchart: HYPERGLYCAEMIA_FLOWCHART_DATA,
  hyperglycaemia_approach: HYPERGLYCAEMIA_FLOWCHART_DATA,
  status_epilepticus_algorithm: STATUS_EPILEPTICUS_FLOWCHART_DATA,
  pe_algorithm: PE_ALGORITHM_FLOWCHART_DATA,
  jaundice_flowchart: JAUNDICE_FLOWCHART_DATA,
  jaundice_approach: JAUNDICE_FLOWCHART_DATA,

  // HJH 2026 imported canonical-entry slug aliases.
  'hypertension-flowchart-hjh': HYPERTENSION_FLOWCHART_DATA,
  'hypertensive-emergencies-hjh': HYPERTENSION_FLOWCHART_DATA,
  'hyperglycaemia-flowchart': HYPERGLYCAEMIA_FLOWCHART_DATA,
  'diabetic-ketoacidosis-dka-hjh': HYPERGLYCAEMIA_FLOWCHART_DATA,
  'status-epilepticus-algorithm': STATUS_EPILEPTICUS_FLOWCHART_DATA,
  'status-epilepticus-hjh': STATUS_EPILEPTICUS_FLOWCHART_DATA,
  'pe-algorithm-hjh': PE_ALGORITHM_FLOWCHART_DATA,
  'pulmonary-embolism-hjh': PE_ALGORITHM_FLOWCHART_DATA,
  'jaundice-flowchart': JAUNDICE_FLOWCHART_DATA,
  'liver-failure-hjh': JAUNDICE_FLOWCHART_DATA,
};


export const generateDynamicFlowchartFromProtocol = (
  protocolId: string,
  rawBody: Record<string, unknown>,
): FlowchartData | undefined => {
  const managementSteps = Array.isArray(rawBody.management_steps) ? rawBody.management_steps : [];
  const sourceText = typeof rawBody.source_text === 'string' ? rawBody.source_text : '';
  const itemTitle = typeof rawBody.item === 'string' ? rawBody.item : protocolId;

  if (managementSteps.length === 0 && !sourceText) {
    return undefined;
  }

  const nodes: Record<string, FlowchartNode> = {};

  if (managementSteps.length > 0) {
    managementSteps.forEach((step, idx) => {
      if (typeof step !== 'object' || step === null) return;
      const rec = step as Record<string, unknown>;
      const stepNum = String(rec.step_number ?? idx + 1);
      const action = String(rec.action ?? `Step ${stepNum}`);
      const details = typeof rec.details === 'string' ? rec.details : '';
      const nodeId = `step_${stepNum}`;
      const nextNodeId = idx < managementSteps.length - 1 ? `step_${idx + 2}` : undefined;

      const isDecision = /\?|if\s+|whether|assess|check|evaluate|determine/i.test(action + ' ' + details);

      nodes[nodeId] = {
        id: nodeId,
        type: isDecision ? 'decision' : idx === managementSteps.length - 1 ? 'outcome' : 'action',
        title: action,
        subtitle: `Step ${stepNum}`,
        badge: `STEP ${stepNum}`,
        accent: isDecision ? 'indigo' : idx === 0 ? 'sky' : idx === managementSteps.length - 1 ? 'emerald' : 'amber',
        bullets: details ? [details] : undefined,
        options: nextNodeId
          ? [
              {
                label: `Proceed to Step ${idx + 2}`,
                targetNodeId: nextNodeId,
                variant: 'indigo',
              },
            ]
          : undefined,
      };
    });

    return {
      id: protocolId,
      title: `${itemTitle} (Interactive Decision Pathway)`,
      subtitle: 'Structured Clinical Protocol Flowchart',
      initialNodeId: 'step_1',
      nodes,
    };
  }

  return undefined;
};

export const findFlowchartForProtocol = (
  protocolId: string,
  rawBody?: Record<string, unknown>,
): FlowchartData | undefined => {
  if (BUILTIN_FLOWCHARTS[protocolId]) {
    return BUILTIN_FLOWCHARTS[protocolId];
  }

  if (
    rawBody &&
    typeof rawBody.flowchart === 'object' &&
    rawBody.flowchart !== null &&
    'initialNodeId' in rawBody.flowchart &&
    'nodes' in rawBody.flowchart
  ) {
    return rawBody.flowchart as FlowchartData;
  }

  if (rawBody) {
    return generateDynamicFlowchartFromProtocol(protocolId, rawBody);
  }

  return undefined;
};
