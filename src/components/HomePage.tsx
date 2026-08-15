import React, {useMemo, useState} from 'react';
import {
  Building2, Stethoscope, ShieldAlert, FileText, Activity, Heart,
  Calculator, Syringe, Flame, Compass, ChevronRight, Search,
  Award, AlertTriangle, Users, MapPin, Layers, Baby, Brain, FlaskConical,
  Star, Clock, BookOpen, Globe2, ChevronDown, X
} from 'lucide-react';
import {
  HOSPITALS,
  HOSPITAL_PROTOCOLS,
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY,
  hospitalProtocolCount,
  type HospitalId,
  type HospitalProtocol,
} from '../clinical/hospitalProtocols';
import {
  PARSED_GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
} from '../clinical/globalReferenceDocuments';
import {TRIALS_REFERENCE} from '../clinical/trialsReference';
import {rankProtocolSearch} from '../clinical/protocolSearch';
import {GlobalCalculatorResults} from './GlobalCalculatorResults';
import type {GlobalCalculator} from '../clinical/globalCalculators';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

interface HomePageProps {
  onSelectFacility: (facilityId: HospitalId) => void;
  onSelectCategory: (catId: string) => void;
  onSelectMindMap: (mindMapId: string) => void;
  onSelectPolicy: (policyId: string) => void;
  onSelectScore: (scoreId: string) => void;
  onOpenCodeRed?: () => void;
  onOpenProtocol?: (protocol: HospitalProtocol) => void;
  onOpenCalculator?: (calculator: GlobalCalculator) => void;
  weight: string;
  setWeight: (w: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ALL_VISIBLE_PROTOCOLS: readonly HospitalProtocol[] = (
  ['hjh', 'rmmch', 'cmjah', 'chbah'] as const
).flatMap(facilityId => HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY[facilityId]);

interface FacilityCard {
  id: HospitalId;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  color: string;
  badge: string;
  badgeVariant: 'facility-hjh' | 'facility-rmmch' | 'facility-cmjah' | 'facility-chbah';
  protocolCount: number;
  icon: React.ComponentType<{className?: string}>;
  available: boolean;
}

export const FACILITIES: FacilityCard[] = [
  {
    id: 'hjh',
    name: 'Helen Joseph Hospital',
    shortName: 'HJH',
    subtitle: 'Primary ED Guidelines 2026',
    description: 'ED protocol algorithms straight from the HJH document: ACS, stroke, sepsis, trauma, toxicology, and ED procedures.',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    badge: 'Main Facility',
    badgeVariant: 'facility-hjh',
    protocolCount: hospitalProtocolCount('hjh'),
    icon: Building2,
    available: true
  },
  {
    id: 'rmmch',
    name: 'Rahima Moosa Mother & Child',
    shortName: 'RMMCH',
    subtitle: 'EM Clinical Protocols, V5 (2024)',
    description: 'Paediatric and maternal emergency protocols from the complete supplied RMMCH schema: resuscitation, airway, and trauma.',
    color: 'border-pink-500/40 bg-pink-500/10 text-pink-400',
    badge: 'Paediatric Referral',
    badgeVariant: 'facility-rmmch',
    protocolCount: hospitalProtocolCount('rmmch'),
    icon: Heart,
    available: true
  },
  {
    id: 'cmjah',
    name: 'Charlotte Maxeke Academic Hospital',
    shortName: 'CMJAH',
    subtitle: 'ED Protocols, V2 (2020)',
    description: 'Complete CMJAH protocol schema: resuscitation, toxicology, medical emergencies, procedures, triage, and critical care.',
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    badge: 'Tertiary Referral',
    badgeVariant: 'facility-cmjah',
    protocolCount: hospitalProtocolCount('cmjah'),
    icon: Award,
    available: true
  },
  {
    id: 'chbah',
    name: 'Chris Hani Baragwanath Hospital',
    shortName: 'CHBAH',
    subtitle: 'ICU Dosing Card (2024)',
    description: 'CHBAH ICU schema: adult and paediatric dosing, infusions, antimicrobial regimens, and electrolyte replacement.',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    badge: 'Regional Referral',
    badgeVariant: 'facility-chbah',
    protocolCount: hospitalProtocolCount('chbah'),
    icon: Flame,
    available: true
  }
];

export const QUICK_RESUS_ALGORITHMS = [
  { id: 'aha_bls_acls', title: 'Adult Cardiac Arrest (ACLS 2020)', category: 'Resuscitation', icon: Activity, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'trauma_arrest', title: 'Trauma Cardiac Arrest (H-O-T-T)', category: 'Trauma', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'acs_stemi_flowchart', title: 'ACS & STEMI / OMI Algorithm', category: 'Cardiology', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'stroke_thrombolysis', title: 'Acute Stroke & Thrombolysis', category: 'Neurovascular', icon: Brain, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'epistaxis_flowchart', title: 'Epistaxis Management & Packing', category: 'ENT', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'croup_algorithm', title: 'Westley Croup Score & Treatment', category: 'Paediatrics / ENT', icon: Baby, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'jaundice_flowchart', title: 'Jaundice Diagnostic Flowchart', category: 'Gastroenterology', icon: Stethoscope, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { id: 'dka_hhs_flowchart', title: 'Hyperglycaemia & DKA / HHS', category: 'Metabolic', icon: Syringe, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'psychosis_flowchart', title: 'Acute Psychosis / Mania Flowchart', category: 'Psychiatry', icon: AlertTriangle, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'snakebite_pathway', title: 'Snakebite Envenomation Pathway', category: 'Toxicology', icon: ShieldAlert, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'scorpion_sting', title: 'Scorpion Sting Envenomation', category: 'Toxicology', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'organ_donation', title: 'Organ & Tissue Donation Protocol', category: 'ICU / Governance', icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' }
];

export const POPULAR_HOSPITAL_SOPS = [
  { id: 'triage_sop', title: 'Triage SOP & SATS TEWS Discriminators', icon: Layers },
  { id: 'ambulance_divert', title: 'Ambulance Divert Protocol', icon: ShieldAlert },
  { id: 'ambulance_handover', title: 'Ambulance Handover Policy', icon: Users },
  { id: 'icu_referral', title: 'ICU Consult & Referral Policy', icon: Building2 },
  { id: 'internal_medicine_admissions', title: 'Internal Medicine Admissions Pathway', icon: Building2 },
  { id: 'stat_lab_use', title: 'Stat Lab Use Policy', icon: FlaskConical },
  { id: 'ct_contrast', title: 'CT Contrast Protocol & Consent', icon: FileText },
  { id: 'j88_guidelines', title: 'J88 Medicolegal Report Guide', icon: Award },
  { id: 'death_certification', title: 'Death Certification (BI 1663 / D28)', icon: FileText },
  { id: 'notifiable_conditions', title: 'Notifiable Conditions & ICD-10 List', icon: AlertTriangle },
  { id: 'suburb_directory', title: 'HJH Drainage Suburbs Directory', icon: MapPin }
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectFacility,
  onSelectCategory,
  onSelectMindMap,
  onSelectPolicy,
  onSelectScore,
  onOpenCodeRed,
  onOpenProtocol,
  onOpenCalculator,
  weight,
  setWeight,
  searchQuery,
  setSearchQuery
}) => {
  const trimmedQuery = searchQuery.trim();
  const [mentionsExpanded, setMentionsExpanded] = useState(false);

  const {namedResults, mentionResults} = useMemo(() => {
    const ranked = rankProtocolSearch(ALL_VISIBLE_PROTOCOLS, trimmedQuery);
    return {
      namedResults: ranked.filter(result => result.kind !== 'body'),
      mentionResults: ranked.filter(result => result.kind === 'body'),
    };
  }, [trimmedQuery]);

  const promoteMentions = namedResults.length === 0;
  const visibleResults = promoteMentions ? mentionResults : namedResults;
  const MAX_HOME_RESULTS = 12;
  const cappedResults = visibleResults.slice(0, MAX_HOME_RESULTS);
  const overflowCount = visibleResults.length - cappedResults.length;

  const resultBadge = (protocol: HospitalProtocol) => {
    const hospital = HOSPITALS[protocol.facilityId];
    return (
      <Badge variant={`facility-${protocol.facilityId}` as any} size="sm">
        {hospital.shortName}
      </Badge>
    );
  };

  const openResult = (protocol: HospitalProtocol) => {
    if (onOpenProtocol) {
      onOpenProtocol(protocol);
    } else {
      onSelectFacility(protocol.facilityId);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* COMPACT DESKTOP WORKSPACE HERO */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                Clinical Reference Platform
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Multi-Facility Edition 2026</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Emergency Department &amp; Critical Care Reference
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Authoritative clinical protocols, interactive resuscitation algorithms, weight-based dose calculations, and facility SOPs.
            </p>
          </div>

          {/* Controls: Weight & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <div className="w-full sm:w-36">
              <Input
                size="sm"
                type="number"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                icon={<Syringe className="w-3.5 h-3.5" />}
                aria-label="Patient weight in kilograms"
              />
            </div>
            <div className="w-full sm:w-64">
              <Input
                size="sm"
                type="text"
                placeholder="Search protocols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-3.5 h-3.5" />}
                aria-label="Search protocols and guidelines"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LIVE SEARCH RESULTS */}
      {trimmedQuery && (
        <section aria-label="Search results" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              Results for “{trimmedQuery}”
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {visibleResults.length} protocol{visibleResults.length === 1 ? '' : 's'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {onOpenCalculator && (
            <GlobalCalculatorResults
              query={trimmedQuery}
              onOpen={onOpenCalculator}
              scopeLabel="all facilities"
            />
          )}

          {cappedResults.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cappedResults.map((result) => {
                const protocol = result.protocol;
                return (
                  <button
                    key={protocol.id}
                    type="button"
                    onClick={() => openResult(protocol)}
                    aria-label={`Open ${protocol.title}`}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-left transition-desktop flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                          {protocol.title}
                        </h3>
                        {resultBadge(protocol)}
                      </div>
                      <p className="line-clamp-2 text-[11px] text-slate-400 leading-relaxed">
                        {protocol.summary}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center text-[10px] font-medium text-indigo-400 gap-1">
                      <span>Open Protocol</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 py-8 text-center">
              <AlertTriangle className="mx-auto h-4 w-4 text-slate-500" />
              <p className="mt-2 text-xs font-medium text-slate-400">
                No protocols match “{trimmedQuery}” in any facility library.
              </p>
            </div>
          )}

          {overflowCount > 0 && (
            <p className="text-xs text-slate-500">
              …and {overflowCount} more. Open a facility library below to browse all matches.
            </p>
          )}

          {!promoteMentions && mentionResults.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <button
                type="button"
                onClick={() => setMentionsExpanded(expanded => !expanded)}
                aria-expanded={mentionsExpanded}
                className="flex w-full items-center justify-between gap-2 text-left cursor-pointer focus-visible:outline-none"
              >
                <div>
                  <span className="block text-xs font-semibold text-slate-300">
                    Mentioned in {mentionResults.length} other protocol{mentionResults.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Terms appear in text, not protocol title.
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${mentionsExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {mentionsExpanded && (
                <ul className="mt-2 space-y-1">
                  {mentionResults.map((result) => (
                    <li key={result.protocol.id}>
                      <button
                        type="button"
                        onClick={() => openResult(result.protocol)}
                        className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800/80 transition-desktop"
                      >
                        <span className="truncate">{result.protocol.title}</span>
                        {resultBadge(result.protocol)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* QUICK WORKSPACE SHORTCUTS */}
      <div className="flex flex-wrap items-center gap-1.5">
        {onOpenCodeRed && (
          <Button
            size="sm"
            variant="danger"
            onClick={onOpenCodeRed}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            Code Red
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('7_useful_formulae')}
          icon={<Syringe className="w-3.5 h-3.5 text-teal-400" />}
        >
          Dosing &amp; Infusion Calculators
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('favourites')}
          icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
        >
          Favourites
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('recently_viewed')}
          icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
        >
          Recent
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('landmark_studies')}
          icon={<FlaskConical className="w-3.5 h-3.5 text-purple-400" />}
        >
          {TRIALS_REFERENCE.length} Studies
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('international_guidelines')}
          icon={<Globe2 className="w-3.5 h-3.5 text-sky-400" />}
        >
          {SUPPLIED_GUIDELINE_LINK_AUDIT.guidelineCount} Guidelines
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelectCategory('pocket_guides')}
          icon={<BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
        >
          {PARSED_GLOBAL_REFERENCE_DOCUMENTS.pocket.entries.length} Pocket Guides
        </Button>
      </div>

      {/* FACILITY SELECTOR GRID */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Select Hospital / Facility Library
            </h2>
            <p className="text-[11px] text-slate-400">
              Protocols are isolated by facility to ensure canonical guideline fidelity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FACILITIES.map((facility) => {
            const Icon = facility.icon;
            return (
              <button
                key={facility.id}
                type="button"
                onClick={facility.available ? () => onSelectFacility(facility.id) : undefined}
                disabled={!facility.available}
                aria-label={`Open ${facility.name} protocols`}
                className={`group p-3.5 rounded-lg border text-left transition-desktop flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  facility.available
                    ? 'border-slate-800 bg-slate-900/90 hover:bg-slate-850 hover:border-slate-700 cursor-pointer shadow-xs'
                    : 'border-slate-800/40 bg-slate-900/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2 rounded-md border ${facility.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={facility.badgeVariant} size="sm">
                      {facility.shortName}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">{facility.subtitle}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {facility.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{facility.protocolCount} protocols</span>
                  <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                    Open <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* QUICK RESUSCITATION ALGORITHMS & MIND MAPS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Emergency Resuscitation &amp; Flowcharts
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive clinical pathways and rapid emergency algorithms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {QUICK_RESUS_ALGORITHMS.map((algo) => {
            const Icon = algo.icon;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => onSelectMindMap(algo.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 transition-desktop text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className={`p-1.5 rounded border shrink-0 ${algo.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{algo.category}</p>
                  <h3 className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {algo.title}
                  </h3>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* HOSPITAL SOPS & GOVERNANCE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Hospital Administrative SOPs &amp; Policies
            </h2>
            <p className="text-[11px] text-slate-400">
              Official institutional policies, medicolegal reporting, and triage guidelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {POPULAR_HOSPITAL_SOPS.map((sop) => {
            const Icon = sop.icon;
            return (
              <button
                key={sop.id}
                type="button"
                onClick={() => onSelectPolicy(sop.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 transition-desktop text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="p-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-medium text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                    {sop.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CLINICAL SPECIALTY MODULES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
              Clinical Modules &amp; Categories
            </h2>
            <p className="text-[11px] text-slate-400">
              Browse reference items by clinical specialty.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: '1_resuscitation_fluids_and_inotropes', name: 'Resuscitation', icon: '💉' },
            { id: '2_airway_and_ventilation', name: 'Airway & Vent', icon: '🫁' },
            { id: '3_sedation_analgesia_and_neurology', name: 'Sedation & Neuro', icon: '🧠' },
            { id: '4_antimicrobials_and_infectious_diseases', name: 'Antimicrobial', icon: '🦠' },
            { id: '5_metabolic_electrolytes_and_nutrition', name: 'Metabolic & Nut', icon: '⚗️' },
            { id: '6_poisoning_and_toxicology', name: 'Toxicology', icon: '☠️' },
            { id: '7_useful_formulae', name: 'Useful Formulae', icon: '📐' },
            { id: '8_cardiovascular', name: 'Cardiovascular', icon: '❤️' },
            { id: '9_blood_products', name: 'Blood Products', icon: '🩸' },
            { id: '10_endocrine_and_other', name: 'Endocrine', icon: '🔬' },
            { id: '11_ed_medical_emergencies', name: 'Medical Emerg', icon: '🩺' },
            { id: '12_ed_toxicology', name: 'ED Toxicology', icon: '☣️' },
            { id: '13_ed_trauma_surgical', name: 'Trauma & Surg', icon: '🚑' },
            { id: '14_ed_metabolic', name: 'ED Metabolic', icon: '🧬' },
            { id: '15_ed_procedures', name: 'Procedures', icon: '🛠️' },
            { id: '16_score_calculators', name: 'Calculators', icon: '📊' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              aria-label={`Browse ${cat.name}`}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-indigo-500/40 text-center group transition-desktop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="text-xl mb-1 group-hover:scale-105 transition-transform" aria-hidden="true">
                {cat.icon}
              </div>
              <div className="text-[11px] font-medium text-slate-300 group-hover:text-indigo-300 truncate">
                {cat.name}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
