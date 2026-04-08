"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const checkEarlyEvent = () => {
      const earlyEvent = (window as any).deferredPWAInstallPrompt;
      if (earlyEvent) {
        setDeferredPrompt(earlyEvent);
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("early-pwa-prompt", checkEarlyEvent);
    
    // Check immediately in case it already fired
    checkEarlyEvent();
    
    // For iOS, the beforeinstallprompt event doesn't fire. But we can show a tooltip natively
    // We'll show the prompt manually if it's iOS and not standalone
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("early-pwa-prompt", checkEarlyEvent);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("Tippe in Safari auf 'Teilen' (Viereck mit Pfeil nach oben) und dann auf 'Zum Home-Bildschirm', um die App zu installieren.");
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom max-w-sm mx-auto">
      <div className="bg-[#2200ff] text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold">App installieren</p>
            <p className="text-white/80 text-xs leading-tight mt-0.5">Schnellerer Zugriff auf ZeitScan</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleInstallClick} 
            className="bg-white text-[#2200ff] text-xs font-bold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform"
          >
            Laden
          </button>
          <button 
            onClick={() => setShowPrompt(false)} 
            className="p-1 px-2 -mr-2 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
