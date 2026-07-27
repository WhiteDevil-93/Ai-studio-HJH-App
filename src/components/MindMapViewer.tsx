import React, { useState } from 'react';
import {
  Activity, ArrowLeft, CheckCircle2, AlertTriangle, Info, ShieldAlert,
  ChevronRight, Heart, Brain, Stethoscope, Flame, RefreshCw, Zap, Layers,
  Printer, Star, LayoutGrid, ListFilter, Share2
} from 'lucide-react';

interface MindMapViewerProps {
  mindMapId: string;
  onBack: () => void;
  weight?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
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
  }
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  mindMapId,
  onBack,
  weight,
  isFavourite = false,
  onToggleFavourite
}) => {
  const mindMap = MIND_MAPS_DATABASE[mindMapId] || MIND_MAPS_DATABASE['aha_bls_acls'];
  const [currentNodeId, setCurrentNodeId] = useState<string>(mindMap.initialNodeId);
  const [viewMode, setViewMode] = useState<'step' | 'full_diagram'>('step');

  const currentNode = mindMap.nodes[currentNodeId] || mindMap.nodes[mindMap.initialNodeId];
  const allNodesList = Object.values(mindMap.nodes);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:max-w-none print:p-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2">
          {onToggleFavourite && (
            <button
              onClick={() => onToggleFavourite(`mindmap.${mindMap.id}`)}
              className={`p-2 rounded-xl border transition-colors ${
                isFavourite
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Star className={`w-4 h-4 ${isFavourite ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            title="Print Protocol Card"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Card</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            PDF Page {mindMap.pdfPage} • {mindMap.category}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl print:bg-none print:text-black print:border-b print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 print:text-slate-600">Interactive Visual Mind Map</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{mindMap.title}</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 print:text-slate-700">{mindMap.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => setViewMode('step')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'step' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Step View
              </button>
              <button
                onClick={() => setViewMode('full_diagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'full_diagram' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Full Diagram
              </button>
            </div>

            <button
              onClick={() => setCurrentNodeId(mindMap.initialNodeId)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Mind Map"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Step Card View */}
      {viewMode === 'step' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
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

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {currentNode.title}
            </h2>
            {currentNode.subtitle && (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{currentNode.subtitle}</p>
            )}
          </div>

          {currentNode.warning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{currentNode.warning}</p>
            </div>
          )}

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
      )}

      {/* VIEW MODE 2: Full Diagram Overview */}
      {viewMode === 'full_diagram' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs font-medium">
            💡 Full Mind Map Overview: Below is the complete visual algorithm tree. Click any node card to jump into that specific step.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allNodesList.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setCurrentNodeId(node.id);
                  setViewMode('step');
                }}
                className={`cursor-pointer p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                  node.id === currentNodeId
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    node.type === 'start' ? 'bg-blue-500/10 text-blue-600' :
                    node.type === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                    node.type === 'outcome' ? 'bg-emerald-500/10 text-emerald-600' :
                    'bg-indigo-500/10 text-indigo-600'
                  }`}>
                    {node.type}
                  </span>
                  {node.dosage && <span className="text-[10px] font-bold text-purple-600">💊 {node.dosage}</span>}
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{node.title}</h4>
                {node.subtitle && <p className="text-xs text-slate-500 mb-2">{node.subtitle}</p>}

                {node.details && (
                  <ul className="space-y-1">
                    {node.details.slice(0, 3).map((d, i) => (
                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 truncate">• {d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
