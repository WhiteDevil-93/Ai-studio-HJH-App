export interface FlowchartOption {
  label: string;
  targetNodeId: string;
  variant?: 'danger' | 'warning' | 'success' | 'indigo' | 'neutral';
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

export const BUILTIN_FLOWCHARTS: Record<string, FlowchartData> = {
  hypertension_flowchart: HYPERTENSION_FLOWCHART_DATA,
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

  return undefined;
};
