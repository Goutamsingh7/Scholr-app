'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    setTimeout(() => window.location.href = '/dashboard', 500);
  }

  useEffect(() => {
    // Auto-retry when back online
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute w-[400px] h-[400px] bg-violet-700 rounded-full blur-3xl opacity-10 top-0 left-0 animate-blob"/>
      <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }}
        className="text-center max-w-sm"
      >
        <div className="text-7xl mb-6 animate-bounce">📡</div>
        <h1 className="font-playfair text-2xl font-bold text-white mb-3">You're offline</h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          No internet connection. Your previously viewed pages are still accessible.
          Scholr will sync your attendance automatically when you're back online.
        </p>
        <button onClick={retry} disabled={retrying}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-medium text-white btn-glow hover:scale-105 transition-all disabled:opacity-60"
        >
          {retrying ? 'Reconnecting…' : 'Try again'}
        </button>
        <p className="text-white/20 text-xs mt-6">Scholr saves your data locally — nothing is lost.</p>
      </motion.div>
    </div>
  );
}
