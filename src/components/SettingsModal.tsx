import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Building2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Info,
  Scale,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  X,
  FileText,
  Sliders,
  HardDrive
} from 'lucide-react';
import { Button } from './ui/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { SettingRow } from './ui/SettingRow';
import { Badge } from './ui/Badge';
import {
  GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
} from '../clinical/globalReferenceDocuments';
import { HOSPITALS, hospitalProtocolCount, type HospitalId } from '../clinical/hospitalProtocols';

export type SettingsTabId =
  | 'appearance'
  | 'defaults'
  | 'sources'
  | 'disclaimer'
  | 'privacy'
  | 'about';

export type AppDensity = 'compact' | 'default' | 'comfortable';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  defaultTab?: string;
  theme: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
  onThemeChange?: React.Dispatch<React.SetStateAction<'dark' | 'light'>> | ((theme: 'dark' | 'light') => void);
  density: AppDensity;
  onChangeDensity?: (density: AppDensity) => void;
  onDensityChange?: React.Dispatch<React.SetStateAction<AppDensity>> | ((density: AppDensity) => void);
  defaultFacility?: HospitalId;
  onChangeDefaultFacility?: (facility: HospitalId) => void;
  favouritesCount?: number;
  recentCount?: number;
  onClearFavourites?: () => void;
  onClearRecent?: () => void;
}

const mapLegacyTab = (tab?: string): SettingsTabId => {
  if (tab === 'disclaimer') return 'disclaimer';
  if (tab === 'design') return 'appearance';
  if (tab === 'privacy') return 'privacy';
  if (tab === 'about') return 'about';
  if (tab === 'defaults') return 'defaults';
  if (tab === 'sources') return 'sources';
  return 'appearance';
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appearance',
  defaultTab,
  theme,
  onToggleTheme,
  onThemeChange,
  density,
  onChangeDensity,
  onDensityChange,
  defaultFacility = 'hjh',
  onChangeDefaultFacility,
  favouritesCount = 0,
  recentCount = 0,
  onClearFavourites,
  onClearRecent,
}) => {
  const resolvedInitialTab = mapLegacyTab(defaultTab || initialTab);
  const [activeTab, setActiveTab] = useState<SettingsTabId>(resolvedInitialTab);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleThemeToggle = (newTheme: 'dark' | 'light') => {
    if (onThemeChange) {
      (onThemeChange as (theme: 'dark' | 'light') => void)(newTheme);
    } else if (onToggleTheme) {
      onToggleTheme(newTheme);
    }
  };

  const handleDensityChange = (newDensity: AppDensity) => {
    if (onDensityChange) {
      (onDensityChange as (density: AppDensity) => void)(newDensity);
    } else if (onChangeDensity) {
      onChangeDensity(newDensity);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(resolvedInitialTab);
    }
  }, [isOpen, resolvedInitialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: Array<{ id: SettingsTabId; label: string; icon: React.ElementType }> = [
    { id: 'appearance', label: 'Appearance & Scaling', icon: Sliders },
    { id: 'defaults', label: 'Clinical Defaults', icon: Scale },
    { id: 'sources', label: 'Facility Libraries', icon: Building2 },
    { id: 'disclaimer', label: 'Safety & Governance', icon: AlertTriangle },
    { id: 'privacy', label: 'Storage & Privacy', icon: HardDrive },
    { id: 'about', label: 'About & System', icon: Info },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl max-w-3xl w-full h-[580px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 id="settings-title" className="text-sm font-bold text-white">
              Asclepius Preferences &amp; Reference Info
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-desktop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Split Sidebar & Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <nav
            className="w-52 border-r border-slate-800 bg-slate-950/40 p-2 space-y-0.5 shrink-0 overflow-y-auto"
            aria-label="Settings categories"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-desktop text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Content Panel */}
          <main className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* 1. APPEARANCE & SCALING */}
            {activeTab === 'appearance' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">Appearance &amp; Density</h3>
                  <p className="text-xs text-slate-400">Configure visual themes and control information density.</p>
                </div>

                <div className="space-y-2">
                  <SettingRow
                    title="Color Theme"
                    description="Switch between dark and light desktop surface palettes."
                  >
                    <SegmentedControl
                      size="sm"
                      value={theme}
                      onChange={(v) => handleThemeToggle(v as 'dark' | 'light')}
                      options={[
                        { value: 'dark', label: 'Dark', icon: <Moon className="w-3 h-3 text-slate-400" /> },
                        { value: 'light', label: 'Light', icon: <Sun className="w-3 h-3 text-amber-400" /> },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    title="Display Density"
                    description="Adjust padding, typography, and control sizing across all clinical cards."
                  >
                    <SegmentedControl
                      size="sm"
                      value={density}
                      onChange={(v) => handleDensityChange(v as AppDensity)}
                      options={[
                        { value: 'compact', label: 'Compact' },
                        { value: 'default', label: 'Default' },
                        { value: 'comfortable', label: 'Comfortable' },
                      ]}
                    />
                  </SettingRow>
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">Density Guidelines</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                    <li><strong className="text-slate-300">Compact:</strong> Maximum information density for clinical monitors (13px text, 28px controls).</li>
                    <li><strong className="text-slate-300">Default:</strong> Balanced desktop density (14px text, 32px controls).</li>
                    <li><strong className="text-slate-300">Comfortable:</strong> Relaxed spacing for touch tablets and fatigue reduction.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. CLINICAL DEFAULTS */}
            {activeTab === 'defaults' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">Clinical &amp; Facility Defaults</h3>
                  <p className="text-xs text-slate-400">Choose your default hospital library when opening Asclepius.</p>
                </div>

                <div className="space-y-2">
                  <SettingRow
                    title="Default Institution"
                    description="Pre-selects protocol catalog on initial load."
                  >
                    <SegmentedControl
                      size="sm"
                      value={defaultFacility}
                      onChange={(v) => onChangeDefaultFacility && onChangeDefaultFacility(v as HospitalId)}
                      options={[
                        { value: 'hjh', label: 'HJH' },
                        { value: 'rmmch', label: 'RMMCH' },
                        { value: 'cmjah', label: 'CMJAH' },
                        { value: 'chbah', label: 'CHBAH' },
                      ]}
                    />
                  </SettingRow>
                </div>
              </div>
            )}

            {/* 3. FACILITY LIBRARIES */}
            {activeTab === 'sources' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">Facility Protocol Repositories</h3>
                  <p className="text-xs text-slate-400">Protocols are isolated by institution to ensure guideline fidelity.</p>
                </div>

                <div className="grid gap-2.5">
                  {(['hjh', 'rmmch', 'cmjah', 'chbah'] as const).map((fid) => {
                    const h = HOSPITALS[fid];
                    const count = hospitalProtocolCount(fid);
                    return (
                      <div key={fid} className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-xs">{h.name}</span>
                            <Badge variant={`facility-${fid}` as any}>{h.shortName}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-400">{h.subtitle}</p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 shrink-0">
                          {count} protocols
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SAFETY & GOVERNANCE */}
            {activeTab === 'disclaimer' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">Clinical Safety &amp; Governance</h3>
                  <p className="text-xs text-slate-400">Decision support constraints and citation verification.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Clinical Decision-Support Notice</span>
                  </div>
                  <p className="text-xs text-rose-100/90 leading-relaxed">
                    Asclepius is a memory aid and clinical reference tool for authorized medical personnel. It is not an automated diagnostic system and does not replace individualized clinical evaluation or institutional protocols.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/40 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">Reference Integrity &amp; Provenance</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Summaries retain their source citations from institutional guideline documents. Where primary evidence supersedes historic dosing, explicit current-source notes are displayed.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Audit: {SUPPLIED_GUIDELINE_LINK_AUDIT.guidelineCount} international guidelines indexed.
                  </p>
                </div>
              </div>
            )}

            {/* 5. STORAGE & PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">Local Storage &amp; Privacy</h3>
                  <p className="text-xs text-slate-400">Manage offline cached data and local preferences.</p>
                </div>

                <div className="p-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20 text-xs text-emerald-200 leading-relaxed">
                  <strong>100% Local-First Architecture:</strong> All clinical calculations, patient weights, favorites, and recent history remain strictly within your browser. No telemetry or patient data is transmitted off-device.
                </div>

                <div className="space-y-2">
                  <SettingRow
                    title="Favorite Items"
                    description={`${favouritesCount} bookmarks stored locally.`}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={favouritesCount === 0}
                      onClick={onClearFavourites}
                      icon={<Trash2 className="w-3 h-3 text-slate-400" />}
                    >
                      Clear
                    </Button>
                  </SettingRow>

                  <SettingRow
                    title="Recently Viewed History"
                    description={`${recentCount} recent clinical cards stored.`}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={recentCount === 0}
                      onClick={onClearRecent}
                      icon={<Trash2 className="w-3 h-3 text-slate-400" />}
                    >
                      Clear
                    </Button>
                  </SettingRow>
                </div>
              </div>
            )}

            {/* 6. ABOUT & SYSTEM */}
            {activeTab === 'about' && (
              <div className="space-y-4" role="tabpanel">
                <div>
                  <h3 className="text-sm font-semibold text-white">About Asclepius Clinical Reference</h3>
                  <p className="text-xs text-slate-400">Version 2026.1 Desktop Edition</p>
                </div>

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    Asclepius is a high-density, professional emergency and critical-care decision-support workspace designed for fast visual scanning, rapid weight-based dose calculation, and protocol navigation.
                  </p>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="text-slate-400 text-[11px] font-medium">Core Stack &amp; Engine</div>
                    <div className="text-slate-200 text-xs font-mono">React 19 + TypeScript + Vite + Tailwind CSS</div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/60 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Esc</kbd> to close</span>
          <Button size="sm" variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
