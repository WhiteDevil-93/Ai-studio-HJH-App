import React from 'react';
import {
  Building2, Stethoscope, ShieldAlert, FileText, Activity, Heart,
  Calculator, Syringe, Flame, Compass, ChevronRight, Search,
  Award, AlertTriangle, Users, MapPin, Layers, Baby, Brain, FlaskConical,
  Star, Clock, BookOpen, Globe2
} from 'lucide-react';

interface HomePageProps {
  onSelectFacility: (facilityId: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectMindMap: (mindMapId: string) => void;
  onSelectPolicy: (policyId: string) => void;
  onSelectScore: (scoreId: string) => void;
  onOpenCodeRed?: () => void;
  weight: string;
  setWeight: (w: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const FACILITIES = [
  {
    id: 'hjth',
    name: 'Helen Joseph Tertiary Hospital (HJTH)',
    subtitle: 'Primary ED Guidelines 2026 (Editor: Dr Jana du Plessis)',
    description: 'ED protocol algorithms straight from the HJH document: ACS, stroke, sepsis, trauma, toxicology, and ED procedures.',
    color: 'from-blue-600 to-indigo-700',
    badge: 'Main Facility',
    protocolCount: 24,
    icon: Building2,
    available: true
  },
  {
    id: 'rmmch',
    name: 'Rahima Moosa Mother & Child (RMMCH)',
    subtitle: 'Paediatric & Obstetrics/Gynaecology Guidelines',
    description: 'Source protocols not yet supplied — see clinical-sources/source-manifest.json. Use HJTH adult guidelines with clinical judgement until RMMCH content is confirmed.',
    color: 'from-pink-600 to-rose-700',
    badge: 'Coming Soon',
    protocolCount: 0,
    icon: Heart,
    available: false
  },
  {
    id: 'cmjah',
    name: 'Charlotte Maxeke Academic Hospital (CMJAH)',
    subtitle: 'Tertiary & Specialist Referral Protocols',
    description: 'No source material has been supplied for CMJAH yet. This card will activate once referral protocols are confirmed and fingerprinted.',
    color: 'from-purple-600 to-indigo-800',
    badge: 'Coming Soon',
    protocolCount: 0,
    icon: Award,
    available: false
  },
  {
    id: 'chbah',
    name: 'Chris Hani Baragwanath Hospital (CHBAH)',
    subtitle: 'ICU Dosing Card (2024 updates)',
    description: 'Complete adult ICU dosing, infusions, and antimicrobial reference. Burns unit and psychiatric referral protocols are pending confirmed source material.',
    color: 'from-amber-600 to-orange-700',
    badge: 'Regional Referral',
    protocolCount: 121,
    icon: Flame,
    available: true
  }
];

export const QUICK_RESUS_ALGORITHMS = [
  { id: 'aha_bls_acls', title: 'Adult Cardiac Arrest Algorithm (2020)', category: 'Resuscitation', icon: Activity, color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { id: 'trauma_arrest', title: 'Trauma Cardiac Arrest (H-O-T-T)', category: 'Trauma', icon: ShieldAlert, color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { id: 'acs_stemi_flowchart', title: 'ACS & STEMI / OMI Algorithm', category: 'Cardiology', icon: Heart, color: 'bg-rose-600/10 text-rose-600 border-rose-600/30' },
  { id: 'stroke_thrombolysis', title: 'Acute Stroke & Thrombolysis Window', category: 'Neurovascular', icon: Brain, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  { id: 'epistaxis_flowchart', title: 'Epistaxis Management & Packing', category: 'ENT', icon: AlertTriangle, color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
  { id: 'croup_algorithm', title: 'Westley Croup Score & Treatment', category: 'Paediatrics / ENT', icon: Baby, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  { id: 'jaundice_flowchart', title: 'Jaundice Diagnostic Flowchart', category: 'Gastroenterology', icon: Stethoscope, color: 'bg-sky-500/10 text-sky-500 border-sky-500/30' },
  { id: 'dka_hhs_flowchart', title: 'Hyperglycaemia & DKA / HHS Mx', category: 'Metabolic', icon: Syringe, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  { id: 'psychosis_flowchart', title: 'Acute Psychosis / Mania Flowchart', category: 'Psychiatry', icon: AlertTriangle, color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  { id: 'snakebite_pathway', title: 'Snakebite Envenomation Pathway', category: 'Toxicology', icon: ShieldAlert, color: 'bg-lime-600/10 text-lime-600 border-lime-600/30' },
  { id: 'scorpion_sting', title: 'Scorpion Sting Envenomation', category: 'Toxicology', icon: AlertTriangle, color: 'bg-amber-600/10 text-amber-600 border-amber-600/30' },
  { id: 'organ_donation', title: 'Organ & Tissue Donation Protocol', category: 'Governance / ICU', icon: Users, color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' }
];

export const POPULAR_HOSPITAL_SOPS = [
  { id: 'triage_sop', title: 'Triage SOP & SATS TEWS Discriminators', icon: Layers },
  { id: 'ambulance_divert', title: 'Ambulance Divert Protocol', icon: ShieldAlert },
  { id: 'ambulance_handover', title: 'Ambulance Handover Policy', icon: Users },
  { id: 'icu_referral', title: 'ICU Consult & Referral Policy', icon: Building2 },
  { id: 'internal_medicine_admissions', title: 'Internal Medicine Admissions Pathway', icon: Building2 },
  { id: 'stat_lab_use', title: 'Stat Lab Use Policy', icon: FlaskConical },
  { id: 'ct_contrast', title: 'CT Contrast Protocol & Consent Checklist', icon: FileText },
  { id: 'j88_guidelines', title: 'J88 Medicolegal Report Completion Guide', icon: Award },
  { id: 'death_certification', title: 'Death Certification (BI 1663 / D28)', icon: FileText },
  { id: 'notifiable_conditions', title: 'Notifiable Conditions & ICD-10 List', icon: AlertTriangle },
  { id: 'suburb_directory', title: 'HJH Drainage Suburbs Directory (Reg B & C)', icon: MapPin }
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectFacility,
  onSelectCategory,
  onSelectMindMap,
  onSelectPolicy,
  onSelectScore,
  onOpenCodeRed,
  weight,
  setWeight,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 border border-slate-800 shadow-2xl text-white">
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Helen Joseph Tertiary Hospital • ED Clinical Guidelines 2026
            </div>
            {onOpenCodeRed && (
              <button
                onClick={onOpenCodeRed}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 border border-red-400 text-white text-xs font-black uppercase tracking-wider shadow-lg animate-pulse cursor-pointer transition-all hover:scale-105"
              >
                <ShieldAlert className="w-4 h-4 text-white" />
                🚨 CODE RED Resuscitation Cards
              </button>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Emergency Department <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-400">Clinical Guidelines</span> & Facilities
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Complete, authoritative clinical protocols, interactive mind maps, visual algorithms, drug infusion calculators, and hospital SOPs for Helen Joseph Tertiary Hospital and referral facilities.
          </p>

          {/* Quick Controls: Weight & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-4 relative">
              <label className="block text-xs text-slate-400 font-medium mb-1">Patient Weight (kg)</label>
              <div className="relative">
                <Syringe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="sm:col-span-8 relative">
              <label className="block text-xs text-slate-400 font-medium mb-1">Quick Search Protocols or Guidelines</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ACS, Stroke, DKA, Snakebite, J88, Triage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Links — the only route to these tabs since the category pill bar is hidden on Home */}
      <div className="flex flex-wrap gap-2">
        {onOpenCodeRed && (
          <button
            onClick={onOpenCodeRed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-md animate-pulse cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> CODE RED Resuscitation Cards
          </button>
        )}
        <button
          onClick={() => onSelectCategory('favourites')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Star className="w-3.5 h-3.5" /> Favourites
        </button>
        <button
          onClick={() => onSelectCategory('recently_viewed')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" /> Recently Viewed
        </button>
        <button
          onClick={() => onSelectCategory('trials_guidelines')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> Trials & Int'l Guidelines
        </button>
        <button
          onClick={() => onSelectCategory('helen_guidelines')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
        >
          <Stethoscope className="w-3.5 h-3.5" /> Helen (HJTH) Guidelines
        </button>
        <button
          onClick={() => onSelectCategory('edl_phc_guidelines')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Globe2 className="w-3.5 h-3.5" /> SA EDL / PHC Guidelines
        </button>
      </div>

      {/* Select Hospital / Facility Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-500" />
              Select Hospital / Facility Protocols
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Click a facility to explore its specific emergency protocols, referral pathways, and guidelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FACILITIES.map((facility) => {
            const Icon = facility.icon;
            return (
              <div
                key={facility.id}
                onClick={facility.available ? () => onSelectFacility(facility.id) : undefined}
                aria-disabled={!facility.available}
                className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
                  facility.available
                    ? 'cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:-translate-y-1'
                    : 'cursor-not-allowed border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3.5 rounded-xl bg-gradient-to-br ${facility.color} text-white shadow-md ${!facility.available ? 'grayscale' : ''}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    facility.available
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/40'
                  }`}>
                    {facility.badge}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                    {facility.name}
                    {facility.available && (
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    )}
                  </h3>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{facility.subtitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{facility.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  {facility.available ? (
                    <>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{facility.protocolCount}+ Protocols & Guidelines</span>
                      <span className="text-indigo-500 font-medium group-hover:underline">Explore Protocols →</span>
                    </>
                  ) : (
                    <span className="font-semibold text-amber-600 dark:text-amber-500">Awaiting confirmed source material</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Resuscitation Mind Maps & Algorithms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-500" />
              Emergency Resuscitation & Mind Maps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Interactive visual flowchart mind maps and step-by-step emergency algorithms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_RESUS_ALGORITHMS.map((algo) => {
            const Icon = algo.icon;
            return (
              <button
                key={algo.id}
                onClick={() => onSelectMindMap(algo.id)}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left group shadow-sm hover:shadow-md"
              >
                <div className={`p-2.5 rounded-lg border ${algo.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{algo.category}</p>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
                    {algo.title}
                  </h4>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Hospital SOPs & Governance Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-500" />
              Hospital Administrative SOPs & Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Official hospital policies, medicolegal recordkeeping, death certification, and triage guidelines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {POPULAR_HOSPITAL_SOPS.map((sop) => {
            const Icon = sop.icon;
            return (
              <button
                key={sop.id}
                onClick={() => onSelectPolicy(sop.id)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left group shadow-sm"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                    {sop.title}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Protocol Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-sky-500" />
              Clinical Categories & Speciality Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Browse all 92 protocols categorized by clinical specialty.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: '1_resuscitation_fluids_and_inotropes', name: 'Resuscitation', icon: '💉' },
            { id: '2_airway_and_ventilation', name: 'Airway & Vent', icon: '🫁' },
            { id: '3_sedation_analgesia_and_neurology', name: 'Sedation & Neuro', icon: '🧠' },
            { id: '4_antimicrobials_and_infectious_diseases', name: 'Antimicrobials', icon: '🦠' },
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
            { id: '16_score_calculators', name: 'Score Calculators', icon: '📊' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all text-center group shadow-sm"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
