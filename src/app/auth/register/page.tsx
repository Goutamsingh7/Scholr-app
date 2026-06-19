'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); toast.error(data.error ?? 'Registration failed'); return; }
    const signInRes = await signIn('credentials', { email:form.email, password:form.password, redirect:false });
    setLoading(false);
    if (signInRes?.ok) { toast.success('Account created! Let\'s set up your timetable 🎓'); router.push('/timetable/upload'); }
    else toast.error('Account created — please sign in');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute w-[700px] h-[700px] bg-violet-700 rounded-full blur-3xl opacity-15 -top-40 -right-40 animate-blob" />
      <div className="absolute w-[400px] h-[400px] bg-pink-600 rounded-full blur-3xl opacity-10 -bottom-20 left-10 animate-blob [animation-delay:2s]" />

      <motion.div initial={{ opacity:0, y:32, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.6, ease:[0.4,0,0.2,1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block font-playfair text-3xl font-bold gradient-text mb-2">Scholr</Link>
            <h1 className="text-xl font-semibold text-white mt-1">Create your account</h1>
            <p className="text-white/40 text-sm mt-1">Free forever · No credit card needed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key:'name', label:'Full Name', type:'text', placeholder:'Alex Kumar' },
              { key:'email', label:'Email', type:'email', placeholder:'you@college.edu' },
              { key:'password', label:'Password', type:'password', placeholder:'Minimum 8 characters' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm text-white/60 mb-1.5 block">{f.label}</label>
                <input
                  type={f.type} required placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 font-semibold text-white transition-all btn-glow hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 mt-2"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating account…</span> : 'Create account →'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"/></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs text-white/30" style={{background:'rgba(5,5,14,0.5)'}}>or</span></div>
          </div>

          <button onClick={() => signIn('google', { callbackUrl:'/timetable/upload' })}
            className="w-full py-3 rounded-xl glass font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-3 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
