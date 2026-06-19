'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import SessionModal from '@/components/dashboard/session-modal';
import { ClassSession, AttendanceStats, SubjectStats } from '@/types';

const stagger = {
  container: { hidden:{}, show:{ transition:{ staggerChildren:0.07 } } },
  item: { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0, transition:{ duration:0.5, ease:[0.4,0,0.2,1] } } },
};

function AttendanceRing({ percentage }: { percentage: number }) {
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash  = (percentage / 100) * circ;
  const color = percentage >= 75 ? '#4ade80' : percentage >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 128 128" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}/>
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          initial={{ strokeDasharray:`0 ${circ}` }}
          animate={{ strokeDasharray:`${dash} ${circ}` }}
          transition={{ duration:1.2, ease:[0.4,0,0.2,1] }}
          style={{ filter:`drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <motion.span className="font-playfair text-2xl font-bold text-white block"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
        >{percentage}%</motion.span>
        <span className="text-xs text-white/40">overall</span>
      </div>
    </div>
  );
}

function getSubjectColor(subject: string) {
  const hash = subject.split('').reduce((a,b) => a+b.charCodeAt(0), 0);
  const colors = [
    { dot:'bg-violet-400' },{ dot:'bg-cyan-400' },{ dot:'bg-pink-400' },
    { dot:'bg-emerald-400' },{ dot:'bg-amber-400' },{ dot:'bg-blue-400' },
    { dot:'bg-rose-400' },{ dot:'bg-teal-400' },
  ];
  return colors[hash % colors.length];
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { data: userSession } = useSession();
  const [sessions,      setSessions]     = useState<ClassSession[]>([]);
  const [stats,         setStats]        = useState<AttendanceStats | null>(null);
  const [subjectStats,  setSubjectStats] = useState<SubjectStats[]>([]);
  const [hasTimetable,  setHasTimetable] = useState<boolean | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [markingId,     setMarkingId]    = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sessRes, attRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/attendance'),
      ]);
      const sessData = await sessRes.json();
      const attData  = await attRes.json();
      setSessions(sessData.sessions ?? []);
      setHasTimetable(sessData.hasTimetable ?? false);
      setStats(attData.stats ?? null);
      setSubjectStats(attData.subjectStats ?? []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function quickMark(sessionId: string, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMarkingId(sessionId);
    try {
      const res = await fetch('/api/attendance', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ classSessionId: sessionId, status }),
      });
      if (!res.ok) throw new Error();
      setSessions(s => s.map(sess =>
        sess.id===sessionId ? { ...sess, attendance:{ id:'',classSessionId:sessionId,status:status as any,markedAt:'' } } : sess
      ));
      toast.success('Marked ' + status);
      fetchData();
    } catch {
      toast.error('Failed to mark');
    } finally {
      setMarkingId(null);
    }
  }

  function handleAttendanceChange(sessionId: string, status: string) {
    setSessions(s => s.map(sess =>
      sess.id===sessionId ? { ...sess, attendance:{ id:'',classSessionId:sessionId,status:status as any,markedAt:'' } } : sess
    ));
    fetchData();
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const todaySessions = sessions.filter(s => {
    const sd = new Date(s.date); sd.setHours(0,0,0,0);
    return sd.getTime() === today.getTime();
  });
  const upcomingSessions = sessions.filter(s => {
    const sd = new Date(s.date); sd.setHours(0,0,0,0);
    return sd.getTime() > today.getTime();
  }).slice(0, 6);

  // Use pre-calculated values from API (correct formula)
  const needAttend = stats?.needAttend ?? 0;
  const canMiss    = stats?.canMiss ?? 0;
  const isAchievable = stats?.isAchievable ?? true;
  const name = (userSession?.user?.name ?? '').split(' ')[0] || 'Student';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-4 animate-pulse">
        <div className="h-8 w-64 glass rounded-xl shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-28 glass rounded-2xl shimmer" />)}
        </div>
        <div className="h-64 glass rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 space-y-7">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
        <p className="text-white/40 text-sm">{getGreeting()},</p>
        <h1 className="font-playfair text-3xl font-bold text-white mt-0.5">{name} <span className="gradient-text">✦</span></h1>
        <p className="text-white/30 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </motion.div>

      {/* No timetable */}
      {hasTimetable === false && (
        <motion.div initial={{ opacity:0,scale:0.97 }} animate={{ opacity:1,scale:1 }}
          className="glass-card rounded-3xl p-8 text-center border border-violet-500/20"
        >
          <div className="text-5xl mb-4">📅</div>
          <h2 className="font-playfair text-xl font-bold text-white mb-2">Set up your timetable first</h2>
          <p className="text-white/40 text-sm mb-6">Upload a photo of your schedule or enter classes manually.</p>
          <Link href="/timetable/upload"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-medium text-white btn-glow hover:scale-105 transition-all"
          >Upload Timetable →</Link>
        </motion.div>
      )}

      {hasTimetable && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Ring card */}
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
              className="col-span-2 lg:col-span-1 glass-card rounded-2xl p-5 flex items-center gap-4"
            >
              <AttendanceRing percentage={stats.percentage} />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Attendance</p>
                <div className={`text-sm font-medium ${stats.percentage>=75?'text-emerald-400':'text-red-400'}`}>
                  {stats.percentage>=75 ? '✓ Above 75%' : '⚠ Below 75%'}
                </div>
                {stats.percentage < 75 && (
                  <p className="text-xs mt-0.5 text-red-300/60">
                    {isAchievable ? `Attend ${needAttend} more` : 'Target unreachable'}
                  </p>
                )}
                {stats.percentage >= 75 && canMiss > 0 && (
                  <p className="text-xs mt-0.5 text-emerald-300/60">Can miss {canMiss} more</p>
                )}
              </div>
            </motion.div>

            {/* Stat cards */}
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.07 }}
              className="glass-card rounded-2xl p-5"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Total</p>
              <p className="font-playfair text-3xl font-bold gradient-text-static">{stats.total}</p>
              <p className="text-xs text-white/30 mt-1">sessions</p>
            </motion.div>

            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.12 }}
              className="glass-card rounded-2xl p-5"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Present</p>
              <p className="font-playfair text-3xl font-bold text-emerald-400">{stats.present}</p>
              <p className="text-xs text-white/30 mt-1">{stats.absent} absent</p>
            </motion.div>

            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.17 }}
              className="glass-card rounded-2xl p-5"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Holidays</p>
              <p className="font-playfair text-3xl font-bold text-amber-400">{stats.holidays}</p>
              <p className="text-xs text-white/30 mt-1">{stats.total - stats.marked} unmarked</p>
            </motion.div>
          </div>

          {/* Alert banner */}
          {stats.percentage < 75 && (
            <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
              className="glass rounded-2xl px-5 py-4 border flex items-start gap-4"
              style={{ background: isAchievable ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.25)' }}
            >
              <span className="text-2xl">{isAchievable ? '⚠️' : '🚨'}</span>
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {isAchievable ? 'Attendance below 75%' : 'Attendance target unreachable this semester'}
                </p>
                <p className="text-xs text-red-300/60 mt-0.5">
                  {isAchievable
                    ? `Attend the next ${needAttend} consecutive classes to get back above 75%.`
                    : 'Even attending all remaining classes won\'t reach 75%. Contact your college.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Today's Classes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Today's Classes</h2>
              <span className="text-xs text-white/30 font-mono">{todaySessions.length} sessions</span>
            </div>
            {todaySessions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-white/25">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm">No classes today!</p>
              </div>
            ) : (
              <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-2.5">
                {todaySessions.map(sess => {
                  const sc = getSubjectColor(sess.subject);
                  const status = sess.attendance?.status;
                  return (
                    <motion.div key={sess.id} variants={stagger.item}
                      onClick={() => setSelectedSession(sess)}
                      className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer group"
                    >
                      <div className={`w-2 h-12 rounded-full ${sc.dot} shrink-0 opacity-70`}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white group-hover:text-violet-200 transition-colors truncate capitalize">{sess.subject}</p>
                        <p className="text-xs text-white/40 font-mono mt-0.5">{sess.startTime} – {sess.endTime}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {status ? (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium badge-${status}`}>{status}</span>
                        ) : (
                          <div className="flex gap-1.5">
                            {(['present','absent','holiday'] as const).map(s => (
                              <button key={s} onClick={e => quickMark(sess.id,s,e)} disabled={markingId===sess.id}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 badge-${s} disabled:opacity-50`}
                                title={s}
                              >{markingId===sess.id?'…':s==='present'?'P':s==='absent'?'A':'H'}</button>
                            ))}
                          </div>
                        )}
                        <span className="text-white/20 group-hover:text-white/50 transition-colors">›</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Upcoming */}
          {upcomingSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Upcoming</h2>
                <Link href="/dashboard/schedule" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
              </div>
              <div className="space-y-2">
                {upcomingSessions.map(sess => {
                  const sc = getSubjectColor(sess.subject);
                  return (
                    <div key={sess.id} onClick={() => setSelectedSession(sess)}
                      className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 cursor-pointer group"
                    >
                      <div className={`w-1.5 h-8 rounded-full ${sc.dot} shrink-0 opacity-60`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate capitalize">{sess.subject}</p>
                        <p className="text-xs text-white/30 font-mono">{sess.startTime}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/40">
                          {new Date(sess.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
                        </p>
                        {sess.attendance && <span className={`text-xs badge-${sess.attendance.status} px-2 py-0.5 rounded-full`}>{sess.attendance.status}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subject breakdown */}
          {subjectStats.length > 0 && (
            <div>
              <h2 className="font-semibold text-white mb-4">Subject Breakdown</h2>
              <div className="space-y-3">
                {subjectStats.map(sub => {
                  const sc = getSubjectColor(sub.subject);
                  return (
                    <div key={sub.subject} className="glass-card rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${sc.dot}`}/>
                          <span className="text-sm text-white/80 truncate capitalize">{sub.subject}</span>
                          <span className="text-[10px] text-white/25 font-mono">({sub.threshold}% req.)</span>
                        </div>
                        <span className={`text-sm font-semibold font-mono ${sub.percentage>=sub.threshold?'text-emerald-400':sub.percentage>=sub.threshold*0.8?'text-amber-400':'text-red-400'}`}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <div className="w-full glass rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${sub.percentage>=sub.threshold?'bg-emerald-500':sub.percentage>=sub.threshold*0.8?'bg-amber-500':'bg-red-500'}`}
                          initial={{ width:0 }} animate={{ width:`${sub.percentage}%` }}
                          transition={{ duration:1, ease:[0.4,0,0.2,1] }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-white/25">{sub.present}/{sub.total-sub.holiday} attended</span>
                        {sub.percentage < sub.threshold && (
                          <span className={`text-xs ${sub.isAchievable?'text-red-300/60':'text-red-400/80'}`}>
                            {sub.isAchievable ? `Attend ${sub.needAttend} more` : '⚠ Target unreachable'}
                          </span>
                        )}
                        {sub.percentage >= sub.threshold && sub.canMiss > 0 && (
                          <span className="text-xs text-emerald-300/60">Can miss {sub.canMiss} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} onAttendanceChange={handleAttendanceChange}/>
    </div>
  );
}
