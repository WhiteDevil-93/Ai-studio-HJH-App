import React from 'react';
import {
  ShieldAlert, X, Activity, Stethoscope, AlertTriangle, Brain, Heart, Syringe, Zap
} from 'lucide-react';

interface CodeRedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMindMap: (id: string) => void;
}

export const EMERGENCY_ACTIONS = [
  {
    id: 'aha_bls_acls',
    title: 'Adult Cardiac Arrest (ACLS 2020)',
    subtitle: 'High-quality CPR • 1 Shock • Epinephrine 1mg • Amiodarone 300mg',
    color: 'bg-red-600 text-white hover:bg-red-700 border-red-500',
    icon: Activity
  },
  {
    id: 'trauma_arrest',
    title: 'Trauma Cardiac Arrest (H-O-T-T)',
    subtitle: 'Haemorrhage control • Oxygenation • Tension decompression • Tamponade',
    color: 'bg-orange-600 text-white hover:bg-orange-700 border-orange-500',
    icon: ShieldAlert
  },
  {
    id: 'anaphylaxis_flowchart',
    title: 'Anaphylaxis Immediate Management',
    subtitle: 'Adrenaline 0.5ml IM (1:1000 anterolateral thigh) • IV Fluids 20ml/kg',
    color: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500',
    icon: AlertTriangle
  },
  {
    id: 'rsi_checklist',
    title: 'Airway RSI Checklist (EDICT)',
    subtitle: 'Pre-oxygenate 100% O2 • Induction + Paralytic • Confirm ETT',
    color: 'bg-sky-600 text-white hover:bg-sky-700 border-sky-500',
    icon: Stethoscope
  },
  {
    id: 'status_epilepticus',
    title: 'Status Epilepticus Seizure Abort',
    subtitle: 'Benzodiazepines: Lorazepam 0.1mg/kg IV or Midazolam 0.2mg/kg IV',
    color: 'bg-purple-600 text-white hover:bg-purple-700 border-purple-500',
    icon: Brain
  }
];

export const CodeRedDrawer: React.FC<CodeRedDrawerProps> = ({ isOpen, onClose, onSelectMindMap }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-500 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Banner */}
        <div className="flex items-center gap-3 border-b border-red-500/30 pb-4">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-red-400">Emergency Resuscitation Mode</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">CODE RED Resuscitation Cards</h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          High-acuity, zero-distraction protocol shortcuts for life-threatening resuscitation scenarios. Tap any card below to launch its interactive algorithm.
        </p>

        {/* Emergency Action Cards */}
        <div className="space-y-3">
          {EMERGENCY_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onSelectMindMap(action.id);
                  onClose();
                }}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${action.color} flex items-center justify-between group`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 rounded-xl bg-white/10 shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold truncate">{action.title}</h3>
                    <p className="text-xs text-white/80 font-medium truncate mt-0.5">{action.subtitle}</p>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-white/70 group-hover:scale-125 transition-transform shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
