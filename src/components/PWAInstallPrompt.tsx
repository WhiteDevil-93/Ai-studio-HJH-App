import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    setIsStandalone(isInStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Capture standard browser PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Automatically pop up banner if not installed
      if (!isInStandalone) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that don't emit beforeinstallprompt (or when triggered manually)
      alert(
        "To install Asclepius as an App:\n\n• Chrome/Edge: Tap the menu (⋮ or ⋯) and select 'Install Asclepius' or 'Add to Home screen'.\n• Safari (iOS): Tap the Share button and select 'Add to Home Screen'."
      );
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Banner Prompt */}
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[110] bg-slate-900/95 border border-indigo-500/50 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Install Asclepius App</h4>
                <p className="text-xs text-slate-300 mt-0.5">Instant offline access to ICU/ED guidelines & dosing cards.</p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close installation prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install PWA Now</span>
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 max-w-sm w-full p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                📱
              </div>
              <div>
                <h3 className="font-extrabold text-base">Install on iOS (Safari)</h3>
                <p className="text-xs text-slate-400">Add to Home Screen in 2 simple steps:</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <Share className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">1. Tap Share Button</span>
                  <p className="text-slate-400">Tap the Share icon in Safari's bottom toolbar.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <PlusSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">2. Add to Home Screen</span>
                  <p className="text-slate-400">Scroll down and tap <strong>'Add to Home Screen'</strong>.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      if (isIOS) {
        alert("To install on iPhone/iPad: Tap the Safari Share button (⎋), then scroll down and tap 'Add to Home Screen'.");
      } else {
        alert("To install Asclepius as an App:\n\nTap your browser menu (⋮ or ⋯) and select 'Install Asclepius' or 'Add to Home Screen'.");
      }
    }
  };

  return { canInstall: !isStandalone, triggerInstall };
}
