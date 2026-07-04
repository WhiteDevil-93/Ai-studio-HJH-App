/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Search, Scale, ChevronDown, Check,
  AlertTriangle, Moon, Sun, BookOpen,
  Calculator, Stethoscope, Activity, Heart, ShieldAlert,
  Info, Sparkles, CheckSquare, Plus, RefreshCw, Clock
} from 'lucide-react';
import D from './data.json';

// Category mapping keys
const CATEGORIES: Record<string, string> = {
  favourites: 'Favourites',
  recently_viewed: 'Recently Viewed',
  all: 'All Categories',
  '1_resuscitation_fluids_and_inotropes': 'Resuscitation',
  '2_airway_and_ventilation': 'Airway & Ventilation',
  '3_sedation_analgesia_and_neurology': 'Sedation & Neurology',
  '4_antimicrobials_and_infectious_diseases': 'Antimicrobials',
  '5_metabolic_electrolytes_and_nutrition': 'Metabolic & Nutrition',
  '6_poisoning_and_toxicology': 'Toxicology',
  '7_useful_formulae': 'Useful Formulae',
  '8_cardiovascular': 'Cardiovascular',
  '9_blood_products': 'Blood Products',
  '10_endocrine_and_other': 'Endocrine & Other',
  '11_ed_medical_emergencies': 'ED Medical Emergencies',
  '12_ed_toxicology': 'ED Toxicology',
  '13_ed_trauma_surgical': 'ED Trauma & Surgical',
  '14_ed_metabolic': 'ED Metabolic',
  '15_ed_procedures': 'ED Procedures',
  '16_score_calculators': 'Score Calculators'
};

const CATEGORY_ICONS: Record<string, string> = {
  favourites: '⭐',
  recently_viewed: '⏱️',
  all: '📋',
  '1_resuscitation_fluids_and_inotropes': '💉',
  '2_airway_and_ventilation': '🫁',
  '3_sedation_analgesia_and_neurology': '🧠',
  '4_antimicrobials_and_infectious_diseases': '🦠',
  '5_metabolic_electrolytes_and_nutrition': '⚗️',
  '6_poisoning_and_toxicology': '☠️',
  '7_useful_formulae': '📐',
  '8_cardiovascular': '❤️',
  '9_blood_products': '🩸',
  '10_endocrine_and_other': '🔬',
  '11_ed_medical_emergencies': '🩺',
  '12_ed_toxicology': '☣️',
  '13_ed_trauma_surgical': '🚑',
  '14_ed_metabolic': '🧬',
  '15_ed_procedures': '🛠️',
  '16_score_calculators': '📊'
};

const ORDER = [
  'favourites',
  'recently_viewed',
  'all',
  '1_resuscitation_fluids_and_inotropes',
  '2_airway_and_ventilation',
  '3_sedation_analgesia_and_neurology',
  '4_antimicrobials_and_infectious_diseases',
  '5_metabolic_electrolytes_and_nutrition',
  '6_poisoning_and_toxicology',
  '7_useful_formulae',
  '8_cardiovascular',
  '9_blood_products',
  '10_endocrine_and_other',
  '11_ed_medical_emergencies',
  '12_ed_toxicology',
  '13_ed_trauma_surgical',
  '14_ed_metabolic',
  '15_ed_procedures',
  '16_score_calculators'
];

interface DrugItem {
  item?: string;
  drug?: string;
  condition_or_drug?: string;
  poison_or_drug?: string;
  antidote_treatment?: string;
  product?: string;
  adult_dose?: string;
  adult_settings?: string;
  paediatric_dose?: string;
  paediatric_settings?: string;
  protocol_dose?: string;
  formula?: string;
  standard_dilutions?: string;
  notes_updates?: string;
  notes?: string;
}

interface InfusionPreset {
  dose: string;
  conc: string;
  unit: string;
  dilutionDesc: string;
  dosesDesc: string;
}

const INFUSION_PRESETS: Record<string, InfusionPreset> = {
  noradrenaline: {
    dose: '0.05',
    conc: '0.05',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Double Strength: 10 mg in 200 mL Normal Saline (0.05 mg/mL)',
    dosesDesc: '0.05 - 1.0 mcg/kg/min'
  },
  adrenaline: {
    dose: '0.05',
    conc: '0.06',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Standard: 12 mg in 200 mL Normal Saline (0.06 mg/mL / 60 mcg/mL)',
    dosesDesc: 'Push-dose: 0.5 mL (50 mcg) IV STAT. Infusion: 0.05 - 1.0 mcg/kg/min'
  },
  dobutamine: {
    dose: '2.5',
    conc: '1.25',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Standard: 250 mg in 200 mL Normal Saline (1.25 mg/mL)',
    dosesDesc: '2.5 - 10 mcg/kg/min (Max: 40 mcg/kg/min)'
  },
  dopamine: {
    dose: '2',
    conc: '1.0',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Standard: 200 mg in 200 mL Normal Saline (1.0 mg/mL)',
    dosesDesc: '2 - 20 mcg/kg/min'
  },
  phenylephrine: {
    dose: '0.1',
    conc: '0.1',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Standard: 20 mg (2 amps) in 200 mL Normal Saline (0.1 mg/mL / 100 mcg/mL)',
    dosesDesc: '0.1 - 6.0 mcg/kg/min (Bolus: 50 - 250 mcg)'
  },
  esmolol: {
    dose: '50',
    conc: '10.0',
    unit: 'mcg/kg/min',
    dilutionDesc: 'Standard: 5 ampoules (500 mg) undiluted in a 50 mL syringe (10.0 mg/mL)',
    dosesDesc: 'Loading: 500 mcg/kg over 60s. Maintenance: 50 - 300 mcg/kg/min'
  },
  labetalol: {
    dose: '1',
    conc: '0.76',
    unit: 'mg/min',
    dilutionDesc: 'Standard: 180 mg (36 mL) in 200 mL 0.9% Normal Saline (0.76 mg/mL)',
    dosesDesc: 'Bolus: 20 mg (4 mL). Infusion: Start 1 mg/min (80 mL/hr), increase by 10 mL/hr q5min to Max 2 mg/min (160 mL/hr)'
  },
  isosorbide: {
    dose: '1',
    conc: '0.1',
    unit: 'mg/hr',
    dilutionDesc: 'Low: 20 mg in 200 mL (0.1 mg/mL) | High: 100 mg in 200 mL (0.5 mg/mL)',
    dosesDesc: 'Initial: 1 - 2 mg/hr. Max: 8 - 10 mg/hr (up to 50 mg/hr in acute heart failure)'
  },
  insulin: {
    dose: '0.1',
    conc: '1.0',
    unit: 'units/kg/hr',
    dilutionDesc: 'Standard Actrapid: 50 units in 50 mL 0.9% NaCl (1.0 unit/mL)',
    dosesDesc: 'Standard DKA: 0.1 units/kg/hr | HIET (Tox): 0.5 - 10 units/kg/hr'
  },
  heparin: {
    dose: '12',
    conc: '500.0',
    unit: 'units/kg/hr',
    dilutionDesc: 'Standard: 25,000 units in 50 mL N/S or D5W (500 units/mL)',
    dosesDesc: 'Loading: 60 IU/kg (max 4000 IU) IV stat. Maintenance: 12 IU/kg/hr (max 1000 IU/hr)'
  },
  amiodarone: {
    dose: '39',
    conc: '4.13',
    unit: 'mg/hr',
    dilutionDesc: 'Infusion: 900 mg (18 mL) in 200 mL 5% Dextrose (4.13 mg/mL total volume 218 mL)',
    dosesDesc: 'Loading: 5 mg/kg (Max 300 mg) over 1 hr. Maintenance: 900 mg over 23 hours (runs at 9.5 mL/hr)'
  },
  furosemide: {
    dose: '10',
    conc: '10.0',
    unit: 'mg/hr',
    dilutionDesc: 'Neat: Undiluted Furosemide (10.0 mg/mL)',
    dosesDesc: '5 - 40 mg/hr'
  },
  propofol: {
    dose: '1',
    conc: '10.0',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Standard 1%: 400 mg pure Propofol in 40 mL (10.0 mg/mL)',
    dosesDesc: '1 - 15 mg/kg/hr (Rates > 4 mg/kg/hr not recommended for prolonged sedation)'
  },
  midazolam: {
    dose: '0.05',
    conc: '2.0',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Continuation: 90 mg in 45 mL volume (2.0 mg/mL)',
    dosesDesc: 'Loading: 0.2 mg/kg. Continuation: 0.05 - 0.3 mg/kg/hr (up to 1.0 mg/kg/hr)'
  },
  morphine: {
    dose: '0.025',
    conc: '0.5',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Continuous (intubated): 90 mg in 180 mL Normal Saline (0.5 mg/mL)',
    dosesDesc: '0.025 - 0.4 mg/kg/hr'
  },
  morphine_midazolam: {
    dose: '0.05',
    conc: '0.5',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Standard: 90 mg Morphine + 90 mg Midazolam in 180 mL total volume (0.5 mg/mL of EACH)',
    dosesDesc: '0.05 - 0.5 mg/kg/hr (only for use in ventilated patients)'
  },
  ketamine: {
    dose: '0.05',
    conc: '1.0',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Standard: 200 mg ketamine in 200 mL Normal Saline (1.0 mg/mL)',
    dosesDesc: 'Analgesia: 0.05 - 0.1 mg/kg/hr | Sedation: 0.2 - 1.0 mg/kg/hr'
  },
  atracurium: {
    dose: '0.3',
    conc: '2.0',
    unit: 'mg/kg/hr',
    dilutionDesc: 'Standard: 100 mg in 50 mL N/S (2.0 mg/mL)',
    dosesDesc: '0.3 - 0.6 mg/kg/hr'
  },
  nitroglycerin: {
    dose: '10',
    conc: '0.05',
    unit: 'mcg/min',
    dilutionDesc: 'Standard: 10 mg in 200 mL Normal Saline (0.05 mg/mL / 50 mcg/mL)',
    dosesDesc: '10 - 200 mcg/min (10 mcg/min is 12 mL/hr, 200 mcg/min is 240 mL/hr)'
  }
};

const getInfusionPreset = (drugName: string): InfusionPreset | undefined => {
  const nameLower = drugName.toLowerCase();
  
  // High-priority combination checks first
  if (nameLower.includes('morphine') && nameLower.includes('midazolam')) {
    return INFUSION_PRESETS.morphine_midazolam;
  }
  
  if (nameLower.includes('noradrenaline')) return INFUSION_PRESETS.noradrenaline;
  if (nameLower.includes('adrenaline') || nameLower.includes('adrenalin')) {
    if (nameLower.includes('noradrenaline')) return INFUSION_PRESETS.noradrenaline;
    return INFUSION_PRESETS.adrenaline;
  }
  if (nameLower.includes('dobutamine')) return INFUSION_PRESETS.dobutamine;
  if (nameLower.includes('dopamine')) return INFUSION_PRESETS.dopamine;
  if (nameLower.includes('phenylephrine')) return INFUSION_PRESETS.phenylephrine;
  if (nameLower.includes('insulin')) return INFUSION_PRESETS.insulin;
  if (nameLower.includes('heparin')) return INFUSION_PRESETS.heparin;
  if (nameLower.includes('amiodarone')) return INFUSION_PRESETS.amiodarone;
  if (nameLower.includes('furosemide') || nameLower.includes('lasix')) return INFUSION_PRESETS.furosemide;
  if (nameLower.includes('propofol')) return INFUSION_PRESETS.propofol;
  if (nameLower.includes('midazolam') || nameLower.includes('dormicum')) return INFUSION_PRESETS.midazolam;
  if (nameLower.includes('morphine')) return INFUSION_PRESETS.morphine;
  if (nameLower.includes('ketamine')) return INFUSION_PRESETS.ketamine;
  if (nameLower.includes('atracurium')) return INFUSION_PRESETS.atracurium;
  if (nameLower.includes('esmolol')) return INFUSION_PRESETS.esmolol;
  if (nameLower.includes('labetalol')) return INFUSION_PRESETS.labetalol;
  if (nameLower.includes('isoket') || nameLower.includes('isosorbide')) return INFUSION_PRESETS.isosorbide;
  if (nameLower.includes('nitroglycerin') || nameLower.includes('nitrocine')) return INFUSION_PRESETS.nitroglycerin;
  return undefined;
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tr_theme') as 'dark' | 'light') || 'dark';
  });

  // Core Inputs
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('tr_w') || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Favorites
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tr_f') || '[]');
    } catch {
      return [];
    }
  });

  // Recently Viewed state
  interface RecentlyViewedItem {
    key: string;
    name: string;
    catKey: string;
    timestamp: number;
    type: 'drug' | 'procedure' | 'calculator';
  }

  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tr_rv') || '[]');
    } catch {
      return [];
    }
  });

  const recordRecentlyViewed = (key: string, name: string, catKey: string, type: 'drug' | 'procedure' | 'calculator') => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(x => x.key !== key);
      const next: RecentlyViewedItem[] = [{ key, name, catKey, timestamp: Date.now(), type }, ...filtered].slice(0, 15);
      localStorage.setItem('tr_rv', JSON.stringify(next));
      return next;
    });
  };

  // Expanded categories / sections
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ORDER.forEach(k => {
      initial[k] = true; // By default expanded
    });
    return initial;
  });

  const [expandedProtocols, setExpandedProtocols] = useState<Record<string, boolean>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});
  const [checklistStatus, setChecklistStatus] = useState<Record<string, boolean>>({});
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  // Score Calculator states
  const [gcsState, setGcsState] = useState<Record<string, number>>({});
  const [nexusState, setNexusState] = useState<Record<string, boolean>>({});
  const [alvaradoState, setAlvaradoState] = useState<Record<string, boolean>>({});
  const [wellsDvtState, setWellsDvtState] = useState<Record<string, boolean>>({});
  const [wellsPeState, setWellsPeState] = useState<Record<string, boolean>>({});
  const [percState, setPercState] = useState<Record<string, boolean>>({});
  const [curb65State, setCurb65State] = useState<Record<string, boolean>>({});
  const [burchWartofskyState, setBurchWartofskyState] = useState<Record<string, number>>({});
  const [ccsState, setCcsState] = useState<Record<string, boolean>>({});
  const [tetanusState, setTetanusState] = useState<Record<string, number>>({}); // 0: doses, 1: wound
  const [formulaInputs, setFormulaInputs] = useState<Record<string, Record<string, string>>>({});
  const [infusionDoses, setInfusionDoses] = useState<Record<string, { dose: string; conc: string; weight: string }>>({});

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      document.body.classList.add('light');
    } else {
      root.classList.remove('light');
      document.body.classList.remove('light');
    }
    localStorage.setItem('tr_theme', theme);
  }, [theme]);

  // Sync weight & favs
  useEffect(() => {
    localStorage.setItem('tr_w', weight);
  }, [weight]);

  useEffect(() => {
    localStorage.setItem('tr_f', JSON.stringify(favourites));
  }, [favourites]);

  const toggleFavourite = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavourites(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      return next;
    });
  };

  const isFavourite = (key: string) => favourites.includes(key);

  const parsedWeight = useMemo(() => {
    const val = parseFloat(weight);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [weight]);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleProtocol = (key: string) => {
    setExpandedProtocols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChecklist = (key: string) => {
    setChecklistStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllContainers = () => {
    // Expand all categories
    const newCats: Record<string, boolean> = {};
    ORDER.forEach(k => {
      newCats[k] = true;
    });
    setExpandedCategories(newCats);

    // Expand all subcategories
    const newSubCats: Record<string, boolean> = {};
    Object.entries(D).forEach(([catKey, catData]) => {
      if (catKey !== '16_score_calculators' && catKey !== '15_ed_procedures' && catData && typeof catData === 'object') {
        Object.keys(catData).forEach(subCatName => {
          newSubCats[`${catKey}::${subCatName}`] = true;
        });
      }
    });
    setExpandedSubCategories(newSubCats);

    // Expand all protocols (procedures)
    const newProtocols: Record<string, boolean> = {};
    const procedures = D['15_ed_procedures'] as any;
    if (procedures && typeof procedures === 'object') {
      Object.entries(procedures).forEach(([subCatName, sv]: any) => {
        if (Array.isArray(sv)) {
          sv.forEach(p => {
            const key = getEntryKey(p, '15_ed_procedures');
            newProtocols[key] = true;
          });
        }
      });
    }
    setExpandedProtocols(newProtocols);
  };

  const collapseAllContainers = () => {
    // Collapse all categories
    const newCats: Record<string, boolean> = {};
    ORDER.forEach(k => {
      newCats[k] = false;
    });
    setExpandedCategories(newCats);

    // Collapse all subcategories
    const newSubCats: Record<string, boolean> = {};
    Object.entries(D).forEach(([catKey, catData]) => {
      if (catKey !== '16_score_calculators' && catKey !== '15_ed_procedures' && catData && typeof catData === 'object') {
        Object.keys(catData).forEach(subCatName => {
          newSubCats[`${catKey}::${subCatName}`] = false;
        });
      }
    });
    setExpandedSubCategories(newSubCats);

    // Collapse all protocols
    setExpandedProtocols({});
  };

  // Helper to generate key for drugs/protocols
  const getEntryKey = (item: any, category: string) => {
    const name = item.item || item.drug || item.condition_or_drug || item.poison_or_drug || item.antidote_treatment || item.product || '';
    return `${category}::${name}`;
  };

  // Dose calculator for weight-based doses
  const calcWeightDose = (doseStr: string, wt: number) => {
    if (!doseStr || !wt) return null;
    const s = doseStr.toString().toLowerCase();
    const unitMatch = s.match(/(ug|mcg|mg|g|units|mEq|mmol|ml)\s*\/\s*kg|per\s*kg/);
    if (!unitMatch) return null;
    const unit = unitMatch[1] || '';
    const numMatch = s.match(/([\d.]+)\s*(?:-|\s+to\s+)\s*([\d.]+)/);
    const singleMatch = s.match(/([\d.]+)/);
    let min = 0, max = 0;
    if (numMatch) {
      min = parseFloat(numMatch[1]);
      max = parseFloat(numMatch[2]);
    } else if (singleMatch) {
      min = parseFloat(singleMatch[1]);
      max = min;
    } else return null;

    const calcMin = (min * wt).toFixed(1).replace(/\.0$/, '');
    const calcMax = (max * wt).toFixed(1).replace(/\.0$/, '');
    const outUnit = unit === 'ug' ? 'mcg' : unit;

    if (min === max) return `${calcMin} ${outUnit}`;
    return `${calcMin} - ${calcMax} ${outUnit}`;
  };

  // Check if a drug should show an infusion calculator
  const isInfusionDrug = (name: string, item: any) => {
    const n = (name || '').toLowerCase();
    const d = ((item.adult_dose || item.adult_settings || item.paediatric_dose || item.paediatric_settings || '') + '').toLowerCase();
    const infusionNames = ['noradrenaline', 'adrenaline', 'dopamine', 'dobutamine', 'phenylephrine', 'nitroglycerin', 'sodium nitroprusside', 'lignocaine', 'amiodarone', 'furosemide', 'morphine', 'midazolam', 'propofol', 'atracurium', 'alteplase', 'heparin', 'insulin', 'esmolol', 'labetalol', 'isoket', 'isosorbide'];
    return infusionNames.some(x => n.includes(x)) || d.includes('/min') || d.includes('infusion') || d.includes('ivi') || d.includes('mcg/kg/min') || d.includes('mg/kg/hr') || d.includes('units/hr') || d.includes('mg/min') || d.includes('mg/hr');
  };

  // Scroll to top check
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Safe parse for custom formatted text blocks
  const parseProtocolText = (text: string) => {
    if (!text) return [];
    return text.split('|').map(x => x.trim()).filter(x => x.length > 0);
  };

  // Safe Math formula evaluator
  const evalFormula = (formula: string, inputs: Record<string, string>) => {
    try {
      let expr = formula.toLowerCase();
      for (const [k, v] of Object.entries(inputs)) {
        if (!v) return null;
        expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
      }
      expr = expr.replace(/\[([^\]]+)\]/g, '($1)');
      const safeExpr = /^[\d\s+\-*/().,^%!&|<>='"a-zA-Z]+$/.test(expr);
      if (!safeExpr) return null;
      const res = new Function(`return (${expr})`)();
      return isFinite(res) ? res : null;
    } catch {
      return null;
    }
  };

  // Update formula input values
  const handleFormulaInputChange = (calcKey: string, inputKey: string, val: string) => {
    setFormulaInputs(prev => ({
      ...prev,
      [calcKey]: {
        ...(prev[calcKey] || {}),
        [inputKey]: val
      }
    }));
  };

  // Re-usable formula calculation result renderers
  const getFormulaResultDesc = (calcKey: string, result: number) => {
    if (result === null || isNaN(result)) return null;

    if (calcKey === 'parkland') {
      const totalVolume = result; // 4 * wt * TBSA
      const first8h = totalVolume / 2;
      const next16h = totalVolume / 2;
      const hourlyFirst8h = first8h / 8;
      const hourlyNext16h = next16h / 16;
      return (
        <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm space-y-2 text-slate-300">
          <div className="text-teal-400 font-bold">Resuscitation Plan (Ringer's Lactate / Balsol)</div>
          <div>Total 24-hour Volume: <strong className="text-white">{totalVolume.toFixed(0)} mL</strong></div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="text-xs text-slate-400">First 8 Hours (50%)</div>
              <div className="font-bold text-teal-300">{first8h.toFixed(0)} mL</div>
              <div className="text-[11px] text-teal-400">{hourlyFirst8h.toFixed(1)} mL/hr</div>
            </div>
            <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="text-xs text-slate-400">Next 16 Hours (50%)</div>
              <div className="font-bold text-teal-300">{next16h.toFixed(0)} mL</div>
              <div className="text-[11px] text-teal-400">{hourlyNext16h.toFixed(1)} mL/hr</div>
            </div>
          </div>
          <div className="text-xs text-rose-300">⚠️ Monitor urine output. Targets: Adults 0.5–1 mL/kg/hr, Children 1–2 mL/kg/hr.</div>
        </div>
      );
    }

    if (calcKey === 'anion_gap') {
      const isHigh = result > 16;
      return (
        <div className={`mt-3 p-3 rounded-lg text-sm border ${isHigh ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' : 'bg-teal-950/20 border-teal-500/20 text-teal-200'}`}>
          <div className="font-bold">{isHigh ? '🔴 Elevated Anion Gap' : '🟢 Normal Anion Gap'}</div>
          <div className="text-xs mt-1 leading-normal text-slate-300">
            {isHigh 
              ? 'MUDPILES / GOLD MARK differential: Methanol, Uremia, DKA/Ketoacidosis, Paracetamol/Propofol, Iron/INH, Lactic acidosis, Ethylene glycol, Salicylates.'
              : 'Normal reference range: 8–16 mmol/L.'}
          </div>
        </div>
      );
    }

    if (calcKey === 'corrected_na') {
      return (
        <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
          <div>Corrected Sodium: <strong className="text-white">{result.toFixed(1)} mmol/L</strong></div>
          <div className="text-xs text-slate-400 mt-1">Adjusted for dilutional effect of hyperglycaemia on measured sodium.</div>
        </div>
      );
    }

    if (calcKey === 'free_water_deficit') {
      return (
        <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
          <div>Free Water Deficit: <strong className="text-white">{result.toFixed(1)} Litres</strong></div>
          <div className="text-xs text-rose-300 mt-1">⚠️ Correct slowly over 48–72 hours to prevent cerebral edema. Max correction 10–12 mmol/L per 24h.</div>
        </div>
      );
    }

    if (calcKey === 'sodium_deficit') {
      return (
        <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
          <div>Sodium Deficit: <strong className="text-white">{result.toFixed(0)} mmol</strong></div>
          <div className="text-xs text-rose-300 mt-1">⚠️ Correct severe hyponatremia slowly. Avoid correcting too quickly (risk of osmotic demyelination / pontine myelinolysis). Limit to &lt;10 mmol/L in 24 hours.</div>
        </div>
      );
    }

    if (calcKey === 'pf_ratio') {
      let severityClass = 'bg-teal-950/20 border-teal-500/20 text-teal-200';
      let title = '🟢 Normal Oxygenation';
      let desc = 'No acute respiratory distress syndrome detected.';

      if (result < 100) {
        severityClass = 'bg-rose-950/40 border-rose-500/40 text-rose-200 animate-pulse';
        title = '🔴 Severe ARDS';
        desc = 'Requires urgent lung protective ventilation ($V_T$ 6 mL/kg, optimized PEEP, consider proning/paralysis).';
      } else if (result < 200) {
        severityClass = 'bg-orange-950/30 border-orange-500/30 text-orange-200';
        title = '🟠 Moderate ARDS';
        desc = 'Consider early ICU referral, high PEEP strategy, non-invasive support.';
      } else if (result < 300) {
        severityClass = 'bg-yellow-950/20 border-yellow-500/20 text-yellow-100';
        title = '🟡 Mild ARDS';
        desc = 'Monitor respiratory indices and work of breathing closely.';
      }

      return (
        <div className={`mt-3 p-3 rounded-lg text-sm border ${severityClass}`}>
          <div className="font-bold">{title}</div>
          <div className="text-xs mt-1 text-slate-300">{desc}</div>
        </div>
      );
    }

    return null;
  };

  // Render individual score cards
  const renderScoreCalculator = (key: string, sc: any) => {
    const isFormula = sc.calculator_type === 'formula';

    if (isFormula) {
      const inputs = formulaInputs[key] || {};
      const result = evalFormula(sc.formula, inputs);

      return (
        <div 
          key={key} 
          onClick={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
          className={`p-4 rounded-xl border transition mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
          </div>
          <div className="space-y-3">
            {sc.inputs.map((inp: any) => (
              <div key={inp.key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-300">{inp.name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={inputs[inp.key] || ''}
                    placeholder="--"
                    onChange={e => handleFormulaInputChange(key, inp.key, e.target.value)}
                    className="w-24 px-2 py-1 bg-black/20 border border-teal-800/40 rounded text-center text-sm text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                  />
                  <span className="text-xs text-slate-400 w-12">{inp.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {result !== null && (
            <div className="mt-4 pt-3 border-t border-teal-900/20">
              <div className="text-xs text-slate-400">Calculated Output:</div>
              <div className="text-2xl font-black text-teal-400 mt-1">{result.toFixed(2)}</div>
              {getFormulaResultDesc(key, result)}
            </div>
          )}
        </div>
      );
    }

    // Interactive Score Matrix Renderers
    if (key === 'gcs') {
      const eye = gcsState.eye || 0;
      const verbal = gcsState.verbal || 0;
      const motor = gcsState.motor || 0;
      const gcsTotal = eye + verbal + motor;

      let severityLabel = 'Select values';
      let severityClass = 'text-slate-400';
      let severityAction = 'Provide GCS criteria selections to evaluate severity.';

      if (eye && verbal && motor) {
        if (gcsTotal >= 13) {
          severityLabel = 'Mild Head Injury';
          severityClass = 'text-teal-400';
          severityAction = 'Perform clinical monitoring. CT head if high-risk features are present.';
        } else if (gcsTotal >= 9) {
          severityLabel = 'Moderate Head Injury';
          severityClass = 'text-amber-400';
          severityAction = 'Perform urgent CT head and consult Neurosurgery.';
        } else {
          severityLabel = 'Severe Head Injury (GCS ≤ 8)';
          severityClass = 'text-rose-400 animate-pulse';
          severityAction = 'Intubate for airway protection immediately. Arrange emergent CT brain.';
        }
      }

      return (
        <div 
          key={key} 
          onClick={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
          className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
          </div>

          <div className="space-y-4">
            {sc.components.map((comp: any) => (
              <div key={comp.key} className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                  {comp.options.map((opt: any) => {
                    const isSelected = gcsState[comp.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setGcsState(prev => ({ ...prev, [comp.key]: opt.value }))}
                        className={`px-2 py-1.5 rounded-lg border text-left flex flex-col justify-between transition h-14 ${
                          isSelected 
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300' 
                            : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between w-full items-start">
                          <span className="text-[11px] font-bold truncate pr-1">{opt.label}</span>
                          <span className={`text-[10px] font-black px-1 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800'}`}>{opt.value}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 line-clamp-1 leading-none">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {eye > 0 && verbal > 0 && motor > 0 && (
            <div className="mt-4 pt-4 border-t border-teal-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">Total GCS Score:</div>
                <div className="text-3xl font-black text-teal-400 mt-1">{gcsTotal} <span className="text-sm font-normal text-slate-400">/ 15</span></div>
              </div>
              <div className="p-3 bg-black/20 rounded-lg flex-1">
                <div className={`font-bold text-sm ${severityClass}`}>{severityLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{severityAction}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (key === 'nexus') {
      const totalAnswered = Object.keys(nexusState).length;
      const isHighRisk = Object.values(nexusState).some(v => v === true);

      return (
        <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
          </div>

          <div className="space-y-2">
            {sc.components.map((comp: any) => {
              const currentVal = nexusState[comp.key];
              return (
                <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/20">
                  <span className="text-sm font-medium text-slate-200">{comp.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setNexusState(prev => ({ ...prev, [comp.key]: false }))}
                      className={`px-3 py-1 text-xs font-bold rounded border transition ${
                        currentVal === false
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setNexusState(prev => ({ ...prev, [comp.key]: true }))}
                      className={`px-3 py-1 text-xs font-bold rounded border transition ${
                        currentVal === true
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalAnswered === sc.components.length && (
            <div className={`mt-4 p-3 rounded-lg border text-sm ${isHighRisk ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' : 'bg-teal-950/20 border-teal-500/20 text-teal-200'}`}>
              <div className="font-bold">{isHighRisk ? '🔴 C-Spine Imaging Required' : '🟢 Clinical Clearance Possible'}</div>
              <div className="text-xs mt-1 text-slate-300">
                {isHighRisk 
                  ? 'High-risk factors present. Maintain inline spinal stabilization and order non-contrast C-spine CT.'
                  : 'Meets low-risk criteria. C-spine may be clinically cleared without radiographs.'}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (key === 'canadian_cspine') {
      const isDangerous = sc.components.some((comp: any) => comp.dangerous && ccsState[comp.key] === true);
      const isSimple = sc.components.some((comp: any) => comp.simple && ccsState[comp.key] === true);

      return (
        <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">Canadian C-Spine Rule for alert and stable trauma patients.</p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 1: Any High-Risk Factors?</div>
              {sc.components.filter((c: any) => c.dangerous).map((comp: any) => {
                const currentVal = ccsState[comp.key];
                return (
                  <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/10">
                    <span className="text-xs text-slate-300">{comp.name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setCcsState(prev => ({ ...prev, [comp.key]: false }))}
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          currentVal === false ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        No
                      </button>
                      <button
                        onClick={() => setCcsState(prev => ({ ...prev, [comp.key]: true }))}
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          currentVal === true ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Step 2: Any Low-Risk Factors?</div>
              {sc.components.filter((c: any) => c.simple).map((comp: any) => {
                const currentVal = ccsState[comp.key];
                return (
                  <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/10">
                    <span className="text-xs text-slate-300">{comp.name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setCcsState(prev => ({ ...prev, [comp.key]: false }))}
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          currentVal === false ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        No
                      </button>
                      <button
                        onClick={() => setCcsState(prev => ({ ...prev, [comp.key]: true }))}
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          currentVal === true ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-900/20">
            {isDangerous ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-lg text-xs font-bold">
                🔴 High risk factor present. Do NOT test range of motion. CT C-spine is indicated.
              </div>
            ) : isSimple ? (
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 text-teal-200 rounded-lg text-xs">
                <strong>🟢 Low risk criteria present.</strong> Safe to clinically assess Range of Motion. If patient can rotate neck 45° left and right, C-spine may be clinically cleared.
              </div>
            ) : (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                Provide criteria answers to evaluate low/high risk pathways.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (key === 'burch_wartofsky') {
      const tempVal = burchWartofskyState.temp !== undefined ? burchWartofskyState.temp : null;
      const cvsVal = burchWartofskyState.cvs !== undefined ? burchWartofskyState.cvs : null;
      const cnsVal = burchWartofskyState.cns !== undefined ? burchWartofskyState.cns : null;
      const giVal = burchWartofskyState.gi !== undefined ? burchWartofskyState.gi : null;

      const totalBurch = (tempVal || 0) + (cvsVal || 0) + (cnsVal || 0) + (giVal || 0);
      const isAllSelected = tempVal !== null && cvsVal !== null && cnsVal !== null && giVal !== null;

      let burchLabel = 'Select values';
      let burchClass = 'text-slate-400 border-slate-800 bg-slate-900/50';
      let burchAction = 'Select a value for all components to calculate the Thyroid Storm score.';

      if (isAllSelected) {
        if (totalBurch >= 45) {
          burchLabel = '🔴 Thyroid Storm Highly Probable (≥45)';
          burchClass = 'bg-rose-950/30 border-rose-500/25 text-rose-300';
          burchAction = 'Clinical emergency! Admit to ICU immediately. Initiate PTU, Lugol\'s iodine, beta-blocker, and steroids.';
        } else if (totalBurch >= 25) {
          burchLabel = '🟡 Impending Thyroid Storm (25-44)';
          burchClass = 'bg-amber-950/20 border-amber-500/25 text-amber-300';
          burchAction = 'Highly suggestive of developing storm. Initiate aggressive supportive therapy, and consult Endocrine urgently.';
        } else {
          burchLabel = '🟢 Thyroid Storm Unlikely (<25)';
          burchClass = 'bg-teal-950/20 border-teal-500/25 text-teal-300';
          burchAction = 'Thyroid storm is unlikely. Perform thyroid function tests and manage underlying symptoms supportively.';
        }
      }

      return (
        <div 
          key={key} 
          onClick={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
          className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
            </div>
            {isAllSelected && (
              <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
                Score: {totalBurch}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {sc.components.map((comp: any) => (
              <div key={comp.key} className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
                <div className="flex flex-col gap-1.5">
                  {comp.options.map((opt: any) => {
                    const isSelected = burchWartofskyState[comp.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setBurchWartofskyState(prev => ({ ...prev, [comp.key]: opt.value }))}
                        className={`px-3 py-2 rounded-lg border text-left flex justify-between items-center transition ${
                          isSelected 
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300' 
                            : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-medium">{opt.label}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                          +{opt.value} pts
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 p-3 rounded-lg border text-sm ${burchClass}`}>
            <div className="font-bold">{burchLabel}</div>
            <div className="text-xs mt-1 text-slate-300">{burchAction}</div>
          </div>
        </div>
      );
    }

    // Default checklist/point-based scorers
    const currentScoresState = 
      key === 'alvarado' ? alvaradoState :
      key === 'wells_dvt' ? wellsDvtState :
      key === 'wells_pe' ? wellsPeState :
      key === 'perc' ? percState :
      key === 'curb65' ? curb65State : {};

    const setCurrentScoresState = 
      key === 'alvarado' ? setAlvaradoState :
      key === 'wells_dvt' ? setWellsDvtState :
      key === 'wells_pe' ? setWellsPeState :
      key === 'perc' ? setPercState :
      key === 'curb65' ? setCurb65State : () => {};

    const pointsSum = sc.components.reduce((acc: number, comp: any) => {
      const cid = comp.key || comp.name;
      const isChecked = currentScoresState[cid];
      if (isChecked) {
        return acc + (comp.points || 1);
      }
      return acc;
    }, 0);

    const getScorerBadgeAndInterp = () => {
      let severityClass = 'bg-teal-950/20 border-teal-500/20 text-teal-300';
      let title = 'Low risk';
      let desc = 'Reference standard guidelines.';

      if (sc.interpretation) {
        const match = sc.interpretation.find((x: any) => pointsSum >= x.min && pointsSum <= x.max);
        if (match) {
          title = match.label;
          desc = match.action;
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('high') || lowerTitle.includes('severe') || lowerTitle.includes('probable')) {
            severityClass = 'bg-rose-950/20 border-rose-500/20 text-rose-300';
          } else if (lowerTitle.includes('moderate') || lowerTitle.includes('possible') || lowerTitle.includes('intermediate')) {
            severityClass = 'bg-orange-950/20 border-orange-500/20 text-orange-300';
          }
        }
      }
      return (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${severityClass}`}>
          <div className="font-bold">{title}</div>
          <div className="text-xs mt-1 text-slate-300">{desc}</div>
        </div>
      );
    };

    return (
      <div 
        key={key} 
        onClick={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
        className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-md text-[#00d9b5]">{sc.name}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
            Score: {pointsSum}
          </div>
        </div>

        <div className="space-y-1.5">
          {sc.components.map((comp: any) => {
            const cid = comp.key || comp.name;
            const isChecked = currentScoresState[cid] === true;
            return (
              <div 
                key={cid}
                onClick={() => setCurrentScoresState((prev: any) => ({ ...prev, [cid]: !prev[cid] }))}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isChecked ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-black/10 border border-transparent hover:border-teal-950/40'
                }`}
              >
                <span className="text-xs text-slate-300 pr-4">{comp.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {comp.points && <span className="text-[10px] text-teal-400">+{comp.points}</span>}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    isChecked ? 'bg-teal-400 border-teal-400 text-black' : 'border-slate-600'
                  }`}>
                    {isChecked && '✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {getScorerBadgeAndInterp()}
      </div>
    );
  };

  // Rendering all score calculators
  const renderScores = (scores: any) => {
    return (
      <div className="space-y-2">
        <div className="bg-teal-950/10 border border-teal-900/30 p-3 rounded-lg text-xs leading-normal mb-4 text-slate-300 flex items-start gap-2">
          <Info className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Interactive scoring matrices:</strong> Tap on the values or checkboxes to calculate immediate clinical recommendations, diagnostic steps, and therapeutic indications.
          </div>
        </div>
        {Object.entries(scores).map(([k, sc]) => renderScoreCalculator(k, sc))}
      </div>
    );
  };

  // Infusion calculator implementation inside cards
  const renderInfusionCalculatorWidget = (drugName: string, item: any) => {
    const key = drugName.replace(/\s+/g, '_');
    const preset = getInfusionPreset(drugName);
    
    // Fallbacks for when no local state is set yet, initializing with standard clinical presets
    const state = infusionDoses[key] || { 
      dose: preset?.dose || '', 
      conc: preset?.conc || '', 
      weight: weight || '' 
    };

    const updateInfusionState = (field: string, val: string) => {
      setInfusionDoses(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || { dose: preset?.dose || '', conc: preset?.conc || '', weight: weight || '' }),
          [field]: val
        }
      }));
    };

    const dVal = parseFloat(state.dose);
    const cVal = parseFloat(state.conc);
    const wVal = parseFloat(state.weight) || parsedWeight || 70;
    const unit = preset?.unit || 'mcg/kg/min';

    let calculatedMLhr: number | null = null;
    if (dVal > 0 && cVal > 0) {
      if (unit === 'mcg/kg/min') {
        calculatedMLhr = (dVal * wVal * 60) / (cVal * 1000);
      } else if (unit === 'mcg/min') {
        calculatedMLhr = (dVal * 60) / (cVal * 1000);
      } else if (unit === 'mg/hr') {
        calculatedMLhr = dVal / cVal;
      } else if (unit === 'mg/kg/hr' || unit === 'units/kg/hr') {
        calculatedMLhr = (dVal * wVal) / cVal;
      } else if (unit === 'mg/min') {
        calculatedMLhr = (dVal * 60) / cVal;
      }
    }

    const calculatedGttMin = calculatedMLhr ? (calculatedMLhr * 20) / 60 : null; // 20 drops/mL standard IV set

    return (
      <div className="mt-3 p-3 rounded-lg bg-black/35 border border-teal-900/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#00d9b5] font-bold">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>Infusion Rate Calculator</span>
          </div>
          {preset && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/50 text-teal-400 font-bold border border-teal-900/30">
              {preset.unit} preset
            </span>
          )}
        </div>

        {preset && (
          <div className="text-[10px] text-slate-400 space-y-0.5 border-b border-teal-950/30 pb-2 mb-2">
            <div><span className="text-teal-400 font-medium">Standard Dilution:</span> {preset.dilutionDesc}</div>
            <div><span className="text-teal-400 font-medium">Therapeutic Range:</span> {preset.dosesDesc}</div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Target Dose ({unit})</label>
            <input
              type="number"
              value={state.dose}
              placeholder={preset?.dose || "Dose"}
              onChange={e => updateInfusionState('dose', e.target.value)}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Conc ({unit.includes('units') ? 'units/mL' : 'mg/mL'})</label>
            <input
              type="number"
              value={state.conc}
              step="any"
              placeholder={preset?.conc || "Conc"}
              onChange={e => updateInfusionState('conc', e.target.value)}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Weight (kg)</label>
            <input
              type="number"
              value={state.weight}
              placeholder={wVal.toString()}
              onChange={e => updateInfusionState('weight', e.target.value)}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {calculatedMLhr !== null && (
          <div className="pt-2 border-t border-teal-900/20 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Infusion Rate:</span>
              <strong className="text-teal-300 font-black text-sm">{calculatedMLhr.toFixed(1)} mL/hr</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Drip Rate (20 gtt/mL):</span>
              <strong className="text-teal-400 font-bold">{calculatedGttMin ? calculatedGttMin.toFixed(0) : '0'} drops/min</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Re-usable component to render standard drug / item cards
  const renderDrugCard = (it: any, cat: string) => {
    const key = getEntryKey(it, cat);
    const fav = isFavourite(key);
    const n = it.item || it.drug || it.condition_or_drug || it.poison_or_drug || it.antidote_treatment || it.product || '';
    const nt = it.notes_updates || it.notes || '';
    const ntLower = nt.toLowerCase();

    // Check tags
    const isFirstLine = ntLower.includes('first-line');
    const isSection21 = ntLower.includes('section 21');
    const isWarning = ntLower.includes('warning') || ntLower.includes('avoid') || ntLower.includes('contraindicated') || ntLower.includes('lethal');
    const isCaution = ntLower.includes('caution') || ntLower.includes('side effect') || ntLower.includes('high risk');

    return (
      <div 
        key={key} 
        onClick={() => recordRecentlyViewed(key, n, cat, 'drug')}
        className={`p-4 rounded-xl border transition-all duration-200 mb-3 cursor-pointer ${
          theme === 'dark' ? 'bg-[#0b1717] border-teal-950/40 hover:border-teal-800/30' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-md text-slate-100 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
              <span className={theme === 'light' ? 'text-slate-900' : 'text-slate-100'}>{n}</span>
              {isFirstLine && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded uppercase">1st Line</span>}
              {isSection21 && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Section 21</span>}
              {isWarning && <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Warning</span>}
              {isCaution && !isWarning && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Caution</span>}
            </h4>
          </div>
          <button 
            onClick={e => toggleFavourite(key, e)}
            className={`p-1.5 rounded-full hover:bg-slate-800/40 transition active:scale-95 ${fav ? 'text-yellow-400' : 'text-slate-600'}`}
          >
            <Star className={`h-5 w-5 ${fav ? 'fill-yellow-400' : ''}`} />
          </button>
        </div>

        {/* Doses Display */}
        <div className="mt-3 space-y-2">
          {(it.adult_dose || it.adult_settings) && (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[10px] uppercase font-black bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">A</span>
              <div className="text-slate-300 flex-1 leading-relaxed">
                {it.adult_dose || it.adult_settings}
                {parsedWeight > 0 && (it.adult_dose || '').toLowerCase().includes('/kg') && (
                  <div className="text-teal-400 text-xs font-bold mt-1">
                    ⚡ Weight Calculated: {calcWeightDose(it.adult_dose || '', parsedWeight)} (for {parsedWeight}kg)
                  </div>
                )}
              </div>
            </div>
          )}

          {(it.paediatric_dose || it.paediatric_settings) && (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[10px] uppercase font-black bg-[#135050] text-[#00d9b5] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">P</span>
              <div className="text-[#00d9b5] flex-1 leading-relaxed">
                {it.paediatric_dose || it.paediatric_settings}
                {parsedWeight > 0 && (it.paediatric_dose || '').toLowerCase().includes('/kg') && (
                  <div className="text-teal-400 text-xs font-bold mt-1">
                    ⚡ Weight Calculated: {calcWeightDose(it.paediatric_dose || '', parsedWeight)} (for {parsedWeight}kg)
                  </div>
                )}
              </div>
            </div>
          )}

          {it.protocol_dose && (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[10px] uppercase font-black bg-purple-950/40 text-purple-300 border border-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">Rx</span>
              <span className="text-slate-300 flex-1 leading-relaxed">{it.protocol_dose}</span>
            </div>
          )}

          {/* Inline Infusion Widget */}
          {isInfusionDrug(n, it) && renderInfusionCalculatorWidget(n, it)}

          {/* Formula Display */}
          {it.formula && (
            <div className="mt-2 p-2 rounded bg-black/20 border border-teal-950/20 text-xs flex justify-between font-mono">
              <span className="text-slate-400">Formula:</span>
              <span className="text-[#00d9b5] font-bold">{it.formula}</span>
            </div>
          )}
          {it.standard_dilutions && (
            <div className="text-xs text-slate-400 mt-1 pl-1">
              <strong>Dilution:</strong> {it.standard_dilutions}
            </div>
          )}

          {/* Notes updates callouts */}
          {nt && (
            <div className={`mt-3 p-3 rounded-lg text-xs leading-normal border ${
              isWarning ? 'bg-rose-950/25 border-rose-900/35 text-rose-200' :
              isCaution ? 'bg-amber-950/20 border-amber-900/35 text-amber-200' :
              'bg-black/10 border-teal-950/20 text-slate-400'
            }`}>
              {nt}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendering procedures with checklist and equipment
  const renderEDProcedureCard = (p: any, cat: string) => {
    const key = getEntryKey(p, cat);
    const fav = isFavourite(key);
    const isExpanded = expandedProtocols[key] === true;

    return (
      <div 
        key={key} 
        className={`p-4 rounded-xl border transition mb-4 ${
          theme === 'dark' ? 'bg-[#0b1717] border-teal-950/40 hover:border-teal-900/30' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div 
          onClick={() => {
            toggleProtocol(key);
            recordRecentlyViewed(key, p.item, cat, 'procedure');
          }}
          className="flex items-start justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <h4 className="font-bold text-md text-[#00d9b5]">{p.item}</h4>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={e => toggleFavourite(key, e)}
              className={`p-1 rounded-full hover:bg-slate-800/40 transition active:scale-95 ${fav ? 'text-yellow-400' : 'text-slate-600'}`}
            >
              <Star className={`h-5 w-5 ${fav ? 'fill-yellow-400' : ''}`} />
            </button>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-teal-900/10 space-y-4">
            
            {/* Equipment checklist tags */}
            {p.equipment && p.equipment.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Equipment</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.equipment.map((eq: string) => (
                    <span key={eq} className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist status updates */}
            {p.checklist_items && p.checklist_items.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Procedure Checklist</span>
                <div className="space-y-1">
                  {p.checklist_items.map((item: string) => {
                    const isChecked = checklistStatus[key + '::' + item] === true;
                    return (
                      <div 
                        key={item}
                        onClick={() => setChecklistStatus(prev => ({ ...prev, [key + '::' + item]: !prev[key + '::' + item] }))}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-teal-500/10 text-slate-400 line-through' : 'bg-black/10 text-slate-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isChecked ? 'bg-teal-400 border-teal-400 text-black' : 'border-slate-600'
                        }`}>
                          {isChecked && '✓'}
                        </div>
                        <span className="text-xs leading-normal">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drugs table if present */}
            {p.drugs && p.drugs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applicable Drugs</span>
                {p.drugs.map((d: any) => renderDrugCard(d, cat))}
              </div>
            )}

            {/* Management Steps timeline */}
            {p.management_steps && p.management_steps.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step-by-step Timeline</span>
                <div className="relative border-l border-teal-900/40 pl-4 ml-2 space-y-4">
                  {p.management_steps.map((s: any) => (
                    <div key={s.step_number} className="relative">
                      <div className="absolute -left-[21px] top-1 bg-teal-400 text-black w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px]">
                        {s.step_number}
                      </div>
                      <div className="font-bold text-xs text-teal-300">{s.action}</div>
                      {s.details && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.details}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General notes / warning callout */}
            {p.notes_updates && (
              <div className="p-3 rounded-lg bg-black/20 border border-teal-950/20 text-xs leading-relaxed text-slate-400">
                {p.notes_updates}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Re-usable component to render sub-headers of categories
  const renderCategorySect = (catKey: string) => {
    const catData = D[catKey as keyof typeof D] as any;
    if (!catData) return null;

    const isExpanded = expandedCategories[catKey] === true;
    const catLabel = CATEGORIES[catKey] || catKey;

    // Filters and search logic
    const matchedItems: any[] = [];

    // Filter GCS or score metrics if score calculators
    if (catKey === '16_score_calculators') {
      Object.entries(catData).forEach(([k, sc]: any) => {
        if (!searchQuery || sc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchedItems.push({ key: k, sc });
        }
      });
    } else {
      // Loop over keys
      Object.entries(catData).forEach(([sk, sv]: any) => {
        if (Array.isArray(sv)) {
          sv.forEach(item => {
            const itemName = item.item || item.drug || item.condition_or_drug || item.poison_or_drug || item.antidote_treatment || item.product || '';
            const matchName = itemName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchNotes = (item.notes_updates || item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!searchQuery || matchName || matchNotes) {
              matchedItems.push({ item, subCategory: sk });
            }
          });
        } else if (sv && typeof sv === 'object') {
          const itemName = sv.item || sv.drug || sv.condition_or_drug || '';
          const matchName = itemName.toLowerCase().includes(searchQuery.toLowerCase());
          const matchNotes = (sv.notes_updates || sv.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

          if (!searchQuery || matchName || matchNotes) {
            matchedItems.push({ item: sv, subCategory: sk });
          }
        }
      });
    }

    // Filter favorites
    const finalItems = matchedItems.filter(entry => {
      if (selectedCategory === 'favourites') {
        const entryKey = entry.sc ? `16_score_calculators::${entry.sc.name}` : getEntryKey(entry.item, catKey);
        return isFavourite(entryKey);
      }
      return true;
    });

    if (finalItems.length === 0) return null;

    return (
      <div 
        key={catKey} 
        className={`rounded-xl border overflow-hidden mb-4 transition-all ${
          theme === 'dark' ? 'bg-[#081212] border-teal-950/60' : 'bg-white border-slate-200'
        }`}
      >
        <div 
          onClick={() => toggleCategory(catKey)}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition ${
            theme === 'dark' ? 'bg-[#0d2222]/80 hover:bg-[#112a22]' : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{CATEGORY_ICONS[catKey] || '📋'}</span>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-teal-400">{catLabel}</h3>
            <span className="text-[10px] bg-teal-950 text-teal-400 font-bold px-1.5 py-0.5 rounded">
              {finalItems.length}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {catKey === '16_score_calculators' ? (
              renderScores(catData)
            ) : catKey === '15_ed_procedures' ? (
              finalItems.map(entry => renderEDProcedureCard(entry.item, catKey))
            ) : (
              // Group normal entries by subCategory
              (Object.entries(
                finalItems.reduce((acc, entry) => {
                  const sub = entry.subCategory || 'General';
                  if (!acc[sub]) acc[sub] = [];
                  acc[sub].push(entry.item);
                  return acc;
                }, {} as Record<string, any[]>)
              ) as [string, any[]][]).map(([subCatName, subCatItems]) => {
                const subCatKey = `${catKey}::${subCatName}`;
                const isSubCatExpanded = expandedSubCategories[subCatKey] !== false;

                return (
                  <div key={subCatName} className="space-y-2 border-l border-teal-950/20 pl-3">
                    <div 
                      onClick={() => setExpandedSubCategories(prev => ({ ...prev, [subCatKey]: !isSubCatExpanded }))}
                      className="text-xs font-bold text-teal-400 uppercase tracking-widest border-b border-teal-950/20 pb-1.5 mb-2 flex items-center justify-between cursor-pointer select-none hover:text-teal-300 transition-colors"
                    >
                      <span>{subCatName.replace(/_/g, ' ')}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isSubCatExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    {isSubCatExpanded && (
                      <div className="space-y-2">
                        {subCatItems.map(it => renderDrugCard(it, catKey))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  // Help find procedure item from JSON structure
  const findProcedureItem = (itemName: string) => {
    const procs = D['15_ed_procedures'];
    if (procs) {
      for (const subCat of Object.values(procs)) {
        if (Array.isArray(subCat)) {
          const match = subCat.find(p => (p.item || '') === itemName);
          if (match) return match;
        }
      }
    }
    return null;
  };

  // Help find drug item from JSON structure
  const findDrugItem = (catKey: string, itemName: string) => {
    const catData = (D as any)[catKey];
    if (catData) {
      for (const subCat of Object.values(catData)) {
        if (Array.isArray(subCat)) {
          const match = subCat.find(x => (x.item || x.drug || x.condition_or_drug || x.poison_or_drug || x.antidote_treatment || x.product || '') === itemName);
          if (match) return match;
        } else if (subCat && typeof subCat === 'object') {
          const name = (subCat as any).item || (subCat as any).drug || (subCat as any).condition_or_drug || '';
          if (name === itemName) return subCat;
        }
      }
    }
    return null;
  };

  // Rendering Recently Viewed tab
  const renderRecentlyViewedTab = () => {
    if (recentlyViewed.length === 0) {
      return (
        <div className="text-center py-20">
          <Clock className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-400">No Recently Viewed Items</h3>
          <p className="text-xs text-slate-500 mt-1">Items you click, view, or calculate will appear here for rapid access.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-teal-950/20 pb-2 mb-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recently Viewed History</span>
          <button 
            onClick={() => {
              setRecentlyViewed([]);
              localStorage.removeItem('tr_rv');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-bold flex items-center gap-1"
          >
            Clear History
          </button>
        </div>
        <div className="space-y-3">
          {recentlyViewed.map(item => {
            if (item.type === 'calculator') {
              const sc = (D['16_score_calculators'] as any)?.[item.key];
              if (!sc) return null;
              return (
                <div key={item.key} className="relative pt-2">
                  <span className="absolute top-0 right-4 bg-teal-950/80 text-[9px] font-black text-teal-400 px-1.5 py-0.5 rounded uppercase z-10 border border-teal-800/30">Calculator</span>
                  {renderScoreCalculator(item.key, sc)}
                </div>
              );
            }

            if (item.type === 'procedure') {
              const p = findProcedureItem(item.name);
              if (!p) return null;
              return (
                <div key={item.key} className="relative pt-2">
                  <span className="absolute top-0 right-4 bg-teal-950/80 text-[9px] font-black text-teal-400 px-1.5 py-0.5 rounded uppercase z-10 border border-teal-800/30">Procedure</span>
                  {renderEDProcedureCard(p, item.catKey)}
                </div>
              );
            }

            if (item.type === 'drug') {
              const d = findDrugItem(item.catKey, item.name);
              if (!d) return null;
              return (
                <div key={item.key} className="relative pt-2">
                  <span className="absolute top-0 right-4 bg-teal-950/80 text-[9px] font-black text-teal-400 px-1.5 py-0.5 rounded uppercase z-10 border border-teal-800/30">{CATEGORIES[item.catKey] || 'Clinical'}</span>
                  {renderDrugCard(d, item.catKey)}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  };

  // Rendering Favorites tab specifically
  const renderFavouritesTab = () => {
    const hasFavs = favourites.length > 0;
    if (!hasFavs) {
      return (
        <div className="text-center py-20">
          <Star className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-400">No Favourites Saved</h3>
          <p className="text-xs text-slate-500 mt-1">Tap the star (☆) on any drug, protocol, or procedure to save it here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ORDER.filter(k => k !== 'favourites' && k !== 'recently_viewed' && k !== 'all').map(k => renderCategorySect(k))}
      </div>
    );
  };

  // Switch rendering based on active categories
  const renderContent = () => {
    if (selectedCategory === 'favourites') {
      return renderFavouritesTab();
    }

    if (selectedCategory === 'recently_viewed') {
      return renderRecentlyViewedTab();
    }

    if (selectedCategory === 'all') {
      return ORDER.filter(k => k !== 'favourites' && k !== 'recently_viewed' && k !== 'all').map(k => renderCategorySect(k));
    }

    return renderCategorySect(selectedCategory);
  };

  // Short naming vars for backwards-compatibility or easy sync
  const act = selectedCategory;
  const setCat = setSelectedCategory;
  const q = searchQuery;
  const setQ = setSearchQuery;
  const W = weight;
  const sW = setWeight;
  const D_keys = ORDER;
  const TAB_NAMES = CATEGORIES;
  const I = CATEGORY_ICONS;
  const C = CATEGORIES;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a1414] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-md transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f2424] border-b border-[#1c3838]' : 'bg-[#0d3b3b] text-white border-b border-[#135050]'}`}>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-[#00d9b5] animate-pulse" />
          <h1 className="text-2xl font-extrabold font-sans tracking-tight">Tit<span className="text-[#00d9b5]">rate</span></h1>
          <span className="text-[10px] bg-[#165252] text-[#00d9b5] font-bold px-1.5 py-0.5 rounded ml-1">v4.4</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAboutOpen(true)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            title="About / Clinical Sources"
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setTheme(theme => theme === 'light' ? 'dark' : 'light')}
            id="theme-tog"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 transition"
            title="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* SEARCH + WEIGHT CONFIG BAR */}
      <div className={`sticky top-[3.5rem] z-40 p-3 shadow-md flex gap-3 items-center border-b transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0f1f1f] border-teal-950/60' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 opacity-60" />
          <input 
            type="text" 
            id="s" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search drug, protocol, score..." 
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-sm transition focus:outline-none ${
              theme === 'dark' 
                ? 'bg-black/30 border border-teal-950 text-slate-100 focus:border-teal-400' 
                : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-teal-600 focus:bg-white'
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-teal-400" />
          <input 
            type="number" 
            id="w" 
            placeholder="Weight" 
            step="0.1" 
            min="0"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className={`w-16 p-1 text-center font-bold text-sm rounded ${
              theme === 'dark' 
                ? 'bg-black/30 border border-teal-950 text-[#00d9b5]' 
                : 'bg-slate-100 border border-slate-200 text-teal-700'
            }`}
          />
          <span className="text-xs text-slate-400 font-bold">kg</span>
        </div>
      </div>

      {/* CATEGORY BAR (PILLS) */}
      <div className={`sticky top-[7rem] z-30 flex gap-2 p-3 overflow-x-auto whitespace-nowrap border-b transition-colors duration-300 no-scrollbar ${
        theme === 'dark' ? 'bg-[#0a1414] border-teal-950/40' : 'bg-slate-50 border-slate-200'
      }`}>
        {ORDER.map(k => {
          const label = CATEGORIES[k] || k;
          const isSelected = selectedCategory === k;
          const favsCount = favourites.length;
          return (
            <button
              key={k}
              onClick={() => setSelectedCategory(k)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-teal-400 text-black shadow-lg shadow-teal-500/10' 
                  : theme === 'dark'
                    ? 'bg-[#142e2e] text-teal-400/80 border border-teal-950 hover:bg-[#1a3838]'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className="mr-1">{CATEGORY_ICONS[k] || '📋'}</span>
              <span>{label}</span>
              {k === 'favourites' && favsCount > 0 && (
                <span className="ml-1.5 bg-black/20 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  {favsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 pb-20">
        {/* Toggle Controls for All Containers */}
        {selectedCategory !== 'favourites' && selectedCategory !== 'recently_viewed' && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={expandAllContainers}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-teal-950/40 text-teal-300 border border-teal-900/30 hover:bg-teal-900/30'
                  : 'bg-teal-50 text-teal-700 border border-teal-200/50 hover:bg-teal-100/50'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Expand All
            </button>
            <button
              onClick={collapseAllContainers}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900/50 text-slate-300 border border-slate-800 hover:bg-slate-800/40'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-180" /> Collapse All
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory + '-' + searchQuery} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-8 text-xs opacity-60">
        Created by Tashriq Hendricks &amp; Kimi · Helen Joseph Hospital guidelines © 2026
      </footer>

      {/* TO TOP BUTTON */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-teal-400 hover:bg-teal-300 text-black shadow-lg transition-transform active:scale-95 z-50 cursor-pointer"
        >
          ↑
        </button>
      )}

      {/* ABOUT / CLINICAL REFERENCE MODAL */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-teal-500/30 text-slate-100 rounded-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold border-b border-teal-500/20 pb-2 mb-4 text-[#00d9b5]">Titrate Reference App</h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <p>
                <strong>Titrate</strong> is a specialized clinical reference database designed for rapid dosing, protocol exploration, and medical calculation in high-acuity environments (ICU and Emergency Department).
              </p>
              <div>
                <h3 className="font-bold text-white mb-1 font-sans">🏥 Primary Data Sources</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Chris Hani Baragwanath Academic Hospital ICU Dosing Card</strong> (2024 Updates).</li>
                  <li><strong>Helen Joseph Tertiary Hospital Emergency Department Clinical Guidelines 2026</strong>.</li>
                  <li>Editor: Dr Jana du Plessis.</li>
                  <li>Contributing Authors: Dr P Saffy, Dr L Chadinha, Dr JP da Costa, Dr C Geldenhuys, Dr N Bruton.</li>
                </ul>
              </div>
              <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 p-3 rounded-lg leading-normal">
                <strong>Disclaimer:</strong> This application is intended as a clinical memory-aid and decision support tool for medical professionals. Always double-check calculations and drug properties prior to administration.
              </p>
            </div>
            <button 
              onClick={() => setAboutOpen(false)}
              className="mt-6 w-full py-2 bg-teal-400 hover:bg-teal-300 text-black font-bold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
