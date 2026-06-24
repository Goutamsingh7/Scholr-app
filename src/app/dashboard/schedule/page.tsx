'use client';
import{useState,useEffect,useCallback}from'react';
import{motion,AnimatePresence}from'framer-motion';
import toast from'react-hot-toast';
import SessionModal from'@/components/dashboard/session-modal';
import ClassManagerModal from'@/components/dashboard/class-manager-modal';
import{ClassSession}from'@/types';

const DAY_NAMES=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];

function getWeekDates(offset:number):Date[]{
  const d=new Date();d.setHours(0,0,0,0);
  d.setDate(d.getDate()-d.getDay()+offset*7);
  return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x;});
}
function sameDay(a:Date,b:Date){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function toDateStr(d:Date){return d.toISOString().split('T')[0];}
function getSubjectColor(s:string){const h=s.split('').reduce((a,b)=>a+b.charCodeAt(0),0);return['bg-violet-500','bg-cyan-500','bg-pink-500','bg-emerald-500','bg-amber-500','bg-blue-500','bg-rose-500','bg-teal-500'][h%8];}

function MiniRing({pct}:{pct:number}){
  const r=18,circ=2*Math.PI*r,dash=(pct/100)*circ;
  const color=pct>=75?'#4ade80':pct>=50?'#fbbf24':'#f87171';
  return(
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4}/>
        <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{filter:`drop-shadow(0 0 4px ${color}88)`}}/>
      </svg>
      <span className="text-[10px] font-bold text-white relative z-10">{pct}%</span>
    </div>
  );
}

export default function SchedulePage(){
  const[weekOffset,setWeekOffset]=useState(0);
  const[selectedDate,setSelectedDate]=useState(()=>{const d=new Date();d.setHours(0,0,0,0);return d;});
  const[allSessions,setAllSessions]=useState<ClassSession[]>([]);
  const[subjectStats,setSubjectStats]=useState<Record<string,{pct:number;canMiss:number}>>({});
  const[loading,setLoading]=useState(true);
  const[sessionModal,setSessionModal]=useState<ClassSession|null>(null);
  const[classManager,setClassManager]=useState<{open:boolean;editing:ClassSession|null}>({open:false,editing:null});
  const[markingId,setMarkingId]=useState<string|null>(null);

  const weekDates=getWeekDates(weekOffset);

  const fetchData=useCallback(async()=>{
    setLoading(true);
    try{
      const start=weekDates[0].toISOString(),end=weekDates[6].toISOString();
      const[sessRes,attRes]=await Promise.all([fetch(`/api/sessions?weekStart=${start}&weekEnd=${end}`),fetch('/api/attendance')]);
      const sessData=await sessRes.json(),attData=await attRes.json();
      setAllSessions(sessData.sessions??[]);
      const stats:Record<string,{pct:number;canMiss:number}>={};
      for(const sub of(attData.subjectStats??[])){stats[sub.subject]={pct:sub.percentage,canMiss:sub.canMiss};}
      setSubjectStats(stats);
    }catch{toast.error('Failed to load');}finally{setLoading(false);}
  },[weekOffset]);

  useEffect(()=>{fetchData();},[fetchData]);

  const today=new Date();today.setHours(0,0,0,0);
  const daySelected=new Date(selectedDate);daySelected.setHours(0,0,0,0);
  const daySessions=allSessions.filter(s=>{const sd=new Date(s.date);sd.setHours(0,0,0,0);return sd.getTime()===daySelected.getTime();}).sort((a,b)=>a.startTime.localeCompare(b.startTime));

  async function quickMark(sessId:string,status:string,e:React.MouseEvent){
    e.stopPropagation();setMarkingId(sessId);
    try{
      await fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({classSessionId:sessId,status})});
      setAllSessions(s=>s.map(x=>x.id===sessId?{...x,attendance:{id:'',classSessionId:sessId,status:status as any,markedAt:''}}:x));
    }catch{toast.error('Failed');}finally{setMarkingId(null);}
  }

  async function shareSchedule(){
    const lines=daySessions.map(s=>`${s.startTime}–${s.endTime}  ${s.subject}  [${s.attendance?.status??'unmarked'}]`);
    const text=`📅 My Schedule — ${selectedDate.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}\n\n${lines.join('\n')||'No classes today'}\n\nTracked with Scholr`;
    if(navigator.share){try{await navigator.share({title:'My Schedule — Scholr',text});return;}catch{}}
    await navigator.clipboard.writeText(text);toast.success('Schedule copied to clipboard');
  }

  function onClassSaved(saved:ClassSession){
    setAllSessions(prev=>{const exists=prev.find(s=>s.id===saved.id);return exists?prev.map(s=>s.id===saved.id?saved:s):[...prev,saved];});
    fetchData();
  }
  function onClassDeleted(id:string){setAllSessions(prev=>prev.filter(s=>s.id!==id));}
  function handleAttendanceChange(sessionId:string,status:string){setAllSessions(s=>s.map(x=>x.id===sessionId?{...x,attendance:{id:'',classSessionId:sessionId,status:status as any,markedAt:''}}:x));fetchData();}

  const monthYear=`${MONTH_NAMES[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  return(
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-[60px] lg:top-0 z-30 px-4 pt-4 pb-3" style={{background:'rgba(5,5,14,0.92)',backdropFilter:'blur(20px)'}}>
        {/* Month + nav */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={()=>setWeekOffset(w=>w-1)} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all text-lg">‹</button>
            <h2 className="font-playfair font-bold text-white text-lg">{monthYear}</h2>
            <button onClick={()=>setWeekOffset(w=>w+1)} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all text-lg">›</button>
          </div>
          <div className="flex items-center gap-2">
            {weekOffset!==0&&<button onClick={()=>{setWeekOffset(0);setSelectedDate(new Date());}} className="text-xs px-3 py-1.5 glass rounded-xl text-violet-400 border border-violet-500/30">Today</button>}
            <button onClick={shareSchedule} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all" title="Share day schedule">⬆</button>
          </div>
        </div>
        {/* Week day selector */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date,i)=>{
            const isToday=sameDay(date,today),isSel=sameDay(date,selectedDate);
            const hasSess=allSessions.some(s=>{const sd=new Date(s.date);sd.setHours(0,0,0,0);return sd.getTime()===date.getTime();});
            return(
              <button key={i} onClick={()=>setSelectedDate(new Date(date))} className="flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all" style={isSel?{background:'rgba(124,58,237,0.25)',border:'1px solid rgba(124,58,237,0.4)'}:{}}>
                <span className={`text-[10px] font-medium ${isSel?'text-violet-300':isToday?'text-violet-400':'text-white/35'}`}>{DAY_NAMES[date.getDay()]}</span>
                <span className={`text-base font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday&&!isSel?'text-violet-400 ring-1 ring-violet-500/50':isSel?'text-white bg-violet-600 shadow-[0_0_12px_rgba(124,58,237,0.5)]':'text-white/70'}`}>{date.getDate()}</span>
                <div className={`w-1 h-1 rounded-full ${hasSess?(isSel?'bg-violet-300':'bg-white/30'):'bg-transparent'}`}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 px-4 pb-24 lg:pb-8 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">{sameDay(selectedDate,today)?'Today':selectedDate.toLocaleDateString('en-IN',{weekday:'long'})}</h3>
            <p className="text-xs text-white/35">{selectedDate.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <button onClick={()=>setClassManager({open:true,editing:null})} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-medium transition-all btn-glow">+ Add class</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={toDateStr(selectedDate)} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}>
            {loading?(
              <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-24 glass rounded-2xl shimmer"/>)}</div>
            ):daySessions.length===0?(
              <div className="glass-card rounded-2xl p-8 text-center"><p className="text-4xl mb-3">🎉</p><p className="text-white/50 text-sm font-medium">No classes scheduled</p><p className="text-white/25 text-xs mt-1">Tap "+ Add class" to add one</p></div>
            ):(
              <div className="space-y-3">
                {daySessions.map(sess=>{
                  const status=sess.attendance?.status,dot=getSubjectColor(sess.subject),subStat=subjectStats[sess.subject],pct=subStat?.pct??0,canMiss=subStat?.canMiss??0;
                  return(
                    <motion.div key={sess.id} layout className="glass-card rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={()=>setSessionModal(sess)}>
                        <div className="text-xs text-white/40 font-mono text-center w-12 shrink-0 leading-relaxed"><div>{sess.startTime}</div><div>{sess.endTime}</div></div>
                        <div className={`w-8 h-8 rounded-xl ${dot} bg-opacity-80 flex items-center justify-center shrink-0 text-white text-sm font-bold`}>{sess.subject[0]?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white capitalize truncate">{sess.subject}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {status?<span className={`badge-${status} px-1.5 py-0.5 rounded-full text-[10px] font-medium`}>{status}</span>:<span className="text-white/25">Not marked</span>}
                            {canMiss>0&&!status&&<span className="text-emerald-400/70 ml-1.5">· Can miss {canMiss} more</span>}
                          </p>
                        </div>
                        <MiniRing pct={pct}/>
                        <button onClick={e=>{e.stopPropagation();setClassManager({open:true,editing:sess});}} className="w-7 h-7 glass rounded-lg flex items-center justify-center text-white/30 hover:text-white transition-colors text-xs shrink-0">✎</button>
                      </div>
                      {/* P/A/Cancel buttons */}
                      <div className="grid grid-cols-3 border-t border-white/5">
                        {([['◎ Can','holiday'],['✗ Abs','absent'],['✓ Pre','present']] as const).map(([label,s])=>(
                          <button key={s} onClick={e=>quickMark(sess.id,s,e)} disabled={markingId===sess.id}
                            className={`py-2.5 text-xs font-semibold transition-all ${status===s?s==='present'?'bg-emerald-500/20 text-emerald-300':s==='absent'?'bg-red-500/20 text-red-300':'bg-amber-500/20 text-amber-300':'text-white/35 hover:text-white hover:bg-white/5'} ${markingId===sess.id?'opacity-50 cursor-not-allowed':''}`}
                          >{markingId===sess.id?'…':label}</button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Week summary */}
            {!loading&&(
              <div className="glass-card rounded-2xl p-4 mt-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-semibold">This week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDates.map((date,i)=>{
                    const ds=allSessions.filter(s=>{const sd=new Date(s.date);sd.setHours(0,0,0,0);return sd.getTime()===date.getTime();});
                    const pre=ds.filter(s=>s.attendance?.status==='present').length,abs=ds.filter(s=>s.attendance?.status==='absent').length;
                    return(
                      <button key={i} onClick={()=>setSelectedDate(new Date(date))} className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] ${sameDay(date,selectedDate)?'text-violet-300':'text-white/30'}`}>{DAY_NAMES[date.getDay()]}</span>
                        <div className="w-full h-6 glass rounded-lg flex items-center justify-center gap-0.5">
                          {ds.length===0?<span className="text-[9px] text-white/15">—</span>:<>
                            {pre>0&&<span className="text-[9px] text-emerald-400 font-bold">{pre}P</span>}
                            {abs>0&&<span className="text-[9px] text-red-400 font-bold">{abs}A</span>}
                            {ds.length-pre-abs>0&&<span className="text-[9px] text-white/30">{ds.length-pre-abs}?</span>}
                          </>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SessionModal session={sessionModal} onClose={()=>setSessionModal(null)} onAttendanceChange={handleAttendanceChange}/>
      <ClassManagerModal open={classManager.open} onClose={()=>setClassManager({open:false,editing:null})} onSaved={onClassSaved} onDeleted={onClassDeleted} editingSession={classManager.editing} defaultDate={toDateStr(selectedDate)}/>
    </div>
  );
}
