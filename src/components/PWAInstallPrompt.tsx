import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, Sparkles, ExternalLink } from 'lucide-react';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone display mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chrome / Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled || bannerDismissed) {
    return null;
  }

  return (
    <>
      {/* Top Floating PWA Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border-b border-indigo-500/30 px-4 py-2.5 text-white flex items-center justify-between gap-3 shadow-md animate-fade-in z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">Install VoxFlow 3D App</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] font-bold text-indigo-300 border border-indigo-400/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Add to Home Screen for fast offline access and smartphone app experience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{deferredPrompt ? 'Install App' : 'How to Install'}</span>
          </button>

          <button
            onClick={() => {
              setBannerDismissed(true);
              if (onDismiss) onDismiss();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install VoxFlow on Smartphone</h3>
                <p className="text-xs text-slate-400">Install directly via Chrome or Safari</p>
              </div>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Share className="w-4 h-4" /> Instructions for iOS (iPhone/iPad):
                </span>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Tap the <strong>Share</strong> button at the bottom of Safari browser.</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>
            ) : (
              /* Chrome / Android Instructions */
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" /> Instructions for Android & Chrome:
                </span>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Tap the <strong>three dots (⋮)</strong> menu in top right of Chrome.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Confirm by tapping <strong>Install</strong>.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
