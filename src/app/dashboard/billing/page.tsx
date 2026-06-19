'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import UpgradeModal from '@/components/dashboard/upgrade-modal';

interface UserData {
  plan: string;
  planExpiresAt: string | null;
  aiParsesUsed: number;
  name: string;
  email: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  plan: string;
  createdAt: string;
  razorpayPaymentId: string | null;
}

const FREE_PARSE_LIMIT = 2;

const FEATURES = {
  free: [
    { label:'Manual timetable entry',      yes:true  },
    { label:'Unlimited attendance tracking',yes:true  },
    { label:'Basic analytics dashboard',    yes:true  },
    { label:'Session notes (text)',         yes:true  },
    { label:'Weekly schedule view',         yes:true  },
    { label:`AI timetable parsing (${FREE_PARSE_LIMIT} free)`, yes:true  },
    { label:'Photo attachments on notes',   yes:false },
    { label:'PDF attendance export',        yes:false },
    { label:'Unlimited AI parsing',         yes:false },
    { label:'Priority support',             yes:false },
  ],
  pro: [
    { label:'Everything in Free',           yes:true },
    { label:'Unlimited AI timetable parsing',yes:true },
    { label:'Photo attachments on notes',    yes:true },
    { label:'PDF attendance export',         yes:true },
    { label:'Advanced analytics',            yes:true },
    { label:'Priority support',              yes:true },
    { label:'All future Pro features',       yes:true },
  ],
};

export default function BillingPage() {
  const [userData,      setUserData]      = useState<UserData | null>(null);
  const [payments,      setPayments]      = useState<Payment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [upgradeOpen,   setUpgradeOpen]   = useState(false);

  async function fetchData() {
    try {
      const res = await fetch('/api/user');
      const d = await res.json();
      setUserData(d.user);
      setPayments(d.payments ?? []);
    } catch {
      toast.error('Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleUpgradeSuccess() {
    fetchData(); // Re-fetch to show updated plan
  }

  const isPro = userData?.plan === 'pro';
  const expiresAt = userData?.planExpiresAt ? new Date(userData.planExpiresAt) : null;
  const parsesLeft = Math.max(0, FREE_PARSE_LIMIT - (userData?.aiParsesUsed ?? 0));

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 glass rounded-xl shimmer" />
        <div className="h-48 glass rounded-3xl shimmer" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-64 glass rounded-3xl shimmer" />
          <div className="h-64 glass rounded-3xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
        <h1 className="font-playfair text-2xl font-bold text-white">Billing & Plan</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your subscription and usage</p>
      </motion.div>

      {/* Current plan card */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
        className={`glass-card rounded-3xl p-6 border ${isPro ? 'border-violet-500/30' : 'border-white/8'}`}
        style={isPro ? { boxShadow:'0 0 40px rgba(124,58,237,0.1)' } : {}}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{isPro ? '⭐' : '🆓'}</span>
              <div>
                <h2 className="font-playfair text-xl font-bold text-white">
                  {isPro ? 'Scholr Pro' : 'Free Plan'}
                </h2>
                {isPro && expiresAt && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Active until {expiresAt.toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {!isPro && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">AI Parse uses</span>
                  <span className="font-mono text-white">{userData?.aiParsesUsed ?? 0} / {FREE_PARSE_LIMIT}</span>
                </div>
                <div className="w-full glass rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all"
                    style={{ width:`${((userData?.aiParsesUsed ?? 0) / FREE_PARSE_LIMIT) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/35">
                  {parsesLeft > 0 ? `${parsesLeft} free AI parse${parsesLeft===1?'':'s'} remaining` : 'Free AI parses used up — upgrade for unlimited'}
                </p>
              </div>
            )}

            {isPro && (
              <div className="flex flex-wrap gap-3 mt-4">
                {['Unlimited AI parsing','Photo notes','PDF export','Priority support'].map(f => (
                  <span key={f} className="text-xs px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">✓ {f}</span>
                ))}
              </div>
            )}
          </div>

          {!isPro && (
            <button onClick={() => setUpgradeOpen(true)}
              className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-sm text-white btn-glow hover:scale-105 transition-all"
            >Upgrade to Pro</button>
          )}
          {isPro && (
            <div className="shrink-0 px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-semibold">
              PRO ⭐
            </div>
          )}
        </div>
      </motion.div>

      {/* Pricing cards */}
      {!isPro && (
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}>
          <h3 className="font-semibold text-white mb-4">Choose a plan</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="glass-card rounded-3xl p-6 border border-white/8">
              <div className="mb-4">
                <p className="font-playfair text-3xl font-bold text-white">Free</p>
                <p className="text-white/40 text-sm mt-1">Forever</p>
              </div>
              <div className="space-y-2.5 mb-6">
                {FEATURES.free.map(f => (
                  <div key={f.label} className={`flex items-center gap-2.5 text-sm ${f.yes?'text-white/70':'text-white/25 line-through'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.yes?'bg-emerald-500/20 border border-emerald-500/30':'bg-white/5'}`}>
                      {f.yes && <span className="text-[9px] text-emerald-400">✓</span>}
                    </span>
                    {f.label}
                  </div>
                ))}
              </div>
              <div className="w-full py-3 rounded-xl glass border border-white/10 text-center text-sm text-white/40 font-medium">
                Current plan
              </div>
            </div>

            {/* Pro */}
            <div className="glass-card rounded-3xl p-6 border border-violet-500/40 relative overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))' }}
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                PRO
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-playfair text-3xl font-bold gradient-text-static">₹149</p>
                  <p className="text-white/40 text-sm">/ semester</p>
                </div>
                <p className="text-white/40 text-xs mt-0.5">or ₹249/year — save ₹501</p>
              </div>
              <div className="space-y-2.5 mb-6">
                {FEATURES.pro.map(f => (
                  <div key={f.label} className="flex items-center gap-2.5 text-sm text-white/80">
                    <span className="w-4 h-4 rounded-full bg-violet-500/25 border border-violet-500/40 flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-violet-300">✓</span>
                    </span>
                    {f.label}
                  </div>
                ))}
              </div>
              <button onClick={() => setUpgradeOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-white transition-all btn-glow hover:scale-[1.02]"
              >Get Pro →</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}>
          <h3 className="font-semibold text-white mb-4">Payment History</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {payments.map(p => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Pro {p.plan === 'semester' ? 'Semester' : 'Annual'}</p>
                    <p className="text-xs text-white/35 font-mono mt-0.5">{p.razorpayPaymentId ?? 'Processing'}</p>
                    <p className="text-xs text-white/25 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">₹{(p.amount/100).toFixed(0)}</p>
                    <span className="text-xs badge-present px-2 py-0.5 rounded-full">Paid</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQ */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.25 }}>
        <h3 className="font-semibold text-white mb-4">FAQ</h3>
        <div className="space-y-3">
          {[
            ['What payment methods are supported?', 'UPI (GPay, PhonePe, Paytm), all debit/credit cards, net banking, and wallets via Razorpay.'],
            ['Can I get a refund?', 'Yes — contact us within 7 days of purchase if you\'re not satisfied and we\'ll refund you, no questions asked.'],
            ['Does my Pro plan cover all semesters?', 'A Semester plan covers 5 months. An Annual plan covers 12 months. You can renew any time.'],
            ['What happens when Pro expires?', 'Your data is never deleted. You revert to the Free plan — tracking and notes stay accessible, AI parsing requires re-subscribing.'],
          ].map(([q,a]) => (
            <div key={q} className="glass-card rounded-2xl p-4">
              <p className="text-sm font-semibold text-white mb-1.5">{q}</p>
              <p className="text-sm text-white/45 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onSuccess={handleUpgradeSuccess} trigger="ai_parse" />
    </div>
  );
}
