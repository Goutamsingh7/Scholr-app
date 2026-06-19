'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', subject:'General enquiry', message:'' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill in all fields'); return; }
    setSending(true);
    // In production wire this to an email API (Resend / EmailJS / Formspree)
    // For now simulate a send
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast.success('Message sent! We\'ll reply within 24 hours.');
  }

  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-violet-700 rounded-full blur-3xl opacity-10 -top-20 -left-20 animate-blob pointer-events-none"/>
      <div className="absolute w-[400px] h-[400px] bg-cyan-600 rounded-full blur-3xl opacity-08 bottom-0 right-0 animate-blob [animation-delay:3s] pointer-events-none"/>

      <div className="max-w-xl mx-auto relative z-10">
        <Link href="/" className="font-playfair text-2xl font-bold gradient-text inline-block mb-8">Scholr</Link>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
          <h1 className="font-playfair text-3xl font-bold text-white mb-1">Contact us</h1>
          <p className="text-white/40 text-sm mb-8">We reply to every message within 24 hours.</p>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon:'💳', label:'Billing & Refunds',  sub:'Payment issues, refunds, plan changes' },
              { icon:'🐛', label:'Report a Bug',        sub:'Something broken or not working' },
              { icon:'💡', label:'Feature Request',     sub:'Suggest something new' },
            ].map(c => (
              <div key={c.label} className="glass-card rounded-2xl p-4 text-center cursor-default">
                <p className="text-2xl mb-1.5">{c.icon}</p>
                <p className="text-xs font-semibold text-white">{c.label}</p>
                <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{c.sub}</p>
              </div>
            ))}
          </div>

          {sent ? (
            <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
              className="glass-card rounded-3xl p-10 text-center border border-emerald-500/25"
              style={{ background:'rgba(34,197,94,0.06)' }}
            >
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-playfair text-xl font-bold text-white mb-2">Message sent!</h2>
              <p className="text-white/50 text-sm mb-6">We'll reply to <span className="text-white">{form.email}</span> within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'General enquiry', message:'' }); }}
                className="px-6 py-2.5 rounded-xl glass border border-white/15 text-sm text-white/60 hover:text-white transition-all"
              >Send another message</button>
            </motion.div>
          ) : (
            <div className="glass-card rounded-3xl p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Name</label>
                    <input type="text" placeholder="Your name" required
                      value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                      className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Email</label>
                    <input type="email" placeholder="you@example.com" required
                      value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                      className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject:e.target.value }))}
                    className="w-full glass rounded-xl px-4 py-3 text-white text-sm transition-all [color-scheme:dark]"
                  >
                    {['General enquiry','Billing & Refunds','Bug report','Feature request','Account issue','Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Message</label>
                  <textarea placeholder="Describe your issue or question…" required rows={5}
                    value={form.message} onChange={e => setForm(f => ({ ...f, message:e.target.value }))}
                    className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all resize-none"
                  />
                </div>

                <button type="submit" disabled={sending}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-white transition-all btn-glow hover:scale-[1.01] disabled:opacity-50"
                >
                  {sending
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending…</span>
                    : 'Send message →'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <p className="text-xs text-white/30">
                  For urgent billing issues, include your payment ID from the{' '}
                  <Link href="/dashboard/billing" className="text-violet-400 hover:text-violet-300 underline">Billing page</Link>.
                </p>
              </div>
            </div>
          )}

          {/* Legal footer links */}
          <div className="flex justify-center gap-4 mt-6 text-xs text-white/25">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
            <Link href="/refund" className="hover:text-white/50 transition-colors">Refunds</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
