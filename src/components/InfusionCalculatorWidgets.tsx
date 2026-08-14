import React from 'react';
import {Activity} from 'lucide-react';
import {
  calculateInfusionRate,
  INFUSION_DEFINITIONS,
  type InfusionDefinition,
} from '../clinical/calculations/infusions';

export type InfusionDoseState = {dose: string; conc: string; weight: string};
export type InfusionDoses = Record<string, InfusionDoseState>;
export type InfusionConfirmed = Record<string, boolean>;

interface InfusionWidgetSharedProps {
  weight: string;
  infusionDoses: InfusionDoses;
  setInfusionDoses: React.Dispatch<React.SetStateAction<InfusionDoses>>;
  infusionConfirmed: InfusionConfirmed;
  setInfusionConfirmed: React.Dispatch<React.SetStateAction<InfusionConfirmed>>;
}

export interface AtropineInfusionWidgetProps {
  infusionDoses: InfusionDoses;
  setInfusionDoses: React.Dispatch<React.SetStateAction<InfusionDoses>>;
  infusionConfirmed: InfusionConfirmed;
  setInfusionConfirmed: React.Dispatch<React.SetStateAction<InfusionConfirmed>>;
}

export interface InfusionCalculatorWidgetProps extends InfusionWidgetSharedProps {
  presetOrDefinition: string | InfusionDefinition;
}

const formatCalculatedDose = (value: number): string => {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/\.?0+$/, '');
};

export const AtropineInfusionWidget: React.FC<AtropineInfusionWidgetProps> = ({
  infusionDoses,
  setInfusionDoses,
  infusionConfirmed,
  setInfusionConfirmed,
}) => {
  const key = 'atropine-percent';
  const state = infusionDoses[key] || {dose: '', conc: '', weight: ''};
  const totalDose = Number(state.dose);
  const concentration = Number(state.conc);
  const percentage = Number(state.weight);
  const confirmed = infusionConfirmed[key] === true;
  // The protocol rate is 10–20% of the atropinisation dose per hour; a value
  // outside that band is rejected rather than silently computed.
  // Number.isFinite guards against Infinity (e.g. an overflowing 1e309 entry),
  // which would otherwise pass `> 0` and render "Infinity mL/hr".
  const positiveFiniteInputs = [totalDose, concentration, percentage].every(
    value => Number.isFinite(value) && value > 0,
  );
  const percentageInRange = percentage >= 10 && percentage <= 20;
  const valid = positiveFiniteInputs && percentageInRange;
  const rate = confirmed && valid
    ? (totalDose * percentage / 100) / concentration
    : null;

  const update = (field: 'dose' | 'conc' | 'weight', value: string) => {
    setInfusionDoses(previous => ({
      ...previous,
      [key]: {...state, [field]: value},
    }));
    setInfusionConfirmed(previous => ({...previous, [key]: false}));
  };

  return (
    <div data-dark-surface className="mt-3 space-y-2 rounded-lg border border-teal-900/40 bg-[#071111] p-3 text-xs">
      <div className="font-bold text-[#00d9b5]">Atropine maintenance infusion</div>
      <div className="text-[10px] text-slate-400">
        Protocol: 200 mg in 200 mL saline (1 mg/mL), run at 10–20% of the total atropinisation dose per hour.
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[10px] text-slate-400">
          Total dose given (mg)
          <input
            type="number"
            min="0"
            step="any"
            value={state.dose}
            onChange={event => update('dose', event.target.value)}
            className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
          />
        </label>
        <label className="text-[10px] text-slate-400">
          Dose per hour (%)
          <input
            type="number"
            min="10"
            max="20"
            step="any"
            value={state.weight}
            onChange={event => update('weight', event.target.value)}
            placeholder="10–20"
            className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
          />
        </label>
        <label className="text-[10px] text-slate-400">
          Actual conc. (mg/mL)
          <input
            type="number"
            min="0"
            step="any"
            value={state.conc}
            onChange={event => update('conc', event.target.value)}
            placeholder="1"
            className="mt-1 w-full rounded border border-teal-800/30 bg-black/40 px-1.5 py-1 text-center font-bold text-teal-300"
          />
        </label>
      </div>
      <label className="flex items-start gap-2 rounded border border-teal-900/30 p-2 text-[10px] text-slate-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={event => setInfusionConfirmed(previous => ({
            ...previous,
            [key]: event.target.checked,
          }))}
        />
        I have confirmed the total dose, selected percentage, and actual concentration.
      </label>
      {confirmed && !valid && (
        <div className="text-[10px] text-rose-300">
          {positiveFiniteInputs && !percentageInRange
            ? 'Dose per hour must be within the protocol range of 10–20%.'
            : 'Complete all three inputs with finite values greater than zero.'}
        </div>
      )}
      {rate !== null && (
        <div className="border-t border-teal-900/20 pt-2" aria-live="polite">
          <strong className="text-sm text-teal-300">{formatCalculatedDose(rate)} mL/hr</strong>
          <div className="text-[10px] text-slate-400">
            ({totalDose} mg × {percentage}%) ÷ {concentration} mg/mL
          </div>
        </div>
      )}
    </div>
  );
};

export const InfusionCalculatorWidget: React.FC<InfusionCalculatorWidgetProps> = ({
  presetOrDefinition,
  weight,
  infusionDoses,
  setInfusionDoses,
  infusionConfirmed,
  setInfusionConfirmed,
}) => {
  if (presetOrDefinition === 'atropine_percent') {
    return (
      <AtropineInfusionWidget
        infusionDoses={infusionDoses}
        setInfusionDoses={setInfusionDoses}
        infusionConfirmed={infusionConfirmed}
        setInfusionConfirmed={setInfusionConfirmed}
      />
    );
  }
  const definition = typeof presetOrDefinition === 'string'
    ? INFUSION_DEFINITIONS[presetOrDefinition]
    : presetOrDefinition;
  if (!definition) return null;
  const key = definition.id;
  const state = infusionDoses[key] || {dose: '', conc: '', weight: weight || ''};

  const updateInfusionState = (field: string, val: string) => {
    setInfusionDoses(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {dose: '', conc: '', weight: weight || ''}),
        [field]: val,
      },
    }));
    // Any change to dose, concentration or weight invalidates the prior
    // confirmation so a rate is never shown against unconfirmed inputs.
    setInfusionConfirmed(prev => ({...prev, [key]: false}));
  };

  const dVal = parseFloat(state.dose);
  const cVal = parseFloat(state.conc);
  const wVal = parseFloat(state.weight);
  let result: ReturnType<typeof calculateInfusionRate> | null = null;
  let calculationError = '';
  if (infusionConfirmed[key]) {
    try {
      result = calculateInfusionRate(definition, {
        dose: dVal,
        concentration: cVal,
        weight: definition.requiresWeight ? wVal : undefined,
      });
    } catch (error) {
      calculationError = error instanceof Error ? error.message : 'Unable to calculate';
    }
  }

  return (
    <div data-dark-surface className="mt-3 p-3 rounded-lg bg-[#071111] border border-teal-900/40 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#00d9b5] font-bold">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>{definition.title}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/50 text-teal-400 font-bold border border-teal-900/30">
          {definition.doseUnit}
        </span>
      </div>

      <div className="text-[10px] text-slate-400 space-y-0.5 border-b border-teal-950/30 pb-2 mb-2">
        <div><span className="text-teal-400 font-medium">Source preparation:</span> {definition.preparation}</div>
        <div><span className="text-teal-400 font-medium">Configured range:</span> {definition.minimumDose}–{definition.maximumDose} {definition.doseUnit}</div>
        <div><span className="text-teal-400 font-medium">Source:</span> {definition.sourceId}{definition.pdfPages.length > 0 ? `, PDF page ${definition.pdfPages.join(', ')}` : ''}</div>
      </div>

      {definition.warnings.length > 0 && (
        <details className="text-[10px] text-slate-400">
          <summary className="cursor-pointer text-teal-400/80 hover:text-teal-300">Protocol notes</summary>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {definition.warnings.map(note => <li key={note}>{note}</li>)}
          </ul>
        </details>
      )}

      {definition.status === 'blocked' && (
        <div className="rounded border border-amber-500/40 bg-amber-950/20 p-2 text-amber-200" role="alert">
          <strong>Unavailable:</strong> {definition.blockedReason}
        </div>
      )}

      {definition.status === 'available' && <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Target Dose ({definition.doseUnit})</label>
          <input
            type="number"
            value={state.dose}
            min="0"
            step="any"
            placeholder="Required"
            onChange={e => updateInfusionState('dose', e.target.value)}
            className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Actual Conc ({definition.concentrationUnit})</label>
          <input
            type="number"
            value={state.conc}
            step="any"
            min="0"
            placeholder={definition.concentration.toString()}
            onChange={e => updateInfusionState('conc', e.target.value)}
            className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Weight (kg)</label>
          <input
            type="number"
            value={state.weight}
            min="0"
            step="any"
            disabled={!definition.requiresWeight}
            placeholder={definition.requiresWeight ? 'Required' : 'N/A'}
            onChange={e => updateInfusionState('weight', e.target.value)}
            className="w-full px-1.5 py-1 bg-black/40 border border-teal-800/30 rounded text-center text-teal-300 font-bold focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>}

      {definition.status === 'available' && (
        <label className="flex cursor-pointer items-start gap-2 text-[10px] text-slate-300">
          <input
            type="checkbox"
            checked={infusionConfirmed[key] === true}
            onChange={event => setInfusionConfirmed(prev => ({...prev, [key]: event.target.checked}))}
          />
          I have confirmed the actual prepared concentration and patient-specific inputs.
        </label>
      )}

      {calculationError && (
        <div className="rounded border border-rose-500/40 bg-rose-950/20 p-2 text-rose-200" role="alert">{calculationError}</div>
      )}

      {result !== null && (
        <div className="pt-2 border-t border-teal-900/20 space-y-2" aria-live="polite">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Infusion Rate:</span>
            <strong className="text-teal-300 font-black text-sm">{result.mlPerHour.toFixed(1)} mL/hr</strong>
          </div>
          <div className="text-[10px] text-slate-400">Working: {result.working}</div>
          {result.outsideRecommendedRange && <div className="font-bold text-rose-300">Entered dose is outside the configured source range.</div>}
        </div>
      )}
    </div>
  );
};
