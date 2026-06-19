'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger?: 'ai_parse' | 'photo_notes' | 'export';
}

const TRIGGER_COPY = {
  ai_parse:    { icon:'🤖', title:'AI Timetable Parser', desc:'You\'ve used your 2 free AI parses. Upgrade to Pro for unlimited AI-powered schedule parsing.' },
  photo_notes: { icon:'📷', title:'Photo Notes',         desc:'Attaching photos to notes is a Pro feature. Upgrade to keep visual study records.' },
  export:      { icon:'📄', title:'PDF Export',          desc:'Exporting attendance reports is a Pro feature. Upgrade to download and share your data.' },
};

const PLANS = [
  { key:'semester', label:'Semester',  price:'₹149', per:'5 months',  popular:false, saving:null },
  { key:'yearly',   label:'Annual',    price:'₹249', per:'12 months', popular:true,  saving:'Save ₹501' },
];

const FEATURES = [
  '🤖 Unlimited AI timetable parsing',
  '📷 Photo attachments on notes',
  '📄 PDF attendance report export',
  '⚡ Priority support',
  '📊 Advanced analytics',
  '🔔 All future Pro features',
];

declare global { interface Window { Razorpay: any } }

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window.Razorpay !== 'undefined') { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function UpgradeModal({ open, onClose, onSuccess, trigger = 'ai_parse' }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'semester'|'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const copy = TRIGGER_COPY[trigger];

  async function handleUpgrade() {
    setLoading(true);
    try {
      // Load Razorpay SDK
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load payment gateway');

      // Create order
      const res = await fetch('/api/payments/create-order', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Order creation failed');

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id:    data.orderId,
        amount:      data.amount,
        currency:    'INR',
        name:        'Scholr',
        description: `Pro ${selectedPlan === 'semester' ? 'Semester' : 'Annual'} Plan`,
        image:       '/favicon.ico',
        theme:       { color: '#7c3aed' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            toast.success('🎉 Welcome to Scholr Pro!');
            onSuccess();
            onClose();
          } catch (err: any) {
            toast.error(err.message ?? 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        prefill: {},
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err.message ?? 'Payment failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div initial={{ opacity:0, scale:0.9, y:24 }} animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:24 }} transition={{ type:'spring', damping:26, stiffness:300 }}
            className="relative w-full max-w-md z-10"
          >
            <div className="glass-strong rounded-3xl overflow-hidden"
              style={{ boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)' }}
            >
              {/* Header gradient */}
              <div className="bg-gradient-to-br from-violet-600/40 to-cyan-600/20 px-6 py-6 border-b border-white/5 relative">
                <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >×</button>
                <div className="text-3xl mb-3">{copy.icon}</div>
                <h2 className="font-playfair text-2xl font-bold text-white">{copy.title}</h2>
                <p className="text-white/50 text-sm mt-1 leading-relaxed">{copy.desc}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Plan selector */}
                <div className="grid grid-cols-2 gap-3">
                  {PLANS.map(plan => (
                    <button key={plan.key} onClick={() => setSelectedPlan(plan.key as any)}
                      className={`relative p-4 rounded-2xl text-left transition-all border ${
                        selectedPlan===plan.key
                          ? 'bg-violet-600/25 border-violet-500/60 shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                          : 'glass border-white/10 hover:border-white/25'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          BEST VALUE
                        </div>
                      )}
                      <p className="font-playfair text-2xl font-bold text-white">{plan.price}</p>
                      <p className="text-xs text-white/50 mt-0.5">{plan.per}</p>
                      <p className="text-sm font-medium text-white mt-1">{plan.label}</p>
                      {plan.saving && (
                        <p className="text-[11px] text-emerald-400 mt-0.5 font-semibold">{plan.saving}</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* Features list */}
                <div className="space-y-2">
                  {FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-emerald-400">✓</span>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button onClick={handleUpgrade} disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-white text-lg transition-all btn-glow hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Opening payment…</span>
                    : `Upgrade to Pro — ${selectedPlan==='semester'?'₹149':'₹249'}`}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs text-white/25">
                  <span>🔒 256-bit SSL</span>
                  <span>·</span>
                  <span>💳 UPI / Cards / NetBanking</span>
                  <span>·</span>
                  <span>↩ Cancel anytime</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
