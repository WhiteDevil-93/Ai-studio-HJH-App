/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Search, Scale, ChevronDown, Check,
  AlertTriangle, Moon, Sun, BookOpen,
  Stethoscope, Activity, Heart, ShieldAlert,
  Sparkles, CheckSquare, Plus, RefreshCw, Clock, Home, Menu, X, Smartphone, Download, Settings,
  FlaskConical, Globe2, Building2, FileText
} from 'lucide-react';
import { PWAInstallPrompt, usePWAInstall } from './components/PWAInstallPrompt';
import {
  clinicalData,
} from './clinical/legacyAdapter';
import {
  INFUSION_DEFINITIONS,
  type InfusionDefinition,
} from './clinical/calculations/infusions';
import {InfusionCalculatorWidget} from './components/InfusionCalculatorWidgets';
import {
  ScoreCalculatorCard,
  ScoreList,
  scoreFavouriteKey,
  type ChecklistAnswers,
  type FormulaInputs,
  type GradedScoreAnswers,
  type News2Answers,
  type News2Scale,
} from './components/ScoreCalculatorCard';
import {
  DrugCard,
  getEntryKey,
  sourceGroupFallbackFromCategory,
} from './components/DrugCard';
import {EDProcedureCard} from './components/EDProcedureCard';
import {ClinicalEntryCard} from './components/ClinicalEntryCard';
import { resolveEntryAlias } from './clinical/entryAliases';
import type { CriterionAnswer } from './clinical/types';
import {
  TRIALS_REFERENCE,
  type TrialReferenceEntry,
} from './clinical/trialsReference';
import { HomePage } from './components/HomePage';
import { MindMapViewer, MIND_MAPS_DATABASE } from './components/MindMapViewer';
import { PolicyViewer, POLICIES_DATABASE } from './components/PolicyViewer';
import { CodeRedDrawer } from './components/CodeRedDrawer';
import { HospitalProtocolsPage } from './components/HospitalProtocolsPage';
import { ProtocolLandingPage } from './components/ProtocolLandingPage';
import { GlobalReferenceDocumentPage } from './components/GlobalReferenceDocumentPage';
import {
  GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
} from './clinical/globalReferenceDocuments';
import {
  HOSPITALS,
  HOSPITAL_PROTOCOLS_BY_FACILITY,
  type HospitalId,
  type HospitalProtocol,
} from './clinical/hospitalProtocols';
import type {GlobalCalculator} from './clinical/globalCalculators';
import {
  CATEGORIES,
  CATEGORY_FACILITY,
  CATEGORY_ICONS,
  FACILITY_CATEGORY,
  GLOBAL_REFERENCE_CATEGORY_IDS,
  GLOBAL_REFERENCE_COUNTS,
  NUMBERED_CATEGORY_IDS,
  ORDER,
  PILLAR_CATEGORY_IDS,
  POCKET_GUIDE_COUNT,
  SOURCE_GROUP_ORDER,
  TRIAL_TYPE_PRESENTATION,
  UTILITY_CATEGORY_IDS,
  parseHospitalHash,
  type SourceGroupFilter,
} from './app/catalog';

export {PROTOCOL_MINDMAP_LINKS} from './app/catalog';

const D = clinicalData as any;

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
  const { canInstall, triggerInstall } = usePWAInstall();
  const initialHospitalRoute = parseHospitalHash();

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('tr_theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  // Core Inputs & Navigation
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('tr_w') || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // A protocol page owns its own query: typing inside a protocol searches that
  // protocol and nothing else, and never re-filters the library behind it.
  const [protocolSearchQuery, setProtocolSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialHospitalRoute ? FACILITY_CATEGORY[initialHospitalRoute.facilityId] : 'home',
  );
  const [selectedFacility, setSelectedFacility] = useState<HospitalId | null>(
    initialHospitalRoute?.facilityId ?? null,
  );
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(
    initialHospitalRoute?.slug
      ? `${initialHospitalRoute.facilityId}:${initialHospitalRoute.slug}`
      : null,
  );
  const [activeMindMap, setActiveMindMap] = useState<string | null>(null);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [codeRedOpen, setCodeRedOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bara_icu' | 'edl_phc'>('all');
  const [policyFacilityFilter, setPolicyFacilityFilter] = useState<'hjh' | 'bara' | 'edl'>('hjh');

  // Favorites
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('tr_f') || '[]');
      if (!Array.isArray(parsed)) return [];
      const migrated = parsed
        .filter((value): value is string => typeof value === 'string')
        .map(resolveEntryAlias);
      // Two saved favourites can collapse onto the same canonical entry.
      return [...new Set(migrated)];
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
      const valid = parsed.filter((value): value is RecentlyViewedItem => {
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
      // Migrate deduplicated IDs, keeping the most recent view of each entry.
      const byKey = new Map<string, RecentlyViewedItem>();
      for (const item of valid) {
        const key = resolveEntryAlias(item.key);
        const existing = byKey.get(key);
        if (!existing || existing.timestamp < item.timestamp) byKey.set(key, {...item, key});
      }
      return [...byKey.values()].sort((left, right) => right.timestamp - left.timestamp);
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
  const [aboutTab, setAboutTab] = useState<'about' | 'disclaimer' | 'design' | 'privacy'>('about');
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);
  const aboutDialogRef = useRef<HTMLDivElement>(null);

  const navigateToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedFacility(null);
    setSelectedProtocolId(null);
    setActiveMindMap(null);
    setActivePolicy(null);
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/hospital/')) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const navigateToFacility = (facilityId: HospitalId) => {
    setSelectedFacility(facilityId);
    setSelectedProtocolId(null);
    setSelectedCategory(FACILITY_CATEGORY[facilityId]);
    setActiveMindMap(null);
    setActivePolicy(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#/hospital/${facilityId}`);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const navigateToProtocol = (protocol: HospitalProtocol) => {
    setSelectedFacility(protocol.facilityId);
    setSelectedProtocolId(protocol.id);
    setSelectedCategory(FACILITY_CATEGORY[protocol.facilityId]);
    setActiveMindMap(null);
    setActivePolicy(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        null,
        '',
        `#/hospital/${protocol.facilityId}/${encodeURIComponent(protocol.slug)}`,
      );
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  useEffect(() => {
    const syncFromLocation = () => {
      const route = parseHospitalHash();
      if (!route) {
        setSelectedFacility(null);
        setSelectedProtocolId(null);
        setSelectedCategory('home');
        setActiveMindMap(null);
        setActivePolicy(null);
        return;
      }
      setSelectedFacility(route.facilityId);
      setSelectedProtocolId(route.slug ? `${route.facilityId}:${route.slug}` : null);
      setSelectedCategory(FACILITY_CATEGORY[route.facilityId]);
      setActiveMindMap(null);
      setActivePolicy(null);
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  // Opening a protocol carries in whatever query led the reader to it, so a hit
  // found in the library stays highlighted on the page. From then on the query
  // is the protocol's own; closing the protocol drops it and the library search
  // behind it is untouched. Read through a ref so re-seeding happens on a
  // protocol change only, not on every keystroke in the library.
  const librarySearchQueryRef = useRef(searchQuery);
  useEffect(() => {
    librarySearchQueryRef.current = searchQuery;
  }, [searchQuery]);
  useEffect(() => {
    setProtocolSearchQuery(selectedProtocolId ? librarySearchQueryRef.current : '');
  }, [selectedProtocolId]);

  const activeProtocol = selectedFacility && selectedProtocolId
    ? HOSPITAL_PROTOCOLS_BY_FACILITY[selectedFacility].find(
        protocol => protocol.id === selectedProtocolId,
      )
    : undefined;

  /**
   * Formulas and score calculators are searchable from every scope, so opening
   * one has to work from inside a protocol too: leave the protocol, land on the
   * calculator's category and narrow it to the tool that was picked.
   */
  const navigateToCalculator = (calculator: GlobalCalculator) => {
    navigateToCategory(calculator.categoryId);
    setSearchQuery(calculator.name);
    if (typeof window !== 'undefined') {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  // Score Calculator states
  const [gcsState, setGcsState] = useState<Record<string, number>>({});
  const [nexusState, setNexusState] = useState<Record<string, boolean>>({});
  // Generic per-score checklist answers, keyed by the score's key (e.g.
  // 'alvarado', 'curb65', 'qsofa') - a new checklist-style score calculator
  // (components with points + interpretation bands) needs no new state or
  // wiring here, unlike the bespoke ones below (gcs, canadian_cspine,
  // burch_wartofsky) which have their own scoring model.
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistAnswers>({});
  // Generic per-score graded-option answers (selected point value per
  // component), keyed by score key - any score whose components are
  // multi-option (components: [{key, options: [{value, label}]}]) renders
  // via this generic mechanism automatically, same idea as checklistAnswers
  // above but for graded (not binary) criteria.
  const [gradedScoreAnswers, setGradedScoreAnswers] = useState<GradedScoreAnswers>({});
  // NEWS2 SpO2 scale: Scale 2 only when a clinician has designated an 88-92%
  // target (hypercapnic respiratory failure). Switching scales clears both
  // SpO2 answers so a selection never carries across scales. Answers are keyed
  // by option label because Scale 2 legitimately has distinct bands with equal
  // point values (e.g. "88-92" and ">= 93 on air" both score 0).
  const [news2Scale, setNews2Scale] = useState<News2Scale>('scale1');
  const [news2Answers, setNews2Answers] = useState<News2Answers>({});
  const [burchWartofskyState, setBurchWartofskyState] = useState<Record<string, number>>({});
  const [ccsState, setCcsState] = useState<Record<string, boolean>>({});
  const [ccsApplicable, setCcsApplicable] = useState<CriterionAnswer>('unanswered');
  const [ccsRotation, setCcsRotation] = useState<CriterionAnswer>('unanswered');
  const [tetanusState, setTetanusState] = useState<Record<string, number>>({}); // 0: doses, 1: wound
  const [formulaInputs, setFormulaInputs] = useState<FormulaInputs>({});
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

  const scoreCardSharedProps = {
    theme,
    formulaInputs,
    setFormulaInputs,
    checklistAnswers,
    setChecklistAnswers,
    gradedScoreAnswers,
    setGradedScoreAnswers,
    gcsState,
    setGcsState,
    nexusState,
    setNexusState,
    ccsState,
    setCcsState,
    ccsApplicable,
    setCcsApplicable,
    ccsRotation,
    setCcsRotation,
    burchWartofskyState,
    setBurchWartofskyState,
    news2Scale,
    setNews2Scale,
    news2Answers,
    setNews2Answers,
  };

  const renderScoreCalculator = (key: string, sc: any) => (
    <ScoreCalculatorCard
      key={key}
      scoreKey={key}
      entry={sc}
      {...scoreCardSharedProps}
      isFavourite={isFavourite(scoreFavouriteKey(key))}
      onToggleFavourite={event => toggleFavourite(scoreFavouriteKey(key), event)}
      onRecordRecentlyViewed={() => recordRecentlyViewed(key, sc.name, '16_score_calculators', 'calculator')}
    />
  );

  const renderScores = (scores: any) => (
    <ScoreList
      scores={scores}
      {...scoreCardSharedProps}
      isScoreFavourite={key => isFavourite(scoreFavouriteKey(key))}
      onToggleScoreFavourite={(key, event) => toggleFavourite(scoreFavouriteKey(key), event)}
      onRecordScoreRecentlyViewed={(key, name) => recordRecentlyViewed(key, name, '16_score_calculators', 'calculator')}
    />
  );

  const renderInfusionCalculatorWidget = (
    presetOrDefinition: string | InfusionDefinition,
  ) => (
    <InfusionCalculatorWidget
      presetOrDefinition={presetOrDefinition}
      weight={weight}
      infusionDoses={infusionDoses}
      setInfusionDoses={setInfusionDoses}
      infusionConfirmed={infusionConfirmed}
      setInfusionConfirmed={setInfusionConfirmed}
    />
  );

  const clinicalCardSharedProps = {
    theme,
    weight,
    sourceGroupFallback: sourceGroupFallbackFromCategory(selectedCategory),
    searchHighlight: searchQuery,
    isFavourite,
    onToggleFavourite: toggleFavourite,
    onRecordRecentlyViewed: recordRecentlyViewed,
    onSearchQuery: setSearchQuery,
    infusionDoses,
    setInfusionDoses,
    infusionConfirmed,
    setInfusionConfirmed,
  };

  const renderDrugCard = (it: any, cat: string) => (
    <DrugCard
      key={getEntryKey(it, cat)}
      item={it}
      category={cat}
      {...clinicalCardSharedProps}
    />
  );

  const renderEDProcedureCard = (p: any, cat: string) => {
    const key = getEntryKey(p, cat);
    return (
      <EDProcedureCard
        key={key}
        item={p}
        category={cat}
        {...clinicalCardSharedProps}
        isExpanded={expandedProtocols[key] === true}
        onToggleExpanded={toggleProtocol}
        checklistStatus={checklistStatus}
        onToggleChecklistItem={toggleChecklist}
        onOpenMindMap={setActiveMindMap}
      />
    );
  };

  const renderClinicalEntryCard = (entry: any, cat: string) => {
    const key = getEntryKey(entry, cat);
    return (
      <ClinicalEntryCard
        key={key}
        entry={entry}
        category={cat}
        {...clinicalCardSharedProps}
        isExpanded={expandedProtocols[key] === true}
        onToggleExpanded={toggleProtocol}
        checklistStatus={checklistStatus}
        onToggleChecklistItem={toggleChecklist}
        onOpenMindMap={setActiveMindMap}
      />
    );
  };

  // Re-usable component to render sub-headers of categories
  const renderCategorySect = (
    catKey: string,
    sourceGroupFilter?: SourceGroupFilter,
  ) => {
    const catData = D[catKey as keyof typeof D] as any;
    if (!catData) return null;

    // Effective per-item source-group filter for this render: an explicit
    // sourceGroupFilter param (used by the dedicated Helen/CMJAH/Bara/EDL
    // pillar views) takes priority; otherwise fall back to the generic
    // "Source Filter" toggle used while browsing categories directly. Score
    // calculators carry no _meta.sourceGroup, so they're matched by the Bara
    // pillar (their historical home) whenever that pillar is active.
    const activeSourceFilter: SourceGroupFilter =
      sourceGroupFilter ?? (sourceFilter === 'bara_icu' ? ['bara_icu', 'chbah'] : sourceFilter === 'edl_phc' ? ['edl_phc'] : undefined);
    if (
      activeSourceFilter &&
      catKey === '16_score_calculators' &&
      !(Array.isArray(activeSourceFilter) && activeSourceFilter.includes('bara_icu'))
    ) {
      return null;
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

    // Filter favorites, plus the per-item sourceGroup filter (used by the
    // Helen/CMJAH/Bara/EDL pillar views and the generic "Source Filter" toggle)
    const finalItems = matchedItems.filter(entry => {
      if (entry.sc) {
        // Score calculators have no _meta.sourceGroup - already gated above.
      } else if (activeSourceFilter) {
        const group = entry.item?._meta?.sourceGroup;
        const matches = Array.isArray(activeSourceFilter) ? activeSourceFilter.includes(group) : group === activeSourceFilter;
        if (!matches) return false;
      }
      if (selectedCategory === 'favourites') {
        const entryKey = entry.sc ? scoreFavouriteKey(entry.key) : getEntryKey(entry.item, catKey);
        return isFavourite(entryKey);
      }
      return true;
    });

    if (finalItems.length === 0 && (catKey !== '7_useful_formulae' || sourceGroupFilter)) return null;

    return (
      <div
        key={catKey}
        className={`rounded-xl border overflow-hidden mb-4 transition-all ${theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
      >
        <button
          type="button"
          onClick={() => toggleCategory(catKey)}
          aria-expanded={isExpanded}
          className={`flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer select-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${theme === 'dark' ? 'bg-[#1e293b]/90 hover:bg-[#334155]/60 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            } w-full text-left`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xl shrink-0">{CATEGORY_ICONS[catKey] || '📋'}</span>
            <h3 className={`font-extrabold text-sm uppercase tracking-wider truncate ${theme === 'dark' ? 'text-sky-400' : 'text-indigo-700'}`}>{catLabel}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
              theme === 'dark' ? 'bg-slate-800 text-sky-300 border-slate-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {finalItems.length + (catKey === '7_useful_formulae' ? Object.keys(INFUSION_DEFINITIONS).length : 0)}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Infusion Rate Calculators Section embedded in Useful Formulae */}
            {catKey === '7_useful_formulae' && (
              <div className={`mb-6 p-4 rounded-xl border space-y-4 ${
                theme === 'dark' ? 'border-indigo-900/50 bg-[#0e1935]' : 'border-indigo-200 bg-indigo-50/50'
              }`}>
                <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
                    <h3 className={`font-extrabold text-sm uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>⚡ Interactive Infusion Rate Calculators</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-800/40">
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
              // Group normal entries by subCategory, then sort each group by
              // source institution so duplicate topics across hospitals appear
              // together and clearly labelled.
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
                const sortedItems = [...subCatItems].sort((left, right) => {
                  const leftGroup = left?._meta?.sourceGroup || '';
                  const rightGroup = right?._meta?.sourceGroup || '';
                  const leftIndex = SOURCE_GROUP_ORDER.indexOf(leftGroup);
                  const rightIndex = SOURCE_GROUP_ORDER.indexOf(rightGroup);
                  if (leftIndex !== rightIndex) return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
                  const leftName = String(left.item || left.drug || left.condition_or_drug || '').toLowerCase();
                  const rightName = String(right.item || right.drug || right.condition_or_drug || '').toLowerCase();
                  return leftName.localeCompare(rightName);
                });

                return (
                  <div key={subCatName} className="space-y-2 border-l border-teal-950/20 pl-3">
                    <button
                      type="button"
                      onClick={() => setExpandedSubCategories(prev => ({ ...prev, [subCatKey]: !isSubCatExpanded }))}
                      aria-expanded={isSubCatExpanded}
                      className="w-full text-left text-xs font-bold text-teal-400 uppercase tracking-widest border-b border-teal-950/20 pb-1.5 mb-2 flex items-center justify-between cursor-pointer select-none hover:text-teal-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                    >
                      <span>{subCatName.replace(/_/g, ' ')}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isSubCatExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isSubCatExpanded && (
                      <div className="space-y-2">
                        {sortedItems.map(it => renderClinicalEntryCard(it, catKey))}
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
  // Categories to scan for the item-level pillar views below. Which items
  // actually appear is decided per-entry by _meta.sourceGroup (see
  // renderCategorySect), not by category membership - a category can (and
  // does) hold a mix of Bara/CHBAH/EDL/HJH-sourced entries side by side.
  const allContentCategoryIds = () => ORDER.filter(k =>
    ![
      'home',
      'favourites',
      'recently_viewed',
      'bara_icu_card',
      'helen_guidelines',
      'cmjah_guidelines',
      'rmmch_guidelines',
      'edl_phc_guidelines',
      ...GLOBAL_REFERENCE_CATEGORY_IDS,
      'mindmaps',
      'policies',
      'all',
    ].includes(k)
  );

  const renderBaraIcuCardView = () => {
    const matched = allContentCategoryIds()
      .map(k => renderCategorySect(k, ['bara_icu', 'chbah']))
      .filter(Boolean);

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
        {matched.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">No Bara ICU entries match your search.</div>
        ) : matched}
      </div>
    );
  };

  // Dedicated view for Helen Joseph Hospital (HJH) ED Guidelines
  const renderEdlPhcView = () => {
    const matched = allContentCategoryIds()
      .map(k => renderCategorySect(k, ['edl_phc']))
      .filter(Boolean);

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
        {matched.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">No EDL/PHC entries match your search.</div>
        ) : matched}
      </div>
    );
  };

  // Dedicated view for entries individually verified against the hjh-ed-2026-v1
  // source map (clinical-sources/source-map.json), wherever they live in the
  // category tree. Distinct from the EDL/PHC pillar above (which is included
  // by category, not by per-item match) — an entry can legitimately appear in
  // both if it's a categories-11-15 item that also happens to be source-mapped.
  const renderHelenGuidelinesView = () => {
    const matched = allContentCategoryIds()
      .map(k => renderCategorySect(k, 'hjth'))
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#0d1b3a] border border-indigo-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Verified Source Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>🩺 Helen Joseph Tertiary Hospital — Source-Verified Entries</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every entry here has a resolved page citation against the HJH document (clinical-sources/source-map.json), regardless of which category it's filed under. Some also appear under EDL/PHC or Bara ICU — that overlap is expected.
            </p>
          </div>
        </div>
        {matched.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">No source-verified entries match your search.</div>
        ) : matched}
      </div>
    );
  };

  // Dedicated view for entries transcribed from the CMJAH ED Protocols source
  // (clinical-sources/source-manifest.json id cmjah-ed-protocols-2020-v2),
  // wherever they live in the category tree. Same item-level model as Helen.
  const renderCmjahGuidelinesView = () => {
    const matched = allContentCategoryIds()
      .map(k => renderCategorySect(k, 'cmjah'))
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#2a0d3a] border border-violet-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-400">Verified Source Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>🏨 Charlotte Maxeke Johannesburg Academic Hospital — ED Protocols</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every entry here has a resolved page citation against the CMJAH ED Protocols document (Version 2, December 2020). 36 of the 74-protocol source have been digitized so far.
            </p>
          </div>
        </div>
        {matched.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">No CMJAH entries match your search.</div>
        ) : matched}
      </div>
    );
  };

  // Dedicated view for entries transcribed from the RMMCH EM Clinical Protocols
  // source (clinical-sources/source-manifest.json id rmmch-paediatric-protocols),
  // wherever they live in the category tree. Same item-level model as CMJAH.
  const renderRmmchGuidelinesView = () => {
    const matched = allContentCategoryIds()
      .map(k => renderCategorySect(k, 'rmmch'))
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#3a1a0d] border border-orange-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400">Paediatric Referral Pillar</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>👶 Rahima Moosa Mother &amp; Child Hospital — EM Clinical Protocols</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paediatric-focused emergency protocols transcribed from the RMMCH EM Clinical Protocols source (V5, January 2024). The source PDF's fingerprint hasn't been independently confirmed yet (see clinical-sources/source-manifest.json).
            </p>
          </div>
        </div>
        {matched.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">No RMMCH entries match your search.</div>
        ) : matched}
      </div>
    );
  };

  // Dedicated view for global landmark studies and decision rules.
  const renderLandmarkStudiesView = () => {
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
        (t.shift_action || '').toLowerCase().includes(q) ||
        (t.review_note || '').toLowerCase().includes(q)
      );
    });

    const byDomain = matched.reduce((acc, t) => {
      if (!acc[t.domain]) acc[t.domain] = [];
      acc[t.domain].push(t);
      return acc;
    }, {} as Record<string, TrialReferenceEntry[]>);

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
              <FlaskConical className="h-4 w-4" />
              Global evidence library
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Landmark Studies
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Searchable summaries of landmark trials, observational studies, and clinical
              decision rules, with direct links to available primary sources.
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300">
            {matched.length} studies
          </span>
          </div>
        </div>

        {matched.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-500">No landmark studies match your search.</div>
        )}

        {Object.entries(byDomain).map(([domain, entries]) => (
          <section
            key={domain}
            className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
              }`}
          >
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className="text-sm font-bold text-slate-200">{domain}</h3>
              <span className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {entries.length}
              </span>
            </div>
            <div className="space-y-2 p-3 sm:p-4">
              {entries.map(t => (
                <details
                  key={t.id}
                  className={`group rounded-xl border transition-colors ${theme === 'dark' ? 'border-slate-800 bg-slate-950/35 open:border-indigo-700/60' : 'border-slate-200 bg-white open:border-indigo-300'
                    }`}
                >
                  <summary className="cursor-pointer list-none p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold leading-snug text-slate-100">
                          {t.title}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                          {t.source_url ? (
                            <a
                              href={t.source_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={event => event.stopPropagation()}
                              className="font-medium text-indigo-300 underline decoration-indigo-700 underline-offset-2 hover:text-indigo-200"
                            >
                              {t.reference} · Primary source
                            </a>
                          ) : (
                            <span className="text-slate-500">{t.reference}</span>
                          )}
                          {t.evidence_status && (
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                              t.evidence_status === 'published'
                                ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                                : 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                            }`}>
                              {t.evidence_status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] font-semibold uppercase ${TRIAL_TYPE_PRESENTATION[t.type].className}`}
                        >
                          {TRIAL_TYPE_PRESENTATION[t.type].label}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400">{t.the_hook}</p>
                  </summary>

                  <div className="space-y-3 border-t border-slate-800 px-4 py-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Clinical relevance
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {t.if_consultant_asks}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Key result
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {t.killer_stat}
                      </p>
                    </div>
                    {t.shift_action && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Practice application
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {t.shift_action}
                        </p>
                      </div>
                    )}
                    {t.review_note && (
                      <div className="rounded-lg border border-amber-900/40 bg-amber-950/15 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                          Evidence note
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-amber-100">
                          {t.review_note}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  // Dedicated view for Mind Maps & Flowcharts gallery
  const renderMindMapsView = () => {
    const maps = Object.values(MIND_MAPS_DATABASE).filter(m =>
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#1f0f18] border border-rose-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Interactive Resuscitation Flowcharts</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>⚡ Emergency Mind Maps & Visual Algorithms</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step interactive decision pathways for cardiac arrest, trauma, anaphylaxis, RSI, seizures, STEMI, stroke, envenomation, and acute psychiatric emergencies.
            </p>
          </div>
          <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-800/30 flex-shrink-0">
            {maps.length} Algorithms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {maps.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMindMap(m.id)}
              className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#081212] border-teal-950/60 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-500'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/40">
                    {m.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">PDF p. {m.pdfPage}</span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-100">{m.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.subtitle}</p>
              </div>
              <div className="text-xs font-bold text-rose-400 flex items-center justify-end gap-1 pt-2 border-t border-rose-950/30">
                Launch Flowchart →
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Dedicated view for Hospital SOPs & Policies
  const renderPoliciesView = () => {
    const allFacilityPolicies = Object.values(POLICIES_DATABASE).filter(p => p.facility === policyFacilityFilter);
    const policies = allFacilityPolicies.filter(p =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(p.sections).toLowerCase().includes(searchQuery.toLowerCase())
    );
    const facilityTabs: { key: 'hjh' | 'bara' | 'edl'; label: string }[] = [
      { key: 'hjh', label: '🩺 Helen (HJH)' },
      { key: 'bara', label: '🏥 Bara ICU' },
      { key: 'edl', label: '🇿🇦 SA EDL / PHC' },
    ];

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#091f18] border border-emerald-900/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Hospital SOPs & Governance</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>📑 Hospital Administrative Policies & Clinical SOPs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Official hospital policies for triage discriminators, ambulance divert, ICU referrals, CT contrast consent, medicolegal J88 reports, death certification, and notifiable conditions.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800/30 flex-shrink-0">
            {policies.length} SOPs
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-teal-950/40 w-fit">
          {facilityTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPolicyFacilityFilter(tab.key)}
              className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${policyFacilityFilter === tab.key ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {policies.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-500">
            No {facilityTabs.find(t => t.key === policyFacilityFilter)?.label} SOPs yet — this umbrella is a placeholder until facility-specific policies are supplied.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {policies.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePolicy(p.id)}
              className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#081212] border-teal-950/60 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40">
                    {p.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">PDF p. {p.pdfPage}</span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-100">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {p.sections[0]?.items[0]?.slice(0, 110)}...
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 pt-2 border-t border-emerald-950/30">
                View Official SOP →
              </div>
            </button>
          ))}
        </div>
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
            type="button"
            onClick={() => {
              setRecentlyViewed([]);
              localStorage.removeItem('tr_rv');
            }}
            aria-label="Clear recently viewed history"
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-bold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded p-1 -m-1"
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
        {allContentCategoryIds().map(k => renderCategorySect(k))}
      </div>
    );
  };

  const renderHospitalProtocolsView = (facilityId: HospitalId) => {
    const backToLibrary = () => {
      setSelectedFacility(facilityId);
      setSelectedProtocolId(null);
      window.history.pushState(null, '', `#/hospital/${facilityId}`);
      window.scrollTo({top: 0, behavior: 'smooth'});
    };

    if (activeProtocol && activeProtocol.facilityId === facilityId) {
      return (
        <ProtocolLandingPage
          protocol={activeProtocol}
          onOpenProtocol={navigateToProtocol}
          weight={weight}
          setWeight={setWeight}
          searchQuery={protocolSearchQuery}
          onClearSearch={() => setProtocolSearchQuery('')}
          onSearchAllProtocols={() => {
            setSearchQuery(protocolSearchQuery);
            backToLibrary();
          }}
          onOpenCalculator={navigateToCalculator}
          onBack={backToLibrary}
        />
      );
    }

    return (
      <HospitalProtocolsPage
        facilityId={facilityId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onBack={() => navigateToCategory('home')}
        onOpenProtocol={navigateToProtocol}
        onOpenCalculator={navigateToCalculator}
        onOpenScores={() => navigateToCategory('16_score_calculators')}
        onOpenFormulae={() => navigateToCategory('7_useful_formulae')}
        onOpenLandmarkStudies={() => navigateToCategory('landmark_studies')}
        onOpenInternationalGuidelines={() => navigateToCategory('international_guidelines')}
        onOpenPocketGuides={() => navigateToCategory('pocket_guides')}
      />
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
          onSelectFacility={navigateToFacility}
          onSelectCategory={navigateToCategory}
          onSelectMindMap={(mapId) => setActiveMindMap(mapId)}
          onSelectPolicy={(polId) => setActivePolicy(polId)}
          onSelectScore={() => navigateToCategory('16_score_calculators')}
          onOpenCodeRed={() => setCodeRedOpen(true)}
          onOpenProtocol={navigateToProtocol}
          onOpenCalculator={navigateToCalculator}
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
      return renderHospitalProtocolsView('chbah');
    }

    if (selectedCategory === 'helen_guidelines') {
      return renderHospitalProtocolsView('hjh');
    }

    if (selectedCategory === 'cmjah_guidelines') {
      return renderHospitalProtocolsView('cmjah');
    }

    if (selectedCategory === 'rmmch_guidelines') {
      return renderHospitalProtocolsView('rmmch');
    }

    if (selectedCategory === 'edl_phc_guidelines') {
      return renderEdlPhcView();
    }

    if (selectedCategory === 'landmark_studies') {
      return renderLandmarkStudiesView();
    }

    if (selectedCategory === 'international_guidelines') {
      return (
        <GlobalReferenceDocumentPage
          documentId="guidelines"
          searchQuery={searchQuery}
        />
      );
    }

    if (selectedCategory === 'pocket_guides') {
      return (
        <GlobalReferenceDocumentPage
          documentId="pocket"
          searchQuery={searchQuery}
        />
      );
    }

    if (selectedCategory === 'mindmaps') {
      return renderMindMapsView();
    }

    if (selectedCategory === 'policies') {
      return renderPoliciesView();
    }

    if (selectedCategory === 'all') {
      return allContentCategoryIds().map(k => renderCategorySect(k));
    }

    // Single-category view: let users jump straight to another specialty
    // module without going back to Home first.
    const contentCategoryKeys = ORDER.filter(k => /^\d+_/.test(k));
    return (
      <>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
          {contentCategoryKeys.map(k => (
            <button
              key={k}
              onClick={() => navigateToCategory(k)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${k === selectedCategory
                  ? 'border-teal-400 bg-teal-500/10'
                  : theme === 'dark'
                    ? 'border-teal-950/60 bg-[#081212] hover:bg-[#0d2222]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
            >
              <span className="text-xl mb-1">{CATEGORY_ICONS[k] || '📋'}</span>
              <span className={`text-[10px] font-semibold leading-tight ${k === selectedCategory ? 'text-teal-300' : 'text-slate-400'}`}>
                {(CATEGORIES[k] || k).replace(/^[^\w]+\s*/, '')}
              </span>
            </button>
          ))}
        </div>
        {renderCategorySect(selectedCategory)}
      </>
    );
  };

  const activeFacilityId = CATEGORY_FACILITY[selectedCategory];
  const isGlobalReferenceCategory = GLOBAL_REFERENCE_CATEGORY_IDS.includes(
    selectedCategory as typeof GLOBAL_REFERENCE_CATEGORY_IDS[number],
  );

  // While a protocol is open the one search box drives that protocol's own
  // query, so a search started there cannot leak into any other view.
  const isProtocolScoped = Boolean(activeProtocol) && !activeMindMap && !activePolicy;
  const searchBarValue = isProtocolScoped ? protocolSearchQuery : searchQuery;
  const setSearchBarValue = isProtocolScoped ? setProtocolSearchQuery : setSearchQuery;

  // Keep each navigation family focused so hospital content never mixes and
  // global reference pages do not inherit unrelated clinical-source controls.
  const categoryBarOrder: string[] = PILLAR_CATEGORY_IDS.includes(
    selectedCategory as typeof PILLAR_CATEGORY_IDS[number],
  )
    ? ['home', selectedCategory, '16_score_calculators', ...GLOBAL_REFERENCE_CATEGORY_IDS]
    : isGlobalReferenceCategory
      ? ['home', ...GLOBAL_REFERENCE_CATEGORY_IDS]
      : NUMBERED_CATEGORY_IDS.includes(selectedCategory)
        ? ['home', ...NUMBERED_CATEGORY_IDS]
        : UTILITY_CATEGORY_IDS.includes(
          selectedCategory as typeof UTILITY_CATEGORY_IDS[number],
        )
          ? ['home', ...UTILITY_CATEGORY_IDS]
          : ORDER;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'theme-dark bg-[#0b1329] text-slate-100' : 'theme-light bg-slate-100 text-slate-900'}`}>

      {/* LEFT COLLAPSIBLE ACTIVITY PANEL / DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-[101] w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-100 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-indigo-400" />
                    <span className="font-extrabold text-lg tracking-tight text-white">Activity & Controls</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Resus Launch */}
                <button
                  type="button"
                  onClick={() => { setCodeRedOpen(true); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider shadow-lg animate-pulse transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5" />
                    <span>CODE RED RESUSCITATION</span>
                  </div>
                  <span>→</span>
                </button>

                {/* PWA Install App Button */}
                <button
                  type="button"
                  onClick={() => { triggerInstall(); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer border border-indigo-400/30"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-indigo-200" />
                    <span>INSTALL ASCLEPIUS PWA APP</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                {/* Patient Weight Config & Quick Presets */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Patient Weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      step="0.1"
                      min="0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">kg</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['10', '20', '50', '70', '90'].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeight(w)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                          weight === w ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-600'
                        }`}
                      >
                        {w}kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Filter Group */}
                {!activeFacilityId && <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Source Filter</label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSourceFilter('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        sourceFilter === 'all' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🌐 All Clinical Sources</span>
                      {sourceFilter === 'all' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceFilter('bara_icu')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        sourceFilter === 'bara_icu' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🏥 Bara ICU Dosing Card</span>
                      {sourceFilter === 'bara_icu' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceFilter('edl_phc')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        sourceFilter === 'edl_phc' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🇿🇦 SA EDL / PHC Guidelines</span>
                      {sourceFilter === 'edl_phc' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  </div>
                </div>}

                {/* Primary Pillars & Shortcuts */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Pillars</label>
                  <div className="space-y-1">
                    {[
                      { id: 'home', label: '🏠 Home Landing Page' },
                      { id: 'mindmaps', label: '⚡ Resuscitation Mind Maps' },
                      { id: 'policies', label: '📑 Hospital SOPs & Policies' },
                      { id: 'bara_icu_card', label: '🏥 Bara ICU Dosing Reference' },
                      { id: 'helen_guidelines', label: '🩺 Helen Joseph ED Guidelines' },
                      { id: 'cmjah_guidelines', label: '🏨 CMJAH ED Protocols' },
                      { id: 'rmmch_guidelines', label: '👶 RMMCH Paediatric Protocols' },
                      { id: 'edl_phc_guidelines', label: '🇿🇦 SA EDL / PHC Protocols' },
                      { id: 'landmark_studies', label: `🔬 ${TRIALS_REFERENCE.length} Landmark Studies` },
                      {
                        id: 'international_guidelines',
                        label: `🌐 ${SUPPLIED_GUIDELINE_LINK_AUDIT.guidelineCount} International Guidelines`,
                      },
                      { id: 'pocket_guides', label: `📘 ${POCKET_GUIDE_COUNT} Pocket Guides` },
                      { id: 'favourites', label: `⭐ Favourites (${favourites.length})` },
                      { id: 'recently_viewed', label: `⏱️ Recently Viewed (${recentlyViewed.length})` },
                      { id: 'all', label: '📋 All Categories' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const facilityId = CATEGORY_FACILITY[item.id];
                          if (facilityId) {
                            navigateToFacility(facilityId);
                          } else {
                            navigateToCategory(item.id);
                          }
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                          selectedCategory === item.id && !activeMindMap && !activePolicy
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                <p>Asclepius Clinical Reference • Version 2026</p>
                <p className="mt-0.5">Helen Joseph & CHBAH ICU Datasets</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* UNCLUTTERED TOP HEADER */}
      <header className={`sticky top-0 z-50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-md transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md' : 'bg-slate-900 text-white border-b border-slate-800'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Activity Panel"
            className="p-2.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[2.75rem] min-w-[2.75rem] sm:min-h-0 sm:min-w-0"
            title="Open Activity & Navigation Panel"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToCategory('home')}
            aria-label="Go to Home"
            className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          >
            <Activity className="h-6 w-6 text-indigo-400 animate-pulse shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white truncate">Asclep<span className="text-indigo-400">ius</span></h1>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCodeRedOpen(true)}
            aria-label="Code Red Resuscitation Mode"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-[10px] sm:text-xs tracking-wider shadow-lg animate-pulse cursor-pointer border border-red-400/50 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 min-h-[2.5rem]"
            title="Code Red Emergency Resuscitation Cards"
          >
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="font-extrabold tracking-widest hidden sm:inline">CODE RED</span>
          </button>

          <button
            ref={aboutTriggerRef}
            onClick={() => {
              setAboutTab('about');
              setAboutOpen(true);
            }}
            aria-label="Open settings and clinical information"
            className="p-2.5 sm:p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[2.75rem] min-w-[2.75rem] sm:min-h-0 sm:min-w-0"
            title="Settings & Clinical Information"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={() => setTheme(theme => theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            id="theme-tog"
            className="p-2.5 sm:p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[2.75rem] min-w-[2.75rem] sm:min-h-0 sm:min-w-0"
            title="Toggle Theme"
          >
            {theme === 'light'
              ? <Moon className="h-4 w-4 text-slate-300" />
              : <Sun className="h-4 w-4 text-amber-300" />}
          </button>
        </div>
      </header>

      {/* STREAMLINED SEARCH BAR (hidden on Home landing page) */}
      {!(selectedCategory === 'home' && !activeMindMap && !activePolicy) && (
        <div className={`sticky top-[3rem] sm:top-[3.5rem] z-40 p-2.5 sm:p-3 shadow-md border-b transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-200/80 border-slate-300'
        }`}>
          <div className={`${isGlobalReferenceCategory ? 'max-w-5xl' : 'max-w-7xl'} mx-auto flex items-center gap-2 sm:gap-3`}>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 opacity-70" />
              <input
                type="text"
                id="s"
                value={searchBarValue}
                onChange={e => setSearchBarValue(e.target.value)}
                placeholder={
                  isProtocolScoped
                    ? `Search within ${activeProtocol!.title}...`
                    : isGlobalReferenceCategory
                      ? `Search ${CATEGORIES[selectedCategory].toLowerCase()}...`
                      : 'Search drug, protocol, emergency condition, score...'
                }
                aria-label={
                  isProtocolScoped
                    ? `Search within ${activeProtocol!.title}`
                    : 'Search clinical reference'
                }
                className={`w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-xl text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-900/90 border border-slate-700/70 text-slate-100 focus:border-indigo-400'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            {isProtocolScoped ? (
              <span
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 sm:py-2 text-xs font-bold text-amber-300 min-h-[2.75rem]"
                title={`Search is limited to ${activeProtocol!.title}. Formulas and scores are still searched globally.`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">This protocol only</span>
                <span className="sm:hidden">Scoped</span>
              </span>
            ) : !isGlobalReferenceCategory && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open source filter"
                className="text-xs font-bold px-3 py-2.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/60 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[2.75rem]"
              >
                <span className="hidden sm:inline">
                  {activeFacilityId
                    ? `${HOSPITALS[activeFacilityId].shortName} only`
                    : sourceFilter === 'all'
                      ? 'All Sources'
                      : sourceFilter === 'bara_icu'
                        ? 'Bara ICU'
                        : 'SA EDL'}
                </span>
                <span className="sm:hidden">Filter</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY BAR (PILLS) — hidden on Home landing page */}
      {!(selectedCategory === 'home' && !activeMindMap && !activePolicy) && (
        <div className={`sticky top-[6.5rem] sm:top-[7rem] z-30 flex gap-2 overflow-x-auto whitespace-nowrap border-b transition-colors duration-300 no-scrollbar py-2 px-3 sm:p-3 ${
          isGlobalReferenceCategory ? 'justify-start sm:justify-center' : ''
        } ${
          theme === 'dark' ? 'bg-slate-900/90 border-slate-800/80' : 'bg-slate-100 border-slate-200'
        }`}
          role="navigation"
          aria-label="Clinical categories"
        >
          {categoryBarOrder.map(k => {
            const label = CATEGORIES[k] || k;
            const isSelected = selectedCategory === k;
            const favsCount = favourites.length;
            const globalCount = GLOBAL_REFERENCE_COUNTS[k];
            return (
              <button
                key={k}
                onClick={() => {
                  const facilityId = CATEGORY_FACILITY[k];
                  if (facilityId) {
                    navigateToFacility(facilityId);
                  } else {
                    navigateToCategory(k);
                  }
                }}
                aria-current={isSelected ? 'page' : undefined}
                aria-label={label}
                className={`flex-shrink-0 text-xs font-semibold transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[2.25rem] ${
                  isGlobalReferenceCategory ? 'rounded-lg border px-3 py-2' : 'rounded-full px-3.5 py-1.5'
                } ${
                  isSelected
                    ? isGlobalReferenceCategory
                      ? 'border-indigo-500/70 bg-indigo-500/15 text-indigo-200'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : theme === 'dark'
                      ? 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isGlobalReferenceCategory ? (
                  <>
                    {k === 'home' && <Home className="mr-1.5 inline h-3.5 w-3.5" />}
                    {k === 'landmark_studies' && <FlaskConical className="mr-1.5 inline h-3.5 w-3.5" />}
                    {k === 'international_guidelines' && <Globe2 className="mr-1.5 inline h-3.5 w-3.5" />}
                    {k === 'pocket_guides' && <BookOpen className="mr-1.5 inline h-3.5 w-3.5" />}
                  </>
                ) : (
                  <span className="mr-1">{CATEGORY_ICONS[k] || '📋'}</span>
                )}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{(CATEGORIES[k] || k).split(' ')[0]}</span>
                {globalCount !== undefined && (
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[9px] ${
                    isSelected ? 'bg-indigo-400/20 text-indigo-100' : 'bg-black/20 text-slate-400'
                  }`}>
                    {globalCount}
                  </span>
                )}
                {k === 'favourites' && favsCount > 0 && (
                  <span className="ml-1.5 bg-black/20 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {favsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className={`${isGlobalReferenceCategory ? 'max-w-5xl' : 'max-w-7xl'} mx-auto p-3 sm:p-4 pb-20`}>
        {/* Toggle Controls for All Containers (NOT shown on Home landing page) */}
        {selectedCategory !== 'home' && selectedCategory !== 'favourites' && selectedCategory !== 'recently_viewed' && !GLOBAL_REFERENCE_CATEGORY_IDS.includes(selectedCategory as typeof GLOBAL_REFERENCE_CATEGORY_IDS[number]) && !CATEGORY_FACILITY[selectedCategory] && !activeMindMap && !activePolicy && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={expandAllContainers}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 hover:bg-indigo-900/30'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-100/50'
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
            // Keyed on the view, not the query: re-running the enter animation
            // on every keystroke is what made typing a search feel like a flash
            // of blank page between results.
            key={selectedCategory + '-' + (selectedProtocolId ?? '')}
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
        Asclepius Clinical Reference · For healthcare professional use · Source rights remain with their respective owners
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

      {/* SETTINGS / CLINICAL INFORMATION MODAL */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div ref={aboutDialogRef} className="bg-slate-900 border border-teal-500/30 text-slate-100 rounded-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setAboutOpen(false)}
              aria-label="Close settings"
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 id="settings-title" className="text-xl font-bold text-[#00d9b5]">
              Settings & Clinical Information
            </h2>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-700 pb-4" role="tablist" aria-label="Settings sections">
              {[
                {id: 'about' as const, label: 'About & Sources', icon: Building2},
                {id: 'disclaimer' as const, label: 'Disclaimer', icon: AlertTriangle},
                {id: 'design' as const, label: 'Design & UX', icon: Sparkles},
                {id: 'privacy' as const, label: 'Privacy & Data', icon: ShieldAlert},
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={aboutTab === tab.id}
                    onClick={() => setAboutTab(tab.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      aboutTab === tab.id
                        ? 'border-teal-400 bg-teal-500/15 text-teal-200'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TabIcon className="inline h-3.5 w-3.5 mr-1.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {aboutTab === 'about' && (
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300" role="tabpanel">
                <p>
                  <strong>Asclepius</strong> is a clinical reference platform for rapid protocol
                  navigation, medication dosing, medical calculations, and evidence access in
                  emergency and critical-care environments.
                </p>
                <p className="text-xs text-slate-400">
                  Facility protocol libraries are kept separate by source institution. Global
                  calculators, trials, and international guidelines are available across all
                  facilities.
                </p>
                <div>
                  <h3 className="font-bold text-white mb-1 font-sans">🏥 Primary data sources</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Helen Joseph Hospital Emergency Department Clinical Guidelines 2026</strong>.</li>
                    <li><strong>Charlotte Maxeke Johannesburg Academic Hospital ED Protocols</strong> (Version 2, December 2020).</li>
                    <li><strong>Rahima Moosa Mother & Child Hospital EM Clinical Protocols</strong> (Version 5, January 2024).</li>
                    <li><strong>Chris Hani Baragwanath Academic Hospital ICU Dosing Card</strong> (2024 updates).</li>
                  </ul>
                </div>
              </div>
            )}

            {aboutTab === 'disclaimer' && (
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300" role="tabpanel">
                <section className="rounded-xl border border-rose-900/50 bg-rose-950/15 p-4">
                  <h3 className="font-black uppercase tracking-wider text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Clinical decision-support disclaimer
                  </h3>
                  <p className="mt-2 text-slate-300">
                    Asclepius is intended for qualified healthcare professionals as a clinical
                    memory aid and decision-support reference only. It does not replace clinical
                    judgement, specialist consultation, or institutional protocols. Always
                    verify doses, drug preparations, allergies, renal/hepatic adjustments, and
                    patient-specific contraindications before administration.
                  </p>
                </section>

                <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <h3 className="font-black uppercase tracking-wider text-slate-100">Facility and global content</h3>
                  <p className="mt-2">
                    Hospital tabs contain only that facility&apos;s published protocol collection.
                    Scores, calculators, trials, pocket references, and international guidelines
                    are global resources and do not represent facility-specific approval unless
                    explicitly stated.
                  </p>
                </section>

                <section className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-4">
                  <h3 className="font-black uppercase tracking-wider text-amber-200">Reference integrity & provenance</h3>
                  <p className="mt-2 text-slate-300">
                    Reference summaries retain their source citations and are supplemented with
                    current-source notes where a newer or primary publication changes the supplied
                    interpretation.
                  </p>
                  <div className="mt-3 space-y-3">
                    {Object.values(GLOBAL_REFERENCE_DOCUMENTS).map(reference => (
                      <details key={reference.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                        <summary className="cursor-pointer font-bold text-slate-100">
                          {reference.label} · governance notes
                        </summary>
                        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-slate-400">
                          {reference.auditNotes.map(note => <li key={note}>{note}</li>)}
                        </ul>
                        <p className="mt-2 text-[10px] text-slate-500">
                          {reference.citationMarkerCount} citation markers · {reference.uniqueCitationMarkerCount} unique markers
                        </p>
                      </details>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Link-quality review: {SUPPLIED_GUIDELINE_LINK_AUDIT.recordsWithDuplicatedUrlCount} of {SUPPLIED_GUIDELINE_LINK_AUDIT.guidelineCount} directory records contain a duplicated outbound URL. Confirm the current publication on the named organization&apos;s official website.
                  </p>
                </section>
              </div>
            )}

            {aboutTab === 'design' && (
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300" role="tabpanel">
                <section className="rounded-xl border border-indigo-900/50 bg-indigo-950/15 p-4">
                  <h3 className="font-black uppercase tracking-wider text-indigo-200">Design principles</h3>
                  <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-300">
                    <li><strong>Calm authority:</strong> Deep slate and indigo reduce visual fatigue during long shifts.</li>
                    <li><strong>Source-first colour coding:</strong> Every protocol and drug card is badged by originating facility so users instantly know whose guideline they are reading.</li>
                    <li><strong>Semantic status colours:</strong> Emerald for safe/pass, amber for caution, rose for critical alerts.</li>
                    <li><strong>Readable typography:</strong> A strict type scale keeps dosing numbers, warnings, and prose distinct.</li>
                    <li><strong>Touch-friendly targets:</strong> Buttons and inputs meet or exceed 44 × 44 px for gloved or fatigued use.</li>
                    <li><strong>Progressive disclosure:</strong> Cards expand, categories collapse, and source transcription is shown only when needed.</li>
                  </ul>
                </section>

                <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <h3 className="font-black uppercase tracking-wider text-slate-100">Accessibility</h3>
                  <p className="mt-2">
                    The interface supports keyboard navigation, focus-visible rings, screen-reader
                    labels, and reduced-motion preferences. Contrast ratios aim for WCAG 2.1 AA
                    across all interactive and clinical text.
                  </p>
                </section>
              </div>
            )}

            {aboutTab === 'privacy' && (
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300" role="tabpanel">
                <section className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-4">
                  <h3 className="font-black uppercase tracking-wider text-emerald-200">Local-first data</h3>
                  <p className="mt-2 text-slate-300">
                    Favourites, recently viewed items, theme preference, and patient weight are
                    stored only in your browser&apos;s localStorage. No patient-identifiable
                    information, searches, or usage data is transmitted to any server.
                  </p>
                </section>

                <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <h3 className="font-black uppercase tracking-wider text-slate-100">Offline use</h3>
                  <p className="mt-2">
                    Once installed as a PWA, the full reference works offline. External links to
                    guidelines or studies require an internet connection.
                  </p>
                </section>
              </div>
            )}

            <button
              onClick={() => setAboutOpen(false)}
              className="mt-6 w-full py-2 bg-teal-400 hover:bg-teal-300 text-black font-bold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Code Red Resuscitation Drawer */}
      <CodeRedDrawer
        isOpen={codeRedOpen}
        onClose={() => setCodeRedOpen(false)}
        onSelectMindMap={(id) => {
          setActiveMindMap(id);
          setActivePolicy(null);
        }}
      />

      {/* PWA Installation Prompt Banner & Modal */}
      <PWAInstallPrompt />
    </div>
  );
}
