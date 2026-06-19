'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface User { name?: string|null; email?: string|null; image?: string|null }

const NAV = [
  { href:'/dashboard',           label:'Dashboard',        icon:'⊞', exact:true  },
  { href:'/dashboard/schedule',  label:'Schedule',         icon:'📅', exact:false },
  { href:'/dashboard/analytics', label:'Analytics',        icon:'📊', exact:false },
  { href:'/dashboard/notes',     label:'Notes',            icon:'📝', exact:false },
  { href:'/timetable/upload',    label:'Upload Timetable', icon:'⬆', exact:false },
];

const BOTTOM_NAV = [
  { href:'/dashboard/billing',  label:'Billing & Plan', icon:'💳', exact:false },
  { href:'/dashboard/settings', label:'Settings',       icon:'⚙️',  exact:false },
];

function NavLink({ href, label, icon, exact, onClick }: { href:string; label:string; icon:string; exact:boolean; onClick?:()=>void }) {
  const pathname = usePathname();
  const active = exact ? pathname===href : pathname.startsWith(href);
  return (
    <Link href={href} onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
        active ? 'text-white border border-violet-500/30' : 'text-white/45 hover:text-white hover:bg-white/[0.04]'
      }`}
      style={active ? { background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(124,58,237,0.08))' } : {}}
    >
      {active && (
        <motion.div layoutId="nav-active" className="absolute inset-0 rounded-xl"
          style={{ boxShadow:'inset 0 0 24px rgba(124,58,237,0.15)' }} />
      )}
      <span className="relative z-10 text-base w-5 text-center leading-none">{icon}</span>
      <span className="relative z-10">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]"/>}
    </Link>
  );
}

function NavContent({ user, plan, onNavigate }: { user:User; plan:string; onNavigate?:()=>void }) {
  const isPro = plan === 'pro';
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <Link href="/dashboard" onClick={onNavigate} className="font-playfair text-2xl font-bold gradient-text block">Scholr</Link>
          <p className="text-[10px] text-white/25 mt-0.5 font-mono">AI Attendance Tracker</p>
        </div>
        {isPro && (
          <span className="text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold px-4 mb-2">Main</p>
        {NAV.map(l => <NavLink key={l.href} {...l} onClick={onNavigate}/>)}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-white/5 space-y-0.5">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold px-4 mb-2">Account</p>
        {BOTTOM_NAV.map(l => <NavLink key={l.href} {...l} onClick={onNavigate}/>)}

        {/* Upgrade banner (free users only) */}
        {!isPro && (
          <Link href="/dashboard/billing" onClick={onNavigate}
            className="mx-1 mt-2 flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
            style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.12))', border:'1px solid rgba(124,58,237,0.3)' }}
          >
            <span className="text-lg">⭐</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Go Pro — ₹149</p>
              <p className="text-[10px] text-white/45 leading-tight">Unlimited AI parsing</p>
            </div>
            <span className="text-white/40 ml-auto shrink-0">›</span>
          </Link>
        )}

        {/* User chip */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mt-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
            style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
          >
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{user.name ?? 'Student'}</p>
            <p className="text-[10px] text-white/30 truncate">{user.email}</p>
          </div>
        </div>

        <button onClick={() => signOut({ callbackUrl:'/' })}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span className="text-sm">⎋</span> Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ user }: { user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    fetch('/api/user').then(r=>r.json()).then(d => setPlan(d.user?.plan ?? 'free')).catch(()=>{});
  }, []);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col z-40"
        style={{ background:'rgba(7,7,18,0.88)', backdropFilter:'blur(24px)', borderRight:'1px solid rgba(255,255,255,0.06)' }}
      >
        <NavContent user={user} plan={plan}/>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3.5"
        style={{ background:'rgba(5,5,14,0.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}
      >
        <Link href="/dashboard" className="font-playfair text-xl font-bold gradient-text">Scholr</Link>
        <div className="flex items-center gap-2">
          {plan==='pro' && <span className="text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">PRO</span>}
          <button onClick={()=>setMobileOpen(true)} className="p-2 rounded-xl glass text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
              onClick={()=>setMobileOpen(false)}
            />
            <motion.div initial={{ x:-288 }} animate={{ x:0 }} exit={{ x:-288 }}
              transition={{ type:'spring', damping:30, stiffness:320 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
              style={{ background:'rgba(7,7,20,0.97)', backdropFilter:'blur(32px)', borderRight:'1px solid rgba(255,255,255,0.08)' }}
            >
              <NavContent user={user} plan={plan} onNavigate={()=>setMobileOpen(false)}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
