import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Globe2,
  Pill,
  Search,
  X,
} from 'lucide-react';
import {
  findReferencedHospitalProtocol,
  findHospitalProtocol,
  HOSPITALS,
  type HospitalProtocol,
} from '../clinical/hospitalProtocols';
import {findFlowchartForProtocol} from '../clinical/flowcharts';
import {FlowchartViewer} from './FlowchartViewer';
import {extractWeightDoseResults} from '../clinical/calculations/weightDose';
import {
  structureTranscription,
  type TranscriptionBlock,
} from '../clinical/transcription';
import {GlobalCalculatorResults} from './GlobalCalculatorResults';
import type {GlobalCalculator} from '../clinical/globalCalculators';

interface ProtocolLandingPageProps {
  protocol: HospitalProtocol;
  onBack: () => void;
  onOpenProtocol: (protocol: HospitalProtocol) => void;
  weight: string;
  setWeight: (weight: string) => void;
  /** Scoped to this protocol only - see the find bar below. */
  searchQuery?: string;
  onClearSearch?: () => void;
  /** Escape hatch out of the protocol scope, back to the facility library. */
  onSearchAllProtocols?: () => void;
  onOpenCalculator?: (calculator: GlobalCalculator) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const labelFor = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightedText: React.FC<{text: string; highlight?: string}> = ({text, highlight}) => {
  const query = highlight?.trim();
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  if (parts.length <= 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          // The find bar counts and steps through these in document order.
          <mark
            key={index}
            data-search-match=""
            className="rounded bg-amber-300/80 px-0.5 text-slate-900 dark:bg-amber-400/90 dark:text-slate-950"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

const FormattedClinicalText: React.FC<{text: string; highlight?: string}> = ({text, highlight}) => {
  if (!text || !text.trim()) return null;

  const raw = text.replace(/\r/g, '');
  const segments = raw
    .split(/\n+|\s+•\s+|\s+▪\s+/)
    .map(line => line.trim())
    .filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const isAlert = /^(?:ALL FEMALE PATIENTS|NB:|WARNING|CONTRAINDICATIONS|DANGER|CAUTION)/i.test(segment);
        const isHeader = /^(?:RED FLAGS|EXCLUSIONS:|INDEX MHCU|KNOWN MHCU|COMPLICATIONS|PROCEDURE|MANAGEMENT|INVESTIGATIONS|APPROACH|GENERAL MANAGEMENT|MONITORING|HOW TO PERFORM)/i.test(segment) ||
          (/^[A-Z\s]{4,}:?$/.test(segment) && segment.length < 40);
        const isYes = /^YES\b/i.test(segment);
        const isNo = /^NO\b/i.test(segment);
        const isBullet = /^[\u2022\u25aa\u25b2\u2192*\-\u2013]\s*/.test(segment) || /^[0-9]+\.\s*/.test(segment);

        if (isYes) {
          const rest = segment.replace(/^YES[:\s-]*/i, '');
          return (
            <div key={index} className="my-2 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span>YES</span>
              {rest && <span className="font-semibold opacity-90">— <HighlightedText text={rest} highlight={highlight} /></span>}
            </div>
          );
        }

        if (isNo) {
          const rest = segment.replace(/^NO[:\s-]*/i, '');
          return (
            <div key={index} className="my-2 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>NO</span>
              {rest && <span className="font-semibold opacity-90">— <HighlightedText text={rest} highlight={highlight} /></span>}
            </div>
          );
        }

        if (isAlert) {
          return (
            <div key={index} className="my-3 flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 leading-relaxed">
                <HighlightedText
                  text={segment.replace(/^(?:ALL FEMALE PATIENTS|NB:|WARNING|CONTRAINDICATIONS|DANGER|CAUTION)[:\s]*/i, '')}
                  highlight={highlight}
                />
              </div>
            </div>
          );
        }

        if (isHeader) {
          return (
            <h4 key={index} className="mt-4 mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/40 pb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <HighlightedText text={segment} highlight={highlight} />
            </h4>
          );
        }

        const cleanText = segment.replace(/^[\u2022\u25aa\u25b2\u2192*\-\u20130-9.]+\s*/, '');

        if (isBullet || segments.length > 1) {
          return (
            <div key={index} className="flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="flex-1"><HighlightedText text={cleanText} highlight={highlight} /></span>
            </div>
          );
        }

        return (
          <p key={index} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <HighlightedText text={cleanText} highlight={highlight} />
          </p>
        );
      })}
    </div>
  );
};

const ValueBlock: React.FC<{value: unknown; highlight?: string}> = ({value, highlight}) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <FormattedClinicalText text={String(value)} highlight={highlight} />;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              {isRecord(item) ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([key, entry]) => (
                    <div key={key}>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{labelFor(key)}: </span>
                      <ValueBlock value={entry} highlight={highlight} />
                    </div>
                  ))}
                </div>
              ) : (
                <ValueBlock value={item} highlight={highlight} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isRecord(value)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">{labelFor(key)}</h4>
            <ValueBlock value={entry} highlight={highlight} />
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TranscriptionPoint: React.FC<{block: TranscriptionBlock; highlight?: string}> = ({
  block,
  highlight,
}) => {
  const body = (
    <>
      {block.label && (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          <HighlightedText text={block.label} highlight={highlight} />:{' '}
        </span>
      )}
      <HighlightedText text={block.text} highlight={highlight} />
    </>
  );

  if (block.tone === 'directive') {
    return (
      <p className="my-2 flex items-start gap-2 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm font-bold leading-relaxed text-amber-900 dark:border-amber-500/70 dark:bg-amber-950/25 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{body}</span>
      </p>
    );
  }

  if (block.tone === 'branch') {
    const affirmative = /^YES\b/i.test(block.text);
    return (
      <div
        className={`my-2 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-black ${
          affirmative
            ? 'border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200'
            : 'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${affirmative ? 'bg-rose-600' : 'bg-emerald-600'}`} />
        {body}
      </div>
    );
  }

  if (block.tone === 'data') {
    return (
      <p className="my-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 font-mono text-[11px] leading-6 tabular-nums text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
        {body}
      </p>
    );
  }

  if (block.tone === 'label') {
    return (
      <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {body}
      </p>
    );
  }

  if (block.kind === 'paragraph') {
    return (
      <p
        className={`text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${
          block.level > 0 ? 'ml-6' : ''
        }`}
      >
        {body}
      </p>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300 ${
        block.level > 0 ? 'ml-6' : ''
      }`}
    >
      {block.marker ? (
        <span className="mt-0.5 min-w-[1.4rem] shrink-0 text-xs font-black tabular-nums text-indigo-500 dark:text-indigo-400">
          {block.marker}
        </span>
      ) : block.level > 0 ? (
        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
      ) : (
        <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      )}
      <span className="flex-1">{body}</span>
    </div>
  );
};

const TranscriptionView: React.FC<{
  text: string;
  title: string;
  highlight?: string;
}> = ({text, title, highlight}) => {
  const sections = useMemo(
    () => structureTranscription(text, {omitHeading: title}),
    [text, title],
  );

  if (sections.length === 0) return null;

  return (
    <div className="space-y-5">
      {sections.map((section, index) => (
        <section key={`${section.heading ?? 'intro'}-${index}`}>
          {section.heading && (
            <h3 className="mb-2 flex items-center gap-2 border-b border-indigo-100 pb-1 text-xs font-black uppercase tracking-wider text-indigo-600 dark:border-indigo-900/40 dark:text-indigo-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <HighlightedText text={section.heading} highlight={highlight} />
            </h3>
          )}
          <div className="space-y-1.5">
            {section.blocks.map((block, blockIndex) => (
              <TranscriptionPoint key={blockIndex} block={block} highlight={highlight} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const ClinicalSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({title, icon, children}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

const WeightDoseResults: React.FC<{text: unknown; weight: string}> = ({text, weight}) => {
  if (typeof text !== 'string') return null;
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) return null;
  const results = extractWeightDoseResults(text, numericWeight);
  if (results.length === 0) return null;

  return (
    <div className="mt-2 space-y-1 rounded-lg border border-cyan-300 bg-cyan-50 p-2 text-xs text-cyan-950">
      {results.map(result => (
        <div key={result.sourceExpression}>
          <span className="font-bold">{result.sourceExpression}</span>
          {' → '}
          {result.minimum === result.maximum
            ? result.minimum.toLocaleString(undefined, {maximumFractionDigits: 2})
            : `${result.minimum.toLocaleString(undefined, {maximumFractionDigits: 2})}–${result.maximum.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
          {' '}{result.resultUnit} for {numericWeight} kg
        </div>
      ))}
    </div>
  );
};

export const ProtocolLandingPage: React.FC<ProtocolLandingPageProps> = ({
  protocol,
  onBack,
  onOpenProtocol,
  weight,
  setWeight,
  searchQuery = '',
  onClearSearch,
  onSearchAllProtocols,
  onOpenCalculator,
}) => {
  const facility = HOSPITALS[protocol.facilityId];
  const referencedProtocol = findReferencedHospitalProtocol(protocol);
  const contentProtocol = referencedProtocol ?? protocol;
  const body = contentProtocol.body;
  const managementSteps = Array.isArray(body.management_steps) ? body.management_steps : [];
  const warnings = Array.isArray(body.warnings) ? body.warnings : [];
  // Passed through unmodified: the structurer reads original indentation to tell
  // a sub-point from a top-level one.
  const sourceText = typeof body.source_text === 'string' ? body.source_text : '';
  const pdfPageLabel =
    contentProtocol.pdfPages.length > 0
      ? `${contentProtocol.pdfPages.length === 1 ? 'page' : 'pages'} ${contentProtocol.pdfPages.join(', ')}`
      : '';
  const trimmedQuery = searchQuery.trim();

  // Matches are counted off the rendered page rather than off the raw record so
  // the tally is exactly what the reader can scroll to - fields that never make
  // it onto the page must not inflate it.
  const articleRef = useRef<HTMLElement>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatch, setActiveMatch] = useState(0);

  const matchNodes = (): HTMLElement[] =>
    Array.from(
      articleRef.current?.querySelectorAll<HTMLElement>('mark[data-search-match]') ?? [],
    );

  useEffect(() => {
    const nodes = matchNodes();
    setMatchCount(nodes.length);
    setActiveMatch(0);
  }, [trimmedQuery, contentProtocol.id, weight]);

  useEffect(() => {
    matchNodes().forEach((node, index) => {
      node.toggleAttribute('data-active-match', index === activeMatch);
    });
  }, [activeMatch, matchCount, trimmedQuery]);

  const stepMatch = (delta: number) => {
    const nodes = matchNodes();
    if (nodes.length === 0) return;
    const next = (activeMatch + delta + nodes.length) % nodes.length;
    setActiveMatch(next);
    nodes[next]?.scrollIntoView({block: 'center', behavior: 'smooth'});
  };

  const reserved = new Set([
    'item',
    'protocol_type',
    'sourceDoc',
    'pdfPages',
    'categoryHint',
    'review_state',
    'clinical_features',
    'management_steps',
    'drugs',
    'warnings',
    'disposition',
    'note',
    'source_text',
    'source_image',
    'source_image_alt',
    'equipment',
  ]);
  const additionalFields = Object.entries(body).filter(
    ([key, value]) => !reserved.has(key) && value !== null && value !== undefined && value !== '',
  );
  const calculableDoseText = [
    ...managementSteps.flatMap(step => {
      const record = isRecord(step) ? step : {};
      return typeof record.details === 'string' ? [record.details] : [];
    }),
    ...contentProtocol.embeddedDrugs.flatMap(drug =>
      ['adult_dose', 'paediatric_dose', 'protocol_dose']
        .map(field => drug[field])
        .filter((value): value is string => typeof value === 'string'),
    ),
  ];
  const hasWeightBasedDoses = calculableDoseText.some(
    text => extractWeightDoseResults(text, 70).length > 0,
  );
  const sourceImage = typeof body.source_image === 'string' ? body.source_image : '';
  const sourceImageAlt = typeof body.source_image_alt === 'string'
    ? body.source_image_alt
    : `${contentProtocol.title} source image`;

  const flowchartData = findFlowchartForProtocol(contentProtocol.slug, body) ?? findFlowchartForProtocol(protocol.slug, body);

  const handleOpenByProtocolSlug = (targetSlug: string) => {
    const found = findHospitalProtocol(protocol.facilityId, targetSlug);
    if (found) {
      onOpenProtocol(found);
    }
  };

  return (
    <article ref={articleRef} className="mx-auto max-w-5xl space-y-5 pb-12">
      <button
        type="button"
        onClick={onBack}
        aria-label={`Back to ${facility.shortName} protocols`}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 -m-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {facility.shortName} protocols
      </button>

      <header className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-7 lg:p-9 text-white shadow-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-300">
            <Building2 className="h-3.5 w-3.5" />
            {facility.shortName}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-xs font-bold text-slate-300">
            {protocol.categoryLabel}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            Published facility protocol
          </span>
        </div>
        <h1 className="mt-4 sm:mt-5 text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
          <HighlightedText text={protocol.title} highlight={trimmedQuery} />
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          <HighlightedText text={contentProtocol.summary} highlight={trimmedQuery} />
        </p>
        <dl className="mt-6 grid gap-3 border-t border-slate-800 pt-5 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-black uppercase tracking-wider text-slate-500">Hospital source</dt>
            <dd className="mt-1 font-semibold text-slate-300">{protocol.sourceDocument}</dd>
          </div>
          <div>
            <dt className="font-black uppercase tracking-wider text-slate-500">Protocol type</dt>
            <dd className="mt-1 font-semibold text-slate-300">{labelFor(protocol.protocolType)}</dd>
          </div>
        </dl>
      </header>

      {trimmedQuery && (
        <div
          role="search"
          aria-label="Find within this protocol"
          className={`sticky top-[9.25rem] z-20 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur sm:top-[9.75rem] ${
            matchCount > 0
              ? 'border-amber-300 bg-amber-50/95 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/80 dark:text-amber-200'
              : 'border-slate-300 bg-slate-50/95 text-slate-600 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-400'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-current/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
              <Search className="h-3 w-3" />
              This protocol only
            </span>

            <span aria-live="polite" className="text-sm font-bold">
              {matchCount > 0
                ? `${activeMatch + 1} of ${matchCount} match${matchCount === 1 ? '' : 'es'} for “${trimmedQuery}”`
                : `No matches for “${trimmedQuery}” in this protocol`}
            </span>

            {matchCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMatch(-1)}
                  aria-label="Previous match"
                  className="rounded-lg border border-current/30 p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepMatch(1)}
                  aria-label="Next match"
                  className="rounded-lg border border-current/30 p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </span>
            )}

            <span className="ml-auto flex flex-wrap items-center gap-2">
              {onSearchAllProtocols && (
                <button
                  type="button"
                  onClick={onSearchAllProtocols}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-current/30 px-2.5 py-1.5 text-[11px] font-bold transition hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Search all {facility.shortName} protocols
                </button>
              )}
              {onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear search"
                  className="rounded-lg border border-current/30 p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </div>
          {matchCount > 0 && (
            <p className="mt-1.5 text-[11px] font-semibold opacity-80">
              Highlighted throughout this page, including the source transcription.
            </p>
          )}
        </div>
      )}

      {onOpenCalculator && (
        <GlobalCalculatorResults
          query={trimmedQuery}
          onOpen={onOpenCalculator}
          scopeLabel="this protocol"
        />
      )}

      {flowchartData && (
        <FlowchartViewer
          flowchart={flowchartData}
          onOpenProtocol={handleOpenByProtocolSlug}
        />
      )}

      {referencedProtocol && (
        <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              This flowchart belongs to <strong>{referencedProtocol.title}</strong>. Its complete clinical content is shown below.
            </p>
            <button
              type="button"
              onClick={() => onOpenProtocol(referencedProtocol)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
            >
              Open parent protocol
            </button>
          </div>
        </div>
      )}

      {hasWeightBasedDoses && (
        <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-950 focus-within:ring-2 focus-within:ring-cyan-400">
          <span className="font-black">Patient weight</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={event => setWeight(event.target.value)}
            placeholder="kg"
            aria-label="Patient weight for dose calculation"
            className="w-28 rounded-lg border border-cyan-400 bg-white px-3 py-2 font-bold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          />
          <span className="text-xs">kg — weight-based doses calculate inline below.</span>
        </label>
      )}

      {body.clinical_features !== undefined && (
        <ClinicalSection title="Clinical features" icon={<FileText className="h-5 w-5 text-indigo-500" />}>
          <ValueBlock value={body.clinical_features} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {managementSteps.length > 0 && (
        <ClinicalSection title="Management" icon={<ClipboardList className="h-5 w-5 text-emerald-500" />}>
          <div className="space-y-3">
            {managementSteps.map((step, index) => {
              const record = isRecord(step) ? step : {};
              const stepNumber = String(record.step_number ?? index + 1);
              const action = String(record.action ?? `Step ${index + 1}`);
              const details = record.details;
              return (
                <div key={`${stepNumber}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-[2.5rem_1fr]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                    {stepNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">
                      <HighlightedText text={action} highlight={trimmedQuery} />
                    </h3>
                    <div className="mt-1">
                      <ValueBlock value={details} highlight={trimmedQuery} />
                      <WeightDoseResults text={details} weight={weight} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ClinicalSection>
      )}

      {body.drugs !== undefined && (
        <ClinicalSection title="Medicines and treatment" icon={<Pill className="h-5 w-5 text-cyan-500" />}>
          <ValueBlock value={body.drugs} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {contentProtocol.embeddedDrugs.length > 0 && (
        <ClinicalSection title="Embedded medicine references" icon={<Pill className="h-5 w-5 text-cyan-500" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {contentProtocol.embeddedDrugs.map((drug, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="mb-3 font-black text-slate-900 dark:text-white">
                  <HighlightedText
                    text={String(drug.item ?? drug.drug ?? drug.condition_or_drug ?? `Medicine ${index + 1}`)}
                    highlight={trimmedQuery}
                  />
                </h3>
                <ValueBlock value={drug} highlight={trimmedQuery} />
                {['adult_dose', 'paediatric_dose', 'protocol_dose'].map(field => (
                  <WeightDoseResults key={field} text={drug[field]} weight={weight} />
                ))}
              </div>
            ))}
          </div>
        </ClinicalSection>
      )}

      {body.equipment !== undefined && (
        <ClinicalSection title="Equipment" icon={<ClipboardList className="h-5 w-5 text-sky-500" />}>
          <ValueBlock value={body.equipment} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {body.disposition !== undefined && (
        <ClinicalSection title="Disposition" icon={<Building2 className="h-5 w-5 text-violet-500" />}>
          <ValueBlock value={body.disposition} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {warnings.length > 0 && (
        <ClinicalSection title="Warnings" icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}>
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <ValueBlock value={warnings} highlight={trimmedQuery} />
          </div>
        </ClinicalSection>
      )}

      {body.note !== undefined && !referencedProtocol && (
        <ClinicalSection title="Notes" icon={<FileText className="h-5 w-5 text-amber-500" />}>
          <ValueBlock value={body.note} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {additionalFields.length > 0 && (
        <ClinicalSection title="Additional protocol content" icon={<FileText className="h-5 w-5 text-slate-500" />}>
          <div className="space-y-4">
            {additionalFields.map(([key, value]) => (
              <div key={key}>
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{labelFor(key)}</h3>
                <ValueBlock value={value} highlight={trimmedQuery} />
              </div>
            ))}
          </div>
        </ClinicalSection>
      )}

      {sourceText && (
        <ClinicalSection
          title="Protocol content"
          icon={<FileText className="h-5 w-5 text-slate-500" />}
        >
          <TranscriptionView
            text={sourceText}
            title={contentProtocol.title}
            highlight={trimmedQuery}
          />
          <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800">
            Transcribed from {protocol.sourceDocument}
            {pdfPageLabel ? ` (${pdfPageLabel})` : ''}. Layout is applied for reading;
            the wording is reproduced from the facility document.
          </p>
        </ClinicalSection>
      )}

      {sourceImage && (
        <ClinicalSection title="Facility source image" icon={<FileText className="h-5 w-5 text-slate-500" />}>
          <a
            href={sourceImage}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Open the full-size facility source image"
          >
            <img
              src={sourceImage}
              alt={sourceImageAlt}
              loading="lazy"
              className="mx-auto h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          </a>
          <a
            href={sourceImage}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs font-bold text-indigo-600 underline underline-offset-2 dark:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1 -m-1"
          >
            Open full-size source image
          </a>
        </ClinicalSection>
      )}
    </article>
  );
};
