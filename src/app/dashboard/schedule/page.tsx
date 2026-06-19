'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SessionModal from '@/components/dashboard/session-modal';
import { ClassSession } from '@/types';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function getWeekBounds(offset: number) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon + offset * 7);
  mon.setHours(0,0,0,0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23,59,59,999);
  return { start: mon, end: sun };
}

function getSubjectColor(subject: string) {
  const hash = subject.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
  const palettes = [
    { bg:'bg-violet-500/10', border:'border-violet-500/20', text:'text-violet-300', dot:'bg-violet-400' },
    { bg:'bg-cyan-500/10', border:'border-cyan-500/20', text:'text-cyan-300', dot:'bg-cyan-400' },
    { bg:'bg-pink-500/10', border:'border-pink-500/20', text:'text-pink-300', dot:'bg-pink-400' },
    { bg:'bg-emerald-500/10', border:'border-emerald-500/20', text:'text-emerald-300', dot:'bg-emerald-400' },
    { bg:'bg-amber-500/10', border:'border-amber-500/20', text:'text-amber-300', dot:'bg-amber-400' },
    { bg:'bg-blue-500/10', border:'border-blue-500/20', text:'text-blue-300', dot:'bg-blue-400' },
    { bg:'bg-rose-500/10', border:'border-rose-500/20', text:'text-rose-300', dot:'bg-rose-400' },
    { bg:'bg-teal-500/10', border:'border-teal-500/20', text:'text-teal-300', dot:'bg-teal-400' },
  ];
  return palettes[hash % palettes.length];
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const { start, end } = getWeekBounds(weekOffset);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const s = start.toISOString();
      const e = end.toISOString();
      const res = await fetch(`/api/sessions?weekStart=${s}&weekEnd=${e}`);
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function quickMark(sessionId: string, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMarkingId(sessionId);
    try {
      await fetch('/api/attendance', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ classSessionId:sessionId, status }),
      });
      setSessions(s => s.map(sess =>
        sess.id === sessionId ? { ...sess, attendance:{ id:'',classSessionId:sessionId,status:status as any,markedAt:new Date().toISOString() } } : sess
      ));
      toast.success(`Marked ${status}`);
    } catch {
      toast.error('Failed to mark');
    } finally {
      setMarkingId(null);
    }
  }

  function handleAttendanceChange(sessionId: string, status: string) {
    setSessions(s => s.map(sess =>
      sess.id === sessionId ? { ...sess, attendance:{ id:'',classSessionId:sessionId,status:status as any,markedAt:new Date().toISOString() } } : sess
    ));
  }

  // Group by day
  const dayGroups = DAYS.map((dayName, i) => {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const daySessions = sessions.filter(s => {
      const sd = new Date(s.date); sd.setHours(0,0,0,0);
      const dd = new Date(dayDate); dd.setHours(0,0,0,0);
      return sd.getTime() === dd.getTime();
    }).sort((a,b) => a.startTime.localeCompare(b.startTime));
    return { dayName, date: dayDate, sessions: daySessions };
  }).filter(d => d.date <= end);

  const today = new Date(); today.setHours(0,0,0,0);
  const isCurrentWeek = weekOffset === 0;

  const weekLabel = `${start.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${end.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;

  const SessionCard = ({ sess, compact = false }: { sess: ClassSession; compact?: boolean }) => {
    const sc = getSubjectColor(sess.subject);
    const status = sess.attendance?.status;
    return (
      <div onClick={() => setSelectedSession(sess)}
        className={`${sc.bg} border ${sc.border} rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-white/20 group
          ${compact ? 'p-2' : 'p-3'}`}
      >
        <p className={`font-medium text-white text-xs leading-tight truncate ${compact?'text-[11px]':''}`}>{sess.subject}</p>
        <p className={`font-mono mt-0.5 text-white/40 ${compact?'text-[10px]':'text-xs'}`}>{sess.startTime}</p>
        {status && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full badge-${status} mt-1 inline-block`}>
            {status[0].toUpperCase()}
          </span>
        )}
        {!status && !compact && (
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
            {(['present','absent','holiday'] as const).map(s => (
              <button key={s} onClick={e=>quickMark(sess.id,s,e)} disabled={!!markingId}
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all badge-${s} hover:scale-110`}
                title={s}
              >{s[0].toUpperCase()}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Schedule</h1>
          <p className="text-white/40 text-sm mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="glass rounded-xl p-1 flex gap-1">
            {(['week','list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode===mode?'bg-violet-600/80 text-white':'text-white/40 hover:text-white'}`}
              >{mode === 'week' ? '⊞ Week' : '☰ List'}</button>
            ))}
          </div>
          {/* Week nav */}
          <div className="flex items-center glass rounded-xl overflow-hidden">
            <button onClick={() => setWeekOffset(w => w-1)} className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm">‹</button>
            <button onClick={() => setWeekOffset(0)} className={`px-3 py-2 text-xs font-medium transition-all ${isCurrentWeek?'text-violet-400':'text-white/40 hover:text-white hover:bg-white/5'}`}>
              {isCurrentWeek ? 'This week' : 'Today'}
            </button>
            <button onClick={() => setWeekOffset(w => w+1)} className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm">›</button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_,i) => <div key={i} className="h-20 glass rounded-2xl shimmer" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`${weekOffset}-${viewMode}`} initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-16 }}
            transition={{ duration:0.3 }}
          >
            {/* ── Week Grid View ──────────────────────────────────────── */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {dayGroups.slice(0, 6).map(({ dayName, date, sessions: daySess }) => {
                  const isToday = date.getTime() === today.getTime();
                  const isPast = date < today;
                  return (
                    <div key={dayName} className={`glass rounded-2xl overflow-hidden ${isToday?'border border-violet-500/30':''}`}
                      style={isToday ? { boxShadow:'0 0 20px rgba(124,58,237,0.15)' } : {}}
                    >
                      <div className={`px-3 py-3 border-b border-white/5 ${isToday?'bg-violet-600/10':''}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isToday?'text-violet-300':isPast?'text-white/25':'text-white/50'}`}>
                          {dayName.slice(0,3)}
                        </p>
                        <p className={`text-lg font-playfair font-bold ${isToday?'gradient-text-static':isPast?'text-white/25':'text-white'}`}>
                          {date.getDate()}
                        </p>
                        {isToday && <p className="text-[10px] text-violet-400 font-medium">Today</p>}
                      </div>
                      <div className="p-2 space-y-1.5 min-h-[120px]">
                        {daySess.length === 0 ? (
                          <p className="text-[11px] text-white/15 text-center py-4">—</p>
                        ) : (
                          daySess.map(sess => <SessionCard key={sess.id} sess={sess} compact />)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── List View ───────────────────────────────────────────── */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {dayGroups.map(({ dayName, date, sessions: daySess }) => {
                  if (daySess.length === 0) return null;
                  const isToday = date.getTime() === today.getTime();
                  return (
                    <div key={dayName}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-2 ${isToday?'text-violet-300':'text-white/40'}`}>
                          <span className="text-sm font-semibold">{dayName}</span>
                          <span className="text-xs opacity-60">{date.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                          {isToday && <span className="text-xs bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">Today</span>}
                        </div>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-xs text-white/25">{daySess.length} {daySess.length===1?'class':'classes'}</span>
                      </div>
                      <div className="space-y-2">
                        {daySess.map(sess => {
                          const sc = getSubjectColor(sess.subject);
                          const status = sess.attendance?.status;
                          return (
                            <div key={sess.id} onClick={() => setSelectedSession(sess)}
                              className="glass-card rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer group"
                            >
                              <div className={`w-1.5 h-10 rounded-full ${sc.dot} shrink-0 opacity-70`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white group-hover:text-violet-200 transition-colors truncate">{sess.subject}</p>
                                <p className="text-xs text-white/40 font-mono mt-0.5">{sess.startTime} – {sess.endTime}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {status ? (
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium badge-${status}`}>{status}</span>
                                ) : (
                                  <div className="flex gap-1">
                                    {(['present','absent','holiday'] as const).map(s => (
                                      <button key={s} onClick={e=>quickMark(sess.id,s,e)} disabled={!!markingId}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:scale-105 badge-${s} hover:brightness-125 disabled:opacity-40`}
                                      >{s==='present'?'P':s==='absent'?'A':'H'}</button>
                                    ))}
                                  </div>
                                )}
                                <span className="text-white/20 group-hover:text-white/50 transition-colors ml-1">›</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {sessions.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <p className="text-4xl mb-3">🗓</p>
                    <p>No classes scheduled for this week</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Summary bar */}
      {!loading && sessions.length > 0 && (
        <div className="glass rounded-xl px-5 py-3 flex flex-wrap gap-4 text-xs text-white/40">
          {(['present','absent','holiday','unmarked'] as const).map(s => {
            const count = s === 'unmarked'
              ? sessions.filter(x => !x.attendance).length
              : sessions.filter(x => x.attendance?.status === s).length;
            return count > 0 ? (
              <span key={s} className={`badge-${s} px-2.5 py-1 rounded-full`}>{count} {s}</span>
            ) : null;
          })}
        </div>
      )}

      <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} onAttendanceChange={handleAttendanceChange} />
    </div>
  );
}
