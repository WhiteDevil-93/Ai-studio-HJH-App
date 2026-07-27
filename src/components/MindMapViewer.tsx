import React, { useState } from 'react';
import {
  Activity, ArrowLeft, CheckCircle2, AlertTriangle, Info, ShieldAlert,
  ChevronRight, Heart, Brain, Stethoscope, Flame, RefreshCw, Zap, Layers
} from 'lucide-react';

interface MindMapViewerProps {
  mindMapId: string;
  onBack: () => void;
  weight?: string;
}

export interface MindMapNode {
  id: string;
  title: string;
  subtitle?: string;
  type: 'start' | 'decision' | 'action' | 'warning' | 'outcome';
  details?: string[];
  options?: { label: string; targetId: string; color?: string }[];
  warning?: string;
  dosage?: string;
}

export interface MindMapDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  pdfPage: number;
  initialNodeId: string;
  nodes: Record<string, MindMapNode>;
}

export const MIND_MAPS_DATABASE: Record<string, MindMapDefinition> = {
  aha_bls_acls: {
    id: 'aha_bls_acls',
    title: 'AHA Adult Cardiac Arrest Algorithm (2020)',
    subtitle: 'High-quality CPR, defibrillation, epinephrine, amiodarone & reversible causes (H\'s and T\'s)',
    category: 'Resuscitation',
    pdfPage: 27,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Start CPR',
        subtitle: 'Give oxygen • Attach monitor/defibrillator',
        type: 'start',
        details: [
          'Push hard (>= 5 cm) and fast (100-120/min), complete chest recoil',
          'Minimize interruptions in compressions',
          'Avoid excessive ventilation',
          'Rotate compressor every 2 minutes or sooner if fatigued'
        ],
        options: [
          { label: 'Check Rhythm: Shockable (VF / Pulseless VT)?', targetId: 'shockable_branch' },
          { label: 'Check Rhythm: Non-Shockable (Asystole / PEA)?', targetId: 'non_shockable_branch' }
        ]
      },
      shockable_branch: {
        id: 'shockable_branch',
        title: 'VF / Pulseless VT (Shockable)',
        type: 'action',
        details: [
          'Deliver 1 Shock (Biphasic: 120-200J or max available; Monophasic: 360J)',
          'Resume CPR immediately for 2 minutes',
          'Establish IV / IO access'
        ],
        options: [
          { label: 'Re-assess Rhythm after 2 min: Still Shockable?', targetId: 'shockable_2' },
          { label: 'ROSC Obtained', targetId: 'post_rosc' }
        ]
      },
      non_shockable_branch: {
        id: 'non_shockable_branch',
        title: 'Asystole / PEA (Non-Shockable)',
        type: 'action',
        dosage: 'Epinephrine 1mg IV/IO ASAP, repeat every 3-5 min',
        details: [
          'Resume CPR immediately for 2 minutes',
          'Establish IV/IO access & give Epinephrine 1mg ASAP',
          'Consider advanced airway & capnography',
          'Treat reversible causes (H\'s and T\'s)'
        ],
        options: [
          { label: 'Re-assess Rhythm after 2 min: Rhythm shockable now?', targetId: 'shockable_branch' },
          { label: 'Still Asystole/PEA after 2 min', targetId: 'non_shockable_branch' },
          { label: 'ROSC Obtained', targetId: 'post_rosc' }
        ]
      },
      shockable_2: {
        id: 'shockable_2',
        title: '2nd Shock & Epinephrine',
        type: 'action',
        dosage: 'Epinephrine 1mg IV/IO every 3-5 minutes',
        details: [
          'Deliver 2nd Shock',
          'Resume CPR 2 minutes',
          'Epinephrine 1mg IV/IO every 3-5 min',
          'Consider advanced airway & continuous capnography'
        ],
        options: [
          { label: 'Rhythm still shockable after 2 min?', targetId: 'antiarrhythmic_step' },
          { label: 'ROSC Obtained', targetId: 'post_rosc' }
        ]
      },
      antiarrhythmic_step: {
        id: 'antiarrhythmic_step',
        title: '3rd Shock + Amiodarone or Lidocaine',
        type: 'action',
        dosage: 'Amiodarone 300mg IV/IO bolus (2nd dose 150mg) OR Lidocaine 1-1.5 mg/kg',
        details: [
          'Deliver 3rd Shock',
          'Resume CPR 2 minutes',
          'Administer Amiodarone 300mg IV/IO (or Lidocaine 1-1.5mg/kg)',
          'Treat Reversible Causes: Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia, Tension pneumothorax, Tamponade, Toxins, Thrombosis (pulmonary/coronary)'
        ],
        options: [
          { label: 'Continue ACLS cycles', targetId: 'shockable_branch' },
          { label: 'ROSC Obtained', targetId: 'post_rosc' }
        ]
      },
      post_rosc: {
        id: 'post_rosc',
        title: 'Return of Spontaneous Circulation (ROSC)',
        type: 'outcome',
        details: [
          'Manage Airway: early placement of ETT',
          'Manage Respiratory: SpO2 92-98%, PaCO2 35-45 mmHg',
          'Manage Hemodynamic: SBP > 90 mmHg, MAP > 65 mmHg',
          'Obtain 12-lead ECG (evaluate for STEMI)',
          'Consider Targeted Temperature Management (TTM) 32-36°C for 24 hours if comatose'
        ]
      }
    }
  },
  trauma_arrest: {
    id: 'trauma_arrest',
    title: 'Trauma Cardiac Arrest Algorithm (Resus Council SA)',
    subtitle: 'Simultaneous multi-member team priorities: H-O-T-T Protocol',
    category: 'Trauma',
    pdfPage: 40,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Hazards, Hello, Help',
        subtitle: 'Ensure scene safety, manual C-spine alignment, call trauma team',
        type: 'start',
        details: [
          'Hazards: Ensure scene safety & don PPE',
          'Hello: Unresponsive, not breathing/gasping. Check POCUS for cardiac wall motion',
          'Help: Activate trauma team immediately'
        ],
        options: [
          { label: 'Execute H-O-T-T Simultaneous Actions', targetId: 'hott_actions' }
        ]
      },
      hott_actions: {
        id: 'hott_actions',
        title: 'Simultaneous H-O-T-T Resuscitation',
        type: 'action',
        details: [
          'H - Haemorrhage Control: Tourniquets, pelvic binder, straighten long bone fractures, IV/IO access above pelvis with warmed crystalloids/FFP/blood',
          'O - Oxygenation & Ventilation: ETT / SGA advanced airway, positive pressure ventilation with 100% O2 @ 15L/min',
          'T - Tension Pneumothorax: Empiric bilateral chest decompression (5th IC space anterior axillary line, finger thoracostomy preferred)',
          'T - Tamponade: Diagnose with Ultrasound, consider emergency thoracotomy or pericardial window if indicated'
        ],
        options: [
          { label: 'ROSC Achieved?', targetId: 'rosc_post' },
          { label: 'No ROSC after interventions', targetId: 'terminate' }
        ]
      },
      rosc_post: {
        id: 'rosc_post',
        title: 'Post Trauma Arrest Management',
        type: 'outcome',
        details: [
          'Follow post cardiac arrest algorithm',
          'Administer Tranexamic Acid (TXA 1g IV)',
          'Urgent surgical consultation for definitive damage control surgery'
        ]
      },
      terminate: {
        id: 'terminate',
        title: 'Consider Termination of Efforts',
        type: 'warning',
        warning: 'If no cardiac motion on ultrasound and all reversible H-O-T-T causes addressed without ROSC, consider terminating resuscitation.'
      }
    }
  },
  epistaxis_flowchart: {
    id: 'epistaxis_flowchart',
    title: 'Epistaxis Management & Nasal Packing Protocol',
    subtitle: 'Stepwise approach from direct pressure to anterior Merocel packing & posterior Foley catheter',
    category: 'ENT',
    pdfPage: 68,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Immediate Management',
        type: 'start',
        details: [
          'Ask patient to blow nose to remove all clots',
          'Sit patient forward & pinch soft part of nose (alae against septum) firmly for 10-15 minutes',
          'Spit out excess blood (do not swallow)',
          'Apply Bactroban ointment 8 hourly for 3/7 on discharge'
        ],
        options: [
          { label: 'Bleeding Stops?', targetId: 'observe_dc' },
          { label: 'Still Bleeding / Re-bleed?', targetId: 'nasal_packing' }
        ]
      },
      observe_dc: {
        id: 'observe_dc',
        title: 'Observe 30 mins & Discharge',
        type: 'outcome',
        details: [
          'Observe for 30 minutes for re-bleeding',
          'Counsel on nares pinching, avoid blowing/sniffing/picking',
          'Hydrate nostrils with saline drops / Vaseline'
        ]
      },
      nasal_packing: {
        id: 'nasal_packing',
        title: 'Anterior Nasal Packing',
        type: 'action',
        dosage: 'Oxymetazoline 2 puffs + 2% Lignocaine cotton wool pack',
        details: [
          'Spray Oxymetazoline (Iliadin) 2 puffs',
          'Anaesthetise with 2% Lignocaine cotton wool',
          'Insert Merocel Nasal Tampon along floor of nostril & expand with adrenaline 1:10 000 (leave 24-48 hrs)',
          'Alternative: Gauze soaked in Cyclokapron (500mg/5ml) + 1:10 000 adrenaline'
        ],
        options: [
          { label: 'Bleeding Controlled?', targetId: 'anterior_discharge' },
          { label: 'Still Bleeding (Posterior Bleed Likely)?', targetId: 'posterior_packing' }
        ]
      },
      anterior_discharge: {
        id: 'anterior_discharge',
        title: 'Discharge with Anterior Pack in Situ',
        type: 'outcome',
        dosage: 'Augmentin oral for 3/7 prophylaxis',
        details: [
          'Prophylactic antibiotics: Augmentin oral for 3 days',
          'Refer within 48 hours for pack removal at ENT OPD'
        ]
      },
      posterior_packing: {
        id: 'posterior_packing',
        title: 'Posterior Nasal Packing',
        type: 'warning',
        dosage: 'Cyclokapron 15mg/kg (max 1g) IV over 15 min',
        warning: 'Senior Doctor & ENT Referral Required!',
        details: [
          'Administer Cyclokapron 15mg/kg IV',
          'Remove anterior pack',
          'Insert Foley catheter (10-14F) along floor of nasal cavity until tip seen in oropharynx',
          'Inflate bulb with 10-20ml sterile water & retract gently against posterior palate',
          'Secure with umbilical cord clamp + gauze padding to prevent alar necrosis',
          'Repack nostrils with new anterior packing & admit patient'
        ]
      }
    }
  },
  croup_algorithm: {
    id: 'croup_algorithm',
    title: 'Westley Croup Score & Treatment Algorithm',
    subtitle: 'Severity stratification and treatment protocols for paediatric croup',
    category: 'Paediatrics / ENT',
    pdfPage: 71,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Westley Croup Score Assessment',
        type: 'start',
        details: [
          'Stridor: None (0), With agitation (1), At rest (2)',
          'Chest wall retractions: None (0), Mild (1), Moderate (2), Severe (3)',
          'Air entry: Normal (0), Decreased (1), Severely decreased (2)',
          'Cyanosis: None (0), With agitation (4), At rest (5)',
          'Conscious Level: Normal (0), Altered (5)'
        ],
        options: [
          { label: 'Score <= 2 (Mild Croup)', targetId: 'mild' },
          { label: 'Score 3 - 7 (Moderate Croup)', targetId: 'moderate' },
          { label: 'Score 8 - 11 (Severe Croup)', targetId: 'severe' },
          { label: 'Score >= 12 (Impending Resp Failure)', targetId: 'resp_failure' }
        ]
      },
      mild: {
        id: 'mild',
        title: 'Mild Croup Management',
        type: 'action',
        dosage: 'Dexamethasone 0.15mg/kg PO (max 10mg) OR Prednisolone 1mg/kg x 2 days',
        details: [
          'Single dose Dexamethasone 0.15mg/kg PO or IM',
          'No need for nebulised adrenalin',
          'Observe 30 minutes post steroids; discharge if stable'
        ]
      },
      moderate: {
        id: 'moderate',
        title: 'Moderate Croup Management',
        type: 'action',
        dosage: 'Adrenalin 1:1,000 nebs 0.5ml/kg (max 5ml) + Budesonide 2mg neb',
        details: [
          'Dexamethasone 0.15mg/kg PO/IM',
          'Nebulised Adrenalin 1:1 000 (0.5ml/kg, max 5ml)',
          'Repeat adrenalin nebs every 15-20 min if no improvement',
          'O2 if Sat < 93%',
          'Admit if symptoms persist > 4 hours'
        ]
      },
      severe: {
        id: 'severe',
        title: 'Severe Croup Management',
        type: 'warning',
        dosage: 'Dexamethasone 0.6mg/kg IV/IM (max 12mg) + Continuous Adrenalin nebs',
        warning: 'Move to Resuscitation Area!',
        details: [
          'Dexamethasone 0.6mg/kg IV/IM',
          'Nebulised Adrenalin continuously',
          'Call for senior clinician / paediatrician',
          'Prepare for intubation with 1 size smaller ETT if deteriorating'
        ]
      },
      resp_failure: {
        id: 'resp_failure',
        title: 'Impending Respiratory Failure',
        type: 'warning',
        warning: 'Urgent ENT / Paediatrician & Anaesthetist Consultation!',
        details: [
          'Immediate senior intubation double setup',
          'Etomidate 0.3mg/kg IV for induction',
          'Have 2 ETT tubes ready (1 size smaller than normal)'
        ]
      }
    }
  },
  jaundice_flowchart: {
    id: 'jaundice_flowchart',
    title: 'Jaundice Diagnostic & Fractionation Flowchart',
    subtitle: 'Stepwise approach to unconjugated vs conjugated hyperbilirubinaemia',
    category: 'Gastroenterology',
    pdfPage: 120,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Initial Bilirubin Fractionation',
        type: 'start',
        details: [
          'Order U&E, LFT, LDH, CMP, CRP, Lipase, INR, VBG',
          'Check urine dipstix, uUrobilinogen & uBilirubin'
        ],
        options: [
          { label: 'Indirect > Direct (Unconjugated, Urobilinogen High)', targetId: 'unconjugated' },
          { label: 'Direct > Indirect (Conjugated, Direct Bili High)', targetId: 'conjugated' }
        ]
      },
      unconjugated: {
        id: 'unconjugated',
        title: 'Unconjugated Hyperbilirubinaemia',
        type: 'action',
        details: [
          'Normal Transaminases & ALP/GGT',
          'Haematological causes: Haemolysis (TTP, Malaria), Haematoma resorption, Dyserythropoiesis',
          'Action: FBC & blood smear (schistocytes?), Coombs test, reticulocytes'
        ]
      },
      conjugated: {
        id: 'conjugated',
        title: 'Conjugated Hyperbilirubinaemia',
        type: 'decision',
        details: [
          'Check enzyme pattern: Transaminases vs ALP/GGT'
        ],
        options: [
          { label: 'Marked Transaminase Elevation (ALT/AST High)', targetId: 'hepatocellular' },
          { label: 'Marked ALP/GGT Elevation (Cholestatic / Obstructive)', targetId: 'obstructive' }
        ]
      },
      hepatocellular: {
        id: 'hepatocellular',
        title: 'Hepatocellular Damage',
        type: 'warning',
        warning: 'Check INR & Encephalopathy for Acute Liver Failure!',
        details: [
          'Viral hepatitis, Paracetamol overdose, TB drugs, Alcohol, Ischaemia',
          'If Paracetamol OD suspected: Start N-Acetylcysteine (NAC) immediately!',
          'Refer GIT / Internal Medicine'
        ]
      },
      obstructive: {
        id: 'obstructive',
        title: 'Obstructive / Biliary Pathology',
        type: 'action',
        details: [
          'Choledocholithiasis, Cholangitis, Strictures, Pancreatic/Biliary neoplasm',
          'Action: Urgent Abdominal Ultrasound (POCUS)',
          'If fever + jaundice + RUQ pain (Charcot triad for Cholangitis): Start IV Ceftriaxone & urgent surgical consult'
        ]
      }
    }
  },
  dka_hhs_flowchart: {
    id: 'dka_hhs_flowchart',
    title: 'Hyperglycaemia & DKA / HHS Management Flowchart',
    subtitle: 'Resuscitation, fluid protocol, insulin titration, and electrolyte correction',
    category: 'Metabolic',
    pdfPage: 92,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'HGT > 11 mmol/L Screen',
        type: 'start',
        details: [
          'Check: Urine ketones, Nausea/vomiting, Dehydration, Altered mental state, Acidotic breathing, Blood gas (pH < 7.35, HCO3 < 20)'
        ],
        options: [
          { label: 'Ketones +, Acidosis + (DKA / HHS)', targetId: 'dka_hhs_mgmt' },
          { label: 'No Acidosis, No Ketones (Uncomplicated)', targetId: 'uncomplicated' }
        ]
      },
      uncomplicated: {
        id: 'uncomplicated',
        title: 'Uncomplicated Hyperglycaemia',
        type: 'action',
        details: [
          'If Type 1 DM or age < 35: Find cause & admit',
          'If Known Type 2 DM: Optimise meds, diabetic education, discharge with 3-day polyclinic follow up'
        ]
      },
      dka_hhs_mgmt: {
        id: 'dka_hhs_mgmt',
        title: 'DKA & HHS Resuscitation & Fluids',
        type: 'action',
        dosage: 'Balsol/Ringers 20ml/kg bolus if shocked, then 150-200 ml/hr',
        details: [
          'Fluids: 20ml/kg bolus if shocked. DKA: 150-200 ml/hr for 1st 4h. HHS: 100-200 ml/hr',
          'When HGT < 15 mmol/L: Change IV fluids to 5% Dextrose-Saline to prevent cerebral oedema',
          'Potassium check: DO NOT start insulin if K+ < 3.5 mmol/L! Replace K+ first (20-40 mmol/L IV)'
        ],
        options: [
          { label: 'Potassium >= 3.5 mmol/L -> Initiate Insulin', targetId: 'insulin_step' }
        ]
      },
      insulin_step: {
        id: 'insulin_step',
        title: 'Actrapid Insulin Administration',
        type: 'action',
        dosage: 'Actrapid 0.1 u/kg IV stat (max 10u), then 0.1 u/kg/hr infusion',
        details: [
          'Actrapid 0.1 u/kg IV stat then 0.1 u/kg/hr infusion',
          'Hourly HGT checks',
          'Anticoagulation: Clexane 0.5mg/kg SC for HHS & severe DKA'
        ]
      }
    }
  },
  organ_donation: {
    id: 'organ_donation',
    title: 'Organ & Tissue Donation Protocol',
    subtitle: 'Brainstem death donor pathway & coordinator contacts',
    category: 'Governance / ICU',
    pdfPage: 229,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Transplant Coordinator Contact',
        subtitle: 'Gauteng South Transplant Coordinator: Anja Mayer (076 729 2801)',
        type: 'start',
        details: [
          'Gauteng South Transplant Coordinator: Anja Mayer 076 729 2801',
          'HJH Transplant Educator: Mabeleng 071 729 6609',
          'Discuss all potential cases with ED consultant prior to calling coordinator',
          'DO NOT discuss organ donation with family without transplant team representative present'
        ],
        options: [
          { label: 'Check Family Meeting Checklist', targetId: 'family_checklist' }
        ]
      },
      family_checklist: {
        id: 'family_checklist',
        title: 'First Family Meeting Checklist',
        type: 'action',
        details: [
          '1. Stable hemodynamics maintained',
          '2. Cause of brain-stem death confirmed',
          '3. No sedatives/analgesics given in last 24h (or boluses in last 12h)',
          '4. Brain-stem death tests done and confirmed irreversible',
          '5. Approaching team includes: Doctor, Nursing sister, Transplant coordinator, Trauma counselor, Translator, Faith representative'
        ]
      }
    }
  },
  acs_stemi_flowchart: {
    id: 'acs_stemi_flowchart',
    title: 'Acute Coronary Syndrome & STEMI/OMI Algorithm',
    subtitle: 'Risk stratification, STEMI/OMI recognition, and reperfusion pathway',
    category: 'Cardiology',
    pdfPage: 9,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Suspected Acute Coronary Syndrome',
        subtitle: 'ECG within 10 minutes of arrival',
        type: 'start',
        details: [
          'Risk factors: age >= 65, smoker, family history of CAD, diabetes mellitus',
          'Obtain 12-lead ECG within 10 minutes; repeat if pain persists or evolves',
          'Aspirin 300mg PO unless contraindicated (active bleeding, hypersensitivity, recent major surgery)'
        ],
        options: [
          { label: 'ECG shows STEMI / OMI pattern', targetId: 'stemi_path' },
          { label: 'No ST elevation on ECG', targetId: 'nste_acs' }
        ]
      },
      stemi_path: {
        id: 'stemi_path',
        title: 'STEMI / OMI Confirmed',
        type: 'action',
        details: [
          'ST elevation in 2 or more contiguous leads, or a STEMI-equivalent pattern (e.g. true posterior MI: tall R in V1 + ST elevation >= 0.5mm in V7-9; RV infarction: ST elevation in right-sided leads)',
          'Activate the cath lab / thrombolysis pathway per local protocol without delay',
          'Dual antiplatelet therapy and anticoagulation per local ACS protocol',
          'Target door-to-balloon or door-to-needle time per departmental policy'
        ],
        warning: 'Confirm aspirin/antiplatelet contraindications before administration (active bleeding, known hypersensitivity).'
      },
      nste_acs: {
        id: 'nste_acs',
        title: 'Non-ST-Elevation ACS Workup',
        type: 'action',
        details: [
          'Calculate TIMI risk score for NSTE-ACS (1 point each): age >= 65; >= 3 risk factors for CAD (family history, hypertension, hypercholesterolaemia, diabetes, smoker); known CAD (stenosis >= 50%); aspirin use in the last 7 days; severe angina (>= 2 episodes in 24h); ST deviation >= 0.5mm; positive cardiac biomarker',
          'Serial troponins and repeat ECGs',
          'Risk-stratify disposition (admission vs accelerated diagnostic pathway) per local protocol'
        ],
        options: [
          { label: 'High-risk features / rising troponin', targetId: 'nste_admit' },
          { label: 'Low-risk, troponin negative x2', targetId: 'nste_discharge' }
        ]
      },
      nste_admit: {
        id: 'nste_admit',
        title: 'Admit for Cardiology Workup',
        type: 'outcome',
        details: [
          'Continue antiplatelet/anticoagulation per local protocol',
          'Cardiology referral for risk-stratified invasive strategy'
        ]
      },
      nste_discharge: {
        id: 'nste_discharge',
        title: 'Low-Risk Pathway',
        type: 'outcome',
        details: [
          'Consider early outpatient follow-up and stress testing',
          'Safety-net advice for recurrent or worsening symptoms'
        ]
      }
    }
  },
  stroke_thrombolysis: {
    id: 'stroke_thrombolysis',
    title: 'Acute Ischaemic Stroke & Thrombolysis Window',
    subtitle: 'Exclude mimics, confirm last-known-well time, assess thrombolysis eligibility',
    category: 'Neurovascular',
    pdfPage: 17,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Suspected Acute Stroke',
        subtitle: 'FAST/BE-FAST screen, urgent imaging, determine onset time',
        type: 'start',
        details: [
          'FAST / BE-FAST screen; urgent non-contrast CT brain',
          'Point-of-care glucose (exclude hypoglycaemia as a mimic)',
          'Establish last-known-well time from patient/witnesses — this drives the entire pathway'
        ],
        options: [
          { label: 'Assess for stroke mimics', targetId: 'exclude_mimics' }
        ]
      },
      exclude_mimics: {
        id: 'exclude_mimics',
        title: 'Exclude Stroke Mimics',
        type: 'decision',
        details: [
          'Hypoglycaemia',
          'Seizure with post-ictal (Todd\'s) paresis',
          'Migraine with aura',
          'Intracranial tumour',
          'Infection (abscess, meningitis)'
        ],
        options: [
          { label: 'Mimic identified', targetId: 'mimic_managed' },
          { label: 'True stroke — CT excludes haemorrhage', targetId: 'window_check' }
        ]
      },
      mimic_managed: {
        id: 'mimic_managed',
        title: 'Manage Identified Mimic',
        type: 'outcome',
        details: ['Treat the underlying cause (e.g. correct glucose, manage seizure) and reassess neurological status']
      },
      window_check: {
        id: 'window_check',
        title: 'Time Since Last Known Well',
        type: 'decision',
        options: [
          { label: '< 3 hours', targetId: 'thrombolysis_window' },
          { label: '3 - 4.5 hours', targetId: 'thrombolysis_window' },
          { label: '> 4.5 hours or unknown onset', targetId: 'beyond_window' }
        ]
      },
      thrombolysis_window: {
        id: 'thrombolysis_window',
        title: 'Assess Thrombolysis Eligibility',
        type: 'action',
        details: [
          'Check standard exclusion criteria: recent major surgery/bleed, therapeutic anticoagulation, uncontrolled BP, seizure at onset, and other local protocol exclusions',
          'The extended 3-4.5h window carries stricter exclusion criteria (e.g. age, stroke severity, diabetes with prior stroke, anticoagulant use) — confirm against local protocol',
          'Discuss with the stroke pathway / on-call team before thrombolysis'
        ],
        warning: 'Blood pressure must be controlled to below the local thrombolysis threshold (commonly <185/110 mmHg) before treatment.'
      },
      beyond_window: {
        id: 'beyond_window',
        title: 'Beyond Standard Thrombolysis Window',
        type: 'action',
        details: [
          'Assess for large-vessel occlusion and mechanical thrombectomy eligibility — extended windows (up to 24h) may apply with perfusion-imaging mismatch per local neurointervention pathway',
          'Admit for secondary prevention workup if not a thrombectomy candidate'
        ]
      }
    }
  },
  psychosis_flowchart: {
    id: 'psychosis_flowchart',
    title: 'Acute Psychosis / Mania Flowchart',
    subtitle: 'Exclude organic causes, de-escalate, then select pharmacological management',
    category: 'Psychiatry',
    pdfPage: 129,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Acute Psychosis / Mania Presentation',
        type: 'start',
        details: [
          'ABC, full vital signs, point-of-care glucose',
          'Screen for organic/toxic causes: substance intoxication or withdrawal, delirium, hypoglycaemia, CNS infection, head injury, thyroid disease',
          'Obtain collateral history where possible'
        ],
        options: [
          { label: 'Organic cause identified', targetId: 'treat_organic' },
          { label: 'Primary psychiatric presentation', targetId: 'de_escalate' }
        ]
      },
      treat_organic: {
        id: 'treat_organic',
        title: 'Treat the Underlying Cause',
        type: 'outcome',
        details: ['Manage the organic cause (e.g. correct glucose, treat sepsis/CNS infection, manage withdrawal), then reassess mental state once medically stable']
      },
      de_escalate: {
        id: 'de_escalate',
        title: 'Verbal De-escalation First',
        type: 'action',
        details: [
          'Calm, low-stimulus environment; involve security/psychiatric liaison early if agitated',
          'Offer oral medication before considering parenteral routes'
        ],
        options: [
          { label: 'Severe agitation / danger to self or others', targetId: 'chemical_restraint' },
          { label: 'Cooperative', targetId: 'psych_referral' }
        ]
      },
      chemical_restraint: {
        id: 'chemical_restraint',
        title: 'Consider Pharmacological Sedation',
        type: 'warning',
        details: [
          'Antipsychotic (e.g. IM olanzapine or haloperidol) with or without a benzodiazepine, per local protocol and formulary',
          'Continuous post-sedation monitoring: vital signs, SpO2, level of consciousness'
        ],
        warning: 'Document the justification for restraint/sedation. Monitor for over-sedation, respiratory depression, and QT prolongation. Confirm exact agent and dose against local protocol — not specified here.'
      },
      psych_referral: {
        id: 'psych_referral',
        title: 'Psychiatric Assessment & Disposition',
        type: 'outcome',
        details: ['Refer to psychiatric liaison for assessment and disposition (admission vs outpatient follow-up) per local pathway']
      }
    }
  },
  snakebite_pathway: {
    id: 'snakebite_pathway',
    title: 'Snakebite Envenomation Pathway',
    subtitle: 'Initial assessment, syndrome recognition, and antivenom decision-making',
    category: 'Toxicology',
    pdfPage: 176,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Suspected Snakebite',
        type: 'start',
        details: [
          'Identify/photograph the snake only if it can be done safely — never handle a dead or live snake',
          'Note time of bite; immobilize the affected limb; remove rings and constrictive items',
          'Do NOT apply a tourniquet or incise/suck the wound',
          'Transport urgently to definitive care'
        ],
        options: [
          { label: 'Assess for envenomation', targetId: 'assess_envenomation' }
        ]
      },
      assess_envenomation: {
        id: 'assess_envenomation',
        title: 'Assess Envenomation Syndrome',
        type: 'decision',
        details: [
          'Local signs: swelling, blistering, necrosis',
          'Systemic — neurotoxic: ptosis, diplopia, bulbar weakness',
          'Systemic — haemotoxic: bleeding, coagulopathy',
          'Systemic — cytotoxic: progressive local tissue injury',
          'Baseline bloods including clotting/INR/fibrinogen; 20-minute whole blood clotting test if available'
        ],
        options: [
          { label: 'Signs of envenomation present', targetId: 'antivenom_path' },
          { label: 'No envenomation signs', targetId: 'observe' }
        ]
      },
      antivenom_path: {
        id: 'antivenom_path',
        title: 'Envenomation — Consider Antivenom',
        type: 'warning',
        details: [
          'Contact your regional poison information centre / snakebite pathway for the antivenom product and dose specific to the implicated species and local stock',
          'Do not delay life-threatening airway/breathing support while arranging antivenom',
          'Anticipate anaphylaxis to antivenom — have adrenaline immediately available'
        ],
        warning: 'Antivenom product and dose are species- and region-specific. Confirm via poison control / local protocol before administration — vial-count dosing is intentionally not specified here.'
      },
      observe: {
        id: 'observe',
        title: 'Observe',
        type: 'action',
        details: [
          'Observe a minimum of 24 hours for evolving local or systemic signs before discharge',
          'Repeat clotting studies as indicated',
          'Safety-net advice on discharge'
        ]
      }
    }
  },
  scorpion_sting: {
    id: 'scorpion_sting',
    title: 'Scorpion Sting Envenomation',
    subtitle: 'Severity assessment and antivenom administration',
    category: 'Toxicology',
    pdfPage: 169,
    initialNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        title: 'Scorpion Sting Presentation',
        type: 'start',
        details: [
          'Local pain / paraesthesia at the sting site is typical and expected',
          'Assess for systemic envenomation: autonomic (sweating, hypertension, tachycardia) and neuromuscular (cranial nerve signs, fasciculations, respiratory compromise)',
          'Continuous cardiorespiratory monitoring while severity is assessed'
        ],
        options: [
          { label: 'Systemic (severe) envenomation', targetId: 'antivenom_action' },
          { label: 'Local signs only', targetId: 'supportive_care' }
        ]
      },
      antivenom_action: {
        id: 'antivenom_action',
        title: 'Scorpion Antivenom',
        type: 'action',
        details: [
          'Scorpion antivenom should be given to all patients with symptoms and signs of severe envenomation',
          'Standard dose: 5-10 mL IV for both children and adults, diluted in a small volume of normal saline, given over 15 minutes',
          'Monitor closely for hypersensitivity reaction during the infusion'
        ],
        warning: 'Have adrenaline immediately available in case of antivenom hypersensitivity/anaphylaxis.'
      },
      supportive_care: {
        id: 'supportive_care',
        title: 'Supportive Care',
        type: 'action',
        details: [
          'Local wound care and analgesia',
          'Tetanus prophylaxis if indicated',
          'Observe for progression to systemic signs'
        ]
      }
    }
  }
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ mindMapId, onBack, weight }) => {
  const mindMap = MIND_MAPS_DATABASE[mindMapId] || MIND_MAPS_DATABASE['aha_bls_acls'];
  const [currentNodeId, setCurrentNodeId] = useState<string>(mindMap.initialNodeId);

  const currentNode = mindMap.nodes[currentNodeId] || mindMap.nodes[mindMap.initialNodeId];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          PDF Page {mindMap.pdfPage} • {mindMap.category}
        </span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interactive Visual Mind Map</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{mindMap.title}</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2">{mindMap.subtitle}</p>
          </div>
          <button
            onClick={() => setCurrentNodeId(mindMap.initialNodeId)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Mind Map"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Flowchart Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
        {/* Node Type Badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            currentNode.type === 'start' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
            currentNode.type === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
            currentNode.type === 'outcome' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
            'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
          }`}>
            Step: {currentNode.type.toUpperCase()}
          </span>

          {currentNode.dosage && (
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              💊 Dosage: {currentNode.dosage}
            </span>
          )}
        </div>

        {/* Node Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {currentNode.title}
          </h2>
          {currentNode.subtitle && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{currentNode.subtitle}</p>
          )}
        </div>

        {/* Warning Alert if present */}
        {currentNode.warning && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{currentNode.warning}</p>
          </div>
        )}

        {/* Node Clinical Details List */}
        {currentNode.details && currentNode.details.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Actions & Guidelines</h4>
            <ul className="space-y-2">
              {currentNode.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision / Next Action Branch Buttons */}
        {currentNode.options && currentNode.options.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Next Decision / Clinical Branch</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentNode.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentNodeId(option.targetId)}
                  className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 font-bold text-xs sm:text-sm transition-all group"
                >
                  <span>{option.label}</span>
                  <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
