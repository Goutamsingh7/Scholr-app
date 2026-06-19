'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import toast from 'react-hot-toast';
import { AttendanceStats, SubjectStats } from '@/types';

const STAGGER = {
  container: { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } },
  item: { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0, transition:{ duration:0.5, ease:[0.4,0,0.2,1] } } },
};

function getSubjectColor(subject: string) {
  const hash = subject.split('').reduce((a,b)=>a+b.charCodeAt(0), 0);
  const cols = ['#7c3aed','#06b6d4','#f472b6','#4ade80','#fbbf24','#60a5fa','#f87171','#2dd4bf'];
  return cols[hash % cols.length];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-sm"
      style={{ background:'rgba(10,10,25,0.95)', backdropFilter:'blur(20px)' }}
    >
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || p.color }}>
          {p.name}: <span className="font-mono font-semibold">{p.value}{p.name==='Attendance'?'%':''}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [stats,        setStats]        = useState<AttendanceStats | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [criteria,     setCriteria]     = useState<Record<string,number>>({});
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetch('/api/attendance')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setSubjectStats(d.subjectStats??[]); setCriteria(d.criteria??{}); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    try {
      const res = await fetch('/api/export');
      if (!res.ok) { toast.error('Export failed'); return; }
      const data = await res.json();
      // Build printable HTML report
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Scholr Attendance Report — ${data.user?.name ?? ''}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0 }
  body { font-family:'Segoe UI',sans-serif; background:#fff; color:#111; padding:32px; }
  h1 { font-size:24px; font-weight:700; margin-bottom:4px }
  .sub { color:#666; font-size:13px; margin-bottom:28px }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px }
  .card { background:#f5f5f5; border-radius:10px; padding:14px; text-align:center }
  .card .val { font-size:28px; font-weight:700 }
  .card .lbl { font-size:11px; color:#666; margin-top:4px }
  table { width:100%; border-collapse:collapse; font-size:13px }
  th { background:#7c3aed; color:#fff; padding:10px 12px; text-align:left; font-weight:600 }
  td { padding:9px 12px; border-bottom:1px solid #eee }
  tr:nth-child(even) td { background:#fafafa }
  .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600 }
  .present { background:#dcfce7; color:#16a34a }
  .absent { background:#fee2e2; color:#dc2626 }
  .holiday { background:#fef9c3; color:#ca8a04 }
  .unmarked { background:#f1f5f9; color:#64748b }
  .section-title { font-size:14px; font-weight:700; margin:20px 0 10px; color:#7c3aed }
  @media print { body { padding:16px } }
</style>
</head>
<body>
<h1>📚 Scholr Attendance Report</h1>
<p class="sub">
  ${data.user?.name ?? 'Student'} · ${data.user?.email ?? ''}<br/>
  Semester: ${new Date(data.semester.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} – ${new Date(data.semester.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}<br/>
  Exported: ${new Date().toLocaleString('en-IN')}
</p>
<div class="grid">
  <div class="card"><div class="val">${data.overall.total}</div><div class="lbl">Total</div></div>
  <div class="card"><div class="val" style="color:#16a34a">${data.overall.present}</div><div class="lbl">Present</div></div>
  <div class="card"><div class="val" style="color:#dc2626">${data.overall.absent}</div><div class="lbl">Absent</div></div>
  <div class="card"><div class="val" style="color:#7c3aed">${data.overall.percentage}%</div><div class="lbl">Overall</div></div>
</div>
<p class="section-title">Subject-wise Breakdown</p>
<table>
  <tr><th>Subject</th><th>Total</th><th>Present</th><th>Absent</th><th>Holiday</th><th>%</th><th>Required</th><th>Status</th></tr>
  ${data.subjectStats.map((s: any) => `
  <tr>
    <td>${s.subject}</td><td>${s.total}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.holiday}</td>
    <td style="font-weight:700;color:${s.percentage>=s.threshold?'#16a34a':'#dc2626'}">${s.percentage}%</td>
    <td>${s.threshold}%</td>
    <td><span class="badge ${s.percentage>=s.threshold?'present':'absent'}">${s.percentage>=s.threshold?'Safe':'Below'}</span></td>
  </tr>`).join('')}
</table>
<p class="section-title">Recent Sessions (last 50)</p>
<table>
  <tr><th>Date</th><th>Subject</th><th>Time</th><th>Status</th></tr>
  ${data.recentSessions.map((s: any) => `
  <tr>
    <td>${new Date(s.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
    <td>${s.subject}</td>
    <td>${s.startTime}–${s.endTime}</td>
    <td><span class="badge ${s.status}">${s.status}</span></td>
  </tr>`).join('')}
</table>
<p style="margin-top:28px;font-size:11px;color:#999;text-align:center">Generated by Scholr · scholr.app</p>
</body>
</html>`;
      const win = window.open('', '_blank');
      if (!win) { toast.error('Allow popups to export'); return; }
      win.document.write(html);
      win.document.close();
      win.print();
    } catch {
      toast.error('Export failed');
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 glass rounded-xl shimmer"/>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i)=><div key={i} className="h-28 glass rounded-2xl shimmer"/>)}
        </div>
        <div className="h-72 glass rounded-2xl shimmer"/>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-white/40">No data yet — upload your timetable and mark attendance first.</p>
        </div>
      </div>
    );
  }

  const isAbove75   = stats.percentage >= 75;
  const needAttend  = stats.needAttend;
  const canMiss     = stats.canMiss;
  const isAchievable = stats.isAchievable;

  const pieData = [
    { name:'Present',  value:stats.present,              color:'#4ade80' },
    { name:'Absent',   value:stats.absent,               color:'#f87171' },
    { name:'Holiday',  value:stats.holidays,             color:'#fbbf24' },
    { name:'Unmarked', value:stats.total - stats.marked, color:'rgba(255,255,255,0.08)' },
  ].filter(d => d.value > 0);

  const barData = subjectStats.map(s => ({
    name:      s.subject.length > 12 ? s.subject.slice(0,12)+'…' : s.subject,
    fullName:  s.subject,
    Attendance: s.percentage,
    threshold: s.threshold,
    color:     getSubjectColor(s.subject),
  }));

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
        <div className="flex items-center justify-between">
        <h1 className="font-playfair text-2xl font-bold text-white">Analytics</h1>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:border-violet-500/40 text-sm text-white/60 hover:text-white transition-all"
        >📄 Export PDF</button>
      </div>
        <p className="text-white/40 text-sm mt-0.5">Attendance performance at a glance</p>
      </motion.div>

      {/* Status Banner */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
        className={`glass rounded-2xl p-5 border flex items-start gap-4 ${isAbove75?'border-emerald-500/25':'border-red-500/25'}`}
        style={{ background: isAbove75?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)' }}
      >
        <span className="text-3xl mt-0.5">{isAbove75?'🎯':isAchievable?'⚠️':'🚨'}</span>
        <div className="flex-1">
          <p className={`font-semibold ${isAbove75?'text-emerald-300':'text-red-300'}`}>
            {isAbove75 ? `Safe — ${stats.percentage}% attendance`
              : isAchievable ? `Below threshold — ${stats.percentage}% attendance`
              : `Critical — ${stats.percentage}% · Target unreachable`}
          </p>
          <p className={`text-sm mt-0.5 ${isAbove75?'text-emerald-300/50':'text-red-300/50'}`}>
            {isAbove75
              ? canMiss > 0 ? `You can miss up to ${canMiss} more classes and stay above 75%.` : `You're at exactly 75%. Don't miss any more.`
              : isAchievable ? `Attend the next ${needAttend} consecutive classes to recover.`
              : 'Even attending all remaining classes won\'t reach 75%. Contact your college administration.'}
          </p>
        </div>
        <div className={`font-playfair text-3xl font-bold shrink-0 ${isAbove75?'text-emerald-400':'text-red-400'}`}>
          {stats.percentage}%
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={STAGGER.container} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label:'Total Sessions', value:stats.total,    color:'gradient-text-static', icon:'📚' },
          { label:'Present',        value:stats.present,  color:'text-emerald-400',     icon:'✅' },
          { label:'Absent',         value:stats.absent,   color:'text-red-400',         icon:'❌' },
          { label:'Holidays',       value:stats.holidays, color:'text-amber-400',       icon:'🏖' },
        ].map(c => (
          <motion.div key={c.label} variants={STAGGER.item} className="glass-card rounded-2xl p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className={`font-playfair text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-white/40 mt-1">{c.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donut */}
        <motion.div initial={{ opacity:0,scale:0.97 }} animate={{ opacity:1,scale:1 }} transition={{ delay:0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4">Attendance Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                    dataKey="value" paddingAngle={3} strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} style={{ filter:`drop-shadow(0 0 8px ${entry.color}50)` }}/>
                    ))}
                  </Pie>
                  <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:'Playfair Display', fontSize:26, fill:'white', fontWeight:700 }}
                  >{stats.percentage}%</text>
                  <text x="50%" y="60%" textAnchor="middle"
                    style={{ fontFamily:'DM Sans', fontSize:10, fill:'rgba(255,255,255,0.4)' }}
                  >overall</text>
                  <Tooltip content={<CustomTooltip />}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 shrink-0">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:d.color, boxShadow:`0 0 6px ${d.color}80` }}/>
                  <span className="text-xs text-white/50">{d.name}</span>
                  <span className="text-xs font-mono text-white/80 ml-2">{d.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-white/30">Effective: {stats.effective}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Threshold Analysis */}
        <motion.div initial={{ opacity:0,scale:0.97 }} animate={{ opacity:1,scale:1 }} transition={{ delay:0.25 }}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-semibold text-white">Threshold Analysis</h3>
          <div className="space-y-3">
            {[
              { label:'Required %',     val:'75%',              clr:'text-violet-400' },
              { label:'Your %',         val:`${stats.percentage}%`, clr:isAbove75?'text-emerald-400':'text-red-400' },
              { label:'Present',        val:`${stats.present}`,      clr:'text-emerald-400' },
              { label:'Effective total',val:`${stats.effective}`,    clr:'text-white/60' },
              {
                label: isAbove75 ? 'Can miss' : isAchievable ? 'Need to attend' : 'Status',
                val:   isAbove75 ? `${canMiss} more` : isAchievable ? `${needAttend} more` : '⚠ Unreachable',
                clr:   isAbove75 ? 'text-cyan-400' : isAchievable ? 'text-amber-400' : 'text-red-400',
              },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-white/50">{row.label}</span>
                <span className={`font-mono font-semibold text-sm ${row.clr}`}>{row.val}</span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-white/25 mb-1.5">
              <span>0%</span><span>75% threshold</span><span>100%</span>
            </div>
            <div className="relative w-full glass rounded-full h-3">
              <div className="absolute left-[75%] top-0 bottom-0 w-px bg-violet-500/60"/>
              <motion.div
                className={`h-full rounded-full ${isAbove75?'bg-gradient-to-r from-emerald-500 to-emerald-400':'bg-gradient-to-r from-red-500 to-red-400'}`}
                initial={{ width:0 }} animate={{ width:`${stats.percentage}%` }}
                transition={{ duration:1.2, ease:[0.4,0,0.2,1] }}
                style={{ filter:`drop-shadow(0 0 6px ${isAbove75?'#4ade80':'#f87171'}60)` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subject Bar Chart */}
      {barData.length > 0 && (
        <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-6">Subject-wise Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11, fontFamily:'DM Sans' }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{ fill:'rgba(255,255,255,0.3)', fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
              <ReferenceLine y={75} stroke="rgba(124,58,237,0.6)" strokeDasharray="6 4"
                label={{ value:'75%', fill:'rgba(139,92,246,0.8)', fontSize:10, position:'insideRight' }}
              />
              <Bar dataKey="Attendance" radius={[6,6,0,0]} maxBarSize={48}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter:`drop-shadow(0 0 8px ${entry.color}50)` }}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Per-subject detail cards */}
      {subjectStats.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-4">Subject Details</h3>
          <motion.div variants={STAGGER.container} initial="hidden" animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[...subjectStats].sort((a,b)=>a.percentage-b.percentage).map(sub => {
              const color    = getSubjectColor(sub.subject);
              const isLow    = sub.percentage < sub.threshold;
              return (
                <motion.div key={sub.subject} variants={STAGGER.item} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-white pr-4 capitalize leading-tight">{sub.subject}</p>
                    <span className={`font-mono font-bold text-lg shrink-0 ${sub.percentage>=sub.threshold?'text-emerald-400':sub.percentage>=sub.threshold*0.8?'text-amber-400':'text-red-400'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 mb-3 font-mono">Required: {sub.threshold}%</p>
                  <div className="w-full glass rounded-full h-1.5 overflow-hidden mb-3">
                    <motion.div className="h-full rounded-full"
                      style={{ background:color, boxShadow:`0 0 8px ${color}60` }}
                      initial={{ width:0 }} animate={{ width:`${sub.percentage}%` }}
                      transition={{ duration:1, ease:[0.4,0,0.2,1] }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {([['Present',sub.present,'text-emerald-400'],['Absent',sub.absent,'text-red-400'],['Holiday',sub.holiday,'text-amber-400']] as const).map(([l,v,c]) => (
                      <div key={l} className="glass rounded-lg py-1.5">
                        <p className={`text-sm font-bold ${c}`}>{v}</p>
                        <p className="text-[10px] text-white/30">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs">
                    {isLow ? (
                      sub.isAchievable
                        ? <p className="text-red-300/70">Attend <strong className="text-red-300">{sub.needAttend}</strong> more to reach {sub.threshold}%</p>
                        : <p className="text-red-400/80 font-medium">⚠ Target unreachable — even attending all remaining won't help</p>
                    ) : (
                      sub.canMiss > 0
                        ? <p className="text-emerald-300/60">Can miss <strong className="text-emerald-300">{sub.canMiss}</strong> more</p>
                        : <p className="text-amber-300/60">At threshold — attend all upcoming classes</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}
