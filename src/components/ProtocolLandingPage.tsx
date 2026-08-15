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
import {FormattedClinicalText} from './FormattedClinicalText';
import {HighlightedText} from './HighlightedText';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

interface ProtocolLandingPageProps {
  protocol: HospitalProtocol;
  onBack: () => void;
  onOpenProtocol: (protocol: HospitalProtocol) => void;
  weight: string;
  setWeight: (weight: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSearchAllProtocols?: () => void;
  onOpenCalculator?: (calculator: GlobalCalculator) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const labelFor = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const ValueBlock: React.FC<{value: unknown; highlight?: string}> = ({value, highlight}) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <FormattedClinicalText text={String(value)} highlight={highlight} />;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="space-y-1.5">
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              {isRecord(item) ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([key, entry]) => (
                    <div key={key}>
                      <span className="font-semibold text-slate-100">{labelFor(key)}: </span>
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
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
            <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{labelFor(key)}</h4>
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
        <span className="font-semibold text-slate-100">
          <HighlightedText text={block.label} highlight={highlight} />:{' '}
        </span>
      )}
      <HighlightedText text={block.text} highlight={highlight} />
    </>
  );

  if (block.tone === 'directive') {
    return (
      <p className="my-1.5 flex items-start gap-2 rounded border-l-2 border-amber-400 bg-amber-950/20 px-2.5 py-1.5 text-xs font-semibold leading-relaxed text-amber-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="flex-1">{body}</span>
      </p>
    );
  }

  if (block.tone === 'branch') {
    const affirmative = /^YES\b/i.test(block.text);
    return (
      <div
        className={`my-1.5 inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold ${
          affirmative
            ? 'border-rose-900/50 bg-rose-950/40 text-rose-200'
            : 'border-emerald-900/50 bg-emerald-950/40 text-emerald-200'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${affirmative ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        {body}
      </div>
    );
  }

  if (block.tone === 'data') {
    return (
      <p className="my-1 overflow-x-auto whitespace-pre-wrap break-words rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed tabular-nums text-slate-300">
        {body}
      </p>
    );
  }

  if (block.tone === 'label') {
    return (
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {body}
      </p>
    );
  }

  if (block.kind === 'paragraph') {
    return (
      <p
        className={`text-xs leading-relaxed text-slate-300 ${
          block.level > 0 ? 'ml-4' : ''
        }`}
      >
        {body}
      </p>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 text-xs leading-relaxed text-slate-300 ${
        block.level > 0 ? 'ml-4' : ''
      }`}
    >
      {block.marker ? (
        <span className="mt-0.5 min-w-[1.2rem] shrink-0 text-xs font-bold tabular-nums text-indigo-400">
          {block.marker}
        </span>
      ) : block.level > 0 ? (
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
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
    <div className="space-y-4">
      {sections.map((section, index) => (
        <section key={`${section.heading ?? 'intro'}-${index}`}>
          {section.heading && (
            <h3 className="mb-1.5 flex items-center gap-1.5 border-b border-indigo-900/40 pb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <HighlightedText text={section.heading} highlight={highlight} />
            </h3>
          )}
          <div className="space-y-1">
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
  <section className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 shadow-xs">
    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
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
    <div className="mt-1.5 space-y-0.5 rounded border border-cyan-500/30 bg-cyan-950/20 p-2 text-xs text-cyan-200">
      {results.map(result => (
        <div key={result.sourceExpression}>
          <span className="font-semibold">{result.sourceExpression}</span>
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
  const sourceText = typeof body.source_text === 'string' ? body.source_text : '';
  const pdfPageLabel =
    contentProtocol.pdfPages.length > 0
      ? `${contentProtocol.pdfPages.length === 1 ? 'page' : 'pages'} ${contentProtocol.pdfPages.join(', ')}`
      : '';
  const trimmedQuery = searchQuery.trim();

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
    <article ref={articleRef} className="mx-auto max-w-5xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          aria-label={`Back to ${facility.shortName} protocols`}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to {facility.shortName} protocols
        </Button>
      </div>

      {/* COMPACT PROTOCOL HEADER */}
      <header className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 sm:p-5 text-white shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={`facility-${protocol.facilityId}` as any} size="sm">
            {facility.shortName}
          </Badge>
          <Badge variant="neutral" size="sm">
            {protocol.categoryLabel}
          </Badge>
          <Badge variant="success" size="sm">
            Published facility protocol
          </Badge>
        </div>
        <h1 className="mt-3 text-lg sm:text-xl font-bold tracking-tight text-white">
          <HighlightedText text={protocol.title} highlight={trimmedQuery} />
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
          <HighlightedText text={contentProtocol.summary} highlight={trimmedQuery} />
        </p>
        <dl className="mt-4 grid gap-2 border-t border-slate-800/80 pt-3 text-xs sm:grid-cols-2 text-slate-400">
          <div>
            <dt className="text-[10px] uppercase font-semibold text-slate-500">Hospital Source</dt>
            <dd className="mt-0.5 text-slate-300 font-medium">{protocol.sourceDocument}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase font-semibold text-slate-500">Protocol Type</dt>
            <dd className="mt-0.5 text-slate-300 font-medium">{labelFor(protocol.protocolType)}</dd>
          </div>
        </dl>
      </header>

      {/* FIND IN PROTOCOL BAR */}
      {trimmedQuery && (
        <div
          role="search"
          aria-label="Find within this protocol"
          className={`sticky top-[3.75rem] z-20 rounded-lg border px-3 py-2 shadow-xs backdrop-blur-md ${
            matchCount > 0
              ? 'border-amber-500/50 bg-amber-950/80 text-amber-200'
              : 'border-slate-800 bg-slate-900/85 text-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <Search className="h-3 w-3" />
              This protocol only
            </span>

            <span aria-live="polite" className="text-xs font-semibold">
              {matchCount > 0
                ? `${activeMatch + 1} of ${matchCount} match${matchCount === 1 ? '' : 'es'} for “${trimmedQuery}”`
                : `No matches for “${trimmedQuery}” in this protocol`}
            </span>

            {matchCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => stepMatch(-1)}
                  aria-label="Previous match"
                  className="rounded border border-current/30 p-1 hover:bg-white/10 transition-desktop"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => stepMatch(1)}
                  aria-label="Next match"
                  className="rounded border border-current/30 p-1 hover:bg-white/10 transition-desktop"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              {onSearchAllProtocols && (
                <button
                  type="button"
                  onClick={onSearchAllProtocols}
                  className="inline-flex items-center gap-1 rounded border border-current/30 px-2 py-1 text-[10px] font-semibold hover:bg-white/10 transition-desktop"
                >
                  <Globe2 className="h-3 w-3" />
                  Search all {facility.shortName} protocols
                </button>
              )}
              {onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear search"
                  className="rounded border border-current/30 p-1 hover:bg-white/10 transition-desktop"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          {matchCount > 0 && (
            <p className="mt-1 text-[10px] text-amber-300/80">
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
        <div className="rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-3 text-xs text-indigo-300 flex items-center justify-between gap-3">
          <p>
            This flowchart belongs to <strong className="text-white">{referencedProtocol.title}</strong>. Complete clinical content is displayed below.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onOpenProtocol(referencedProtocol)}
          >
            Open parent protocol
          </Button>
        </div>
      )}

      {/* WEIGHT-BASED DOSE TOOLBAR */}
      {hasWeightBasedDoses && (
        <div className="flex items-center gap-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200">
          <span className="font-semibold text-slate-200 shrink-0">Patient Weight:</span>
          <div className="w-24">
            <Input
              size="sm"
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={event => setWeight(event.target.value)}
              placeholder="kg"
              aria-label="Patient weight for dose calculation"
            />
          </div>
          <span className="text-[11px] text-cyan-300/80">kg — weight-based doses calculate inline below.</span>
        </div>
      )}

      {body.clinical_features !== undefined && (
        <ClinicalSection title="Clinical features" icon={<FileText className="h-4 w-4 text-indigo-400" />}>
          <ValueBlock value={body.clinical_features} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {managementSteps.length > 0 && (
        <ClinicalSection title="Management" icon={<ClipboardList className="h-4 w-4 text-emerald-400" />}>
          <div className="space-y-2">
            {managementSteps.map((step, index) => {
              const record = isRecord(step) ? step : {};
              const stepNumber = String(record.step_number ?? index + 1);
              const action = String(record.action ?? `Step ${index + 1}`);
              const details = record.details;
              return (
                <div key={`${stepNumber}-${index}`} className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                    {stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-white">
                      <HighlightedText text={action} highlight={trimmedQuery} />
                    </h3>
                    <div className="mt-1 text-xs text-slate-300">
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
        <ClinicalSection title="Medicines and treatment" icon={<Pill className="h-4 w-4 text-cyan-400" />}>
          <ValueBlock value={body.drugs} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {contentProtocol.embeddedDrugs.length > 0 && (
        <ClinicalSection title="Embedded medicine references" icon={<Pill className="h-4 w-4 text-cyan-400" />}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {contentProtocol.embeddedDrugs.map((drug, index) => (
              <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <h3 className="mb-2 text-xs font-semibold text-white">
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
        <ClinicalSection title="Equipment" icon={<ClipboardList className="h-4 w-4 text-sky-400" />}>
          <ValueBlock value={body.equipment} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {body.disposition !== undefined && (
        <ClinicalSection title="Disposition" icon={<Building2 className="h-4 w-4 text-purple-400" />}>
          <ValueBlock value={body.disposition} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {warnings.length > 0 && (
        <ClinicalSection title="Warnings" icon={<AlertTriangle className="h-4 w-4 text-rose-400" />}>
          <div className="rounded-md border border-rose-900/50 bg-rose-950/20 p-3">
            <ValueBlock value={warnings} highlight={trimmedQuery} />
          </div>
        </ClinicalSection>
      )}

      {body.note !== undefined && !referencedProtocol && (
        <ClinicalSection title="Notes" icon={<FileText className="h-4 w-4 text-amber-400" />}>
          <ValueBlock value={body.note} highlight={trimmedQuery} />
        </ClinicalSection>
      )}

      {additionalFields.length > 0 && (
        <ClinicalSection title="Additional protocol content" icon={<FileText className="h-4 w-4 text-slate-400" />}>
          <div className="space-y-3">
            {additionalFields.map(([key, value]) => (
              <div key={key}>
                <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{labelFor(key)}</h3>
                <ValueBlock value={value} highlight={trimmedQuery} />
              </div>
            ))}
          </div>
        </ClinicalSection>
      )}

      {sourceText && (
        <ClinicalSection
          title="Protocol content"
          icon={<FileText className="h-4 w-4 text-slate-400" />}
        >
          <TranscriptionView
            text={sourceText}
            title={contentProtocol.title}
            highlight={trimmedQuery}
          />
          <p className="mt-4 border-t border-slate-800 pt-2.5 text-[10px] leading-relaxed text-slate-500">
            Transcribed from {protocol.sourceDocument}
            {pdfPageLabel ? ` (${pdfPageLabel})` : ''}. Layout is formatted for desktop scanning;
            the exact clinical wording is preserved from the facility document.
          </p>
        </ClinicalSection>
      )}

      {sourceImage && (
        <ClinicalSection title="Facility source image" icon={<FileText className="h-4 w-4 text-slate-400" />}
        >
          <a
            href={sourceImage}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-slate-800 bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Open the full-size facility source image"
          >
            <img
              src={sourceImage}
              alt={sourceImageAlt}
              loading="lazy"
              className="mx-auto h-auto max-h-[75vh] w-auto max-w-full object-contain"
            />
          </a>
          <a
            href={sourceImage}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Open full-size source image
          </a>
        </ClinicalSection>
      )}
    </article>
  );
};
