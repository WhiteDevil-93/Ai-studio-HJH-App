import React, { useState } from 'react';
import {
  FileText, ArrowLeft, ShieldAlert, Award, Building2, MapPin,
  CheckCircle2, AlertTriangle, Info, BookOpen, Layers, Search
} from 'lucide-react';

interface PolicyViewerProps {
  policyId: string;
  onBack: () => void;
}

export interface PolicyDefinition {
  id: string;
  title: string;
  category: string;
  pdfPage: number;
  sections: { title: string; items: string[] }[];
  warning?: string;
  reference?: string;
}

export const POLICIES_DATABASE: Record<string, PolicyDefinition> = {
  triage_sop: {
    id: 'triage_sop',
    title: 'Triage SOP & SATS TEWS Discriminators Table',
    category: 'Hospital SOPs',
    pdfPage: 238,
    sections: [
      {
        title: 'Triage Allocation & Roles',
        items: [
          'All patients must be triaged as soon as possible after arrival.',
          'Dedicated triage nurse required at all times (never left unmanned).',
          '1 Doctor allocated to assist with complex cases in triage 24/7.',
          'Vital signs mandatory for all: BP, Pulse, RR, Temp, SpO2, HGT.',
          'TEWS score calculated accurately and screened for SATS discriminators.'
        ]
      },
      {
        title: 'Target Time to Treat & TEWS Categories',
        items: [
          '🔴 RED (TEWS >= 7): Immediate treatment • Obstructed airway, active seizure, cardiac arrest, severe hypoglycaemia (< 3 mmol/l).',
          '🟠 ORANGE (TEWS 5-6): < 10 mins • High-energy transfer, acute dyspnoea, chest pain, uncontrolled bleed, postictal, acute focal neuro fallout.',
          '🟡 YELLOW (TEWS 3-4): < 60 mins • Controlled bleed, closed fracture, abdominal pain, persistent vomiting.',
          '🟢 GREEN (TEWS 0-2): < 240 mins • Mild pain, minor complaints.',
          '🔵 BLUE: Deceased on arrival (DOA).'
        ]
      }
    ]
  },
  ambulance_divert: {
    id: 'ambulance_divert',
    title: 'Ambulance Divert Protocol',
    category: 'Hospital SOPs',
    pdfPage: 206,
    sections: [
      {
        title: 'Divert Authorization Procedure',
        items: [
          'When all hospital beds are filled or logistical fault occurs (water shortage, electrical failure, lift failure):',
          'Superintendent reports to Managing Medical Officer (MMO) at Gauteng Health.',
          'Once approved by MMO, Metro Control places hospital on "Divert".',
          'Divert applies ONLY to ambulance cases. Walk-in/private vehicle cases MAY NOT be turned away.'
        ]
      },
      {
        title: 'Patient Stabilization Requirement',
        items: [
          'Any UNSTABLE patient arriving on divert MUST be stabilized first prior to being referred on.',
          'Emergency care will be provided on the EMS stretcher if needed.'
        ]
      }
    ]
  },
  icu_referral: {
    id: 'icu_referral',
    title: 'ICU Consult & Referral Policy',
    category: 'Hospital SOPs',
    pdfPage: 220,
    sections: [
      {
        title: 'ICU Consultation Workflow',
        items: [
          '1. ED doctor contacts ICU Doctor on call to request consultation.',
          '2. ED doctor ensures base referral specialty (e.g. Medicine/Surgery) is aware of patient to take over once discharged from ICU (taking over is NOT a prerequisite for consultation).',
          '3. ED doctor fills in ICU Consult Form and places in patient\'s file in ED.',
          '4. ICU doctor consults patient and informs ED doctors of decision.'
        ]
      }
    ]
  },
  ct_contrast: {
    id: 'ct_contrast',
    title: 'CT Scans & Contrast Protocol + Consent Checklist',
    category: 'Radiology / SOPs',
    pdfPage: 214,
    sections: [
      {
        title: 'Emergency CT Scans Without U&E Delay',
        items: [
          'No U&E required prior to CT for: Life-threatening trauma, Suspected ruptured/dissecting aortic aneurysm, Urgent patients < 45 years with no known renal disease.',
          'Low risk eGFR: 45-59 ml/min (Cr < 130 µmol/L)',
          'Moderate risk eGFR: 30-44 ml/min (Cr 130-200 µmol/L)',
          'High risk eGFR: < 30 ml/min (Cr > 200 µmol/L) - consult renal physician.'
        ]
      },
      {
        title: 'Contrast Hypersensitivity Accelerated Premedication',
        items: [
          'Life-threatening cases (severe trauma): DO NOT DELAY scan for premedication.',
          'Urgent CT Accelerated Premedication: Hydrocortisone 2mg/kg IV (max 200mg) 5h & 1h prior + Phenergan 25mg IV 1h prior.'
        ]
      }
    ]
  },
  j88_guidelines: {
    id: 'j88_guidelines',
    title: 'J88 Medicolegal Report Completion Guidelines',
    category: 'Medicolegal',
    pdfPage: 223,
    sections: [
      {
        title: 'General Principles for J88 Completion',
        items: [
          'Must be completed in doctor\'s own handwriting or typewritten (Police not allowed to write on J88).',
          'Doctor must sign every page.',
          'Avoid technical medical jargon; describe injuries plainly.',
          'Indicate extent & position of injuries on sketches provided using contrasting colour pen.',
          'Number each lesion (1), (2), (3) and describe clearly.'
        ]
      },
      {
        title: 'Crucial Legal Caveats',
        items: [
          'NEVER give the name of the accused or alleged perpetrator in conclusion.',
          'Conclusion format: "Injuries compatible/incompatible with alleged time and mechanism (e.g. sharp/blunt object)".'
        ]
      }
    ]
  },
  death_certification: {
    id: 'death_certification',
    title: 'Filling Forms After Death (BI 1663 & D28)',
    category: 'Medicolegal',
    pdfPage: 227,
    sections: [
      {
        title: 'Natural Death (BI 1663 / DHA 1663)',
        items: [
          'Normal disease processes. Filled by attending doctor.',
          'Cremation allowed provided no pacemaker or internal defibrillator in corpse.'
        ]
      },
      {
        title: 'Unnatural Death: D28 Form (HJH 269)',
        items: [
          'DO NOT fill BI 1663 for unnatural deaths.',
          'Includes: Motor vehicle accidents, burns, gunshot wounds, assaults, post-operative deaths, poisonings, drug-related deaths.',
          'Corpse sent to Government Forensic Mortuary with D28 form & SAPS report.'
        ]
      }
    ]
  },
  notifiable_conditions: {
    id: 'notifiable_conditions',
    title: 'Revised Notifiable Medical Conditions & ICD-10 Codes',
    category: 'Public Health',
    pdfPage: 228,
    sections: [
      {
        title: 'Category 1 Notifiable Conditions (Immediate Telephone Notification)',
        items: [
          'Acute Flaccid Paralysis (G82.0)',
          'Anthrax (A22.0)',
          'Cholera (A00.0)',
          'Food-borne outbreaks (A05.9)',
          'Haemorrhagic fevers of Africa (A96.0)',
          'Listeriosis (A32.11)',
          'Meningococcal infections (A39.0)',
          'Plague (A20.0)',
          'Poliomyelitis (A80.0)',
          'Rabies (Human) (A82.0)',
          'Severe Acute Respiratory Syndrome / SARS (U04.9)',
          'Smallpox (B03)',
          'Yellow Fever (A95.0)'
        ]
      }
    ]
  },
  suburb_directory: {
    id: 'suburb_directory',
    title: 'HJH Geographical Drainage Suburbs (Regions B & C)',
    category: 'Referral Directory',
    pdfPage: 235,
    sections: [
      {
        title: 'Region B Suburbs',
        items: [
          'Albertville, Auckland Park, Berario, Blackheath, Blairgowrie, Bordeaux, Bosmont, Brixton, Bryanston West, Claremont, Coronationville, Craighall, Cresta, Delarey, Emmarentia, Fairland, Ferndale, Florida Glen, Greenside, Hyde Park, Illovo, Linden, Melville, Montgomery Park, Newclare, Newlands, Northcliff, Parkhurst, Parktown North, Parkview, Randpark, Richmond, Riverlea, Rosebank, Sophiatown, Westbury, Westdene, Windsor.'
        ]
      },
      {
        title: 'Region C Suburbs',
        items: [
          'Allen\'s Nek, Amorosa, Boskruin, Bromhof, Cosmo City, Davidsonville, Discovery, Florida, Helderkruin, Honeydew, Horison, Little Falls, North Riding, Ontdekkerspark, Panorama, Radiokop, Roodekrans, Roodepoort, Ruimsig, Strubensvallei, Sundowner, Weltevredenpark, Wilgeheuwel, Wilropark, Witpoortjie, Zandspruit.'
        ]
      }
    ]
  },
  ambulance_handover: {
    id: 'ambulance_handover',
    title: 'Ambulance Handover Policy',
    category: 'Hospital SOPs',
    pdfPage: 207,
    sections: [
      {
        title: 'Structured Handover (ISBAR)',
        items: [
          'Identify yourself and the patient.',
          'Situation: presenting complaint and acuity.',
          'Background: relevant history, mechanism of injury/illness, interventions already given.',
          'Assessment: vital signs and working diagnosis.',
          'Recommendation: what is needed next (bed, specialty, monitoring level).'
        ]
      },
      {
        title: 'Handover Process',
        items: [
          'Triage nurse or doctor formally receives handover before the ambulance crew leaves.',
          'The patient is not left unattended until formally accepted by ED staff.',
          'Document the time of handover and the receiving clinician\'s name.'
        ]
      }
    ],
    warning: 'The full local Ambulance Handover Policy text could not be extracted from the source PDF (page 207 is diagram/image-based in the supplied scan). This reflects standard ISBAR handover practice — confirm wording against the printed policy.'
  },
  internal_medicine_admissions: {
    id: 'internal_medicine_admissions',
    title: 'Internal Medicine Admissions Pathway',
    category: 'Hospital SOPs',
    pdfPage: 221,
    sections: [
      {
        title: 'Referral Process',
        items: [
          'Discuss all planned medical admissions with the Internal Medicine team on call.',
          'Complete relevant workup (bloods, ECG, imaging) before referral where clinically appropriate.',
          'Document the referral discussion, time, and receiving doctor\'s name in the patient file.'
        ]
      }
    ],
    warning: 'The full local Internal Medicine Admissions policy text could not be extracted from the source PDF (page 221 is diagram/image-based in the supplied scan). Confirm the current referral workflow against the printed policy or the Internal Medicine department.'
  },
  stat_lab_use: {
    id: 'stat_lab_use',
    title: 'Stat Lab Use Policy',
    category: 'Hospital SOPs',
    pdfPage: 222,
    sections: [
      {
        title: 'Access & Use',
        items: [
          'The Stat Lab in ED is for the use of ED doctors only.',
          'Only doctors who have been trained are allowed to access the Stat Lab machines.'
        ]
      }
    ]
  }
};

export const PolicyViewer: React.FC<PolicyViewerProps> = ({ policyId, onBack }) => {
  const policy = POLICIES_DATABASE[policyId] || POLICIES_DATABASE['triage_sop'];
  const [filterText, setFilterText] = useState('');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          PDF Page {policy.pdfPage} • {policy.category}
        </span>
      </div>

      {/* Policy Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Hospital Administrative Policy & SOP</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{policy.title}</h1>

        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter policy text..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Sections Container */}
      <div className="space-y-6">
        {policy.sections.map((section, sIdx) => {
          const filteredItems = section.items.filter(item => item.toLowerCase().includes(filterText.toLowerCase()));
          if (filterText && filteredItems.length === 0) return null;

          return (
            <div key={sIdx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                {section.title}
              </h3>

              <ul className="space-y-2.5">
                {filteredItems.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
