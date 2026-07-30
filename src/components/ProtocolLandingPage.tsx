import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pill,
} from 'lucide-react';
import {
  findReferencedHospitalProtocol,
  HOSPITALS,
  type HospitalProtocol,
} from '../clinical/hospitalProtocols';
import {extractWeightDoseResults} from '../clinical/calculations/weightDose';

interface ProtocolLandingPageProps {
  protocol: HospitalProtocol;
  onBack: () => void;
  onOpenProtocol: (protocol: HospitalProtocol) => void;
  weight: string;
  setWeight: (weight: string) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const labelFor = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const compactSourceText = (value: string): string =>
  value
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');

const ValueBlock: React.FC<{value: unknown}> = ({value}) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{String(value)}</p>;
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
                      <ValueBlock value={entry} />
                    </div>
                  ))}
                </div>
              ) : (
                <ValueBlock value={item} />
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
            <ValueBlock value={entry} />
          </div>
        ))}
      </div>
    );
  }
  return null;
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
}) => {
  const facility = HOSPITALS[protocol.facilityId];
  const referencedProtocol = findReferencedHospitalProtocol(protocol);
  const contentProtocol = referencedProtocol ?? protocol;
  const body = contentProtocol.body;
  const managementSteps = Array.isArray(body.management_steps) ? body.management_steps : [];
  const warnings = Array.isArray(body.warnings) ? body.warnings : [];
  const sourceText = typeof body.source_text === 'string' ? compactSourceText(body.source_text) : '';
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
    'equipment',
  ]);
  const additionalFields = Object.entries(body).filter(
    ([key, value]) => !reserved.has(key) && value !== null && value !== undefined && value !== '',
  );
  const hasWeightBasedDoses = /(?:mcg|µg|ug|mg|mmol|g|m[lℓ]|units?|iu|u|meq|j)\s*\/\s*kg/i.test(
    JSON.stringify({body, embeddedDrugs: contentProtocol.embeddedDrugs}),
  );

  return (
    <article className="mx-auto max-w-5xl space-y-5 pb-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {facility.shortName} protocols
      </button>

      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl sm:p-9">
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
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{protocol.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">{contentProtocol.summary}</p>
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
        <label className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-950">
          <span className="font-black">Patient weight</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={event => setWeight(event.target.value)}
            placeholder="kg"
            className="w-28 rounded-lg border border-cyan-400 bg-white px-3 py-2 font-bold outline-none"
          />
          <span className="text-xs">kg — weight-based doses calculate inline below.</span>
        </label>
      )}

      {body.clinical_features !== undefined && (
        <ClinicalSection title="Clinical features" icon={<FileText className="h-5 w-5 text-indigo-500" />}>
          <ValueBlock value={body.clinical_features} />
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
                    <h3 className="font-black text-slate-900 dark:text-white">{action}</h3>
                    <div className="mt-1">
                      <ValueBlock value={details} />
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
          <ValueBlock value={body.drugs} />
        </ClinicalSection>
      )}

      {contentProtocol.embeddedDrugs.length > 0 && (
        <ClinicalSection title="Embedded medicine references" icon={<Pill className="h-5 w-5 text-cyan-500" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {contentProtocol.embeddedDrugs.map((drug, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="mb-3 font-black text-slate-900 dark:text-white">
                  {String(drug.item ?? drug.drug ?? drug.condition_or_drug ?? `Medicine ${index + 1}`)}
                </h3>
                <ValueBlock value={drug} />
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
          <ValueBlock value={body.equipment} />
        </ClinicalSection>
      )}

      {body.disposition !== undefined && (
        <ClinicalSection title="Disposition" icon={<Building2 className="h-5 w-5 text-violet-500" />}>
          <ValueBlock value={body.disposition} />
        </ClinicalSection>
      )}

      {warnings.length > 0 && (
        <ClinicalSection title="Warnings" icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}>
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <ValueBlock value={warnings} />
          </div>
        </ClinicalSection>
      )}

      {body.note !== undefined && !referencedProtocol && (
        <ClinicalSection title="Notes" icon={<FileText className="h-5 w-5 text-amber-500" />}>
          <ValueBlock value={body.note} />
        </ClinicalSection>
      )}

      {additionalFields.length > 0 && (
        <ClinicalSection title="Additional protocol content" icon={<FileText className="h-5 w-5 text-slate-500" />}>
          <div className="space-y-4">
            {additionalFields.map(([key, value]) => (
              <div key={key}>
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{labelFor(key)}</h3>
                <ValueBlock value={value} />
              </div>
            ))}
          </div>
        </ClinicalSection>
      )}

      {sourceText && (
        <ClinicalSection title="Source transcription" icon={<FileText className="h-5 w-5 text-slate-500" />}>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
            {sourceText}
          </pre>
        </ClinicalSection>
      )}
    </article>
  );
};
