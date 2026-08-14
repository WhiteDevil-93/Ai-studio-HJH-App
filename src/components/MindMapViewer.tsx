import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert,
  ChevronRight, RefreshCw, Printer, Star, LayoutGrid, ListFilter
} from 'lucide-react';
import {
  MIND_MAPS_DATABASE,
  type MindMapDefinition,
  type MindMapNode,
} from '../clinical/mindMaps';

interface MindMapViewerProps {
  mindMapId: string;
  onBack: () => void;
  weight?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
}

export { MIND_MAPS_DATABASE, type MindMapDefinition, type MindMapNode } from '../clinical/mindMaps';


export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  mindMapId,
  onBack,
  weight,
  isFavourite = false,
  onToggleFavourite
}) => {
  // No fallback to another algorithm: opening an unknown mind-map ID must show
  // an explicit not-found state. Falling back to the adult cardiac arrest map
  // silently presented the WRONG algorithm whenever a link was broken — and
  // masked the broken link itself.
  const mindMap: MindMapDefinition | undefined = MIND_MAPS_DATABASE[mindMapId];
  const [currentNodeId, setCurrentNodeId] = useState<string>(mindMap?.initialNodeId ?? '');
  const [viewMode, setViewMode] = useState<'step' | 'full_diagram'>('step');

  if (!mindMap) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">🗺️</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mind map not found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No interactive pathway exists for the identifier “{mindMapId}”. This link is broken —
          please report it. No substitute algorithm is shown, to avoid presenting the wrong pathway.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    );
  }

  const currentNode = mindMap.nodes[currentNodeId] || mindMap.nodes[mindMap.initialNodeId];
  const allNodesList = Object.values(mindMap.nodes);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:max-w-none print:p-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2">
          {onToggleFavourite && (
            <button
              onClick={() => onToggleFavourite(`mindmap.${mindMap.id}`)}
              className={`p-2 rounded-xl border transition-colors ${
                isFavourite
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Star className={`w-4 h-4 ${isFavourite ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            title="Print Protocol Card"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Card</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            PDF Page {mindMap.pdfPage} • {mindMap.category}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl print:bg-none print:text-black print:border-b print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 print:text-slate-600">Interactive Visual Mind Map</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{mindMap.title}</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 print:text-slate-700">{mindMap.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => setViewMode('step')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'step' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Step View
              </button>
              <button
                onClick={() => setViewMode('full_diagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'full_diagram' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Full Diagram
              </button>
            </div>

            <button
              onClick={() => setCurrentNodeId(mindMap.initialNodeId)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Mind Map"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Step Card View */}
      {viewMode === 'step' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              currentNode.type === 'start' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
              currentNode.type === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
              currentNode.type === 'outcome' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
              'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
            }`}>
              Step: {currentNode.type.toUpperCase()}
            </span>

            {currentNode.dosage && (
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                💊 Dosage: {currentNode.dosage}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {currentNode.title}
            </h2>
            {currentNode.subtitle && (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{currentNode.subtitle}</p>
            )}
          </div>

          {currentNode.warning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{currentNode.warning}</p>
            </div>
          )}

          {currentNode.details && currentNode.details.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Actions & Guidelines</h4>
              <ul className="space-y-2">
                {currentNode.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentNode.options && currentNode.options.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Next Decision / Clinical Branch</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentNode.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentNodeId(option.targetId)}
                    className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 font-bold text-xs sm:text-sm transition-all group"
                  >
                    <span>{option.label}</span>
                    <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: Full Diagram Overview */}
      {viewMode === 'full_diagram' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs font-medium">
            💡 Full Mind Map Overview: Below is the complete visual algorithm tree. Click any node card to jump into that specific step.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allNodesList.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setCurrentNodeId(node.id);
                  setViewMode('step');
                }}
                className={`cursor-pointer p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                  node.id === currentNodeId
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    node.type === 'start' ? 'bg-blue-500/10 text-blue-600' :
                    node.type === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                    node.type === 'outcome' ? 'bg-emerald-500/10 text-emerald-600' :
                    'bg-indigo-500/10 text-indigo-600'
                  }`}>
                    {node.type}
                  </span>
                  {node.dosage && <span className="text-[10px] font-bold text-purple-600">💊 {node.dosage}</span>}
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{node.title}</h4>
                {node.subtitle && <p className="text-xs text-slate-500 mb-2">{node.subtitle}</p>}

                {node.details && (
                  <ul className="space-y-1">
                    {node.details.slice(0, 3).map((d, i) => (
                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 truncate">• {d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
