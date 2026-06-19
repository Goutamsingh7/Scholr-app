'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name,        setName]        = useState('');
  const [savingName,  setSavingName]  = useState(false);
  const [passwords,   setPasswords]   = useState({ current:'', next:'', confirm:'' });
  const [savingPwd,   setSavingPwd]   = useState(false);
  const [userData,    setUserData]    = useState<any>(null);

  useEffect(() => {
    if (session?.user) setName((session.user as any).name ?? '');
    fetch('/api/user').then(r=>r.json()).then(d=>setUserData(d.user)).catch(()=>{});
  }, [session]);

  async function saveName() {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingName(true);
    try {
      const res = await fetch('/api/user', {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: name.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await update({ name: name.trim() });
      toast.success('Name updated ✓');
    } catch (err:any) {
      toast.error(err.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (!passwords.current) { toast.error('Enter your current password'); return; }
    if (passwords.next.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (passwords.next !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPasswords({ current:'', next:'', confirm:'' });
      toast.success('Password changed ✓');
    } catch (err:any) {
      toast.error(err.message ?? 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  }

  const isPro = userData?.plan === 'pro';
  const memberSince = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : '—';

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
        <h1 className="font-playfair text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your account preferences</p>
      </motion.div>

      {/* Profile card */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
        className="glass-card rounded-3xl p-6"
      >
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <span>👤</span> Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
          >
            {(session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{session?.user?.name ?? 'Student'}</p>
            <p className="text-sm text-white/40">{session?.user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPro?'bg-violet-500/20 text-violet-300 border border-violet-500/30':'bg-white/8 text-white/40 border border-white/10'}`}>
                {isPro?'⭐ Pro':'Free'}
              </span>
              <span className="text-xs text-white/25">Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Name field */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Display Name</label>
            <div className="flex gap-2">
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')saveName()}}
                placeholder="Your name"
                className="flex-1 glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"
              />
              <button onClick={saveName} disabled={savingName||!name.trim()}
                className="px-4 py-3 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-40"
              >{savingName?'…':'Save'}</button>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Email</label>
            <input type="email" value={session?.user?.email ?? ''} disabled
              className="w-full glass rounded-xl px-4 py-3 text-white/40 text-sm cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-white/25 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </motion.div>

      {/* Password change */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}
        className="glass-card rounded-3xl p-6"
      >
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <span>🔐</span> Change Password
        </h2>

        {(session as any)?.user?.provider === 'google' ? (
          <div className="glass rounded-xl p-4 border border-white/10 text-sm text-white/40">
            You signed in with Google — password management is handled by your Google account.
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { key:'current',  label:'Current Password', ph:'••••••••' },
              { key:'next',     label:'New Password',     ph:'Minimum 8 characters' },
              { key:'confirm',  label:'Confirm New Password', ph:'••••••••' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">{field.label}</label>
                <input type="password" placeholder={field.ph}
                  value={(passwords as any)[field.key]}
                  onChange={e=>setPasswords(p=>({...p,[field.key]:e.target.value}))}
                  className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"
                />
              </div>
            ))}
            <button onClick={changePassword} disabled={savingPwd}
              className="w-full py-3 rounded-xl bg-violet-600/80 hover:bg-violet-500 font-medium text-white transition-all disabled:opacity-40"
            >
              {savingPwd ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Changing…</span> : 'Change Password'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
        className="glass-card rounded-3xl p-6 border border-red-500/15"
      >
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <span>⚠️</span> Danger Zone
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Reset timetable</p>
              <p className="text-xs text-white/35 mt-0.5">Delete your current timetable and start over. Attendance history will be lost.</p>
            </div>
            <Link href="/timetable/upload"
              className="shrink-0 px-4 py-2 rounded-xl glass border border-white/10 hover:border-red-500/30 text-sm text-white/50 hover:text-red-400 transition-all"
            >Reset</Link>
          </div>
        </div>
      </motion.div>

      {/* Links */}
      <div className="flex flex-wrap gap-4 text-xs text-white/25 pb-4">
        {[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Refund Policy','/refund'],['Contact','/contact']].map(([l,h])=>(
          <a key={l} href={h} className="hover:text-white/50 transition-colors">{l}</a>
        ))}
        <span>· v1.0.0</span>
      </div>
    </div>
  );
}
