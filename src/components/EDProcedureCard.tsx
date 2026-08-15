import React from 'react';
import {ChevronDown, Star, Zap, Check} from 'lucide-react';
import {getPairedDrugsForDisease} from '../clinical/legacyAdapter';
import {type InfusionDefinition} from '../clinical/calculations/infusions';
import {infusionDefinitionFromDoseText} from '../clinical/calculations/weightDose';
import {getSourceGroupMeta, PROTOCOL_MINDMAP_LINKS} from '../app/catalog';
import {
  InfusionCalculatorWidget,
  type InfusionConfirmed,
  type InfusionDoses,
} from './InfusionCalculatorWidgets';
import {
  DrugCard,
  WeightDoseSummary,
  getEntryKey,
  type ClinicalCardSharedProps,
} from './DrugCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface EDProcedureCardProps extends ClinicalCardSharedProps {
  item: any;
  category: string;
  isExpanded: boolean;
  onToggleExpanded: (key: string) => void;
  checklistStatus: Record<string, boolean>;
  onToggleChecklistItem: (itemKey: string) => void;
  onOpenMindMap: (mindMapId: string) => void;
}

export const EDProcedureCard: React.FC<EDProcedureCardProps> = ({
  item: p,
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
  isExpanded,
  onToggleExpanded,
  checklistStatus,
  onToggleChecklistItem,
  onOpenMindMap,
}) => {
  const key = getEntryKey(p, cat);
  const fav = isFavourite(key);
  const pairedDrugs = getPairedDrugsForDisease(p.item);
  const procedureSourceMeta = getSourceGroupMeta(p?._meta?.sourceGroup, sourceGroupFallback);

  const drugCardProps: ClinicalCardSharedProps = {
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
  };

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
      className={`p-3.5 rounded-lg border transition-desktop mb-2.5 ${
        theme === 'dark'
          ? 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div
        onClick={() => {
          onToggleExpanded(key);
          onRecordRecentlyViewed(key, p.item, cat, 'procedure');
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleExpanded(key);
            onRecordRecentlyViewed(key, p.item, cat, 'procedure');
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${p.item}, ${procedureSourceMeta.label}. Tap to expand protocol.`}
        className="flex items-start justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
      >
        <div className="flex items-start gap-2 flex-wrap min-w-0 flex-1">
          <span className="text-base shrink-0" aria-hidden="true">🛠️</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-xs text-white leading-tight">{p.item}</h4>
            <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${theme === 'dark' ? procedureSourceMeta.badgeClass : procedureSourceMeta.lightBadgeClass}`}>
              {procedureSourceMeta.emoji} {procedureSourceMeta.short}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {PROTOCOL_MINDMAP_LINKS[p.item] && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onOpenMindMap(PROTOCOL_MINDMAP_LINKS[p.item]); }}
              aria-label={`Open ${p.item} interactive flowchart`}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500/20 transition-desktop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              title="View the interactive flowchart for this protocol"
            >
              <Zap className="w-3 h-3" />
              Flowchart
            </button>
          )}
          <button
            type="button"
            onClick={e => onToggleFavourite(key, e)}
            aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
            className={`p-1.5 rounded-full hover:bg-slate-800 transition-desktop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${fav ? 'text-amber-400' : 'text-slate-500'}`}
          >
            <Star className={`h-4 w-4 ${fav ? 'fill-amber-400' : ''}`} />
          </button>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3.5">
          {p.equipment && p.equipment.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Equipment</span>
              <div className="flex flex-wrap gap-1">
                {p.equipment.map((eq: string) => (
                  <span key={eq} className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {p.checklist_items && p.checklist_items.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Procedure Checklist</span>
              <div className="space-y-1">
                {p.checklist_items.map((item: string) => {
                  const isChecked = checklistStatus[key + '::' + item] === true;
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-desktop ${
                        isChecked ? 'bg-indigo-950/20 text-slate-500 line-through' : 'bg-slate-950/40 text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleChecklistItem(key + '::' + item)}
                        className="sr-only"
                      />
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                        isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className="text-xs leading-normal">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {pairedDrugs.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <span>Paired Drugs &amp; Infusions for {p.item}</span>
                <Badge variant="primary" size="sm">{pairedDrugs.length}</Badge>
              </div>
              <div className="space-y-2">
                {pairedDrugs.map(d => (
                  <DrugCard
                    key={getEntryKey(d, (d._meta as any)?.categoryId || cat)}
                    item={d}
                    category={(d._meta as any)?.categoryId || cat}
                    {...drugCardProps}
                  />
                ))}
              </div>
            </div>
          )}

          {p.drugs && p.drugs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applicable Drugs</span>
              {p.drugs.map((d: any) => (
                <DrugCard
                  key={getEntryKey(d, cat)}
                  item={d}
                  category={cat}
                  {...drugCardProps}
                />
              ))}
            </div>
          )}

          {p.management_steps && p.management_steps.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step-by-step Timeline</span>
              <div className="relative border-l border-slate-800 pl-3.5 ml-2 space-y-3">
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
                      <div className="absolute -left-[20px] top-0.5 bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px]">
                        {s.step_number}
                      </div>
                      <div className="font-semibold text-xs text-slate-200">{s.action}</div>
                      {s.details && (
                        <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {s.details}
                          <WeightDoseSummary text={stepDetails} label="Weight calculation" weight={weight} />
                        </div>
                      )}
                      {stepInfusion && renderInfusionCalculatorWidget(stepInfusion)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {p.notes_updates && (
            <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800 text-xs leading-relaxed text-slate-400">
              {p.notes_updates}
              <WeightDoseSummary text={String(p.notes_updates)} label="Weight calculation" weight={weight} />
            </div>
          )}

          {p?._meta?.warnings?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Warnings and contraindications</span>
              {p._meta.warnings.map((warning: any) => (
                <div
                  key={warning.id}
                  role="alert"
                  className={`rounded border p-2.5 text-xs leading-relaxed ${
                    warning.severity === 'critical'
                      ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                      : warning.severity === 'caution'
                        ? 'border-amber-900/50 bg-amber-950/20 text-amber-200'
                        : 'border-blue-900/40 bg-blue-950/20 text-blue-200'
                  }`}
                >
                  {warning.text}
                  <WeightDoseSummary text={String(warning.text)} label="Weight calculation" weight={weight} />
                </div>
              ))}
            </div>
          )}

          {p?._meta?.sourceRefs?.length > 0 && (
            <div className="border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
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
