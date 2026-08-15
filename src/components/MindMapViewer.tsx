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
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SegmentedControl } from './ui/SegmentedControl';

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
  const mindMap: MindMapDefinition | undefined = MIND_MAPS_DATABASE[mindMapId];
  const [currentNodeId, setCurrentNodeId] = useState<string>(mindMap?.initialNodeId ?? '');
  const [viewMode, setViewMode] = useState<'step' | 'full_diagram'>('step');

  if (!mindMap) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
        <div className="text-3xl" aria-hidden="true">🗺️</div>
        <h2 className="text-sm font-bold text-white">Mind map not found</h2>
        <p className="text-xs text-slate-400">
          No interactive pathway exists for the identifier “{mindMapId}”.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={onBack}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const currentNode = mindMap.nodes[currentNodeId] || mindMap.nodes[mindMap.initialNodeId];
  const allNodesList = Object.values(mindMap.nodes);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 print:max-w-none print:p-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Home
        </Button>

        <div className="flex items-center gap-1.5">
          {onToggleFavourite && (
            <button
              type="button"
              onClick={() => onToggleFavourite(`mindmap.${mindMap.id}`)}
              className={`p-1.5 rounded-md border transition-desktop cursor-pointer ${
                isFavourite
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Star className={`w-3.5 h-3.5 ${isFavourite ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Print Card</span>
          </Button>

          <Badge variant="primary" size="sm">
            PDF Page {mindMap.pdfPage} · {mindMap.category}
          </Badge>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-lg p-4 sm:p-5 text-white border border-slate-800 bg-slate-900/90 shadow-xs print:bg-none print:text-black print:border-b print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 print:text-slate-600">
              Interactive Resuscitation Flowchart
            </span>
            <h1 className="text-base sm:text-lg font-bold">{mindMap.title}</h1>
            <p className="text-slate-400 text-xs print:text-slate-700 leading-relaxed">{mindMap.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 print:hidden shrink-0">
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={(v) => setViewMode(v as 'step' | 'full_diagram')}
              options={[
                { value: 'step', label: 'Step View', icon: <ListFilter className="w-3 h-3" /> },
                { value: 'full_diagram', label: 'Overview', icon: <LayoutGrid className="w-3 h-3" /> },
              ]}
            />

            <button
              type="button"
              onClick={() => setCurrentNodeId(mindMap.initialNodeId)}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-desktop cursor-pointer"
              title="Reset Flowchart"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Step Card View */}
      {viewMode === 'step' && (
        <div className="bg-slate-900/85 rounded-lg border border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={
                currentNode.type === 'start' ? 'primary' :
                currentNode.type === 'warning' ? 'warning' :
                currentNode.type === 'outcome' ? 'success' :
                'neutral'
              }
              size="sm"
            >
              Step: {currentNode.type.toUpperCase()}
            </Badge>

            {currentNode.dosage && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/40">
                Dosage: {currentNode.dosage}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-white">
              {currentNode.title}
            </h2>
            {currentNode.subtitle && (
              <p className="text-xs text-slate-400">{currentNode.subtitle}</p>
            )}
          </div>

          {currentNode.warning && (
            <div className="p-3 rounded border border-amber-900/40 bg-amber-950/20 text-amber-200 flex items-start gap-2 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>{currentNode.warning}</p>
            </div>
          )}

          {currentNode.details && currentNode.details.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Actions &amp; Guidelines</h3>
              <ul className="space-y-1.5">
                {currentNode.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentNode.options && currentNode.options.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Decision Branch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentNode.options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentNodeId(option.targetId)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-indigo-500/50 text-slate-200 font-medium text-xs transition-desktop group text-left cursor-pointer"
                  >
                    <span>{option.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-400 transition-transform shrink-0 ml-1.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: Full Diagram Overview */}
      {viewMode === 'full_diagram' && (
        <div className="space-y-3">
          <div className="p-2.5 rounded border border-indigo-900/40 bg-indigo-950/20 text-indigo-300 text-xs">
            Complete algorithm tree: click any step to view details.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allNodesList.map((node) => (
              <div
                key={node.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCurrentNodeId(node.id);
                  setViewMode('step');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCurrentNodeId(node.id);
                    setViewMode('step');
                  }
                }}
                className={`cursor-pointer p-3.5 rounded-lg border transition-desktop ${
                  node.id === currentNodeId
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge
                    variant={
                      node.type === 'start' ? 'primary' :
                      node.type === 'warning' ? 'warning' :
                      node.type === 'outcome' ? 'success' :
                      'neutral'
                    }
                    size="sm"
                  >
                    {node.type}
                  </Badge>
                  {node.dosage && <span className="text-[10px] text-purple-300 font-medium">💊 {node.dosage}</span>}
                </div>

                <h4 className="font-semibold text-xs text-white mb-0.5">{node.title}</h4>
                {node.subtitle && <p className="text-[11px] text-slate-400 mb-1.5">{node.subtitle}</p>}

                {node.details && (
                  <ul className="space-y-0.5">
                    {node.details.slice(0, 2).map((d, i) => (
                      <li key={i} className="text-[10px] text-slate-400 truncate">• {d}</li>
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
