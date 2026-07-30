import React, {useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Info,
  RotateCcw,
  Zap,
} from 'lucide-react';
import type {FlowchartData, FlowchartNode} from '../clinical/flowcharts';
import type {HospitalProtocol} from '../clinical/hospitalProtocols';

interface FlowchartViewerProps {
  flowchart: FlowchartData;
  onOpenProtocol?: (protocolId: string) => void;
  allProtocols?: HospitalProtocol[];
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({
  flowchart,
  onOpenProtocol,
  allProtocols,
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(flowchart.initialNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'wizard' | 'diagram'>('wizard');

  const currentNode: FlowchartNode = flowchart.nodes[currentNodeId] ?? flowchart.nodes[flowchart.initialNodeId];

  const handleSelectOption = (targetNodeId: string) => {
    if (flowchart.nodes[targetNodeId]) {
      setHistory(prev => [...prev, currentNodeId]);
      setCurrentNodeId(targetNodeId);
    }
  };

  const handleRestart = () => {
    setCurrentNodeId(flowchart.initialNodeId);
    setHistory([]);
  };

  const handleBackStep = () => {
    if (history.length > 0) {
      const previousNodeId = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentNodeId(previousNodeId);
    }
  };

  const getAccentStyles = (accent?: FlowchartNode['accent']) => {
    switch (accent) {
      case 'rose':
        return {
          card: 'border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100',
          badge: 'bg-rose-600 text-white',
          bulletIcon: 'text-rose-500',
        };
      case 'amber':
        return {
          card: 'border-amber-300 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100',
          badge: 'bg-amber-600 text-white',
          bulletIcon: 'text-amber-500',
        };
      case 'emerald':
        return {
          card: 'border-emerald-300 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100',
          badge: 'bg-emerald-600 text-white',
          bulletIcon: 'text-emerald-500',
        };
      case 'sky':
        return {
          card: 'border-sky-300 bg-sky-50/90 dark:border-sky-900/60 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100',
          badge: 'bg-sky-600 text-white',
          bulletIcon: 'text-sky-500',
        };
      default:
        return {
          card: 'border-indigo-300 bg-indigo-50/90 dark:border-indigo-900/60 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100',
          badge: 'bg-indigo-600 text-white',
          bulletIcon: 'text-indigo-500',
        };
    }
  };

  const getOptionButtonStyles = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/20 border-rose-500';
      case 'warning':
        return 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-900/20 border-amber-500';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20 border-emerald-500';
      case 'indigo':
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20 border-indigo-500';
    }
  };

  const currentAccent = getAccentStyles(currentNode.accent);

  return (
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 p-5 shadow-lg dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/30 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <GitBranch className="h-3.5 w-3.5" />
            Interactive Clinical Flowchart
          </span>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {flowchart.title}
          </h2>
          {flowchart.subtitle && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {flowchart.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(prev => (prev === 'wizard' ? 'diagram' : 'wizard'))}
            className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"
          >
            {viewMode === 'wizard' ? 'View Full Diagram' : 'Interactive Decision Steps'}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart
            </button>
          )}
        </div>
      </div>

      {viewMode === 'wizard' ? (
        <div className="mt-5 space-y-5">
          {history.length > 0 && (
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <button
                type="button"
                onClick={handleRestart}
                className="hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Start
              </button>
              {history.map((nodeId, idx) => {
                const stepNode = flowchart.nodes[nodeId];
                return (
                  <React.Fragment key={nodeId}>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setHistory(prev => prev.slice(0, idx));
                        setCurrentNodeId(nodeId);
                      }}
                      className="max-w-[140px] truncate hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {stepNode?.title ?? nodeId}
                    </button>
                  </React.Fragment>
                );
              })}
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                {currentNode.title}
              </span>
            </nav>
          )}

          <div className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${currentAccent.card}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {currentNode.badge && (
                <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-black uppercase tracking-wide ${currentAccent.badge}`}>
                  {currentNode.badge}
                </span>
              )}
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  ← Back one step
                </button>
              )}
            </div>

            <h3 className="text-lg font-black">{currentNode.title}</h3>
            {currentNode.subtitle && (
              <p className="mt-1 text-sm font-semibold opacity-90">{currentNode.subtitle}</p>
            )}

            {currentNode.bullets && currentNode.bullets.length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl bg-white/70 p-4 dark:bg-slate-900/60">
                {currentNode.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${currentAccent.bulletIcon}`} />
                    <span className="flex-1 font-medium">{bullet}</span>
                  </div>
                ))}
              </div>
            )}

            {currentNode.options && currentNode.options.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-slate-200/60 dark:border-slate-700/60 pt-5">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Select decision branch:
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentNode.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(opt.targetNodeId)}
                      className={`group flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all shadow-md active:scale-95 ${getOptionButtonStyles(opt.variant)}`}
                    >
                      <div className="flex w-full items-center justify-between gap-2 font-black text-base">
                        <span>{opt.label}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                      {opt.description && (
                        <p className="text-xs font-medium opacity-90 leading-relaxed">
                          {opt.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentNode.linkProtocolId && onOpenProtocol && (
              <div className="mt-5 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
                <button
                  type="button"
                  onClick={() => onOpenProtocol(currentNode.linkProtocolId!)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-rose-700"
                >
                  <Zap className="h-4 w-4" />
                  {currentNode.linkProtocolTitle ?? 'View Full Protocol'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <div className="text-xs font-semibold text-slate-500">
            Complete Decision Diagram Pathways
          </div>
          <div className="space-y-4">
            {Object.values(flowchart.nodes).map(node => {
              const accent = getAccentStyles(node.accent);
              const isActive = node.id === currentNodeId;
              return (
                <div
                  key={node.id}
                  className={`rounded-2xl border p-5 transition-all ${accent.card} ${isActive ? 'ring-2 ring-indigo-500 shadow-md' : 'opacity-90'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wide ${accent.badge}`}>
                      {node.badge ?? node.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentNodeId(node.id);
                        setViewMode('wizard');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Jump to this step →
                    </button>
                  </div>
                  <h3 className="mt-2 text-base font-black">{node.title}</h3>
                  {node.subtitle && <p className="text-xs opacity-90">{node.subtitle}</p>}

                  {node.bullets && (
                    <ul className="mt-3 space-y-1 text-xs">
                      {node.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {node.options && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      {node.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentNodeId(opt.targetNodeId);
                            setViewMode('wizard');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-indigo-500"
                        >
                          <span>{opt.label}</span>
                          <ArrowRight className="h-3 w-3 text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
