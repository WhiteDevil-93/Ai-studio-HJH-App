import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calculator,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react';
import {
  HOSPITALS,
  HOSPITAL_PROTOCOLS_BY_FACILITY,
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY,
  type HospitalId,
  type HospitalProtocol,
} from '../clinical/hospitalProtocols';

interface HospitalProtocolsPageProps {
  facilityId: HospitalId;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBack: () => void;
  onOpenProtocol: (protocol: HospitalProtocol) => void;
  onOpenScores: () => void;
  onOpenTrials: () => void;
}

const accentClasses = {
  indigo: {
    hero: 'from-indigo-950 via-slate-950 to-blue-950 border-indigo-800/50',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    selected: 'bg-indigo-600 text-white border-indigo-500',
  },
  violet: {
    hero: 'from-violet-950 via-slate-950 to-purple-950 border-violet-800/50',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    icon: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    selected: 'bg-violet-600 text-white border-violet-500',
  },
  amber: {
    hero: 'from-amber-950 via-slate-950 to-orange-950 border-amber-800/50',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    selected: 'bg-amber-600 text-white border-amber-500',
  },
  rose: {
    hero: 'from-rose-950 via-slate-950 to-pink-950 border-rose-800/50',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    selected: 'bg-rose-600 text-white border-rose-500',
  },
} as const;

export const HospitalProtocolsPage: React.FC<HospitalProtocolsPageProps> = ({
  facilityId,
  searchQuery,
  setSearchQuery,
  onBack,
  onOpenProtocol,
  onOpenScores,
  onOpenTrials,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const facility = HOSPITALS[facilityId];
  const sourceProtocols = HOSPITAL_PROTOCOLS_BY_FACILITY[facilityId];
  const protocols = HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY[facilityId];
  const omittedPlaceholders = sourceProtocols.length - protocols.length;
  const accent = accentClasses[facility.accent];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    protocols.forEach(protocol => {
      counts.set(protocol.categoryLabel, (counts.get(protocol.categoryLabel) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [protocols]);

  const visibleProtocols = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return protocols.filter(protocol => {
      const categoryMatches =
        selectedCategory === 'all' || protocol.categoryLabel === selectedCategory;
      const searchMatches = !query || protocol.searchText.includes(query);
      return categoryMatches && searchMatches;
    });
  }, [protocols, searchQuery, selectedCategory]);

  return (
    <div className="hospital-library space-y-6 pb-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All facilities
      </button>

      <section className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accent.hero} p-6 sm:p-9 text-white shadow-2xl`}>
        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${accent.badge}`}>
              <Building2 className="h-3.5 w-3.5" />
              {facility.shortName} protocol library
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-bold text-slate-300">
              {protocols.length} complete protocol pages
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{facility.name}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{facility.subtitle}</p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">{facility.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search {facility.shortName} protocols</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder={`Search all ${facility.shortName} protocols`}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/75 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-slate-500"
              />
            </label>
            <button
              type="button"
              onClick={onOpenScores}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/75 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              <Calculator className="h-4 w-4" />
              Global scores
            </button>
            <button
              type="button"
              onClick={onOpenTrials}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/75 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              Trials & guidelines
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="hospital-library-heading text-xl font-black">Browse protocols</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every card contains clinical content from this facility’s published protocol collection.
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-slate-500">
            {visibleProtocols.length} shown
          </span>
        </div>

        {omittedPlaceholders > 0 && (
          <p className="text-[11px] text-slate-500">
            {omittedPlaceholders} empty source placeholder{omittedPlaceholders === 1 ? '' : 's'} omitted because no clinical content was supplied.
          </p>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
              selectedCategory === 'all'
                ? accent.selected
                : 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            All {protocols.length}
          </button>
          {categories.map(([category, count]) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
                selectedCategory === category
                  ? accent.selected
                  : 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {category} {count}
            </button>
          ))}
        </div>
      </section>

      {visibleProtocols.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleProtocols.map(protocol => (
            <button
              key={protocol.id}
              type="button"
              onClick={() => onOpenProtocol(protocol)}
              className="group flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-lg border p-2 ${accent.icon}`}>
                  <FileText className="h-4 w-4" />
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {protocol.categoryLabel}
                </span>
              </div>
              <h3 className="mt-4 text-base font-black leading-snug text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                {protocol.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {protocol.summary}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-500 dark:border-slate-800">
                <span className="truncate pr-3">{protocol.sourceDocument}</span>
                <span className="inline-flex shrink-0 items-center gap-1 font-bold text-indigo-500">
                  Open protocol <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <AlertTriangle className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            No protocols match this search and category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-xs font-bold text-indigo-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
