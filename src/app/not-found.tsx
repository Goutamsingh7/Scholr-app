'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-violet-700 rounded-full blur-3xl opacity-15 top-0 left-0 animate-blob"/>
      <div className="absolute w-[400px] h-[400px] bg-cyan-600 rounded-full blur-3xl opacity-10 bottom-0 right-0 animate-blob [animation-delay:3s]"/>
      <motion.div initial={{ opacity:0,y:32 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }}
        className="text-center relative z-10 max-w-md"
      >
        <div className="font-playfair text-[120px] font-bold gradient-text leading-none mb-4">404</div>
        <h1 className="font-playfair text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist, or you may not have access to it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-medium text-white btn-glow hover:scale-105 transition-all"
          >Go to Dashboard</Link>
          <Link href="/"
            className="px-6 py-3 rounded-xl glass border border-white/10 font-medium text-white/70 hover:text-white hover:border-white/25 transition-all"
          >Back to Home</Link>
        </div>
      </motion.div>
    </div>
  );
}
