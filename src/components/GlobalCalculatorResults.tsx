import React, {useMemo} from 'react';
import {Calculator, Sigma, Syringe} from 'lucide-react';
import {
  searchGlobalCalculators,
  type GlobalCalculator,
  type GlobalCalculatorKind,
} from '../clinical/globalCalculators';

interface GlobalCalculatorResultsProps {
  query: string;
  onOpen: (calculator: GlobalCalculator) => void;
  /** Names the scope the reader is searching inside, e.g. "this protocol". */
  scopeLabel: string;
  limit?: number;
}

const KIND_PRESENTATION: Record<
  GlobalCalculatorKind,
  {label: string; icon: React.ReactNode}
> = {
  score: {label: 'Score', icon: <Calculator className="h-3.5 w-3.5" />},
  formula: {label: 'Formula', icon: <Sigma className="h-3.5 w-3.5" />},
  infusion: {label: 'Infusion', icon: <Syringe className="h-3.5 w-3.5" />},
};

/**
 * Search elsewhere in the app is scoped to whatever the reader is looking at.
 * Calculators are the deliberate exception - they are needed mid-protocol and
 * belong to no facility - so matching ones surface here whatever the scope.
 */
export const GlobalCalculatorResults: React.FC<GlobalCalculatorResultsProps> = ({
  query,
  onOpen,
  scopeLabel,
  limit,
}) => {
  const results = useMemo(
    () => searchGlobalCalculators(query, limit),
    [query, limit],
  );

  if (results.length === 0) return null;

  return (
    <section
      aria-label="Formula and score calculator results"
      className="rounded-2xl border border-indigo-300 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/25"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          <Calculator className="h-4 w-4" />
          Formulas &amp; scores
        </h2>
        <p className="text-[11px] font-semibold text-indigo-700/80 dark:text-indigo-300/80">
          Always searched globally, not just {scopeLabel}
        </p>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {results.map(calculator => {
          const presentation = KIND_PRESENTATION[calculator.kind];
          return (
            <li key={calculator.id}>
              <button
                type="button"
                onClick={() => onOpen(calculator)}
                aria-label={`Open ${calculator.name} calculator`}
                className="flex w-full items-start gap-3 rounded-xl border border-indigo-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="mt-0.5 shrink-0 rounded-lg border border-indigo-200 bg-indigo-100 p-1.5 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {presentation.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {calculator.name}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {presentation.label}
                    </span>
                  </span>
                  {calculator.detail && (
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {calculator.detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
