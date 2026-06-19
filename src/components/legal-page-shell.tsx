'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LegalPageShell({ title, updated, children }: { title:string; updated:string; children:React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-violet-700 rounded-full blur-3xl opacity-10 -top-20 -left-20 animate-blob pointer-events-none"/>
      <div className="max-w-2xl mx-auto relative z-10">
        <Link href="/" className="font-playfair text-2xl font-bold gradient-text inline-block mb-8">Scholr</Link>
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="glass-card rounded-3xl p-7 sm:p-10">
          <h1 className="font-playfair text-3xl font-bold text-white mb-1">{title}</h1>
          <p className="text-white/30 text-xs mb-8 font-mono">Last updated: {updated}</p>
          <div className="prose-legal space-y-5 text-white/65 text-sm leading-relaxed">
            {children}
          </div>
        </motion.div>
        <div className="flex justify-center gap-4 mt-6 text-xs text-white/25">
          <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <Link href="/refund" className="hover:text-white/50 transition-colors">Refunds</Link>
          <Link href="/contact" className="hover:text-white/50 transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
