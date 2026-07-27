/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Search, Scale, ChevronDown, Check,
  AlertTriangle, Moon, Sun, BookOpen,
  Calculator, Stethoscope, Activity, Heart, ShieldAlert,
  Info, Sparkles, CheckSquare, Plus, RefreshCw, Clock
} from 'lucide-react';
import {
  clinicalData,
  getAssociatedDiseasesForDrug,
  getPairedDrugsForDisease,
  DISEASE_DRUG_PAIRINGS
} from './clinical/legacyAdapter';
import {calculateFormula, type FormulaKey} from './clinical/calculations/formulas';
import {
  calculateInfusionRate,
  INFUSION_DEFINITIONS,
  type InfusionDefinition,
} from './clinical/calculations/infusions';
import {
  extractWeightDoseResults,
  infusionDefinitionFromDoseText,
} from './clinical/calculations/weightDose';
import {calculateChecklistScore} from './clinical/scores';
import type {CriterionAnswer} from './clinical/types';
import trialsReference from './trials-reference.json';
import {HomePage} from './components/HomePage';
import {MindMapViewer} from './components/MindMapViewer';
import {PolicyViewer} from './components/PolicyViewer';

const D = clinicalData as any;

interface TrialReferenceEntry {
  id: string;
  type: 'clinical_trial' | 'clinical_decision_rule';
  title: string;
  reference: string;
  domain: string;
  the_hook: string;
  if_consultant_asks: string;
  killer_stat: string;
  shift_action?: string;
}

const TRIALS_REFERENCE = trialsReference as TrialReferenceEntry[];

// Category mapping keys
const CATEGORIES: Record<string, string> = {
  home: '🏠 Home Page',
  favourites: 'Favourites',
  recently_viewed: 'Recently Viewed',
  bara_icu_card: '🏥 Bara ICU Dosing Card',
  sa_edl_phc_guidelines: '🇿🇦 SA EDL / PHC Guidelines',
  trials_guidelines: '🔬 Trials & Int\'l Guidelines',
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
  home: '🏠',
  favourites: '⭐',
  recently_viewed: '⏱️',
  bara_icu_card: '🏥',
  sa_edl_phc_guidelines: '🇿🇦',
  trials_guidelines: '🔬',
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
  'home',
  'favourites',
  'recently_viewed',
  'bara_icu_card',
  'sa_edl_phc_guidelines',
  'trials_guidelines',
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


export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('tr_theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  // Core Inputs & Navigation
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('tr_w') || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('home');
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [activeMindMap, setActiveMindMap] = useState<string | null>(null);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bara_icu' | 'sa_edl_phc'>('all');

  // Favorites
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('tr_f') || '[]');
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
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
      const parsed: unknown = JSON.parse(localStorage.getItem('tr_rv') || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is RecentlyViewedItem => {
        if (!value || typeof value !== 'object') return false;
        const candidate = value as Partial<RecentlyViewedItem>;
        return (
          typeof candidate.key === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.catKey === 'string' &&
          typeof candidate.timestamp === 'number' &&
          ['drug', 'procedure', 'calculator'].includes(candidate.type ?? '')
        );
      });
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
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);
  const aboutDialogRef = useRef<HTMLDivElement>(null);

  // Score Calculator states
  const [gcsState, setGcsState] = useState<Record<string, number>>({});
  const [nexusState, setNexusState] = useState<Record<string, boolean>>({});
  const [alvaradoState, setAlvaradoState] = useState<Record<string, CriterionAnswer>>({});
  const [wellsDvtState, setWellsDvtState] = useState<Record<string, CriterionAnswer>>({});
  const [wellsPeState, setWellsPeState] = useState<Record<string, CriterionAnswer>>({});
  const [percState, setPercState] = useState<Record<string, CriterionAnswer>>({});
  const [curb65State, setCurb65State] = useState<Record<string, CriterionAnswer>>({});
  const [burchWartofskyState, setBurchWartofskyState] = useState<Record<string, number>>({});
  const [ccsState, setCcsState] = useState<Record<string, boolean>>({});
  const [ccsApplicable, setCcsApplicable] = useState<CriterionAnswer>('unanswered');
  const [ccsRotation, setCcsRotation] = useState<CriterionAnswer>('unanswered');
  const [tetanusState, setTetanusState] = useState<Record<string, number>>({}); // 0: doses, 1: wound
  const [formulaInputs, setFormulaInputs] = useState<Record<string, Record<string, string>>>({});
  const [infusionDoses, setInfusionDoses] = useState<Record<string, { dose: string; conc: string; weight: string }>>({});
  const [infusionConfirmed, setInfusionConfirmed] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (!aboutOpen) return;
    const dialog = aboutDialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAboutOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      aboutTriggerRef.current?.focus();
    };
  }, [aboutOpen]);

  const toggleFavourite = (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavourites(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      return next;
    });
  };

  const isFavourite = (key: string) => favourites.includes(key);
  const scoreFavouriteKey = (key: string) => `score.${key}`;
  const renderScoreFavouriteButton = (key: string) => {
    const favouriteKey = scoreFavouriteKey(key);
    const favourite = isFavourite(favouriteKey);
    return (
      <button
        type="button"
        onClick={event => toggleFavourite(favouriteKey, event)}
        aria-label={favourite ? 'Remove calculator from favourites' : 'Add calculator to favourites'}
        className={`rounded-full p-1.5 ${favourite ? 'text-yellow-400' : 'text-slate-500'}`}
      >
        <Star className={`h-4 w-4 ${favourite ? 'fill-yellow-400' : ''}`} />
      </button>
    );
  };

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
    if (item?._meta?.id) return item._meta.id;
    const name = item.item || item.drug || item.condition_or_drug || item.poison_or_drug || item.antidote_treatment || item.product || '';
    return `${category}::${name}`;
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

  const evalFormula = (formulaKey: FormulaKey, inputs: Record<string, string>) => {
    try {
      const numericInputs: Record<string, number> = {};
      for (const [key, value] of Object.entries(inputs)) {
        if (value === '') return {result: null, error: ''};
        numericInputs[key] = Number(value);
      }
      return {result: calculateFormula(formulaKey, numericInputs), error: ''};
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Unable to calculate',
      };
    }
  };

  const formatCalculatedDose = (value: number): string => {
    if (Math.abs(value) >= 100) return value.toFixed(0);
    if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, '');
    return value.toFixed(2).replace(/\.?0+$/, '');
  };

  const renderWeightDoseSummary = (text: string, label?: string) => {
    const patientWeight = Number(weight);
    const results = extractWeightDoseResults(text, patientWeight);
    if (results.length === 0) return null;

    return (
      <div className="mt-1.5 space-y-1" aria-live="polite">
        {results.map(result => (
          <div
            key={`${label ?? ''}-${result.sourceExpression}`}
            className="rounded border border-teal-900/30 bg-teal-950/20 px-2 py-1 text-[10px] text-teal-200"
          >
            {label && <span className="font-bold">{label}: </span>}
            At {formatCalculatedDose(patientWeight)} kg, {result.sourceExpression} ={' '}
            <strong>
              {formatCalculatedDose(result.minimum)}
              {result.maximum !== result.minimum
                ? `–${formatCalculatedDose(result.maximum)}`
                : ''}{' '}
              {result.resultUnit}
            </strong>
            {/\bmax(?:imum)?\b/i.test(text) && (
              <span className="ml-1 text-slate-400">— apply the printed maximum</span>
            )}
          </div>
        ))}
      </div>
    );
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
      const totalVolume = result;
      const first8h = totalVolume / 2;
      const next16h = totalVolume / 2;
      const hourlyFirst8h = first8h / 8;
      const hourlyNext16h = next16h / 16;
      return (
        <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm space-y-2 text-slate-300">
          <div className="text-teal-400 font-bold">HJH Modified Brooke Resuscitation Plan</div>
          <div>Total 24-hour Volume: <strong className="text-white">{totalVolume.toFixed(0)} mL</strong></div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="text-xs text-slate-400">First 8 Hours From Time of Burn (50%)</div>
              <div className="font-bold text-teal-300">{first8h.toFixed(0)} mL</div>
              <div className="text-[11px] text-teal-400">{hourlyFirst8h.toFixed(1)} mL/hr</div>
            </div>
            <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="text-xs text-slate-400">Next 16 Hours (50%)</div>
              <div className="font-bold text-teal-300">{next16h.toFixed(0)} mL</div>
              <div className="text-[11px] text-teal-400">{hourlyNext16h.toFixed(1)} mL/hr</div>
            </div>
          </div>
          <div className="text-xs text-rose-300">⚠️ HJH initiation thresholds: adults &gt;20% TBSA and children &gt;15% TBSA. Paediatric maintenance fluid is separate.</div>
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

    if (calcKey.startsWith('corrected_na_hjh_')) {
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
    const renderScoreTitle = () => (
      <div className="min-w-0">
        <div className="font-bold text-md text-[#00d9b5]">{sc.name}</div>
        <div className="text-[9px] font-normal text-slate-500">
          {sc.source_label
            ? sc.source_label
            : sc.source_pages?.length > 0
            ? `HJH PDF page${sc.source_pages.length > 1 ? 's' : ''} ${sc.source_pages.join(', ')} · clinical review pending`
            : 'Source page mapping or external-source approval required'}
        </div>
      </div>
    );

    if (isFormula) {
      const inputs = formulaInputs[key] || {};
      const formulaKey = sc.formula_id as FormulaKey | undefined;
      const hasStarted = Object.values(inputs).some(value => value !== '');
      const evaluation = formulaKey && !sc.disabled_reason && hasStarted
        ? evalFormula(formulaKey, inputs)
        : {result: null, error: ''};
      const result = evaluation.result;

      return (
        <div 
          key={key} 
          onClick={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
          className={`p-4 rounded-xl border transition mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              {renderScoreTitle()}
            </div>
            {renderScoreFavouriteButton(key)}
          </div>
          {sc.disabled_reason && (
            <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-200" role="alert">
              <strong>Calculation unavailable:</strong> {sc.disabled_reason}
            </div>
          )}
          {sc.review_note && (
            <div className="mb-3 text-[10px] leading-normal text-slate-400">
              {sc.review_note}
            </div>
          )}
          <div className="space-y-3">
            {sc.inputs.map((inp: any) => (
              <div key={inp.key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-300">{inp.name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={inputs[inp.key] || ''}
                    placeholder="--"
                    onChange={e => handleFormulaInputChange(key, inp.key, e.target.value)}
                    disabled={Boolean(sc.disabled_reason)}
                    aria-label={`${sc.name}: ${inp.name} (${inp.unit})`}
                    className="w-24 px-2 py-1 bg-black/20 border border-teal-800/40 rounded text-center text-sm text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                  />
                  <span className="text-xs text-slate-400 w-12">{inp.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {evaluation.error && (
            <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/20 p-2 text-xs text-rose-200" role="alert">
              {evaluation.error}
            </div>
          )}
          {result !== null && (
            <div className="mt-4 pt-3 border-t border-teal-900/20" aria-live="polite">
              <div className="text-xs text-slate-400">Calculated Output:</div>
              <div className="text-2xl font-black text-teal-400 mt-1">
                {result.value.toFixed(2)} <span className="text-sm">{result.unit}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Working: {result.working}</div>
              {getFormulaResultDesc(key, result.value)}
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
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              {renderScoreTitle()}
            </div>
            {renderScoreFavouriteButton(key)}
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
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              {renderScoreTitle()}
            </div>
            {renderScoreFavouriteButton(key)}
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
      const highRiskComponents = sc.components.filter((comp: any) => comp.dangerous);
      const lowRiskComponents = sc.components.filter((comp: any) => comp.simple);
      const highRiskComplete = highRiskComponents.every(
        (comp: any) => ccsState[comp.key] !== undefined,
      );
      const lowRiskComplete = lowRiskComponents.every(
        (comp: any) => ccsState[comp.key] !== undefined,
      );
      const isDangerous = highRiskComponents.some(
        (comp: any) => ccsState[comp.key] === true,
      );
      const isSimple = lowRiskComponents.some(
        (comp: any) => ccsState[comp.key] === true,
      );

      return (
        <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              {renderScoreTitle()}
            </div>
            {renderScoreFavouriteButton(key)}
          </div>

          <p className="text-[11px] text-slate-400 mb-3">HJH Canadian C-Spine workflow for eligible alert and stable trauma patients (PDF page 54).</p>
          <div className="mb-3 rounded border border-amber-500/30 bg-amber-950/20 p-2 text-[10px] text-amber-100">
            If the HJH Head Injury protocol indicates CT brain, the source pathway directs non-contrast CT brain and C-spine.
          </div>

          <div className="mb-4 rounded-lg border border-teal-900/30 bg-black/10 p-3">
            <div className="mb-2 text-xs font-bold text-teal-300">Applicability confirmed?</div>
            <p className="mb-2 text-[10px] text-slate-400">
              Trauma, GCS 15, stable vitals, age ≥16, no acute paralysis, no known vertebral disease or prior C-spine surgery, and not pregnant.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCcsApplicable('no')} aria-pressed={ccsApplicable === 'no'} className={`rounded border px-3 py-1 text-xs ${ccsApplicable === 'no' ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-slate-700'}`}>No</button>
              <button type="button" onClick={() => setCcsApplicable('yes')} aria-pressed={ccsApplicable === 'yes'} className={`rounded border px-3 py-1 text-xs ${ccsApplicable === 'yes' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700'}`}>Yes</button>
            </div>
          </div>

          {ccsApplicable === 'yes' && <div className="space-y-3">
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

            {highRiskComplete && !isDangerous && <div className="space-y-1.5">
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
            </div>}
          </div>}

          <div className="mt-4 pt-3 border-t border-teal-900/20">
            {ccsApplicable === 'no' ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-lg text-xs font-bold">
                The Canadian C-Spine Rule is not applicable. Use clinical assessment and the appropriate imaging pathway.
              </div>
            ) : ccsApplicable !== 'yes' ? (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                Confirm applicability before entering criteria.
              </div>
            ) : isDangerous ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-lg text-xs font-bold">
                🔴 High risk factor present. Do NOT test range of motion. CT C-spine is indicated.
              </div>
            ) : !highRiskComplete ? (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                Complete all high-risk criteria first.
              </div>
            ) : !lowRiskComplete ? (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                Complete all low-risk criteria.
              </div>
            ) : !isSimple ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-lg text-xs font-bold">
                No low-risk factor is present. Imaging is indicated in the HJH pathway.
              </div>
            ) : ccsRotation === 'unanswered' ? (
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 text-teal-200 rounded-lg text-xs">
                <strong>Low-risk factor present.</strong>
                <div className="my-2">Can the patient actively rotate the neck 45° left and right?</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCcsRotation('no')} className="rounded border border-rose-500 px-3 py-1">No</button>
                  <button type="button" onClick={() => setCcsRotation('yes')} className="rounded border border-teal-500 px-3 py-1">Yes</button>
                </div>
              </div>
            ) : ccsRotation === 'yes' ? (
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 text-teal-200 rounded-lg text-xs font-bold">
                HJH pathway complete: no C-spine imaging required.
              </div>
            ) : (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-lg text-xs font-bold">
                Unable to rotate 45° left and right: imaging is indicated.
              </div>
            )}
            {ccsApplicable === 'yes' && highRiskComplete && !isDangerous && !lowRiskComplete && (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                Do not proceed to range-of-motion assessment until the low-risk section is complete.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (key === 'burch_wartofsky') {
      const componentKeys = sc.components.map((component: any) => component.key);
      const isAllSelected = componentKeys.every(
        (componentKey: string) => burchWartofskyState[componentKey] !== undefined,
      );
      const totalBurch = componentKeys.reduce(
        (total: number, componentKey: string) =>
          total + (burchWartofskyState[componentKey] ?? 0),
        0,
      );

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
              {renderScoreTitle()}
            </div>
            <div className="flex items-center gap-2">
              {isAllSelected && (
                <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
                  Score: {totalBurch}
                </div>
              )}
              {renderScoreFavouriteButton(key)}
            </div>
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
          <div className="mt-2 text-[10px] text-amber-300">
            Clinical review pending for source-table errata on HJH PDF page 190.
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

    const checklistResult = calculateChecklistScore(
      sc.components.map((comp: any) => ({
        key: comp.key || comp.name,
        points: comp.points,
      })),
      currentScoresState,
    );
    const pointsSum = checklistResult.score;
    const answeredCount = checklistResult.answeredCount;
    const isComplete = checklistResult.complete;

    const getScorerBadgeAndInterp = () => {
      if (!isComplete) {
        return (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300" aria-live="polite">
            <div className="font-bold">Assessment incomplete</div>
            <div className="mt-1 text-xs">{answeredCount} of {sc.components.length} criteria answered. No interpretation is available yet.</div>
          </div>
        );
      }

      let severityClass = 'bg-teal-950/20 border-teal-500/20 text-teal-300';
      let title = 'Low risk';
      let desc = 'Reference standard guidelines.';

      if (key === 'perc') {
        if (pointsSum === 0) {
          title = 'PERC Negative';
          desc = 'All eight HJH PERC criteria have been explicitly confirmed as negative. Apply only within the HJH low-risk PE pathway.';
        } else {
          title = 'PERC Positive';
          desc = `${pointsSum} positive criterion${pointsSum === 1 ? '' : 'a'}. Follow the HJH pulmonary embolism algorithm.`;
          severityClass = 'bg-orange-950/20 border-orange-500/20 text-orange-300';
        }
      } else if (sc.interpretation) {
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
            {renderScoreTitle()}
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
              {isComplete ? `Score: ${pointsSum}` : `${answeredCount}/${sc.components.length} answered`}
            </div>
            {renderScoreFavouriteButton(key)}
          </div>
        </div>

        <div className="space-y-1.5">
          {sc.components.map((comp: any) => {
            const cid = comp.key || comp.name;
            const answer = currentScoresState[cid] as CriterionAnswer | undefined;
            return (
              <div 
                key={cid}
                className={`flex items-center justify-between gap-3 p-2 rounded-lg transition ${
                  answer === 'yes' ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-black/10 border border-transparent'
                }`}
              >
                <span className="text-xs text-slate-300 pr-4">{comp.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {comp.points && <span className="text-[10px] text-teal-400">+{comp.points}</span>}
                  <button
                    type="button"
                    onClick={() => setCurrentScoresState((prev: any) => ({...prev, [cid]: 'no'}))}
                    aria-pressed={answer === 'no'}
                    className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'no' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScoresState((prev: any) => ({...prev, [cid]: 'yes'}))}
                    aria-pressed={answer === 'yes'}
                    className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'yes' ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    Yes
                  </button>
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
  const renderAtropineInfusionWidget = () => {
    const key = 'atropine-percent';
    const state = infusionDoses[key] || {dose: '', conc: '', weight: ''};
    const totalDose = Number(state.dose);
    const concentration = Number(state.conc);
    const percentage = Number(state.weight);
    const confirmed = infusionConfirmed[key] === true;
    const valid = totalDose > 0 && concentration > 0 && percentage > 0;
    const rate = confirmed && valid
      ? (totalDose * percentage / 100) / concentration
      : null;

    const update = (field: 'dose' | 'conc' | 'weight', value: string) => {
      setInfusionDoses(previous => ({
        ...previous,
        [key]: {...state, [field]: value},
      }));
      setInfusionConfirmed(previous => ({...previous, [key]: false}));
    };

    return (
      <div data-dark-surface className="mt-3 space-y-2 rounded-lg border border-teal-900/40 bg-[#071111] p-3 text-xs">
        <div className="font-bold text-[#00d9b5]">Atropine maintenance infusion</div>
        <div className="text-[10px] text-slate-400">
          Protocol: 200 mg in 200 mL saline (1 mg/mL), run at 10–20% of the total atropinisation dose per hour.
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-[10px] text-slate-400">
            Total dose given (mg)
            <input
              type="number"
              min="0"
              step="any"
              value={state.dose}
              onChange={event => update('dose', event.target.value)}
              className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
            />
          </label>
          <label className="text-[10px] text-slate-400">
            Dose per hour (%)
            <input
              type="number"
              min="10"
              max="20"
              step="any"
              value={state.weight}
              onChange={event => update('weight', event.target.value)}
              placeholder="10–20"
              className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
            />
          </label>
          <label className="text-[10px] text-slate-400">
            Actual conc. (mg/mL)
            <input
              type="number"
              min="0"
              step="any"
              value={state.conc}
              onChange={event => update('conc', event.target.value)}
              placeholder="1"
              className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
            />
          </label>
        </div>
        <label className="flex items-start gap-2 rounded border border-teal-900/30 p-2 text-[10px] text-slate-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={event => setInfusionConfirmed(previous => ({
              ...previous,
              [key]: event.target.checked,
            }))}
          />
          I have confirmed the total dose, selected percentage, and actual concentration.
        </label>
        {confirmed && !valid && (
          <div className="text-[10px] text-rose-300">Complete all three inputs with values greater than zero.</div>
        )}
        {rate !== null && (
          <div className="border-t border-teal-900/20 pt-2" aria-live="polite">
            <strong className="text-sm text-teal-300">{formatCalculatedDose(rate)} mL/hr</strong>
            <div className="text-[10px] text-slate-400">
              ({totalDose} mg × {percentage}%) ÷ {concentration} mg/mL
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInfusionCalculatorWidget = (
    presetOrDefinition: string | InfusionDefinition,
  ) => {
    if (presetOrDefinition === 'atropine_percent') {
      return renderAtropineInfusionWidget();
    }
    const definition = typeof presetOrDefinition === 'string'
      ? INFUSION_DEFINITIONS[presetOrDefinition]
      : presetOrDefinition;
    if (!definition) return null;
    const key = definition.id;
    const state = infusionDoses[key] || {dose: '', conc: '', weight: weight || ''};

    const updateInfusionState = (field: string, val: string) => {
      setInfusionDoses(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || {dose: '', conc: '', weight: weight || ''}),
          [field]: val
        }
      }));
    };

    const dVal = parseFloat(state.dose);
    const cVal = parseFloat(state.conc);
    const wVal = parseFloat(state.weight);
    let result: ReturnType<typeof calculateInfusionRate> | null = null;
    let calculationError = '';
    if (infusionConfirmed[key]) {
      try {
        result = calculateInfusionRate(definition, {
          dose: dVal,
          concentration: cVal,
          weight: definition.requiresWeight ? wVal : undefined,
        });
      } catch (error) {
        calculationError = error instanceof Error ? error.message : 'Unable to calculate';
      }
    }

    return (
      <div data-dark-surface className="mt-3 p-3 rounded-lg bg-[#071111] border border-teal-900/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#00d9b5] font-bold">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>{definition.title}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/50 text-teal-400 font-bold border border-teal-900/30">
            {definition.doseUnit}
          </span>
        </div>

        <div className="text-[10px] text-slate-400 space-y-0.5 border-b border-teal-950/30 pb-2 mb-2">
          <div><span className="text-teal-400 font-medium">Source preparation:</span> {definition.preparation}</div>
          <div><span className="text-teal-400 font-medium">Configured range:</span> {definition.minimumDose}–{definition.maximumDose} {definition.doseUnit}</div>
          <div><span className="text-teal-400 font-medium">Source:</span> {definition.sourceId}{definition.pdfPages.length > 0 ? `, PDF page ${definition.pdfPages.join(', ')}` : ''}</div>
        </div>

        {definition.warnings.length > 0 && (
          <details className="rounded border border-slate-800 px-2 py-1 text-[10px] text-slate-400">
            <summary className="cursor-pointer">Protocol notes</summary>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {definition.warnings.map(note => <li key={note}>{note}</li>)}
            </ul>
          </details>
        )}

        {definition.status === 'blocked' && (
          <div className="rounded border border-amber-500/40 bg-amber-950/20 p-2 text-amber-200" role="alert">
            <strong>Unavailable:</strong> {definition.blockedReason}
          </div>
        )}

        {definition.status === 'available' && <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Target Dose ({definition.doseUnit})</label>
            <input
              type="number"
              value={state.dose}
              min="0"
              step="any"
              placeholder="Required"
              onChange={e => updateInfusionState('dose', e.target.value)}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Actual Conc ({definition.concentrationUnit})</label>
            <input
              type="number"
              value={state.conc}
              step="any"
              min="0"
              placeholder={definition.concentration.toString()}
              onChange={e => {
                updateInfusionState('conc', e.target.value);
                setInfusionConfirmed(prev => ({...prev, [key]: false}));
              }}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Weight (kg)</label>
            <input
              type="number"
              value={state.weight}
              min="0"
              step="any"
              disabled={!definition.requiresWeight}
              placeholder={definition.requiresWeight ? 'Required' : 'N/A'}
              onChange={e => updateInfusionState('weight', e.target.value)}
              className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>}

        {definition.status === 'available' && (
          <label className="flex cursor-pointer items-start gap-2 rounded border border-teal-900/30 p-2 text-[10px] text-slate-300">
            <input
              type="checkbox"
              checked={infusionConfirmed[key] === true}
              onChange={event => setInfusionConfirmed(prev => ({...prev, [key]: event.target.checked}))}
            />
            I have confirmed the actual prepared concentration and patient-specific inputs.
          </label>
        )}

        {calculationError && (
          <div className="rounded border border-rose-500/40 bg-rose-950/20 p-2 text-rose-200" role="alert">{calculationError}</div>
        )}

        {result !== null && (
          <div className="pt-2 border-t border-teal-900/20 space-y-2" aria-live="polite">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Infusion Rate:</span>
              <strong className="text-teal-300 font-black text-sm">{result.mlPerHour.toFixed(1)} mL/hr</strong>
            </div>
            <div className="text-[10px] text-slate-400">Working: {result.working}</div>
            {result.outsideRecommendedRange && <div className="font-bold text-rose-300">Entered dose is outside the configured source range.</div>}
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
    const adultDoseText = String(it.adult_dose || it.adult_settings || '');
    const paediatricDoseText = String(it.paediatric_dose || it.paediatric_settings || '');
    const protocolDoseText = String(it.protocol_dose || '');
    const primarySource = it?._meta?.sourceRefs?.[0];
    const dynamicInfusions = it?._meta?.infusionPresetId
      ? []
      : [
          infusionDefinitionFromDoseText(
            `${key}.adult-infusion`,
            `${n} adult infusion`,
            adultDoseText,
            it.standard_dilutions,
            primarySource?.sourceId ?? 'source-unresolved',
            primarySource?.pdfPages ?? [],
          ),
          infusionDefinitionFromDoseText(
            `${key}.paediatric-infusion`,
            `${n} paediatric infusion`,
            paediatricDoseText,
            it.standard_dilutions,
            primarySource?.sourceId ?? 'source-unresolved',
            primarySource?.pdfPages ?? [],
          ),
          infusionDefinitionFromDoseText(
            `${key}.protocol-infusion`,
            `${n} protocol infusion`,
            protocolDoseText,
            it.standard_dilutions,
            primarySource?.sourceId ?? 'source-unresolved',
            primarySource?.pdfPages ?? [],
          ),
        ].filter((definition): definition is InfusionDefinition => Boolean(definition));

    // Check tags
    const isFirstLine = ntLower.includes('first-line');
    const isSection21 = ntLower.includes('section 21');
    const isWarning = ntLower.includes('warning') || ntLower.includes('avoid') || ntLower.includes('contraindicated') || ntLower.includes('lethal');
    const isCaution = ntLower.includes('caution') || ntLower.includes('side effect') || ntLower.includes('high risk');
    const associatedDiseases = getAssociatedDiseasesForDrug(n);

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
              {it?._meta?.sourceGroup === 'bara_icu' ? (
                <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-bold px-1.5 py-0.5 rounded">🏥 Bara ICU Card</span>
              ) : (
                <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold px-1.5 py-0.5 rounded">🇿🇦 SA EDL / PHC</span>
              )}
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
                {renderWeightDoseSummary(adultDoseText, 'Adult')}
              </div>
            </div>
          )}

          {(it.paediatric_dose || it.paediatric_settings) && (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[10px] uppercase font-black bg-[#135050] text-[#00d9b5] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">P</span>
              <div className="text-[#00d9b5] flex-1 leading-relaxed">
                {it.paediatric_dose || it.paediatric_settings}
                {renderWeightDoseSummary(paediatricDoseText, 'Paediatric')}
              </div>
            </div>
          )}

          {it.protocol_dose && (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[10px] uppercase font-black bg-purple-950/40 text-purple-300 border border-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">Rx</span>
              <span className="text-slate-300 flex-1 leading-relaxed">
                {it.protocol_dose}
                {renderWeightDoseSummary(protocolDoseText, 'Protocol')}
              </span>
            </div>
          )}

          {/* Inline Infusion Widget */}
          {it?._meta?.infusionPresetId && renderInfusionCalculatorWidget(it._meta.infusionPresetId)}
          {dynamicInfusions.map(definition => (
            <React.Fragment key={definition.id}>
              {renderInfusionCalculatorWidget(definition)}
            </React.Fragment>
          ))}

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

          {/* Associated Diseases / Emergency Issues Badges */}
          {associatedDiseases.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-teal-950/20">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">🩺 Associated Emergencies & Diseases</div>
              <div className="flex flex-wrap gap-1">
                {associatedDiseases.map(dis => (
                  <button
                    key={dis}
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSearchQuery(dis);
                    }}
                    className="text-[10px] bg-teal-950/50 hover:bg-teal-900/60 text-teal-300 border border-teal-800/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {dis}
                  </button>
                ))}
              </div>
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
              {renderWeightDoseSummary(nt, 'Weight calculation')}
            </div>
          )}

          {it?._meta?.sourceRefs?.length > 0 && (
            <div className="mt-3 border-t border-teal-950/30 pt-2 text-[10px] text-slate-500">
              {it._meta.sourceRefs.map((source: any) => (
                <div key={`${source.sourceId}-${source.pdfPages.join('-')}`}>
                  Source: {source.sourceId}
                  {source.pdfPages.length > 0 ? ` · PDF page${source.pdfPages.length > 1 ? 's' : ''} ${source.pdfPages.join(', ')}` : ' · mapping required'}
                  {' · '}Review: {it._meta.reviewState}
                </div>
              ))}
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
    const pairedDrugs = getPairedDrugsForDisease(p.item);

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
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleProtocol(key);
              recordRecentlyViewed(key, p.item, cat, 'procedure');
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          className="flex items-start justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">🛠️</span>
            <h4 className="font-bold text-md text-[#00d9b5]">{p.item}</h4>
            <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold px-1.5 py-0.5 rounded">
              🇿🇦 SA EDL / PHC
            </span>
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
                      <label
                        key={item}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-teal-500/10 text-slate-400 line-through' : 'bg-black/10 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setChecklistStatus(prev => ({ ...prev, [key + '::' + item]: !prev[key + '::' + item] }))}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isChecked ? 'bg-teal-400 border-teal-400 text-black' : 'border-slate-600'
                        }`}>
                          {isChecked && '✓'}
                        </div>
                        <span className="text-xs leading-normal">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paired Drugs & Infusions for this Disease / Emergency Issue */}
            {pairedDrugs.length > 0 && (
              <div className="space-y-2 border-t border-teal-900/20 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <span>💊 Paired Drugs & Infusions for {p.item}</span>
                  <span className="text-[9px] bg-teal-950 text-teal-400 px-1.5 py-0.5 rounded font-black">{pairedDrugs.length}</span>
                </div>
                <div className="space-y-2">
                  {pairedDrugs.map(d => renderDrugCard(d, (d._meta as any)?.categoryId || cat))}
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
                  {p.management_steps.map((s: any) => {
                    const stepDetails = String(s.details || '');
                    const source = p?._meta?.sourceRefs?.[0];
                    const stepInfusion = infusionDefinitionFromDoseText(
                      `${key}.step-${s.step_number}-infusion`,
                      `${p.item}: ${s.action}`,
                      stepDetails,
                      undefined,
                      source?.sourceId ?? 'source-unresolved',
                      source?.pdfPages ?? [],
                    );
                    return (
                    <div key={s.step_number} className="relative">
                      <div className="absolute -left-[21px] top-1 bg-teal-400 text-black w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px]">
                        {s.step_number}
                      </div>
                      <div className="font-bold text-xs text-teal-300">{s.action}</div>
                      {s.details && (
                        <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {s.details}
                          {renderWeightDoseSummary(stepDetails, 'Weight calculation')}
                        </div>
                      )}
                      {stepInfusion && renderInfusionCalculatorWidget(stepInfusion)}
                    </div>
                  )})}
                </div>
              </div>
            )}

            {/* General notes / warning callout */}
            {p.notes_updates && (
              <div className="p-3 rounded-lg bg-black/20 border border-teal-950/20 text-xs leading-relaxed text-slate-400">
                {p.notes_updates}
                {renderWeightDoseSummary(String(p.notes_updates), 'Weight calculation')}
              </div>
            )}

            {p?._meta?.warnings?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Warnings and contraindications</span>
                {p._meta.warnings.map((warning: any) => (
                  <div
                    key={warning.id}
                    role="alert"
                    className={`rounded-lg border p-3 text-xs leading-relaxed ${
                      warning.severity === 'critical'
                        ? 'border-rose-500/40 bg-rose-950/30 text-rose-100'
                        : warning.severity === 'caution'
                          ? 'border-amber-500/40 bg-amber-950/20 text-amber-100'
                          : 'border-blue-500/30 bg-blue-950/20 text-blue-100'
                    }`}
                  >
                    {warning.text}
                    {renderWeightDoseSummary(String(warning.text), 'Weight calculation')}
                  </div>
                ))}
              </div>
            )}

            {p?._meta?.sourceRefs?.length > 0 && (
              <div className="border-t border-teal-900/20 pt-2 text-[10px] text-slate-500">
                {p._meta.sourceRefs.map((source: any) => (
                  <div key={`${source.sourceId}-${source.pdfPages.join('-')}`}>
                    Source: {source.sourceId}
                    {source.pdfPages.length > 0 ? ` · PDF page${source.pdfPages.length > 1 ? 's' : ''} ${source.pdfPages.join(', ')}` : ' · page mapping required'}
                    {' · '}Review: {p._meta.reviewState}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderClinicalEntryCard = (entry: any, cat: string) => {
    const type = entry?._meta?.type;
    if (type === 'protocol' || type === 'procedure' || entry?.protocol_type === 'ed_protocol') {
      return renderEDProcedureCard(entry, cat);
    }
    return renderDrugCard(entry, cat);
  };

  // Re-usable component to render sub-headers of categories
  const renderCategorySect = (catKey: string) => {
    const catData = D[catKey as keyof typeof D] as any;
    if (!catData) return null;

    // Filter sourceGroup if sourceFilter is active
    if (sourceFilter === 'bara_icu') {
      const isBaraCategory = [
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
        '16_score_calculators',
      ].includes(catKey);
      if (!isBaraCategory) return null;
    } else if (sourceFilter === 'sa_edl_phc') {
      const isSaEdlCategory = [
        '11_ed_medical_emergencies',
        '12_ed_toxicology',
        '13_ed_trauma_surgical',
        '14_ed_metabolic',
        '15_ed_procedures',
      ].includes(catKey);
      if (!isSaEdlCategory) return null;
    }

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
            const matchStructuredContent = JSON.stringify({
              management_steps: item.management_steps,
              equipment: item.equipment,
              warnings: item.warnings,
              drugs: item.drugs,
              standard_dilutions: item.standard_dilutions,
              adult_dose: item.adult_dose,
              paediatric_dose: item.paediatric_dose,
            }).toLowerCase().includes(searchQuery.toLowerCase());

            if (!searchQuery || matchName || matchNotes || matchStructuredContent) {
              matchedItems.push({ item, subCategory: sk });
            }
          });
        } else if (sv && typeof sv === 'object') {
            const itemName = sv.item || sv.drug || sv.condition_or_drug || '';
            const matchName = itemName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchNotes = (sv.notes_updates || sv.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchStructuredContent = JSON.stringify(sv).toLowerCase().includes(searchQuery.toLowerCase());

            if (!searchQuery || matchName || matchNotes || matchStructuredContent) {
            matchedItems.push({ item: sv, subCategory: sk });
          }
        }
      });
    }

    // Filter favorites
    const finalItems = matchedItems.filter(entry => {
      if (selectedCategory === 'favourites') {
        const entryKey = entry.sc ? scoreFavouriteKey(entry.key) : getEntryKey(entry.item, catKey);
        return isFavourite(entryKey);
      }
      return true;
    });

    if (finalItems.length === 0 && catKey !== '7_useful_formulae') return null;

    return (
      <div 
        key={catKey} 
        className={`rounded-xl border overflow-hidden mb-4 transition-all ${
          theme === 'dark' ? 'bg-[#081212] border-teal-950/60' : 'bg-white border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleCategory(catKey)}
          aria-expanded={isExpanded}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition ${
            theme === 'dark' ? 'bg-[#0d2222]/80 hover:bg-[#112a22]' : 'bg-slate-100 hover:bg-slate-200'
          } w-full text-left`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{CATEGORY_ICONS[catKey] || '📋'}</span>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-teal-400">{catLabel}</h3>
            <span className="text-[10px] bg-teal-950 text-teal-400 font-bold px-1.5 py-0.5 rounded">
              {finalItems.length + (catKey === '7_useful_formulae' ? Object.keys(INFUSION_DEFINITIONS).length : 0)}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Infusion Rate Calculators Section embedded in Useful Formulae */}
            {catKey === '7_useful_formulae' && (
              <div className="mb-6 p-4 rounded-xl border border-teal-900/50 bg-[#061414] space-y-4">
                <div className="flex items-center justify-between border-b border-teal-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-400 animate-pulse" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-teal-300">⚡ Interactive Infusion Rate Calculators</h3>
                  </div>
                  <span className="text-[10px] bg-teal-950 text-teal-400 font-bold px-2 py-0.5 rounded border border-teal-800/30">
                    {Object.keys(INFUSION_DEFINITIONS).length} Calculators
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculate continuous IV infusion rates (mL/hr) in real-time based on weight and prepared concentration for all high-acuity ICU & ED agents.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(INFUSION_DEFINITIONS).map(([infKey, definition]) => (
                    <div key={infKey}>
                      {renderInfusionCalculatorWidget(definition)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catKey === '16_score_calculators' ? (
              renderScores(Object.fromEntries(finalItems.map(entry => [entry.key, entry.sc])))
            ) : catKey === '15_ed_procedures' ? (
              finalItems.map(entry => renderClinicalEntryCard(entry.item, catKey))
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
                    <button
                      type="button"
                      onClick={() => setExpandedSubCategories(prev => ({ ...prev, [subCatKey]: !isSubCatExpanded }))}
                      aria-expanded={isSubCatExpanded}
                      className="w-full text-left text-xs font-bold text-teal-400 uppercase tracking-widest border-b border-teal-950/20 pb-1.5 mb-2 flex items-center justify-between cursor-pointer select-none hover:text-teal-300 transition-colors"
                    >
                      <span>{subCatName.replace(/_/g, ' ')}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isSubCatExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isSubCatExpanded && (
                      <div className="space-y-2">
                        {subCatItems.map(it => renderClinicalEntryCard(it, catKey))}
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

  // Dedicated view for Bara ICU Dosing Card
  const renderBaraIcuCardView = () => {
    const baraCategories = [
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
      '16_score_calculators',
    ];

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#091b1b] border border-cyan-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">ICU Dosing & Reference Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>🏥 Chris Hani Baragwanath Academic Hospital ICU Dosing Card</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete, independent dosing reference for Intubation, Inotropes, Antiarrhythmics, Electrolyte Replacement, Blood Products, Antimicrobials, Infusions, and ICU Formulae.
            </p>
          </div>
        </div>
        {baraCategories.map(k => renderCategorySect(k))}
      </div>
    );
  };

  // Dedicated view for SA EDL / PHC Guidelines
  const renderSaEdlPhcView = () => {
    const saEdlCategories = [
      '11_ed_medical_emergencies',
      '12_ed_toxicology',
      '13_ed_trauma_surgical',
      '14_ed_metabolic',
      '15_ed_procedures',
    ];

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#081826] border border-blue-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Emergency & Primary Care Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>🇿🇦 South African Essential Drugs List & Emergency Department Guidelines</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete, independent ED emergency management algorithms (ACS, Stroke, Heart Failure, Sepsis, Asthma, COPD, UGIB, Seizures, Trauma, Procedures).
            </p>
          </div>
        </div>
        {saEdlCategories.map(k => renderCategorySect(k))}
      </div>
    );
  };

  // Dedicated view for Trials & International Guidelines reference cards
  const renderTrialsView = () => {
    const q = searchQuery.toLowerCase();
    const matched = TRIALS_REFERENCE.filter(t => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.the_hook.toLowerCase().includes(q) ||
        t.if_consultant_asks.toLowerCase().includes(q) ||
        t.killer_stat.toLowerCase().includes(q) ||
        (t.shift_action || '').toLowerCase().includes(q)
      );
    });

    const byDomain = matched.reduce((acc, t) => {
      if (!acc[t.domain]) acc[t.domain] = [];
      acc[t.domain].push(t);
      return acc;
    }, {} as Record<string, TrialReferenceEntry[]>);

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#1a0f26] border border-purple-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Evidence Base Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>🔬 Landmark Trials & International Guidelines</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Key clinical trials and validated clinical decision rules — the evidence behind the protocols, for when a consultant asks "why".
            </p>
          </div>
          <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-800/30 flex-shrink-0">
            {matched.length} Entries
          </span>
        </div>

        {matched.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-500">No trials or guidelines match your search.</div>
        )}

        {Object.entries(byDomain).map(([domain, entries]) => (
          <div
            key={domain}
            className={`rounded-xl border overflow-hidden ${
              theme === 'dark' ? 'bg-[#081212] border-teal-950/60' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center gap-2.5 px-4 py-3 ${theme === 'dark' ? 'bg-[#0d2222]/80' : 'bg-slate-100'}`}>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-purple-400">{domain}</h3>
              <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded">
                {entries.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {entries.map(t => (
                <div
                  key={t.id}
                  className={`rounded-lg border p-3.5 space-y-2 ${
                    theme === 'dark' ? 'border-teal-950/40 bg-black/10' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-100">{t.title}</h4>
                    <span
                      className={`flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        t.type === 'clinical_trial'
                          ? 'bg-sky-950/60 text-sky-300 border-sky-800/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                      }`}
                    >
                      {t.type === 'clinical_trial' ? 'Trial' : 'Decision Rule'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">{t.reference}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{t.the_hook}</p>

                  <div className="pt-1.5 border-t border-teal-950/20 space-y-1.5">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-bold text-teal-400">If the consultant asks: </span>
                      {t.if_consultant_asks}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-bold text-emerald-400">Killer stat: </span>
                      {t.killer_stat}
                    </p>
                    {t.shift_action && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-bold text-amber-400">On shift: </span>
                        {t.shift_action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
        {ORDER.filter(k => k !== 'home' && k !== 'favourites' && k !== 'recently_viewed' && k !== 'bara_icu_card' && k !== 'sa_edl_phc_guidelines' && k !== 'trials_guidelines' && k !== 'all').map(k => renderCategorySect(k))}
      </div>
    );
  };

  // Switch rendering based on active categories
  const renderContent = () => {
    if (activeMindMap) {
      return (
        <MindMapViewer
          mindMapId={activeMindMap}
          onBack={() => setActiveMindMap(null)}
          weight={weight}
        />
      );
    }

    if (activePolicy) {
      return (
        <PolicyViewer
          policyId={activePolicy}
          onBack={() => setActivePolicy(null)}
        />
      );
    }

    if (selectedCategory === 'home') {
      return (
        <HomePage
          onSelectFacility={(facId) => {
            setSelectedFacility(facId);
            if (facId === 'hjth') {
              setSourceFilter('all');
              setSelectedCategory('all');
            } else if (facId === 'chbah') {
              setSelectedCategory('bara_icu_card');
            }
            // rmmch / cmjah: no confirmed source content yet (see clinical-sources/source-manifest.json) — HomePage marks these "Coming Soon" and does not navigate.
          }}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
          onSelectMindMap={(mapId) => setActiveMindMap(mapId)}
          onSelectPolicy={(polId) => setActivePolicy(polId)}
          onSelectScore={() => setSelectedCategory('16_score_calculators')}
          weight={weight}
          setWeight={setWeight}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      );
    }

    if (selectedCategory === 'favourites') {
      return renderFavouritesTab();
    }

    if (selectedCategory === 'recently_viewed') {
      return renderRecentlyViewedTab();
    }

    if (selectedCategory === 'bara_icu_card') {
      return renderBaraIcuCardView();
    }

    if (selectedCategory === 'sa_edl_phc_guidelines') {
      return renderSaEdlPhcView();
    }

    if (selectedCategory === 'trials_guidelines') {
      return renderTrialsView();
    }

    if (selectedCategory === 'all') {
      return ORDER.filter(k => k !== 'home' && k !== 'favourites' && k !== 'recently_viewed' && k !== 'bara_icu_card' && k !== 'sa_edl_phc_guidelines' && k !== 'trials_guidelines' && k !== 'all').map(k => renderCategorySect(k));
    }

    return renderCategorySect(selectedCategory);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'theme-dark bg-[#0a1414] text-slate-100' : 'theme-light bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-md transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f2424] border-b border-[#1c3838]' : 'bg-[#0d3b3b] text-white border-b border-[#135050]'}`}>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-[#00d9b5] animate-pulse" />
          <h1 className="text-2xl font-extrabold font-sans tracking-tight">Asclep<span className="text-[#00d9b5]">ius</span></h1>
          <span className="ml-1 rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">CLINICAL REFERENCE</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            ref={aboutTriggerRef}
            onClick={() => setAboutOpen(true)}
            aria-label="About, clinical status, and sources"
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            title="About / Clinical Sources"
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setTheme(theme => theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            id="theme-tog"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 transition"
            title="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* SEARCH + WEIGHT CONFIG + SOURCE FILTER BAR (hidden on the Home landing page, which has its own) */}
      {!(selectedCategory === 'home' && !activeMindMap && !activePolicy) && (
      <div className={`sticky top-[3.5rem] z-40 p-3 shadow-md flex flex-wrap md:flex-nowrap gap-3 items-center border-b transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0f1f1f] border-teal-950/60' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 opacity-60" />
          <input 
            type="text" 
            id="s" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search drug, protocol, emergency condition..." 
            aria-label="Search clinical reference"
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-sm transition focus:outline-none ${
              theme === 'dark' 
                ? 'bg-black/30 border border-teal-950 text-slate-100 focus:border-teal-400' 
                : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-teal-600 focus:bg-white'
            }`}
          />
        </div>

        {/* SOURCE FILTER TOGGLE BAR */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-teal-950/40">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
              sourceFilter === 'all' ? 'bg-teal-500/30 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sources
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('bara_icu')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
              sourceFilter === 'bara_icu' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏥 Bara ICU
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('sa_edl_phc')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
              sourceFilter === 'sa_edl_phc' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇿🇦 SA EDL / PHC
          </button>
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
            aria-label="Patient weight in kilograms"
            className={`w-20 pl-2 pr-2 py-1.5 rounded-lg text-sm transition focus:outline-none ${
              theme === 'dark'
                ? 'bg-black/30 border border-teal-950 text-slate-100 focus:border-teal-400'
                : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-teal-600 focus:bg-white'
            }`}
          />
        </div>
      </div>
      )}

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
        Asclepius validation prototype · Clinical content rights remain with the respective source owners
      </footer>

      {/* TO TOP BUTTON */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 p-3 rounded-full bg-teal-400 hover:bg-teal-300 text-black shadow-lg transition-transform active:scale-95 z-50 cursor-pointer"
        >
          ↑
        </button>
      )}

      {/* ABOUT / CLINICAL REFERENCE MODAL */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="about-title">
          <div ref={aboutDialogRef} className="bg-slate-900 border border-teal-500/30 text-slate-100 rounded-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setAboutOpen(false)}
              aria-label="Close about dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 id="about-title" className="text-xl font-bold border-b border-teal-500/20 pb-2 mb-4 text-[#00d9b5]">Asclepius Reference App</h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <p>
                <strong>Asclepius</strong> is a specialized clinical reference database designed for rapid dosing, protocol exploration, and medical calculation in high-acuity environments (ICU and Emergency Department).
              </p>
              <p className="text-xs text-slate-400">
                <strong>Clinical status:</strong> Protocol transcription in review. HJH is largely adult-focused and refers paediatric users to RMMCH protocols.
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
