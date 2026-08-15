import React from 'react';
import {
  ShieldAlert, X, Activity, Stethoscope, AlertTriangle, Brain, Zap, ChevronRight
} from 'lucide-react';
import {
  MIND_MAPS_DATABASE,
  type MindMapDefinition,
} from '../clinical/mindMaps';
import { Button } from './ui/Button';

interface CodeRedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMindMap: (id: string) => void;
}

interface CodeRedActionRef {
  id: string;
  sourceId: string;
  color: string;
  icon: React.ElementType;
}

export const EMERGENCY_ACTIONS: CodeRedActionRef[] = [
  {
    id: 'aha_bls_acls',
    sourceId: 'aha_bls_acls',
    color: 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border-rose-800/60',
    icon: Activity
  },
  {
    id: 'trauma_arrest',
    sourceId: 'trauma_arrest',
    color: 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50 border-amber-800/60',
    icon: ShieldAlert
  },
  {
    id: 'anaphylaxis_flowchart',
    sourceId: 'anaphylaxis_flowchart',
    color: 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border-rose-800/60',
    icon: AlertTriangle
  },
  {
    id: 'rsi_checklist',
    sourceId: 'rsi_checklist',
    color: 'bg-sky-950/40 text-sky-200 hover:bg-sky-900/50 border-sky-800/60',
    icon: Stethoscope
  },
  {
    id: 'status_epilepticus',
    sourceId: 'status_epilepticus',
    color: 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 border-purple-800/60',
    icon: Brain
  }
];

export function getCodeRedAction(
  actionRef: CodeRedActionRef,
  database: Record<string, MindMapDefinition> = MIND_MAPS_DATABASE
): (CodeRedActionRef & MindMapDefinition) | null {
  const source = database[actionRef.sourceId];
  if (!source) return null;
  return { ...source, ...actionRef };
}

export const CodeRedDrawer: React.FC<CodeRedDrawerProps> = ({ isOpen, onClose, onSelectMindMap }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="codered-title"
    >
      <div className="bg-slate-900 border border-rose-600/50 text-white rounded-xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-rose-950/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-rose-600 text-white shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Emergency Resuscitation</span>
              <h2 id="codered-title" className="text-sm font-bold text-white">CODE RED Resuscitation Cards</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Code Red drawer"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-desktop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            High-acuity, rapid protocol shortcuts for life-threatening resuscitation scenarios.
          </p>

          <div className="space-y-2">
            {EMERGENCY_ACTIONS.map((actionRef) => {
              const action = getCodeRedAction(actionRef);
              if (!action) return null;
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    onSelectMindMap(action.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-desktop flex items-center justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${action.color}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-black/20 shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold truncate text-white">{action.title}</h3>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{action.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/70 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Esc to close</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
