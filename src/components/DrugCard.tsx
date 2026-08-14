import React from 'react';
import {Star} from 'lucide-react';
import {getAssociatedDiseasesForDrug} from '../clinical/legacyAdapter';
import {type InfusionDefinition} from '../clinical/calculations/infusions';
import {
  extractWeightDoseResults,
  infusionDefinitionFromDoseText,
} from '../clinical/calculations/weightDose';
import {getSourceGroupMeta} from '../app/catalog';
import {
  InfusionCalculatorWidget,
  type InfusionConfirmed,
  type InfusionDoses,
} from './InfusionCalculatorWidgets';

export function getEntryKey(item: any, category: string) {
  if (item?._meta?.id) return item._meta.id;
  const name = item.item || item.drug || item.condition_or_drug || item.poison_or_drug || item.antidote_treatment || item.product || '';
  return `${category}::${name}`;
}

export function sourceGroupFallbackFromCategory(selectedCategory: string): string | undefined {
  return selectedCategory === 'helen_guidelines'
    ? 'HJH'
    : selectedCategory === 'cmjah_guidelines'
      ? 'CMJAH'
      : selectedCategory === 'rmmch_guidelines'
        ? 'RMMCH'
        : undefined;
}

export const formatCalculatedDose = (value: number): string => {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/\.?0+$/, '');
};

export const WeightDoseSummary: React.FC<{
  text: string;
  label?: string;
  weight: string;
}> = ({text, label, weight}) => {
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
          {result.printedMax ? (
            // Never silently cap: show both values and flag the overshoot so
            // a prescribing error is visible rather than hidden by a clamp.
            result.maximum > result.printedMax.value ? (
              <span className="ml-1 font-bold text-rose-300">
                — exceeds the printed maximum of {formatCalculatedDose(result.printedMax.value)} {result.printedMax.unit}: give the maximum, not the weight-based value
              </span>
            ) : (
              <span className="ml-1 text-slate-400">
                — printed maximum {formatCalculatedDose(result.printedMax.value)} {result.printedMax.unit}
              </span>
            )
          ) : /\bmax(?:imum)?\b/i.test(text) ? (
            <span className="ml-1 text-slate-400">— apply the printed maximum</span>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export interface ClinicalCardSharedProps {
  theme: 'dark' | 'light';
  weight: string;
  sourceGroupFallback?: string;
  searchHighlight?: string;
  isFavourite: (key: string) => boolean;
  onToggleFavourite: (key: string, event?: React.MouseEvent) => void;
  onRecordRecentlyViewed: (key: string, name: string, catKey: string, type: 'drug' | 'procedure') => void;
  onSearchQuery: (query: string) => void;
  infusionDoses: InfusionDoses;
  setInfusionDoses: React.Dispatch<React.SetStateAction<InfusionDoses>>;
  infusionConfirmed: InfusionConfirmed;
  setInfusionConfirmed: React.Dispatch<React.SetStateAction<InfusionConfirmed>>;
}

export interface DrugCardProps extends ClinicalCardSharedProps {
  item: any;
  category: string;
}

export const DrugCard: React.FC<DrugCardProps> = ({
  item: it,
  category: cat,
  theme,
  weight,
  sourceGroupFallback,
  isFavourite,
  onToggleFavourite,
  onRecordRecentlyViewed,
  onSearchQuery,
  infusionDoses,
  setInfusionDoses,
  infusionConfirmed,
  setInfusionConfirmed,
}) => {
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

  const isFirstLine = ntLower.includes('first-line');
  const isSection21 = ntLower.includes('section 21');
  const isWarning = ntLower.includes('warning') || ntLower.includes('avoid') || ntLower.includes('contraindicated') || ntLower.includes('lethal');
  const isCaution = ntLower.includes('caution') || ntLower.includes('side effect') || ntLower.includes('high risk');
  const associatedDiseases = getAssociatedDiseasesForDrug(n);

  const sourceMeta = getSourceGroupMeta(it?._meta?.sourceGroup, sourceGroupFallback);

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

  return (
    <div
      onClick={() => onRecordRecentlyViewed(key, n, cat, 'drug')}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onRecordRecentlyViewed(key, n, cat, 'drug');
        }
      }}
      aria-label={`${n}, ${sourceMeta.label}. Tap to view details.`}
      className={`p-4 rounded-xl border transition-all duration-200 mb-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${theme === 'dark' ? 'bg-[#0b1717] border-teal-950/40 hover:border-teal-800/30' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className={`font-bold text-md leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>{n}</h4>
            <span className={`shrink-0 text-[10px] border font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? sourceMeta.badgeClass : sourceMeta.lightBadgeClass}`}>
              {sourceMeta.emoji} {sourceMeta.short}
            </span>
            {isFirstLine && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded uppercase">1st Line</span>}
            {isSection21 && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Section 21</span>}
            {isWarning && <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Warning</span>}
            {isCaution && !isWarning && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded uppercase">Caution</span>}
          </div>
          {it.category && (
            <div className="text-[10px] text-slate-500">{it.category}</div>
          )}
        </div>
        <button
          type="button"
          onClick={e => onToggleFavourite(key, e)}
          aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
          className={`p-2 -m-1 rounded-full hover:bg-slate-800/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${fav ? 'text-yellow-400' : 'text-slate-600'}`}
        >
          <Star className={`h-5 w-5 ${fav ? 'fill-yellow-400' : ''}`} />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {(it.adult_dose || it.adult_settings) && (
          <div className="flex items-start gap-2.5 text-sm">
            <span className="text-[10px] uppercase font-black bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">A</span>
            <div className="text-slate-300 flex-1 leading-relaxed">
              {it.adult_dose || it.adult_settings}
              <WeightDoseSummary text={adultDoseText} label="Adult" weight={weight} />
            </div>
          </div>
        )}

        {(it.paediatric_dose || it.paediatric_settings) && (
          <div className="flex items-start gap-2.5 text-sm">
            <span className="text-[10px] uppercase font-black bg-[#135050] text-[#00d9b5] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">P</span>
            <div className="text-[#00d9b5] flex-1 leading-relaxed">
              {it.paediatric_dose || it.paediatric_settings}
              <WeightDoseSummary text={paediatricDoseText} label="Paediatric" weight={weight} />
            </div>
          </div>
        )}

        {it.protocol_dose && (
          <div className="flex items-start gap-2.5 text-sm">
            <span className="text-[10px] uppercase font-black bg-purple-950/40 text-purple-300 border border-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 w-6 text-center">Rx</span>
            <span className="text-slate-300 flex-1 leading-relaxed">
              {it.protocol_dose}
              <WeightDoseSummary text={protocolDoseText} label="Protocol" weight={weight} />
            </span>
          </div>
        )}

        {it.route && (
          <div className="flex items-start gap-2.5 text-sm">
            <span className="text-[10px] uppercase font-black bg-sky-950/50 text-sky-300 border border-sky-900/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
              Route
            </span>
            <span className="text-slate-300 flex-1 leading-relaxed">{it.route}</span>
          </div>
        )}

        {it?._meta?.infusionPresetId && renderInfusionCalculatorWidget(it._meta.infusionPresetId)}
        {dynamicInfusions.map(definition => (
          <React.Fragment key={definition.id}>
            {renderInfusionCalculatorWidget(definition)}
          </React.Fragment>
        ))}

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
                    onSearchQuery(dis);
                  }}
                  className="text-[10px] bg-teal-950/50 hover:bg-teal-900/60 text-teal-300 border border-teal-800/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  {dis}
                </button>
              ))}
            </div>
          </div>
        )}

        {nt && (
          <div className={`mt-3 p-3 rounded-lg text-xs leading-normal border ${isWarning ? 'bg-rose-950/25 border-rose-900/35 text-rose-200' :
              isCaution ? 'bg-amber-950/20 border-amber-900/35 text-amber-200' :
                'bg-black/10 border-teal-950/20 text-slate-400'
            }`}>
            {nt}
            <WeightDoseSummary text={nt} label="Weight calculation" weight={weight} />
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
