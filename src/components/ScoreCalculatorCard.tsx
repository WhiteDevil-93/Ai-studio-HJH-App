import React from 'react';
import {Calculator, Info, Star} from 'lucide-react';
import {calculateFormula, type FormulaKey} from '../clinical/calculations/formulas';
import {formulaInputSpec} from '../clinical/calculations/formulaInputSpecs';
import {calculateChecklistScore, evaluateCanadianCSpine, evaluateNews2} from '../clinical/scores';
import {
  interpretAnionGap,
  interpretBurchWartofsky,
  interpretCamIcu,
  interpretCanadianCSpine,
  interpretChecklistScore,
  interpretCorrectedSodium,
  interpretFreeWaterDeficit,
  interpretGcs,
  interpretGradedScore,
  interpretMeld,
  interpretNews2Risk,
  interpretNexus,
  interpretParkland,
  interpretPesi,
  interpretPfRatio,
  interpretSodiumDeficit,
  interpretTieredRiskRule,
  PF_RATIO_ARDS_CAVEAT,
} from '../clinical/scoreInterpretations';
import type {CriterionAnswer} from '../clinical/types';

export type FormulaInputs = Record<string, Record<string, string>>;
export type ChecklistAnswers = Record<string, Record<string, CriterionAnswer>>;
export type GradedScoreAnswers = Record<string, Record<string, number>>;
export type News2Scale = 'scale1' | 'scale2';
export type News2Answers = Record<string, {label: string; value: number}>;

export interface ScoreCalculatorCardProps {
  scoreKey: string;
  entry: any;
  theme: 'dark' | 'light';
  formulaInputs: FormulaInputs;
  setFormulaInputs: React.Dispatch<React.SetStateAction<FormulaInputs>>;
  checklistAnswers: ChecklistAnswers;
  setChecklistAnswers: React.Dispatch<React.SetStateAction<ChecklistAnswers>>;
  gradedScoreAnswers: GradedScoreAnswers;
  setGradedScoreAnswers: React.Dispatch<React.SetStateAction<GradedScoreAnswers>>;
  gcsState: Record<string, number>;
  setGcsState: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  nexusState: Record<string, boolean>;
  setNexusState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  ccsState: Record<string, boolean>;
  setCcsState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  ccsApplicable: CriterionAnswer;
  setCcsApplicable: React.Dispatch<React.SetStateAction<CriterionAnswer>>;
  ccsRotation: CriterionAnswer;
  setCcsRotation: React.Dispatch<React.SetStateAction<CriterionAnswer>>;
  burchWartofskyState: Record<string, number>;
  setBurchWartofskyState: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  news2Scale: News2Scale;
  setNews2Scale: React.Dispatch<React.SetStateAction<News2Scale>>;
  news2Answers: News2Answers;
  setNews2Answers: React.Dispatch<React.SetStateAction<News2Answers>>;
  isFavourite: boolean;
  onToggleFavourite: (event?: React.MouseEvent) => void;
  onRecordRecentlyViewed: () => void;
}

export type ScoreCalculatorSharedProps = Omit<
  ScoreCalculatorCardProps,
  'scoreKey' | 'entry' | 'isFavourite' | 'onToggleFavourite' | 'onRecordRecentlyViewed'
>;

export interface ScoreListProps extends ScoreCalculatorSharedProps {
  scores: Record<string, any>;
  isScoreFavourite: (scoreKey: string) => boolean;
  onToggleScoreFavourite: (scoreKey: string, event?: React.MouseEvent) => void;
  onRecordScoreRecentlyViewed: (scoreKey: string, name: string) => void;
}

export const scoreFavouriteKey = (key: string) => `score.${key}`;

const evalFormula = (formulaKey: FormulaKey, inputs: Record<string, string>) => {
  try {
    const numericInputs: Record<string, number> = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (value === '') return {result: null, error: ''};
      numericInputs[key] = Number(value);
    }
    return {result: calculateFormula(formulaKey, numericInputs), error: ''};
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Unable to calculate',
    };
  }
};

const getFormulaResultDesc = (calcKey: string, result: number) => {
  if (result === null || isNaN(result)) return null;

  if (calcKey === 'parkland') {
    const plan = interpretParkland(result);
    return (
      <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm space-y-2 text-slate-300">
        <div className="text-teal-400 font-bold">HJH Modified Brooke Resuscitation Plan</div>
        <div>Total 24-hour Volume: <strong className="text-white">{plan.totalVolumeMl.toFixed(0)} mL</strong></div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
            <div className="text-xs text-slate-400">First 8 Hours From Time of Burn (50%)</div>
            <div className="font-bold text-teal-300">{plan.first8hMl.toFixed(0)} mL</div>
            <div className="text-[11px] text-teal-400">{plan.hourlyFirst8hMl.toFixed(1)} mL/hr</div>
          </div>
          <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
            <div className="text-xs text-slate-400">Next 16 Hours (50%)</div>
            <div className="font-bold text-teal-300">{plan.next16hMl.toFixed(0)} mL</div>
            <div className="text-[11px] text-teal-400">{plan.hourlyNext16hMl.toFixed(1)} mL/hr</div>
          </div>
        </div>
        <div className="text-xs text-rose-300">{plan.warning}</div>
      </div>
    );
  }

  if (calcKey === 'anion_gap') {
    const interp = interpretAnionGap(result);
    return (
      <div className={`mt-3 p-3 rounded-lg text-sm border ${interp.tone === 'high' ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' : 'bg-teal-950/20 border-teal-500/20 text-teal-200'}`}>
        <div className="font-bold">{interp.title}</div>
        <div className="text-xs mt-1 leading-normal text-slate-300">{interp.action}</div>
      </div>
    );
  }

  if (calcKey.startsWith('corrected_na_hjh_')) {
    const interp = interpretCorrectedSodium(result);
    return (
      <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
        <div>Corrected Sodium: <strong className="text-white">{result.toFixed(1)} mmol/L</strong></div>
        <div className="text-xs text-slate-400 mt-1">{interp.action}</div>
      </div>
    );
  }

  if (calcKey === 'free_water_deficit') {
    const interp = interpretFreeWaterDeficit(result);
    return (
      <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
        <div>Free Water Deficit: <strong className="text-white">{result.toFixed(1)} Litres</strong></div>
        <div className="text-xs text-rose-300 mt-1">{interp.action}</div>
      </div>
    );
  }

  if (calcKey === 'sodium_deficit') {
    const interp = interpretSodiumDeficit(result);
    return (
      <div className="mt-3 p-3 rounded-lg bg-teal-950/20 border border-teal-500/20 text-sm text-slate-300">
        <div>Sodium Deficit: <strong className="text-white">{result.toFixed(0)} mmol</strong></div>
        <div className="text-xs text-rose-300 mt-1">{interp.action}</div>
      </div>
    );
  }

  if (calcKey === 'pf_ratio') {
    const interp = interpretPfRatio(result);
    const severityClass =
      interp.tone === 'high'
        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 animate-pulse'
        : interp.title.includes('Moderate')
          ? 'bg-orange-950/30 border-orange-500/30 text-orange-200'
          : interp.title.includes('Mild')
            ? 'bg-yellow-950/20 border-yellow-500/20 text-yellow-100'
            : 'bg-teal-950/20 border-teal-500/20 text-teal-200';
    return (
      <div className={`mt-3 p-3 rounded-lg text-sm border ${severityClass}`}>
        <div className="font-bold">{interp.title}</div>
        <div className="text-xs mt-1 text-slate-300">{interp.action}</div>
        <div className="text-[11px] mt-2 text-slate-400 leading-snug">
          {PF_RATIO_ARDS_CAVEAT}
        </div>
      </div>
    );
  }

  if (calcKey === 'pesi') {
    const interp = interpretPesi(result);
    const severityClass =
      interp.title.startsWith('Class V')
        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 animate-pulse'
        : interp.title.startsWith('Class IV')
          ? 'bg-rose-950/20 border-rose-500/20 text-rose-200'
          : interp.title.startsWith('Class III')
            ? 'bg-orange-950/30 border-orange-500/30 text-orange-200'
            : interp.title.startsWith('Class II')
              ? 'bg-yellow-950/20 border-yellow-500/20 text-yellow-100'
              : 'bg-teal-950/20 border-teal-500/20 text-teal-200';
    return (
      <div className={`mt-3 p-3 rounded-lg text-sm border ${severityClass}`}>
        <div className="font-bold">{interp.title}</div>
        <div className="text-xs mt-1 text-slate-300">{interp.action}</div>
      </div>
    );
  }

  if (calcKey === 'meld') {
    const interp = interpretMeld(result);
    const severityClass =
      result >= 40
        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 animate-pulse'
        : result >= 30
          ? 'bg-rose-950/20 border-rose-500/20 text-rose-200'
          : result >= 20
            ? 'bg-orange-950/30 border-orange-500/30 text-orange-200'
            : result >= 10
              ? 'bg-yellow-950/20 border-yellow-500/20 text-yellow-100'
              : 'bg-teal-950/20 border-teal-500/20 text-teal-200';
    return (
      <div className={`mt-3 p-3 rounded-lg text-sm border ${severityClass}`}>
        <div className="text-xs text-slate-300">{interp.action}</div>
      </div>
    );
  }

  return null;
};

const ScoreFavouriteButton: React.FC<{
  isFavourite: boolean;
  onToggleFavourite: (event?: React.MouseEvent) => void;
}> = ({isFavourite, onToggleFavourite}) => (
  <button
    type="button"
    onClick={event => onToggleFavourite(event)}
    aria-label={isFavourite ? 'Remove calculator from favourites' : 'Add calculator to favourites'}
    className={`rounded-full p-1.5 ${isFavourite ? 'text-yellow-400' : 'text-slate-500'}`}
  >
    <Star className={`h-4 w-4 ${isFavourite ? 'fill-yellow-400' : ''}`} />
  </button>
);

export const ScoreCalculatorCard: React.FC<ScoreCalculatorCardProps> = ({
  scoreKey,
  entry: sc,
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
  isFavourite,
  onToggleFavourite,
  onRecordRecentlyViewed,
}) => {
  const key = scoreKey;
  const isFormula = sc.calculator_type === 'formula';
  const renderScoreTitle = () => (
    <div className="min-w-0">
      <div className="font-bold text-md text-[#00d9b5]">{sc.name}</div>
      <div className="text-[9px] font-normal text-slate-500">
        {sc.source_label
          ? sc.source_label
          : sc.source_pages?.length > 0
            ? `HJH PDF page${sc.source_pages.length > 1 ? 's' : ''} ${sc.source_pages.join(', ')} · clinical review pending`
            : 'Source page mapping or external-source approval required'}
      </div>
      {sc.review_status && (
        <div className="mt-0.5 text-[9px] font-medium text-amber-300">
          Review status: {String(sc.review_status).replace(/-/g, ' ')}
        </div>
      )}
      {Array.isArray(sc.applicability) && sc.applicability.length > 0 && (
        <details
          className="mt-1 text-[10px] font-normal text-slate-400"
          onClick={event => event.stopPropagation()}
        >
          <summary className="cursor-pointer font-bold text-teal-300">
            Applicability
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {sc.applicability.map((condition: string) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );

  const handleFormulaInputChange = (calcKey: string, inputKey: string, val: string) => {
    setFormulaInputs(prev => ({
      ...prev,
      [calcKey]: {
        ...(prev[calcKey] || {}),
        [inputKey]: val,
      },
    }));
  };

  if (isFormula) {
    const inputs = formulaInputs[key] || {};
    const formulaKey = sc.formula_id as FormulaKey | undefined;
    const hasStarted = Object.values(inputs).some(value => value !== '');
    const evaluation = formulaKey && !sc.disabled_reason && hasStarted
      ? evalFormula(formulaKey, inputs)
      : {result: null, error: ''};
    const result = evaluation.result;

    return (
      <div
        key={key}
        onClick={onRecordRecentlyViewed}
        className={`p-4 rounded-xl border transition mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>
        {sc.disabled_reason && (
          <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-200" role="alert">
            <strong>Calculation unavailable:</strong> {sc.disabled_reason}
          </div>
        )}
        {sc.review_note && (
          <div className="mb-3 rounded-lg border border-teal-900/30 bg-teal-950/10 p-2 text-[11px] leading-relaxed text-slate-300">
            {sc.review_note}
          </div>
        )}
        {sc.formula && (
          <div className="mb-3 rounded-lg border border-teal-900/30 bg-black/20 p-2 text-[10px] text-slate-300">
            <span className="font-bold text-teal-300">Source formula:</span>{' '}
            <code>{sc.formula}</code>
          </div>
        )}
        <div className="space-y-3">
          {sc.inputs.map((inp: any) => {
            const spec = formulaInputSpec(formulaKey, inp.key);
            // Binary inputs render as explicit No/Yes toggles so the UI can
            // only ever submit the exact 0/1 the fail-closed validator
            // accepts — free-typing 0.5 or 2 is impossible, and "unanswered"
            // stays visibly unanswered instead of defaulting to "no".
            if (spec?.kind === 'binary') {
              const current = inputs[inp.key] ?? '';
              return (
                <div key={inp.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-300">{inp.name}</span>
                  <div className="flex items-center gap-1.5" role="group" aria-label={`${sc.name}: ${inp.name}`}>
                    {(['0', '1'] as const).map(optionValue => (
                      <button
                        key={optionValue}
                        type="button"
                        onClick={() => handleFormulaInputChange(key, inp.key, optionValue)}
                        disabled={Boolean(sc.disabled_reason)}
                        aria-pressed={current === optionValue}
                        className={`rounded border px-3 py-1 text-xs font-bold transition ${current === optionValue
                            ? optionValue === '1'
                              ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                              : 'border-teal-400 bg-teal-500/20 text-teal-200'
                            : 'border-slate-700 bg-slate-900/50 text-slate-400'
                          }`}
                      >
                        {optionValue === '1' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={inp.key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-300">{inp.name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min={spec?.kind === 'bounded' ? spec.min : 0}
                    max={spec?.kind === 'bounded' ? spec.max : undefined}
                    value={inputs[inp.key] || ''}
                    placeholder="--"
                    onChange={e => handleFormulaInputChange(key, inp.key, e.target.value)}
                    disabled={Boolean(sc.disabled_reason)}
                    aria-label={`${sc.name}: ${inp.name} (${inp.unit})`}
                    className="w-24 px-2 py-1 bg-black/20 border border-teal-800/40 rounded text-center text-sm text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                  />
                  <span className="text-xs text-slate-400 w-12">{inp.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
        {evaluation.error && (
          <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/20 p-2 text-xs text-rose-200" role="alert">
            {evaluation.error}
          </div>
        )}
        {result !== null && (
          <div className="mt-4 pt-3 border-t border-teal-900/20" aria-live="polite">
            <div className="text-xs text-slate-400">Calculated Output:</div>
            <div className="text-2xl font-black text-teal-400 mt-1">
              {result.value.toFixed(2)} <span className="text-sm">{result.unit}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Working: {result.working}</div>
            {getFormulaResultDesc(key, result.value)}
          </div>
        )}
      </div>
    );
  }

  // Interactive Score Matrix Renderers
  if (key === 'gcs') {
    const eye = gcsState.eye || 0;
    const verbal = gcsState.verbal || 0;
    const motor = gcsState.motor || 0;
    const gcsTotal = eye + verbal + motor;
    const gcsInterp = interpretGcs(eye, verbal, motor);
    const severityLabel = gcsInterp?.title ?? 'Select values';
    const severityAction = gcsInterp?.action ?? 'Provide GCS criteria selections to evaluate severity.';
    const severityClass =
      gcsInterp?.tone === 'high'
        ? 'text-rose-400 animate-pulse'
        : gcsInterp?.tone === 'moderate'
          ? 'text-amber-400'
          : gcsInterp?.tone === 'low'
            ? 'text-teal-400'
            : 'text-slate-400';

    return (
      <div
        key={key}
        onClick={onRecordRecentlyViewed}
        className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>

        <div className="space-y-4">
          {sc.components.map((comp: any) => (
            <div key={comp.key} className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {comp.options.map((opt: any) => {
                  const isSelected = gcsState[comp.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setGcsState(prev => ({...prev, [comp.key]: opt.value}))}
                      className={`px-2 py-1.5 rounded-lg border text-left flex flex-col justify-between transition h-14 ${isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                        }`}
                    >
                      <div className="flex justify-between w-full items-start">
                        <span className="text-[11px] font-bold truncate pr-1">{opt.label}</span>
                        <span className={`text-[10px] font-black px-1 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800'}`}>{opt.value}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 line-clamp-1 leading-none">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {eye > 0 && verbal > 0 && motor > 0 && (
          <div className="mt-4 pt-4 border-t border-teal-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Total GCS Score:</div>
              <div className="text-3xl font-black text-teal-400 mt-1">{gcsTotal} <span className="text-sm font-normal text-slate-400">/ 15</span></div>
            </div>
            <div className="p-3 bg-black/20 rounded-lg flex-1">
              <div className={`font-bold text-sm ${severityClass}`}>{severityLabel}</div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{severityAction}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (key === 'nexus') {
    const nexusKeys = sc.components.map((comp: any) => comp.key);
    const nexusInterp = interpretNexus(nexusState, nexusKeys);
    const isHighRisk = nexusInterp?.tone === 'high';

    return (
      <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>

        <div className="space-y-2">
          {sc.components.map((comp: any) => {
            const currentVal = nexusState[comp.key];
            return (
              <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/20">
                <span className="text-sm font-medium text-slate-200">{comp.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setNexusState(prev => ({...prev, [comp.key]: false}))}
                    className={`px-3 py-1 text-xs font-bold rounded border transition ${currentVal === false
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setNexusState(prev => ({...prev, [comp.key]: true}))}
                    className={`px-3 py-1 text-xs font-bold rounded border transition ${currentVal === true
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {nexusInterp && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${isHighRisk ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' : 'bg-teal-950/20 border-teal-500/20 text-teal-200'}`}>
            <div className="font-bold">{nexusInterp.title}</div>
            <div className="text-xs mt-1 text-slate-300">{nexusInterp.action}</div>
          </div>
        )}
      </div>
    );
  }

  if (key === 'canadian_cspine') {
    const highRiskComponents = sc.components.filter((comp: any) => comp.dangerous);
    const lowRiskComponents = sc.components.filter((comp: any) => comp.simple);
    const toAnswer = (value: boolean | undefined): CriterionAnswer =>
      value === true ? 'yes' : value === false ? 'no' : 'unanswered';
    const ccsResult = evaluateCanadianCSpine({
      applicable: ccsApplicable === 'yes' || ccsApplicable === 'no' ? ccsApplicable : 'unanswered',
      highRisk: Object.fromEntries(
        highRiskComponents.map((comp: any) => [comp.key, toAnswer(ccsState[comp.key])]),
      ),
      lowRisk: Object.fromEntries(
        lowRiskComponents.map((comp: any) => [comp.key, toAnswer(ccsState[comp.key])]),
      ),
      rotation45Degrees: ccsRotation,
    });
    const ccsInterp = interpretCanadianCSpine(ccsResult.state);
    const highRiskComplete = ccsResult.state !== 'high-risk-incomplete' && ccsResult.state !== 'applicability-required' && ccsResult.state !== 'not-applicable';
    const isDangerous = ccsResult.state === 'imaging-high-risk';

    return (
      <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>

        <p className="text-[11px] text-slate-400 mb-3">HJH Canadian C-Spine workflow for eligible alert and stable trauma patients (PDF page 54).</p>
        <div className="mb-3 rounded border border-amber-500/30 bg-amber-950/20 p-2 text-[10px] text-amber-100">
          If the HJH Head Injury protocol indicates CT brain, the source pathway directs non-contrast CT brain and C-spine.
        </div>

        <div className="mb-4 rounded-lg border border-teal-900/30 bg-black/10 p-3">
          <div className="mb-2 text-xs font-bold text-teal-300">Applicability confirmed?</div>
          <p className="mb-2 text-[10px] text-slate-400">
            Trauma, GCS 15, stable vitals, age ≥16, no acute paralysis, no known vertebral disease or prior C-spine surgery, and not pregnant.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCcsApplicable('no')} aria-pressed={ccsApplicable === 'no'} className={`rounded border px-3 py-1 text-xs ${ccsApplicable === 'no' ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-slate-700'}`}>No</button>
            <button type="button" onClick={() => setCcsApplicable('yes')} aria-pressed={ccsApplicable === 'yes'} className={`rounded border px-3 py-1 text-xs ${ccsApplicable === 'yes' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700'}`}>Yes</button>
          </div>
        </div>

        {ccsApplicable === 'yes' && <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 1: Any High-Risk Factors?</div>
            {sc.components.filter((c: any) => c.dangerous).map((comp: any) => {
              const currentVal = ccsState[comp.key];
              return (
                <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/10">
                  <span className="text-xs text-slate-300">{comp.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setCcsState(prev => ({...prev, [comp.key]: false}))}
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${currentVal === false ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setCcsState(prev => ({...prev, [comp.key]: true}))}
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${currentVal === true ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {highRiskComplete && !isDangerous && <div className="space-y-1.5">
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Step 2: Any Low-Risk Factors?</div>
            {sc.components.filter((c: any) => c.simple).map((comp: any) => {
              const currentVal = ccsState[comp.key];
              return (
                <div key={comp.key} className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-teal-950/10">
                  <span className="text-xs text-slate-300">{comp.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setCcsState(prev => ({...prev, [comp.key]: false}))}
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${currentVal === false ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setCcsState(prev => ({...prev, [comp.key]: true}))}
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${currentVal === true ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900/50 border-slate-800'
                        }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>}

        <div className="mt-4 pt-3 border-t border-teal-900/20">
          {ccsResult.state === 'rotation-required' ? (
            <div className="p-3 bg-teal-950/20 border border-teal-500/20 text-teal-200 rounded-lg text-xs">
              <strong>{ccsInterp.title}.</strong>
              <div className="my-2">{ccsInterp.action}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCcsRotation('no')} className="rounded border border-rose-500 px-3 py-1">No</button>
                <button type="button" onClick={() => setCcsRotation('yes')} className="rounded border border-teal-500 px-3 py-1">Yes</button>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-lg text-xs ${
              ccsInterp.tone === 'high'
                ? 'bg-rose-950/20 border border-rose-500/20 text-rose-200 font-bold'
                : ccsInterp.tone === 'low'
                  ? 'bg-teal-950/20 border border-teal-500/20 text-teal-200 font-bold'
                  : 'bg-slate-900/50 border border-slate-800 text-slate-400'
            }`}>
              {ccsInterp.action}
            </div>
          )}
          {ccsResult.state === 'low-risk-incomplete' && (
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
              Do not proceed to range-of-motion assessment until the low-risk section is complete.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (key === 'cam_icu') {
    const answers = checklistAnswers[key] ?? {};
    const setAnswer = (critKey: string, value: CriterionAnswer) =>
      setChecklistAnswers(prevAll => ({...prevAll, [key]: {...(prevAll[key] ?? {}), [critKey]: value}}));
    const features: any[] = sc.features ?? [];
    const allAnswered = features.every((f: any) => answers[f.key] !== undefined && answers[f.key] !== 'unanswered');
    const camInterp = interpretCamIcu(
      allAnswered,
      answers.feature1,
      answers.feature2,
      answers.feature3,
      answers.feature4,
    );

    return (
      <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>

        <p className="mb-3 text-[10px] text-slate-400">
          CAM-ICU is positive when Feature 1 AND Feature 2 are both present, AND either Feature 3 OR Feature 4 is present.
        </p>

        <div className="space-y-2">
          {features.map((f: any) => {
            const currentVal = answers[f.key];
            return (
              <div key={f.key} className="p-2 rounded-lg bg-black/10 border border-teal-950/20">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200">{f.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button type="button" onClick={() => setAnswer(f.key, 'no')} aria-pressed={currentVal === 'no'} className={`px-3 py-1 text-xs font-bold rounded border transition ${currentVal === 'no' ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>No</button>
                    <button type="button" onClick={() => setAnswer(f.key, 'yes')} aria-pressed={currentVal === 'yes'} className={`px-3 py-1 text-xs font-bold rounded border transition ${currentVal === 'yes' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>Yes</button>
                  </div>
                </div>
                {f.description && <div className="mt-1 text-[10px] text-slate-500 leading-snug">{f.description}</div>}
              </div>
            );
          })}
        </div>

        {camInterp && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${camInterp.tone === 'high' ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' : 'bg-teal-950/20 border-teal-500/20 text-teal-200'}`}>
            <div className="font-bold">{camInterp.title}</div>
            <div className="text-xs mt-1 text-slate-300">{camInterp.action}</div>
          </div>
        )}
      </div>
    );
  }

  // Generic tiered risk-factor rule - any score shaped as high_risk: [...]
  // (optionally with medium_risk/low_risk) renders here: any "yes" in the
  // highest tier present wins, no point total involved. Covers rules like
  // the Canadian CT Head Rule.
  if (Array.isArray(sc.high_risk)) {
    const tiers: Array<{tierKey: string; label: string; items: any[]}> = [
      {tierKey: 'high', label: 'High-risk factors', items: sc.high_risk},
      ...(Array.isArray(sc.medium_risk) ? [{tierKey: 'medium', label: 'Medium-risk factors', items: sc.medium_risk}] : []),
      ...(Array.isArray(sc.low_risk) ? [{tierKey: 'low', label: 'Low-risk factors', items: sc.low_risk}] : []),
    ];
    const answers = checklistAnswers[key] ?? {};
    const setAnswer = (critKey: string, value: CriterionAnswer) =>
      setChecklistAnswers(prevAll => ({...prevAll, [key]: {...(prevAll[key] ?? {}), [critKey]: value}}));

    const allCriteria = tiers.flatMap(t => t.items.map((item, i) => `${t.tierKey}_${i}`));
    const allAnswered = allCriteria.every(k => answers[k] !== undefined);
    const triggeredTier = tiers.find(t => t.items.some((_, i) => answers[`${t.tierKey}_${i}`] === 'yes'));
    const tierInterp = interpretTieredRiskRule(
      allAnswered,
      triggeredTier ? (triggeredTier.tierKey as 'high' | 'medium' | 'low') : null,
      triggeredTier?.label ?? null,
      typeof sc.interpretation === 'string' ? sc.interpretation : '',
    );

    return (
      <div key={key} className={`p-4 rounded-xl border mb-4 ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>

        <div className="space-y-3">
          {tiers.map(tier => (
            <div key={tier.tierKey} className="space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tier.label}</div>
              {tier.items.map((item: any, i: number) => {
                const critKey = `${tier.tierKey}_${i}`;
                const answer = answers[critKey];
                return (
                  <div key={critKey} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-black/10 border border-teal-950/10">
                    <span className="text-xs text-slate-300 pr-4">{item.name}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => setAnswer(critKey, 'no')} aria-pressed={answer === 'no'} className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'no' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700 text-slate-400'}`}>No</button>
                      <button type="button" onClick={() => setAnswer(critKey, 'yes')} aria-pressed={answer === 'yes'} className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'yes' ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-slate-700 text-slate-400'}`}>Yes</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {tierInterp ? (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${
            tierInterp.tone === 'high'
              ? 'bg-rose-950/20 border-rose-500/20 text-rose-200'
              : tierInterp.tone === 'moderate'
                ? 'bg-orange-950/20 border-orange-500/20 text-orange-200'
                : 'bg-teal-950/20 border-teal-500/20 text-teal-200'
          }`}>
            <div className="font-bold">{tierInterp.title}</div>
            <div className="text-xs mt-1 text-slate-300">{tierInterp.action}</div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300" aria-live="polite">
            <div className="font-bold">Assessment incomplete</div>
            <div className="mt-1 text-xs">Answer every criterion to see the result.</div>
          </div>
        )}
      </div>
    );
  }

  if (key === 'burch_wartofsky') {
    const componentKeys = sc.components.map((component: any) => component.key);
    const isAllSelected = componentKeys.every(
      (componentKey: string) => burchWartofskyState[componentKey] !== undefined,
    );
    const totalBurch = componentKeys.reduce(
      (total: number, componentKey: string) =>
        total + (burchWartofskyState[componentKey] ?? 0),
      0,
    );

    const burchInterp = interpretBurchWartofsky(isAllSelected, totalBurch);
    const burchLabel = burchInterp.title;
    const burchAction = burchInterp.action;
    const burchClass =
      burchInterp.tone === 'high'
        ? 'bg-rose-950/30 border-rose-500/25 text-rose-300'
        : burchInterp.tone === 'moderate'
          ? 'bg-amber-950/20 border-amber-500/25 text-amber-300'
          : burchInterp.tone === 'low'
            ? 'bg-teal-950/20 border-teal-500/25 text-teal-300'
            : 'text-slate-400 border-slate-800 bg-slate-900/50';

    return (
      <div
        key={key}
        onClick={onRecordRecentlyViewed}
        className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <div className="flex items-center gap-2">
            {isAllSelected && (
              <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
                Score: {totalBurch}
              </div>
            )}
            <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
          </div>
        </div>

        <div className="space-y-4">
          {sc.components.map((comp: any) => (
            <div key={comp.key} className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
              <div className="flex flex-col gap-1.5">
                {comp.options.map((opt: any) => {
                  const isSelected = burchWartofskyState[comp.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setBurchWartofskyState(prev => ({...prev, [comp.key]: opt.value}))}
                      className={`px-3 py-2 rounded-lg border text-left flex justify-between items-center transition ${isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                        }`}
                    >
                      <span className="text-xs font-medium">{opt.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                        +{opt.value} pts
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-4 p-3 rounded-lg border text-sm ${burchClass}`}>
          <div className="font-bold">{burchLabel}</div>
          <div className="text-xs mt-1 text-slate-300">{burchAction}</div>
        </div>
        <div className="mt-2 text-[10px] text-amber-300">
          Clinical review pending for source-table errata on HJH PDF page 190.
        </div>
      </div>
    );
  }

  // NEWS2 needs a dedicated renderer: it carries two mutually exclusive SpO2
  // scales (Scale 2 only for clinician-designated 88-92% targets) and the RCP
  // escalation table's red-score rule — any single parameter scoring 3
  // escalates to at least urgent review regardless of the aggregate. The
  // scoring itself lives in evaluateNews2 (scores.ts) so it is unit-tested.
  if (key === 'news2') {
    const activeSpo2Key = news2Scale === 'scale2' ? 'spo2_scale2' : 'spo2';
    const activeComponents = (sc.components as Array<{key: string; name: string; options: Array<{label: string; value: number}>}>)
      .filter(comp => comp.key !== (news2Scale === 'scale2' ? 'spo2' : 'spo2_scale2'));
    const requiredKeys = activeComponents.map(comp => comp.key);
    const news2 = evaluateNews2(
      requiredKeys,
      Object.fromEntries(requiredKeys.map(k => [k, news2Answers[k]?.value])),
    );

    const switchScale = (scale: News2Scale) => {
      if (scale === news2Scale) return;
      setNews2Scale(scale);
      setNews2Answers(prev => {
        const next = {...prev};
        delete next.spo2;
        delete next.spo2_scale2;
        return next;
      });
    };

    const news2Interp = interpretNews2Risk(news2.risk);
    const news2RiskClass =
      news2.risk === 'high'
        ? 'bg-rose-950/30 border-rose-500/30 text-rose-300 animate-pulse'
        : news2.risk === 'medium' || news2.risk === 'low-medium'
          ? 'bg-orange-950/30 border-orange-500/30 text-orange-300'
          : 'bg-teal-950/20 border-teal-500/25 text-teal-300';

    return (
      <div
        key={key}
        onClick={onRecordRecentlyViewed}
        className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <div className="flex items-center gap-2">
            {news2.complete && (
              <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
                Score: {news2.total}
              </div>
            )}
            <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-teal-900/30 bg-black/10 p-3">
          <div className="mb-1 text-xs font-bold text-teal-300">SpO₂ scale</div>
          <p className="mb-2 text-[10px] leading-snug text-slate-400">
            Use Scale 2 only when a clinician has formally designated a target saturation of 88–92% (hypercapnic respiratory failure, e.g. COPD). If in doubt, use Scale 1.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchScale('scale1')}
              aria-pressed={news2Scale === 'scale1'}
              className={`rounded border px-3 py-1 text-xs font-bold ${news2Scale === 'scale1' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700 text-slate-400'}`}
            >
              Scale 1 (standard)
            </button>
            <button
              type="button"
              onClick={() => switchScale('scale2')}
              aria-pressed={news2Scale === 'scale2'}
              className={`rounded border px-3 py-1 text-xs font-bold ${news2Scale === 'scale2' ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'border-slate-700 text-slate-400'}`}
            >
              Scale 2 (target 88–92%)
            </button>
          </div>
          {news2Scale === 'scale2' && (
            <div className="mt-2 rounded border border-amber-500/30 bg-amber-950/20 p-2 text-[10px] text-amber-100">
              Scale 2 selected: confirm the 88–92% target is documented by the responsible clinician.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {activeComponents.map(comp => (
            <div key={comp.key} className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
              <div className="flex flex-col gap-1.5">
                {comp.options.map(opt => {
                  const isSelected = news2Answers[comp.key]?.label === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        setNews2Answers(prev => ({...prev, [comp.key]: {label: opt.label, value: opt.value}}))
                      }
                      className={`px-3 py-2 rounded-lg border text-left flex justify-between items-center transition ${isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                        }`}
                    >
                      <span className="text-xs font-medium">{opt.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                        {opt.value === 3 ? '🔴 ' : ''}+{opt.value} pts
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {news2Interp ? (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${news2RiskClass}`}>
            <div className="font-bold">{news2Interp.title}</div>
            <div className="text-xs mt-1 text-slate-300">{news2Interp.action}</div>
            {news2.anySingleThree && news2.risk !== 'low-medium' && (
              <div className="text-[11px] mt-2 text-slate-300">
                Includes at least one parameter scoring 3 (red score).
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300" aria-live="polite">
            <div className="font-bold">Assessment incomplete</div>
            <div className="mt-1 text-xs">{news2.answeredCount} of {requiredKeys.length} parameters answered ({activeSpo2Key === 'spo2_scale2' ? 'Scale 2' : 'Scale 1'} active). No risk band is shown until every parameter is answered.</div>
          </div>
        )}
      </div>
    );
  }

  // Generic graded/option-based scorer - any score whose components carry
  // an `options` array (e.g. HEART, NIHSS, CIWA, Child-Pugh, Killip, APGAR)
  // renders here automatically, same idea as the checklist scorer below but
  // for criteria with more than two levels.
  if (Array.isArray(sc.components) && sc.components[0]?.options) {
    const gradedAnswers = gradedScoreAnswers[key] ?? {};
    const setGradedAnswer = (compKey: string, value: number) =>
      setGradedScoreAnswers(prevAll => ({
        ...prevAll,
        [key]: {...(prevAll[key] ?? {}), [compKey]: value},
      }));

    const componentKeys = sc.components.map((c: any) => c.key || c.name);
    const isGradedComplete = componentKeys.every((k: string) => gradedAnswers[k] !== undefined);
    const gradedTotal = componentKeys.reduce(
      (sum: number, k: string) => sum + (gradedAnswers[k] ?? 0),
      0,
    );

    const gradedInterp = interpretGradedScore(
      isGradedComplete,
      gradedTotal,
      Array.isArray(sc.interpretation) ? sc.interpretation : undefined,
    );
    const gradedClass =
      gradedInterp?.tone === 'high'
        ? 'bg-rose-950/20 border-rose-500/20 text-rose-300'
        : gradedInterp?.tone === 'moderate'
          ? 'bg-orange-950/20 border-orange-500/20 text-orange-300'
          : 'bg-teal-950/20 border-teal-500/20 text-teal-300';

    return (
      <div
        key={key}
        onClick={onRecordRecentlyViewed}
        className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            {renderScoreTitle()}
          </div>
          <div className="flex items-center gap-2">
            {isGradedComplete && (
              <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
                Score: {gradedTotal}
              </div>
            )}
            <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
          </div>
        </div>

        <div className="space-y-4">
          {sc.components.map((comp: any) => {
            const compKey = comp.key || comp.name;
            return (
              <div key={compKey} className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{comp.name}</span>
                <div className="flex flex-col gap-1.5">
                  {comp.options.map((opt: any) => {
                    const optValue = opt.value ?? opt.points;
                    const isSelected = gradedAnswers[compKey] === optValue;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setGradedAnswer(compKey, optValue)}
                        className={`px-3 py-2 rounded-lg border text-left flex justify-between items-center transition ${isSelected
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                            : 'bg-black/10 border-teal-950/20 hover:border-teal-700/40 text-slate-300'
                          }`}
                      >
                        <span className="text-xs font-medium">{opt.label}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
                          {optValue} pt{optValue === 1 || optValue === -1 ? '' : 's'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {isGradedComplete ? (
          gradedInterp && (
            <div className={`mt-4 p-3 rounded-lg border text-sm ${gradedClass}`}>
              <div className="font-bold">{gradedInterp.title}</div>
              <div className="text-xs mt-1 text-slate-300">{gradedInterp.action}</div>
            </div>
          )
        ) : (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300" aria-live="polite">
            <div className="font-bold">Assessment incomplete</div>
            <div className="mt-1 text-xs">Select a value for every component to see the interpretation.</div>
          </div>
        )}
      </div>
    );
  }

  // Default checklist/point-based scorers - any score whose data is shaped
  // as components: [{key, points}] lands here automatically.
  const currentScoresState = checklistAnswers[key] ?? {};
  const setCurrentScoresState = (
    updater: (prev: Record<string, CriterionAnswer>) => Record<string, CriterionAnswer>,
  ) => setChecklistAnswers(prevAll => ({...prevAll, [key]: updater(prevAll[key] ?? {})}));

  const checklistResult = calculateChecklistScore(
    sc.components.map((comp: any) => ({
      key: comp.key || comp.name,
      points: comp.points,
    })),
    currentScoresState,
  );
  const answeredCount = checklistResult.answeredCount;
  const isComplete = checklistResult.complete;

  // Some scores have criteria that are mutually exclusive (e.g. CHA2DS2-VASc's
  // two age brackets) but are still rendered as independent yes/no toggles for
  // traceability against the printed source table. If more than one member of
  // a group is marked 'yes', only the highest-value one should actually count.
  const exclusiveGroupOverlap: string[][] = (sc.mutually_exclusive_groups ?? []).filter(
    (group: string[]) => group.filter(k => currentScoresState[k] === 'yes').length > 1,
  );
  const overCountedPoints = exclusiveGroupOverlap.reduce((total, group) => {
    const selectedPoints = group
      .filter(k => currentScoresState[k] === 'yes')
      .map(k => sc.components.find((c: any) => (c.key || c.name) === k)?.points ?? 0);
    return total + (selectedPoints.reduce((a: number, b: number) => a + b, 0) - Math.max(...selectedPoints));
  }, 0);
  const pointsSum = checklistResult.score - overCountedPoints;

  const getScorerBadgeAndInterp = () => {
    const checklistInterp = interpretChecklistScore(
      key,
      isComplete,
      pointsSum,
      Array.isArray(sc.interpretation) ? sc.interpretation : undefined,
    );
    if (!checklistInterp) {
      return (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300" aria-live="polite">
          <div className="font-bold">Assessment incomplete</div>
          <div className="mt-1 text-xs">{answeredCount} of {sc.components.length} criteria answered. No interpretation is available yet.</div>
        </div>
      );
    }

    const severityClass =
      checklistInterp.tone === 'high'
        ? 'bg-rose-950/20 border-rose-500/20 text-rose-300'
        : checklistInterp.tone === 'moderate'
          ? 'bg-orange-950/20 border-orange-500/20 text-orange-300'
          : 'bg-teal-950/20 border-teal-500/20 text-teal-300';
    return (
      <div className={`mt-4 p-3 rounded-lg border text-sm ${severityClass}`}>
        <div className="font-bold">{checklistInterp.title}</div>
        <div className="text-xs mt-1 text-slate-300">{checklistInterp.action}</div>
      </div>
    );
  };

  return (
    <div
      key={key}
      onClick={onRecordRecentlyViewed}
      className={`p-4 rounded-xl border mb-4 cursor-pointer ${theme === 'dark' ? 'bg-[#0f1d1d] border-teal-900/40' : 'bg-white border-slate-200 shadow-sm'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-teal-400" />
          {renderScoreTitle()}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold">
            {isComplete ? `Score: ${pointsSum}` : `${answeredCount}/${sc.components.length} answered`}
          </div>
          <ScoreFavouriteButton isFavourite={isFavourite} onToggleFavourite={onToggleFavourite} />
        </div>
      </div>

      {exclusiveGroupOverlap.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-2 text-[11px] text-amber-200" role="alert">
          Only one of these criteria applies at a time - the higher-value option has been counted, the other ignored.
        </div>
      )}

      <div className="space-y-1.5">
        {sc.components.map((comp: any) => {
          const cid = comp.key || comp.name;
          const answer = currentScoresState[cid] as CriterionAnswer | undefined;
          return (
            <div
              key={cid}
              className={`flex items-center justify-between gap-3 p-2 rounded-lg transition ${answer === 'yes' ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-black/10 border border-transparent'
                }`}
            >
              <span className="text-xs text-slate-300 pr-4">{comp.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {comp.points && <span className="text-[10px] text-teal-400">+{comp.points}</span>}
                <button
                  type="button"
                  onClick={() => setCurrentScoresState((prev: any) => ({...prev, [cid]: 'no'}))}
                  aria-pressed={answer === 'no'}
                  className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'no' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700 text-slate-400'}`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentScoresState((prev: any) => ({...prev, [cid]: 'yes'}))}
                  aria-pressed={answer === 'yes'}
                  className={`rounded border px-2 py-1 text-[10px] font-bold ${answer === 'yes' ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-slate-700 text-slate-400'}`}
                >
                  Yes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {getScorerBadgeAndInterp()}
    </div>
  );
};

export const ScoreList: React.FC<ScoreListProps> = ({
  scores,
  isScoreFavourite,
  onToggleScoreFavourite,
  onRecordScoreRecentlyViewed,
  ...sharedProps
}) => (
  <div className="space-y-2">
    <div className="bg-teal-950/10 border border-teal-900/30 p-3 rounded-lg text-xs leading-normal mb-4 text-slate-300 flex items-start gap-2">
      <Info className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
      <div>
        <strong>Interactive scoring matrices:</strong> Tap on the values or checkboxes to calculate immediate clinical recommendations, diagnostic steps, and therapeutic indications.
      </div>
    </div>
    {Object.entries(scores).map(([k, sc]) => (
      <ScoreCalculatorCard
        key={k}
        scoreKey={k}
        entry={sc}
        {...sharedProps}
        isFavourite={isScoreFavourite(k)}
        onToggleFavourite={event => onToggleScoreFavourite(k, event)}
        onRecordRecentlyViewed={() => onRecordScoreRecentlyViewed(k, sc.name)}
      />
    ))}
  </div>
);
