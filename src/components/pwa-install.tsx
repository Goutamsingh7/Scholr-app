'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [prompt,    setPrompt]    = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed,  setDismissed]  = useState(false);
  const [isIOS,      setIsIOS]      = useState(false);
  const [isInApp,    setIsInApp]    = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(err => console.warn('SW registration failed:', err));
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect if already installed as PWA
    const inApp = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInApp(inApp);

    if (inApp) return; // Already installed, hide banner

    // Check if user dismissed before (session)
    if (sessionStorage.getItem('pwa-dismissed')) return;

    // Android: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Show after 20s on dashboard
      if (window.location.pathname.startsWith('/dashboard')) {
        setTimeout(() => setShowBanner(true), 20000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show custom instructions after 30s
    if (ios && window.location.pathname.startsWith('/dashboard')) {
      const iosTimer = setTimeout(() => {
        if (!sessionStorage.getItem('pwa-dismissed')) setShowBanner(true);
      }, 30000);
      return () => { clearTimeout(iosTimer); window.removeEventListener('beforeinstallprompt', handler); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setPrompt(null);
    }
  }

  function dismiss() {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  }

  if (isInApp || dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type:'spring', damping:26, stiffness:300 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-80"
      >
        <div className="glass-strong rounded-2xl p-4 border border-violet-500/30"
          style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <img src="/icon-72.png" alt="Scholr" className="w-12 h-12 rounded-xl shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Install Scholr</p>
              <p className="text-xs text-white/45 mt-0.5 leading-tight">
                {isIOS
                  ? 'Tap Share → "Add to Home Screen" for the best experience'
                  : 'Add to home screen for faster access and offline support'}
              </p>
            </div>
            <button onClick={dismiss} className="text-white/25 hover:text-white/60 transition-colors text-xl leading-none shrink-0 mt-0.5">×</button>
          </div>

          {isIOS ? (
            <div className="mt-3 glass rounded-xl p-3 flex items-center gap-2 border border-white/10">
              <span className="text-xl">⬆️</span>
              <div className="text-xs text-white/60">
                Tap <span className="text-white font-medium">Share</span> then{' '}
                <span className="text-white font-medium">Add to Home Screen</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button onClick={dismiss}
                className="flex-1 py-2 rounded-xl glass text-xs text-white/50 hover:text-white transition-all border border-white/10"
              >Not now</button>
              <button onClick={install}
                className="flex-2 flex-grow py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-xs font-bold text-white transition-all hover:scale-[1.02]"
              >📲 Install free</button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
