'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ParsedSlot } from '@/types';
import UpgradeModal from '@/components/dashboard/upgrade-modal';

type Mode = 'ai' | 'manual';
type Step = 'check' | 'input' | 'parsing' | 'review' | 'criteria' | 'configure' | 'saving';

interface ManualSlotForm { subject:string; days:string[]; startTime:string; endTime:string }
interface ExistingInfo  { exists:boolean; sessionCount?:number; markedCount?:number; startDate?:string; endDate?:string; createdAt?:string }

const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_ORDER   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SLOT_COLORS  = ['from-violet-500/15 border-violet-500/25','from-cyan-500/15 border-cyan-500/25','from-pink-500/15 border-pink-500/25','from-emerald-500/15 border-emerald-500/25','from-amber-500/15 border-amber-500/25','from-blue-500/15 border-blue-500/25'];
const slotColor    = (s:string) => SLOT_COLORS[s.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % SLOT_COLORS.length];
const sortDays     = (d:string[]) => [...d].sort((a,b)=>DAYS_ORDER.indexOf(a)-DAYS_ORDER.indexOf(b));

interface GroupedSlot { subject:string; days:string[]; startTime:string; endTime:string; indices:number[] }
function groupSlots(slots:ParsedSlot[]): GroupedSlot[] {
  const map = new Map<string,GroupedSlot>();
  slots.forEach((slot,i) => {
    const key = `${slot.subject}|${slot.startTime}|${slot.endTime}`;
    if (map.has(key)) { const g=map.get(key)!; if (!g.days.includes(slot.day)) g.days.push(slot.day); g.indices.push(i); }
    else map.set(key,{ subject:slot.subject, days:[slot.day], startTime:slot.startTime, endTime:slot.endTime, indices:[i] });
  });
  return Array.from(map.values());
}

export default function UploadPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode,        setMode]        = useState<Mode>('ai');
  const [step,        setStep]        = useState<Step>('check');
  const [existing,    setExisting]    = useState<ExistingInfo>({ exists:false });
  const [slots,       setSlots]       = useState<ParsedSlot[]>([]);
  const [criteria,    setCriteria]    = useState<Record<string,number>>({});
  const [globalCrit,  setGlobalCrit]  = useState(75);
  const [config,      setConfig]      = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate:   new Date(Date.now()+150*864e5).toISOString().split('T')[0],
    skipDays:  '',
  });
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [imageData,    setImageData]    = useState<string|null>(null);
  const [mimeType,     setMimeType]     = useState('image/jpeg');
  const [dragging,     setDragging]     = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [parseError,   setParseError]   = useState<string|null>(null);
  const [upgradeOpen,  setUpgradeOpen]  = useState(false);
  const [form,         setForm]         = useState<ManualSlotForm>({ subject:'', days:[], startTime:'09:00', endTime:'10:00' });
  const [formErr,      setFormErr]      = useState('');

  // Check if timetable already exists
  useEffect(() => {
    fetch('/api/timetable/check')
      .then(r=>r.json())
      .then(d=>{ setExisting(d); if (!d.exists) setStep('input'); })
      .catch(()=>setStep('input'));
  }, []);

  const handleFile = useCallback((file:File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    if (file.size > 10*1024*1024) { toast.error('Max 10 MB'); return; }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = e => { const r=e.target?.result as string; setImagePreview(r); setImageData(r.split(',')[1]); setParseError(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e:React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  async function handleParse() {
    if (!imageData) { toast.error('Upload an image first'); return; }
    setStep('parsing'); setProgress(0); setParseError(null);
    const iv = setInterval(()=>setProgress(p=>Math.min(p+7,90)), 350);
    try {
      const res = await fetch('/api/timetable/parse', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ imageData, mimeType }),
      });
      clearInterval(iv); setProgress(100);
      const data = await res.json();
      if (res.status === 402) { setUpgradeOpen(true); setStep('input'); return; }
      if (!res.ok) throw new Error(data.error ?? 'parse_failed');
      if (!data.slots?.length) throw new Error('No classes detected — try a clearer photo or use Manual Entry.');
      setSlots(data.slots);
      const c: Record<string,number> = {};
      [...new Set(data.slots.map((s:ParsedSlot)=>s.subject))].forEach((s:any)=>{ c[s]=75; });
      setCriteria(c);
      setTimeout(()=>setStep('review'), 500);
    } catch (err:any) {
      clearInterval(iv);
      setParseError(err.message?.includes('parse_failed')||err.message?.includes('API')
        ? 'AI parser is under maintenance. Use Manual Entry to set up your schedule.'
        : err.message || 'Parse failed — try a clearer photo.');
      setStep('input');
    }
  }

  function addManualSlot() {
    setFormErr('');
    if (!form.subject.trim())          { setFormErr('Subject name is required'); return; }
    if (!form.days.length)             { setFormErr('Select at least one day'); return; }
    if (form.startTime >= form.endTime){ setFormErr('End time must be after start time'); return; }
    const newSlots = form.days.map(day=>({ day, subject:form.subject.trim(), startTime:form.startTime, endTime:form.endTime }));
    setSlots(s=>[...s,...newSlots]);
    setCriteria(c=>c[form.subject.trim()]?c:{...c,[form.subject.trim()]:75});
    setForm(f=>({...f,subject:'',days:[]}));
    toast.success(`Added ${form.subject}`);
  }

  function removeGroup(indices:number[]) { const set=new Set(indices); setSlots(s=>s.filter((_,i)=>!set.has(i))); }

  async function handleSave() {
    if (!slots.length) { toast.error('No classes to save'); return; }
    setStep('saving');
    try {
      const skipDays = config.skipDays.split(',').map(d=>d.trim()).filter(Boolean);
      const res = await fetch('/api/timetable/save', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slots, startDate:config.startDate, endDate:config.endDate, skipDays, criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ ${data.sessionsCreated} sessions created!`);
      router.push('/dashboard');
    } catch (err:any) { toast.error(err.message??'Save failed'); setStep('criteria'); }
  }

  const grouped     = groupSlots(slots);
  const uniqueSubjs = [...new Set(slots.map(s=>s.subject))];
  const STEPS       = ['Setup','Review','Criteria','Configure'];
  const stepIdx     = (step==='input'||step==='parsing')?0:step==='review'?1:step==='criteria'?2:3;

  // ── Existing timetable check screen ──────────────────────────────────────
  if (step === 'check') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-violet-700 rounded-full blur-3xl opacity-15 -top-20 -left-20 animate-blob pointer-events-none"/>
      <div className="absolute w-[400px] h-[400px] bg-cyan-600 rounded-full blur-3xl opacity-10 top-1/3 -right-20 animate-blob [animation-delay:3s] pointer-events-none"/>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="text-center mb-8">
          <div className="font-playfair text-3xl font-bold gradient-text mb-2">
            {existing.exists ? 'Replace your timetable' : 'Set up your timetable'}
          </div>
          <p className="text-white/40 text-sm">AI-powered or enter manually — your choice</p>
        </motion.div>

        {/* ⚠ Existing timetable warning banner */}
        {existing.exists && (step==='input') && (
          <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
            className="glass rounded-2xl p-4 border border-amber-500/35 flex items-start gap-3 mb-6"
            style={{ background:'rgba(251,191,36,0.07)' }}
          >
            <span className="text-2xl shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-amber-300 font-semibold text-sm">You already have a timetable</p>
              <p className="text-amber-300/60 text-xs mt-0.5 leading-relaxed">
                You have <strong className="text-amber-300">{existing.sessionCount}</strong> sessions
                ({existing.markedCount} marked). Saving a new timetable will <strong className="text-amber-300">permanently delete all attendance history</strong>.
                To just add a class, use the Schedule page instead.
              </p>
              <Link href="/dashboard/schedule"
                className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300 underline"
              >← Go back to Schedule (safer) →</Link>
            </div>
          </motion.div>
        )}

        {/* Mode tabs */}
        {step==='input' && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} className="flex glass rounded-2xl p-1 mb-6 gap-1">
            {([{key:'ai' as Mode,icon:'🤖',label:'AI Parse',sub:'Upload photo'},{key:'manual' as Mode,icon:'✏️',label:'Manual Entry',sub:'Add classes yourself'}]).map(tab=>(
              <button key={tab.key} onClick={()=>{ setMode(tab.key); setSlots([]); setParseError(null); }}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${mode===tab.key?'bg-violet-600/30 border border-violet-500/30 text-white':'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <div><p className="text-sm font-semibold">{tab.label}</p><p className="text-xs text-white/35">{tab.sub}</p></div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step indicator */}
        {step!=='input' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label,i)=>{ const isDone=i<stepIdx,isActive=i===stepIdx; return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 transition-all ${isActive?'':'opacity-50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDone?'bg-emerald-500/25 text-emerald-400 border border-emerald-500/35':isActive?'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]':'glass text-white/30'}`}>{isDone?'✓':i+1}</div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive?'text-white':'text-white/30'}`}>{label}</span>
                </div>
                {i<STEPS.length-1&&<div className="w-6 h-px bg-white/10 mx-1"/>}
              </div>
            ); })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* AI UPLOAD */}
          {step==='input' && mode==='ai' && (
            <motion.div key="ai" initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-24 }} className="space-y-4">
              {parseError && (
                <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
                  className="glass rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3"
                  style={{ background:'rgba(251,191,36,0.07)' }}
                >
                  <span className="text-2xl">🔧</span>
                  <div className="flex-1">
                    <p className="text-amber-300 font-semibold text-sm">AI Parser Unavailable</p>
                    <p className="text-amber-300/65 text-xs mt-0.5 leading-relaxed">{parseError}</p>
                    <button onClick={()=>{ setMode('manual'); setParseError(null); }} className="text-xs text-violet-400 hover:text-violet-300 underline mt-1.5 inline-block">Switch to Manual Entry →</button>
                  </div>
                  <button onClick={()=>setParseError(null)} className="text-white/30 hover:text-white/60 text-lg">×</button>
                </motion.div>
              )}
              <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
                onClick={()=>fileRef.current?.click()}
                className={`glass-card rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 border-2 ${dragging?'border-violet-500/60 bg-violet-500/10 scale-[1.01]':'border-transparent hover:border-white/12'}`}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
                {imagePreview ? (
                  <div className="space-y-4"><img src={imagePreview} alt="Timetable" className="max-h-60 mx-auto rounded-xl object-contain"/><p className="text-emerald-400 text-sm">✓ Image ready — click to change</p></div>
                ) : (
                  <div className="space-y-4 py-8">
                    <div className="text-6xl">📸</div>
                    <div><p className="text-white font-semibold text-lg">Drop your timetable photo here</p><p className="text-white/35 text-sm mt-1">or click to browse · JPG, PNG, WEBP · max 10 MB</p></div>
                    <p className="text-xs text-white/20">Works with printed schedules, handwritten tables, and screenshots</p>
                  </div>
                )}
              </div>
              <p className="text-center text-white/25 text-xs">No photo? <button onClick={()=>setMode('manual')} className="text-violet-400 underline">Use Manual Entry →</button></p>
              {imagePreview && <motion.button initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} onClick={handleParse} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-lg text-white btn-glow hover:scale-[1.01] transition-all">🤖 Parse with Claude AI →</motion.button>}
            </motion.div>
          )}

          {/* MANUAL */}
          {step==='input' && mode==='manual' && (
            <motion.div key="manual" initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-24 }} className="space-y-4">
              <div className="glass-card rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2"><span className="text-xl">📚</span><h3 className="font-semibold text-white">Add a recurring class</h3></div>
                <div><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Subject Name</label>
                  <input type="text" placeholder="e.g. Mathematics, Physics Lab…" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')addManualSlot()}} className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"/>
                </div>
                <div><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Repeats On</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day=>{ const sel=form.days.includes(day); return (
                      <button key={day} onClick={()=>setForm(f=>({...f,days:sel?f.days.filter(d=>d!==day):[...f.days,day]}))}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${sel?'bg-violet-600/30 border-violet-500/50 text-white':'glass border-white/10 text-white/45 hover:text-white'}`}
                      >{day.slice(0,3)}</button>
                    ); })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[['MWF',['Monday','Wednesday','Friday']],['TT',['Tuesday','Thursday']],['All',DAYS_OF_WEEK]].map(([l,d])=>(
                      <button key={l as string} onClick={()=>setForm(f=>({...f,days:d as string[]}))} className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 glass rounded-lg border border-white/8 transition-colors">{l as string}</button>
                    ))}
                    <button onClick={()=>setForm(f=>({...f,days:[]}))} className="text-xs text-white/30 hover:text-white/60 px-2 py-1 transition-colors">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[['Start Time','startTime'],['End Time','endTime']].map(([label,key])=>(
                    <div key={key}><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">{label}</label>
                      <input type="time" value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} className="w-full glass rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark] transition-all"/>
                    </div>
                  ))}
                </div>
                {formErr && <p className="text-red-400 text-xs">⚠ {formErr}</p>}
                <button onClick={addManualSlot} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-violet-500/80 hover:from-violet-600 hover:to-cyan-500 font-semibold text-white btn-glow transition-all">+ Add to Schedule</button>
              </div>
              {grouped.length > 0 && (
                <div className="glass-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-white text-sm">Added Classes ({slots.length} slots)</h3><button onClick={()=>setSlots([])} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Clear all</button></div>
                  <div className="space-y-2 mb-4">
                    {grouped.map((g,i)=>(
                      <div key={i} className={`bg-gradient-to-r ${slotColor(g.subject)} border rounded-xl px-4 py-3 flex items-center justify-between`}>
                        <div><p className="text-sm font-medium text-white capitalize">{g.subject}</p><p className="text-xs text-white/45 mt-0.5">{sortDays(g.days).map(d=>d.slice(0,3)).join(', ')} · {g.startTime}–{g.endTime}</p></div>
                        <button onClick={()=>removeGroup(g.indices)} className="text-white/25 hover:text-red-400 transition-colors text-xl ml-4">×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setStep('review')} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-white btn-glow hover:scale-[1.01] transition-all">Review & Continue →</button>
                </div>
              )}
              <p className="text-center text-white/25 text-xs">Have a photo? <button onClick={()=>setMode('ai')} className="text-violet-400 hover:text-violet-300 underline">Switch to AI Parse →</button></p>
            </motion.div>
          )}

          {/* PARSING */}
          {step==='parsing' && (
            <motion.div key="parsing" initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.95 }} className="glass-card rounded-3xl p-12 text-center">
              <div className="text-6xl mb-5 animate-bounce">🤖</div>
              <h3 className="font-playfair text-2xl font-bold text-white mb-2">Claude is reading your timetable</h3>
              <p className="text-white/40 text-sm mb-8">Identifying subjects, days, and time slots…</p>
              <div className="w-full glass rounded-full h-2.5 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width:`${progress}%` }} transition={{ duration:0.3 }}/></div>
              <p className="text-white/25 text-xs mt-3 font-mono">{progress}%</p>
            </motion.div>
          )}

          {/* REVIEW */}
          {step==='review' && (
            <motion.div key="review" initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-24 }} className="space-y-4">
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-white">{mode==='ai'?'Parsed Timetable':'Your Schedule'}</h3><span className="text-xs text-white/35">{slots.length} slots · {grouped.length} subjects</span></div>
                <div className="space-y-2">
                  {grouped.map((g,i)=>(
                    <div key={i} className={`bg-gradient-to-r ${slotColor(g.subject)} border rounded-xl px-4 py-3 flex items-center justify-between group`}>
                      <div><p className="text-sm font-medium text-white capitalize">{g.subject}</p><p className="text-xs text-white/45 mt-0.5 font-mono">{sortDays(g.days).map(d=>d.slice(0,3)).join(', ')} · {g.startTime}–{g.endTime}</p></div>
                      <button onClick={()=>removeGroup(g.indices)} className="text-white/20 hover:text-red-400 transition-colors text-xl opacity-0 group-hover:opacity-100 ml-4">×</button>
                    </div>
                  ))}
                  {slots.length===0&&<p className="text-center py-8 text-white/25">No slots. Go back and add some.</p>}
                </div>
                {mode==='manual'&&<button onClick={()=>setStep('input')} className="w-full mt-4 py-2.5 rounded-xl glass border border-dashed border-white/15 text-sm text-white/45 hover:text-white hover:border-white/30 transition-all">+ Add more classes</button>}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep('input')} className="px-5 py-3 rounded-xl glass text-white/50 hover:text-white transition-all text-sm">← Back</button>
                <button onClick={()=>setStep('criteria')} disabled={slots.length===0} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 font-semibold text-white btn-glow transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40">Set Attendance Criteria →</button>
              </div>
            </motion.div>
          )}

          {/* CRITERIA */}
          {step==='criteria' && (
            <motion.div key="criteria" initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-24 }} className="glass-card rounded-3xl p-8 space-y-6">
              <div><h3 className="font-playfair text-xl font-bold text-white mb-1">Attendance Criteria</h3><p className="text-white/40 text-sm">Set the minimum attendance % per subject. Most colleges require 75%.</p></div>
              <div className="glass rounded-2xl p-4 border border-violet-500/20 flex items-center gap-4">
                <div className="flex-1"><p className="text-sm font-medium text-white">Apply same to all subjects</p><p className="text-xs text-white/35">Quick-set one threshold for everything</p></div>
                <div className="flex items-center gap-2 shrink-0">
                  <input type="number" min={1} max={100} value={globalCrit} onChange={e=>setGlobalCrit(Math.min(100,Math.max(1,parseInt(e.target.value)||75)))}
                    className="w-16 glass rounded-xl px-3 py-2 text-center text-white font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"/>
                  <span className="text-white/50 text-sm">%</span>
                  <button onClick={()=>{ const n={...criteria}; Object.keys(n).forEach(k=>{n[k]=globalCrit;}); setCriteria(n); toast.success(`Applied ${globalCrit}% to all`); }}
                    className="px-3 py-2 rounded-xl bg-violet-600/50 hover:bg-violet-600/80 text-white text-xs font-medium transition-all">Apply</button>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Per Subject</p>
                {uniqueSubjs.map(subject=>(
                  <div key={subject} className={`bg-gradient-to-r ${slotColor(subject)} border rounded-xl px-4 py-3 flex items-center justify-between`}>
                    <p className="text-sm font-medium text-white capitalize">{subject}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <input type="number" min={1} max={100} value={criteria[subject]??75} onChange={e=>setCriteria(c=>({...c,[subject]:Math.min(100,Math.max(1,parseInt(e.target.value)||75))}))}
                        className="w-16 glass rounded-xl px-3 py-1.5 text-center text-white font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"/>
                      <span className="text-white/50 text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep('review')} className="px-5 py-3 rounded-xl glass text-white/50 hover:text-white transition-all text-sm">← Review</button>
                <button onClick={()=>setStep('configure')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 font-semibold text-white btn-glow transition-all hover:from-violet-500 hover:to-cyan-500">Set Semester Dates →</button>
              </div>
            </motion.div>
          )}

          {/* CONFIGURE + SAVE */}
          {(step==='configure'||step==='saving') && (
            <motion.div key="configure" initial={{ opacity:0,x:24 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-24 }} className="glass-card rounded-3xl p-8 space-y-6">
              <div>
                <h3 className="font-playfair text-xl font-bold text-white mb-1">Configure semester</h3>
                {existing.exists && <div className="mt-2 glass rounded-xl p-3 border border-red-500/25 text-xs text-red-300/70"><span className="font-bold text-red-300">⚠ Warning:</span> Saving will permanently delete your existing {existing.sessionCount} sessions and {existing.markedCount} attendance records.</div>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[['Semester Start','startDate'],['Semester End','endDate']].map(([label,key])=>(
                  <div key={key}><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">{label}</label>
                    <input type="date" value={(config as any)[key]} onChange={e=>setConfig(c=>({...c,[key]:e.target.value}))} className="w-full glass rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark] transition-all"/>
                  </div>
                ))}
              </div>
              <div><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Holiday Dates <span className="text-white/25 normal-case">(optional, comma-separated YYYY-MM-DD)</span></label>
                <input type="text" placeholder="2024-01-26, 2024-08-15" value={config.skipDays} onChange={e=>setConfig(c=>({...c,skipDays:e.target.value}))} className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm font-mono transition-all"/>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep('criteria')} disabled={step==='saving'} className="px-5 py-3 rounded-xl glass text-white/50 hover:text-white transition-all text-sm disabled:opacity-40">← Back</button>
                <button onClick={handleSave} disabled={step==='saving'} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-white btn-glow transition-all hover:scale-[1.01] disabled:opacity-50">
                  {step==='saving'?<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating sessions…</span>:'🚀 Generate semester schedule'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={()=>setUpgradeOpen(false)} onSuccess={()=>{ setUpgradeOpen(false); toast.success('You can now use AI parsing!'); }} trigger="ai_parse"/>
    </div>
  );
}
