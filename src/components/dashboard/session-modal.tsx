'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ClassSession } from '@/types';
import UpgradeModal from '@/components/dashboard/upgrade-modal';

interface Props {
  session: ClassSession | null;
  onClose: () => void;
  onAttendanceChange: (sessionId: string, status: string) => void;
}

const STATUS_CONFIG = {
  present: { label:'Present', emoji:'✓', base:'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', active:'ring-2 ring-emerald-400/50 bg-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.25)]' },
  absent:  { label:'Absent',  emoji:'✗', base:'bg-red-500/15 text-red-300 border border-red-500/30',         active:'ring-2 ring-red-400/50 bg-red-500/30 shadow-[0_0_20px_rgba(248,113,113,0.25)]' },
  holiday: { label:'Holiday', emoji:'◎', base:'bg-amber-500/15 text-amber-300 border border-amber-500/30',   active:'ring-2 ring-amber-400/50 bg-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.25)]' },
};

function getSubjectGrad(subject: string) {
  const h = subject.split('').reduce((a,b) => a+b.charCodeAt(0), 0);
  const g = ['from-violet-600/30 to-violet-900/10','from-cyan-600/30 to-cyan-900/10','from-pink-600/30 to-pink-900/10',
    'from-emerald-600/30 to-emerald-900/10','from-amber-600/30 to-amber-900/10','from-blue-600/30 to-blue-900/10',
    'from-rose-600/30 to-rose-900/10','from-teal-600/30 to-teal-900/10'];
  return g[h % g.length];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

async function compressImage(file: File, maxW = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SessionModal({ session, onClose, onAttendanceChange }: Props) {
  const [notes,         setNotes]         = useState<any[]>([]);
  const [notesLoading,  setNotesLoading]  = useState(false);
  const [newNote,       setNewNote]       = useState('');
  const [pendingImage,  setPendingImage]  = useState<string|null>(null);
  const [savingNote,    setSavingNote]    = useState(false);
  const [markingStatus, setMarkingStatus] = useState<string|null>(null);
  const [currentStatus, setCurrentStatus] = useState<string|null>(null);
  const [expandedNote,  setExpandedNote]  = useState<string|null>(null);
  const [upgradeOpen,   setUpgradeOpen]   = useState(false);
  const [userPlan,      setUserPlan]      = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Always fetch fresh notes from DB when session changes
  useEffect(() => {
    if (!session?.id) return;
    setCurrentStatus(session.attendance?.status ?? null);
    setNotes([]);
    setNewNote('');
    setPendingImage(null);
    if (!userPlan) {
      fetch('/api/user').then(r=>r.json()).then(d=>setUserPlan(d.user?.plan??'free')).catch(()=>{});
    }
    setNotesLoading(true);
    fetch(`/api/notes?sessionId=${session.id}`)
      .then(r => r.json())
      .then(d => setNotes(d.notes ?? []))
      .catch(() => setNotes(session.notes ?? []))
      .finally(() => setNotesLoading(false));
  }, [session?.id]);

  async function markAttendance(status: string) {
    if (!session) return;
    setMarkingStatus(status);
    try {
      const res = await fetch('/api/attendance', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ classSessionId: session.id, status }),
      });
      if (!res.ok) throw new Error();
      setCurrentStatus(status);
      onAttendanceChange(session.id, status);
      toast.success('Marked as ' + status);
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingStatus(null);
    }
  }

  function handlePhotoClick() {
    if (userPlan !== 'pro') { setUpgradeOpen(true); return; }
    imageInputRef.current?.click();
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8 MB'); return; }
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
      toast.success('Photo attached! Add text and save.');
    } catch {
      toast.error('Failed to process image');
    }
    e.target.value = '';
  }

  async function addNote() {
    if (!session) return;
    if (!newNote.trim() && !pendingImage) { toast.error('Write a note or attach a photo'); return; }
    setSavingNote(true);
    try {
      const res = await fetch('/api/notes', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          classSessionId: session.id,
          content: newNote.trim() || '📷 Photo note',
          imageData: pendingImage,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(n => [data.note, ...n]);
      setNewNote('');
      setPendingImage(null);
      toast.success('Note saved ✓');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(id: string) {
    try {
      await fetch('/api/notes?id=' + id, { method:'DELETE' });
      setNotes(n => n.filter(note => note.id !== id));
    } catch {
      toast.error('Failed to delete note');
    }
  }

  return (
    <AnimatePresence>
      {session && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal — bottom-sheet on mobile, centered on sm+ */}
          <motion.div
            initial={{ opacity:0, y:80, scale:0.95 }}
            animate={{ opacity:1, y:0,  scale:1   }}
            exit={{   opacity:0, y:80, scale:0.95 }}
            transition={{ type:'spring', damping:28, stiffness:300 }}
            className="relative w-full sm:max-w-lg sm:mx-4"
            onClick={e => e.stopPropagation()}
          >
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            <div className="glass-strong rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{ boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)' }}
            >
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Subject Header */}
              <div className={`bg-gradient-to-br ${getSubjectGrad(session.subject)} px-6 py-5 border-b border-white/5 relative`}>
                <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl leading-none"
                >×</button>
                <h2 className="font-playfair text-2xl font-bold text-white pr-10 capitalize">{session.subject}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-white/50">
                  <span className="font-mono">{session.startTime} – {session.endTime}</span>
                  <span className="text-white/25">·</span>
                  <span>{formatDate(session.date)}</span>
                </div>
                {currentStatus && (
                  <span className={`mt-3 inline-block text-xs px-3 py-1 rounded-full font-medium badge-${currentStatus}`}>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </span>
                )}
              </div>

              {/* Scrollable body */}
              <div className="max-h-[72vh] sm:max-h-[62vh] overflow-y-auto">
                <div className="p-5 space-y-6">

                  {/* Attendance Buttons */}
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-widest mb-3 font-semibold">Mark Attendance</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(status => {
                        const cfg = STATUS_CONFIG[status];
                        const isActive  = currentStatus === status;
                        const isLoading = markingStatus === status;
                        return (
                          <button key={status} onClick={() => markAttendance(status)}
                            disabled={!!markingStatus}
                            className={`py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${cfg.base} ${isActive ? cfg.active : 'hover:brightness-125'} disabled:cursor-not-allowed`}
                          >
                            {isLoading
                              ? <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              : <>{cfg.emoji} {cfg.label}</>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Note */}
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-widest mb-3 font-semibold">Add Note</p>

                    {pendingImage && (
                      <div className="relative mb-3 inline-block">
                        <img src={pendingImage} alt="Attachment" className="h-28 rounded-xl object-cover border border-white/10" />
                        <button onClick={() => setPendingImage(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center transition-colors"
                        >×</button>
                      </div>
                    )}

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <textarea
                          placeholder="What happened in this class…"
                          value={newNote} onChange={e => setNewNote(e.target.value)}
                          onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) addNote(); }}
                          rows={2}
                          className="w-full glass rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 resize-none transition-all"
                        />
                        <p className="text-[10px] text-white/20 mt-1">Ctrl+Enter to save quickly · 📷 button to attach photo</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={handlePhotoClick} title={userPlan==='pro'?'Attach photo':'Photo notes — Pro feature'}
                          className={`w-9 h-9 rounded-xl glass border flex items-center justify-center text-base transition-all ${pendingImage ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'}`}
                        >📷</button>
                        <button onClick={addNote} disabled={savingNote || (!newNote.trim() && !pendingImage)}
                          className="w-9 h-9 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white flex items-center justify-center font-bold transition-all disabled:opacity-40"
                        >{savingNote ? '…' : '↑'}</button>
                      </div>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-widest mb-3 font-semibold">
                      Saved Notes {notes.length > 0 && <span className="text-violet-400 ml-1">({notes.length})</span>}
                    </p>

                    {notesLoading ? (
                      <div className="space-y-2">
                        {[1,2].map(i => <div key={i} className="h-14 glass rounded-xl shimmer" />)}
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="glass rounded-xl p-5 text-center">
                        <p className="text-3xl mb-1.5">📝</p>
                        <p className="text-xs text-white/30">No notes for this session yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence initial={false}>
                          {notes.map(note => (
                            <motion.div key={note.id}
                              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                              className="glass rounded-xl overflow-hidden group"
                            >
                              {note.imageData && (
                                <div className="relative cursor-pointer" onClick={() => setExpandedNote(expandedNote===note.id ? null : note.id)}>
                                  <img src={note.imageData} alt="Note photo"
                                    className={`w-full object-cover transition-all duration-300 ${expandedNote===note.id ? 'max-h-96' : 'max-h-32'}`}
                                  />
                                  <div className="absolute bottom-2 right-2 glass rounded-lg px-2 py-0.5 text-[10px] text-white/60 border border-white/10">
                                    {expandedNote===note.id ? '▲ Collapse' : '▼ Expand'}
                                  </div>
                                </div>
                              )}
                              <div className="px-4 py-3 flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {note.content !== '📷 Photo note' && (
                                    <p className="text-sm text-white/80 leading-relaxed">{note.content}</p>
                                  )}
                                  <p className="text-[11px] text-white/25 mt-1 font-mono">
                                    {new Date(note.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                                  </p>
                                </div>
                                <button onClick={() => deleteNote(note.id)}
                                  className="text-white/15 hover:text-red-400 transition-colors text-xl leading-none shrink-0 opacity-0 group-hover:opacity-100"
                                >×</button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <UpgradeModal open={upgradeOpen} onClose={()=>setUpgradeOpen(false)} onSuccess={()=>{ setUpgradeOpen(false); setUserPlan('pro'); }} trigger="photo_notes"/>
    </AnimatePresence>
  );
}
