'use client';
import{useState,useEffect}from'react';
import{motion,AnimatePresence}from'framer-motion';
import toast from'react-hot-toast';

interface NoteItem{id:string;content:string;imageData?:string|null;createdAt:string}
interface SessionWithNotes{id:string;date:string;subject:string;startTime:string;endTime:string;notes:NoteItem[]}
interface SubjectGroup{subject:string;sessions:SessionWithNotes[];totalNotes:number}

function getColor(s:string){const h=s.split('').reduce((a,b)=>a+b.charCodeAt(0),0);const p=[{bg:'bg-violet-500/10',border:'border-violet-500/20',text:'text-violet-300',dot:'bg-violet-400',glow:'rgba(124,58,237,0.2)'},{bg:'bg-cyan-500/10',border:'border-cyan-500/20',text:'text-cyan-300',dot:'bg-cyan-400',glow:'rgba(6,182,212,0.2)'},{bg:'bg-pink-500/10',border:'border-pink-500/20',text:'text-pink-300',dot:'bg-pink-400',glow:'rgba(244,114,182,0.2)'},{bg:'bg-emerald-500/10',border:'border-emerald-500/20',text:'text-emerald-300',dot:'bg-emerald-400',glow:'rgba(52,211,153,0.2)'},{bg:'bg-amber-500/10',border:'border-amber-500/20',text:'text-amber-300',dot:'bg-amber-400',glow:'rgba(251,191,36,0.2)'},{bg:'bg-blue-500/10',border:'border-blue-500/20',text:'text-blue-300',dot:'bg-blue-400',glow:'rgba(96,165,250,0.2)'},{bg:'bg-rose-500/10',border:'border-rose-500/20',text:'text-rose-300',dot:'bg-rose-400',glow:'rgba(251,113,133,0.2)'},{bg:'bg-teal-500/10',border:'border-teal-500/20',text:'text-teal-300',dot:'bg-teal-400',glow:'rgba(45,212,191,0.2)'}];return p[h%p.length];}
function fmtDate(s:string){return new Date(s).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});}
function fmtTime(s:string){return new Date(s).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
function groupByMonth(sessions:SessionWithNotes[]):Record<string,SessionWithNotes[]>{const g:Record<string,SessionWithNotes[]>={};sessions.forEach(s=>{const k=new Date(s.date).toLocaleDateString('en-IN',{month:'long',year:'numeric'});if(!g[k])g[k]=[];g[k].push(s);});return g;}

async function shareContent(title:string,text:string){
  if(navigator.share){try{await navigator.share({title,text});return;}catch{}}
  await navigator.clipboard.writeText(text);toast.success('Copied to clipboard');
}

export default function NotesPage(){
  const[loading,setLoading]=useState(true);
  const[groups,setGroups]=useState<SubjectGroup[]>([]);
  const[activeSub,setActiveSub]=useState('all');
  const[query,setQuery]=useState('');
  const[expandImg,setExpandImg]=useState<string|null>(null);
  const[deletingId,setDeletingId]=useState<string|null>(null);
  const[editingId,setEditingId]=useState<string|null>(null);
  const[editText,setEditText]=useState('');
  const[savingEdit,setSavingEdit]=useState(false);

  useEffect(()=>{
    fetch('/api/notes?all=true').then(r=>r.json()).then(d=>{
      const sessions:SessionWithNotes[]=d.sessions??[];
      const map=new Map<string,SessionWithNotes[]>();
      sessions.forEach(s=>{if(!map.has(s.subject))map.set(s.subject,[]);map.get(s.subject)!.push(s);});
      setGroups(Array.from(map.entries()).map(([subject,sl])=>({subject,sessions:sl.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()),totalNotes:sl.reduce((n,s)=>n+s.notes.length,0)})).sort((a,b)=>b.totalNotes-a.totalNotes));
    }).catch(()=>toast.error('Failed to load notes')).finally(()=>setLoading(false));
  },[]);

  async function deleteNote(noteId:string,sessionId:string){
    setDeletingId(noteId);
    try{
      await fetch(`/api/notes?id=${noteId}`,{method:'DELETE'});
      setGroups(prev=>prev.map(g=>{const upd=g.sessions.map(s=>s.id===sessionId?{...s,notes:s.notes.filter(n=>n.id!==noteId)}:s).filter(s=>s.notes.length>0);return{...g,sessions:upd,totalNotes:upd.reduce((n,s)=>n+s.notes.length,0)};}).filter(g=>g.sessions.length>0));
      toast.success('Note deleted');
    }catch{toast.error('Failed');}finally{setDeletingId(null);}
  }

  function startEdit(note:NoteItem){setEditingId(note.id);setEditText(note.content==='📷 Photo note'?'':note.content);}
  function cancelEdit(){setEditingId(null);setEditText('');}

  async function saveEdit(noteId:string,sessionId:string){
    if(!editText.trim()){toast.error('Note cannot be empty');return;}
    setSavingEdit(true);
    try{
      const res=await fetch('/api/notes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:noteId,content:editText.trim()})});
      if(!res.ok)throw new Error();
      setGroups(prev=>prev.map(g=>({...g,sessions:g.sessions.map(s=>s.id===sessionId?{...s,notes:s.notes.map(n=>n.id===noteId?{...n,content:editText.trim()}:n)}:s)})));
      toast.success('Note updated ✓');setEditingId(null);setEditText('');
    }catch{toast.error('Failed to update');}finally{setSavingEdit(false);}
  }

  async function shareNote(note:NoteItem,subject:string,sess:SessionWithNotes){
    const text=`📝 ${subject}\n${fmtDate(sess.date)} · ${sess.startTime}–${sess.endTime}\n\n${note.content!=='📷 Photo note'?note.content:''}\n\nTracked with Scholr`;
    await shareContent(`Note — ${subject}`,text);
  }

  async function shareSubjectNotes(group:SubjectGroup){
    const lines:string[]=[];
    group.sessions.forEach(sess=>{lines.push(`\n📅 ${fmtDate(sess.date)} (${sess.startTime}–${sess.endTime})`);sess.notes.forEach(n=>{if(n.content!=='📷 Photo note')lines.push(`  • ${n.content}`);});});
    await shareContent(`${group.subject} Notes — Scholr`,`📚 ${group.subject} Notes\n${lines.join('\n')}\n\nTracked with Scholr`);
  }

  function exportPDF(){
    const exportGroups=activeSub==='all'?groups:groups.filter(g=>g.subject===activeSub);
    if(!exportGroups.length){toast.error('No notes to export');return;}
    const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Scholr Notes</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#111;padding:32px}.st{font-size:18px;font-weight:700;color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:6px;margin:24px 0 12px}.sh{background:#f8f7ff;border-radius:8px;padding:10px 14px;margin-bottom:8px;border:1px solid #e8e4ff;font-size:13px;font-weight:600}.note{padding:8px 14px;border-bottom:1px dashed #eee;font-size:13px;line-height:1.5}.nt{font-size:10px;color:#aaa;font-family:monospace}.ni{max-width:100%;max-height:280px;border-radius:8px;margin:4px 0;display:block}.ft{text-align:center;font-size:11px;color:#999;margin-top:32px}@media print{body{padding:16px}}</style></head><body>
<h1 style="font-size:22px;font-weight:700;color:#7c3aed;margin-bottom:4px">📝 Scholr Notes Export</h1>
<p style="color:#666;font-size:12px;margin-bottom:20px">Exported ${new Date().toLocaleString('en-IN')} · ${exportGroups.reduce((n,g)=>n+g.totalNotes,0)} notes</p>
${exportGroups.map(g=>`<div class="st">${esc(g.subject)} (${g.totalNotes} notes)</div>${Object.entries(groupByMonth(g.sessions)).map(([month,sess])=>`<p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">${month}</p>${sess.map(s=>`<div class="sh">${fmtDate(s.date)} · ${s.startTime}–${s.endTime}</div>${s.notes.map(n=>`<div class="note">${n.imageData?`<img src="${n.imageData}" class="ni"/>`:''}${n.content!=='📷 Photo note'?`<p>${esc(n.content)}</p>`:''}<p class="nt">${fmtTime(n.createdAt)}</p></div>`).join('')}`).join('')}`).join('')}`).join('')}
<p class="ft">Generated by Scholr · scholr.app</p></body></html>`;
    const win=window.open('','_blank');if(!win){toast.error('Allow popups');return;}win.document.write(html);win.document.close();setTimeout(()=>win.print(),300);
  }

  const totalNotes=groups.reduce((n,g)=>n+g.totalNotes,0);
  const filteredGroups=groups.filter(g=>activeSub==='all'||g.subject===activeSub).map(g=>({...g,sessions:g.sessions.map(s=>({...s,notes:s.notes.filter(n=>!query||n.content.toLowerCase().includes(query.toLowerCase())||g.subject.toLowerCase().includes(query.toLowerCase()))})).filter(s=>s.notes.length>0)})).filter(g=>g.sessions.length>0);

  if(loading)return(<div className="p-6 lg:p-8 space-y-6 animate-pulse"><div className="h-8 w-48 glass rounded-xl shimmer"/><div className="flex gap-2">{[...Array(4)].map((_,i)=><div key={i} className="h-9 w-24 glass rounded-xl shimmer"/>)}</div>{[...Array(3)].map((_,i)=><div key={i} className="h-40 glass rounded-2xl shimmer"/>)}</div>);

  return(
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="flex items-start justify-between gap-4">
        <div><h1 className="font-playfair text-2xl font-bold text-white">Notes</h1><p className="text-white/40 text-sm mt-0.5">{totalNotes===0?'No notes yet':`${totalNotes} note${totalNotes===1?'':'s'} across ${groups.length} subject${groups.length===1?'':'s'}`}</p></div>
        {totalNotes>0&&(
          <div className="flex gap-2 shrink-0">
            <button onClick={()=>{const g=groups.find(g=>g.subject===activeSub);if(g)shareSubjectNotes(g);}} disabled={activeSub==='all'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 hover:border-cyan-500/40 text-sm text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Share selected subject">⬆ Share</button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 hover:border-violet-500/40 text-sm text-white/60 hover:text-white transition-all">📄 PDF</button>
          </div>
        )}
      </motion.div>

      {totalNotes===0?(
        <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} className="glass-card rounded-3xl p-12 text-center border border-white/5">
          <p className="text-6xl mb-4">📝</p><h2 className="font-playfair text-xl font-bold text-white mb-2">No notes yet</h2>
          <p className="text-white/40 text-sm">Open any class session and add notes — they'll appear here sorted by subject and date.</p>
        </motion.div>
      ):(
        <>
          {/* Search */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.05}}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              <input type="text" placeholder="Search notes…" value={query} onChange={e=>setQuery(e.target.value)} className="w-full glass rounded-xl pl-9 pr-10 py-3 text-white placeholder-white/25 text-sm transition-all"/>
              {query&&<button onClick={()=>setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">×</button>}
            </div>
          </motion.div>

          {/* Subject tabs */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setActiveSub('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSub==='all'?'bg-violet-600/30 border border-violet-500/40 text-white':'glass text-white/45 hover:text-white border border-transparent'}`}>All ({totalNotes})</button>
            {groups.map(g=>{const sc=getColor(g.subject);return(<button key={g.subject} onClick={()=>setActiveSub(g.subject)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeSub===g.subject?`${sc.bg} ${sc.border} border ${sc.text}`:'glass text-white/45 hover:text-white border border-transparent'}`}>{g.subject} ({g.totalNotes})</button>);})}
          </div>

          {/* Notes */}
          <AnimatePresence mode="wait">
            <motion.div key={activeSub+query} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-8">
              {filteredGroups.length===0?(
                <div className="glass-card rounded-2xl p-8 text-center"><p className="text-3xl mb-3">🔍</p><p className="text-white/40 text-sm">No notes match your search</p></div>
              ):filteredGroups.map(g=>{
                const sc=getColor(g.subject),monthGroups=groupByMonth(g.sessions);
                return(
                  <div key={g.subject}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${sc.dot} shrink-0`} style={{boxShadow:`0 0 8px ${sc.glow}`}}/>
                      <h2 className={`font-playfair text-lg font-bold capitalize ${sc.text}`}>{g.subject}</h2>
                      <div className="flex-1 h-px bg-white/5"/>
                      <button onClick={()=>shareSubjectNotes(g)} className="text-xs text-white/30 hover:text-cyan-400 transition-colors px-2 py-1 glass rounded-lg border border-white/8" title="Share these notes">⬆ Share</button>
                      <span className="text-xs text-white/25">{g.totalNotes} notes</span>
                    </div>
                    <div className="space-y-6 ml-3">
                      {Object.entries(monthGroups).map(([month,sessions])=>(
                        <div key={month}>
                          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2"><span className="w-4 h-px bg-white/10 inline-block"/>{month}</p>
                          <div className="space-y-3">
                            {sessions.map(sess=>(
                              <div key={sess.id} className={`glass-card rounded-2xl overflow-hidden border ${sc.border}`}>
                                <div className={`${sc.bg} px-4 py-3 border-b border-white/5 flex items-center justify-between`}>
                                  <div><p className="text-sm font-medium text-white/90">{fmtDate(sess.date)}</p><p className="text-xs text-white/40 font-mono">{sess.startTime} – {sess.endTime}</p></div>
                                  <span className="text-xs text-white/30 font-mono">{sess.notes.length} note{sess.notes.length===1?'':'s'}</span>
                                </div>
                                <div className="divide-y divide-white/[0.04]">
                                  {sess.notes.map(note=>{
                                    const isEdit=editingId===note.id;
                                    return(
                                      <div key={note.id} className="group">
                                        {note.imageData&&(
                                          <div className="relative cursor-pointer" onClick={()=>setExpandImg(expandImg===note.id?null:note.id)}>
                                            <img src={note.imageData} alt="Note photo" className={`w-full object-cover transition-all duration-300 ${expandImg===note.id?'max-h-96':'max-h-32'}`}/>
                                            <div className="absolute bottom-2 right-2 glass rounded-lg px-2 py-0.5 text-[10px] text-white/60 border border-white/10">{expandImg===note.id?'▲ Collapse':'▼ Expand'}</div>
                                          </div>
                                        )}
                                        <div className="px-4 py-3">
                                          {isEdit?(
                                            <div className="space-y-2">
                                              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={3} autoFocus onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))saveEdit(note.id,sess.id);if(e.key==='Escape')cancelEdit();}} className="w-full glass rounded-xl px-3 py-2 text-sm text-white resize-none border border-violet-500/40 transition-all"/>
                                              <div className="flex gap-2 justify-end">
                                                <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white transition-all">Cancel</button>
                                                <button onClick={()=>saveEdit(note.id,sess.id)} disabled={savingEdit} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white font-medium transition-all disabled:opacity-50">{savingEdit?'Saving…':'Save'}</button>
                                              </div>
                                            </div>
                                          ):(
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                {note.content!=='📷 Photo note'&&<p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{note.content}</p>}
                                                <p className="text-[11px] text-white/25 mt-1.5 font-mono">{fmtTime(note.createdAt)}</p>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={()=>shareNote(note,g.subject,sess)} className="text-white/30 hover:text-cyan-400 transition-colors text-sm p-1" title="Share">⬆</button>
                                                <button onClick={()=>startEdit(note)} className="text-white/30 hover:text-violet-400 transition-colors text-sm p-1" title="Edit">✎</button>
                                                <button onClick={()=>deleteNote(note.id,sess.id)} disabled={deletingId===note.id} className="text-white/30 hover:text-red-400 transition-colors text-xl leading-none p-1 disabled:opacity-30">{deletingId===note.id?'…':'×'}</button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {expandImg&&(()=>{
          const note=filteredGroups.flatMap(g=>g.sessions).flatMap(s=>s.notes).find(n=>n.id===expandImg);
          return note?.imageData?(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={()=>setExpandImg(null)}><motion.img src={note.imageData} alt="Note" initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}} className="max-w-full max-h-full object-contain rounded-2xl" onClick={e=>e.stopPropagation()}/><button onClick={()=>setExpandImg(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-white text-xl hover:bg-white/10 transition-colors">×</button></motion.div>):null;
        })()}
      </AnimatePresence>
    </div>
  );
}
