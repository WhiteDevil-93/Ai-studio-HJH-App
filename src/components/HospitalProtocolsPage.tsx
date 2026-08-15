import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  FileText,
  FlaskConical,
  Globe2,
  Search,
  Syringe,
} from 'lucide-react';
import {
  HOSPITALS,
  HOSPITAL_PROTOCOLS_BY_FACILITY,
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY,
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

interface HospitalProtocolsPageProps {
  facilityId: HospitalId;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBack: () => void;
  onOpenProtocol: (protocol: HospitalProtocol) => void;
  onOpenScores: () => void;
  onOpenFormulae: () => void;
  onOpenLandmarkStudies: () => void;
  onOpenInternationalGuidelines: () => void;
  onOpenPocketGuides: () => void;
  onOpenCalculator?: (calculator: GlobalCalculator) => void;
}

const accentClasses = {
  indigo: {
    hero: 'border-indigo-800/40 bg-slate-900/90',
    badgeVariant: 'facility-hjh' as const,
    selected: 'bg-indigo-600 text-white',
  },
  violet: {
    hero: 'border-purple-800/40 bg-slate-900/90',
    badgeVariant: 'facility-cmjah' as const,
    selected: 'bg-purple-600 text-white',
  },
  amber: {
    hero: 'border-amber-800/40 bg-slate-900/90',
    badgeVariant: 'facility-chbah' as const,
    selected: 'bg-amber-600 text-white',
  },
  rose: {
    hero: 'border-pink-800/40 bg-slate-900/90',
    badgeVariant: 'facility-rmmch' as const,
    selected: 'bg-pink-600 text-white',
  },
} as const;

export const HospitalProtocolsPage: React.FC<HospitalProtocolsPageProps> = ({
  facilityId,
  searchQuery,
  setSearchQuery,
  onBack,
  onOpenProtocol,
  onOpenScores,
  onOpenFormulae,
  onOpenLandmarkStudies,
  onOpenInternationalGuidelines,
  onOpenPocketGuides,
  onOpenCalculator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mentionsExpanded, setMentionsExpanded] = useState(false);
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

  const {visibleProtocols, mentionedProtocols} = useMemo(() => {
    const inCategory = protocols.filter(
      protocol =>
        selectedCategory === 'all' || protocol.categoryLabel === selectedCategory,
    );
    const results = rankProtocolSearch(inCategory, searchQuery);
    const named = results.filter(result => result.kind !== 'body');
    const mentions = results.filter(result => result.kind === 'body');

    if (named.length === 0) {
      return {
        visibleProtocols: mentions.map(result => result.protocol),
        mentionedProtocols: [] as HospitalProtocol[],
      };
    }

    return {
      visibleProtocols: named.map(result => result.protocol),
      mentionedProtocols: mentions.map(result => result.protocol),
    };
  }, [protocols, searchQuery, selectedCategory]);

  return (
    <div className="hospital-library space-y-5 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          aria-label="Return to all facilities"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          All facilities
        </Button>
      </div>

      {/* COMPACT FACILITY HERO */}
      <section className={`rounded-lg border ${accent.hero} p-4 sm:p-5 shadow-xs text-white`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={accent.badgeVariant} size="sm">
                {facility.shortName}
              </Badge>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">{protocols.length} complete protocol pages</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">{facility.name}</h1>
            <p className="text-xs font-medium text-indigo-400">{facility.subtitle}</p>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{facility.description}</p>
          </div>

          {/* Quick Facility Search & Actions */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="w-full sm:w-60">
              <Input
                size="sm"
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder={`Search ${facility.shortName} protocols...`}
                icon={<Search className="w-3.5 h-3.5" />}
                aria-label={`Search ${facility.shortName} protocols`}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenScores}
              icon={<Calculator className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Scores
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenFormulae}
              icon={<Syringe className="w-3.5 h-3.5 text-teal-400" />}
            >
              Formulae
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenLandmarkStudies}
              icon={<FlaskConical className="w-3.5 h-3.5 text-purple-400" />}
            >
              Studies
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenInternationalGuidelines}
              icon={<Globe2 className="w-3.5 h-3.5 text-sky-400" />}
            >
              Guidelines
            </Button>
          </div>
        </div>
      </section>

      {onOpenCalculator && (
        <GlobalCalculatorResults
          query={searchQuery}
          onOpen={onOpenCalculator}
          scopeLabel={`${facility.shortName} protocols`}
        />
      )}

      {/* PROTOCOL BROWSER */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Browse Protocols</h2>
            <p className="text-[11px] text-slate-400">
              Clinical content from {facility.shortName}’s published protocol collection.
            </p>
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {visibleProtocols.length} shown
          </span>
        </div>

        {omittedPlaceholders > 0 && (
          <p className="text-[11px] text-slate-500">
            {omittedPlaceholders} empty source placeholder{omittedPlaceholders === 1 ? '' : 's'} omitted because no clinical content was supplied.
          </p>
        )}

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-desktop cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            All Categories ({protocols.length})
          </button>
          {categories.map(([label, count]) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedCategory(label)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-desktop cursor-pointer shrink-0 ${
                selectedCategory === label
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Protocol Grid */}
        {visibleProtocols.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProtocols.map(protocol => (
              <button
                key={protocol.id}
                type="button"
                onClick={() => onOpenProtocol(protocol)}
                aria-label={`Open ${protocol.title}`}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-left transition-desktop flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      {protocol.categoryLabel}
                    </span>
                    {protocol.pdfPages && protocol.pdfPages.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        p. {protocol.pdfPages.join(', ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                    {protocol.title}
                  </h3>
                  <p className="line-clamp-2 text-[11px] text-slate-400 leading-relaxed">
                    {protocol.summary}
                  </p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-medium text-indigo-400 gap-1">
                  <span>Open Protocol</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 py-8 text-center">
            <AlertTriangle className="mx-auto h-4 w-4 text-slate-500" />
            <p className="mt-2 text-xs font-medium text-slate-400">
              No protocols match your search in this category.
            </p>
          </div>
        )}

        {mentionedProtocols.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <button
              type="button"
              onClick={() => setMentionsExpanded(expanded => !expanded)}
              aria-expanded={mentionsExpanded}
              className="flex w-full items-center justify-between gap-2 text-left cursor-pointer focus-visible:outline-none"
            >
              <div>
                <span className="block text-xs font-semibold text-slate-300">
                  Mentioned in {mentionedProtocols.length} other protocol{mentionedProtocols.length === 1 ? '' : 's'}
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
                {mentionedProtocols.map(protocol => (
                  <li key={protocol.id}>
                    <button
                      type="button"
                      onClick={() => onOpenProtocol(protocol)}
                      className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800/80 transition-desktop"
                    >
                      <span className="truncate">{protocol.title}</span>
                      <span className="text-[10px] text-slate-500">{protocol.categoryLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
