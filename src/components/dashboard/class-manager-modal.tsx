'use client';
import{useState,useEffect}from'react';
import{motion,AnimatePresence}from'framer-motion';
import toast from'react-hot-toast';
import{ClassSession}from'@/types';
interface Props{open:boolean;onClose:()=>void;onSaved:(s:ClassSession)=>void;onDeleted?:(id:string)=>void;editingSession?:ClassSession|null;defaultDate?:string}
export default function ClassManagerModal({open,onClose,onSaved,onDeleted,editingSession,defaultDate}:Props){
  const isEdit=!!editingSession;
  const[form,setForm]=useState({subject:'',date:'',startTime:'09:00',endTime:'10:00'});
  const[saving,setSaving]=useState(false);
  const[deleting,setDeleting]=useState(false);
  const[confirmDel,setConfirmDel]=useState(false);
  useEffect(()=>{
    if(open){
      if(editingSession){setForm({subject:editingSession.subject,date:new Date(editingSession.date).toISOString().split('T')[0],startTime:editingSession.startTime,endTime:editingSession.endTime});}
      else{setForm({subject:'',date:defaultDate??new Date().toISOString().split('T')[0],startTime:'09:00',endTime:'10:00'});}
      setConfirmDel(false);
    }
  },[open,editingSession,defaultDate]);
  async function handleSave(){
    if(!form.subject.trim()){toast.error('Subject required');return;}
    if(!form.date){toast.error('Date required');return;}
    if(form.startTime>=form.endTime){toast.error('End must be after start');return;}
    setSaving(true);
    try{
      const res=isEdit
        ?await fetch(`/api/sessions/${editingSession!.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        :await fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error);
      toast.success(isEdit?'Class updated ✓':'Class added ✓');
      onSaved(data.session);onClose();
    }catch(err:any){toast.error(err.message??'Failed');}finally{setSaving(false);}
  }
  async function handleDelete(){
    if(!editingSession)return;
    if(!confirmDel){setConfirmDel(true);return;}
    setDeleting(true);
    try{
      const res=await fetch(`/api/sessions/${editingSession.id}`,{method:'DELETE'});
      if(!res.ok)throw new Error('Delete failed');
      toast.success('Class removed');onDeleted?.(editingSession.id);onClose();
    }catch(err:any){toast.error(err.message??'Failed');}finally{setDeleting(false);}
  }
  return(
    <AnimatePresence>
      {open&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose}/>
          <motion.div initial={{opacity:0,y:60,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:60,scale:0.95}} transition={{type:'spring',damping:28,stiffness:300}} className="relative w-full sm:max-w-md sm:mx-4" onClick={e=>e.stopPropagation()}>
            <div className="glass-strong rounded-t-3xl sm:rounded-3xl overflow-hidden" style={{boxShadow:'0 32px 80px rgba(0,0,0,0.7)'}}>
              <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20"/></div>
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.08))'}}>
                <h2 className="font-playfair text-xl font-bold text-white">{isEdit?'Edit Class':'Add Class'}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Subject Name</label>
                  <input type="text" placeholder="e.g. Mathematics, Physics Lab…" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')handleSave();}} autoFocus className="w-full glass rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm transition-all"/>
                </div>
                <div><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full glass rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark] transition-all"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['Start Time','startTime'],['End Time','endTime']].map(([label,key])=>(
                    <div key={key}><label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">{label}</label>
                      <input type="time" value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} className="w-full glass rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark] transition-all"/>
                    </div>
                  ))}
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-semibold text-white btn-glow transition-all hover:scale-[1.01] disabled:opacity-50">
                  {saving?<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</span>:isEdit?'✓ Save Changes':'+ Add Class'}
                </button>
                {isEdit&&(
                  <>
                    <button onClick={handleDelete} disabled={deleting} className={`w-full py-3 rounded-xl text-sm font-medium transition-all border ${confirmDel?'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30':'glass border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30'} disabled:opacity-40`}>
                      {deleting?'Deleting…':confirmDel?'⚠ Confirm Delete':'🗑 Delete This Class'}
                    </button>
                    {confirmDel&&!deleting&&<button onClick={()=>setConfirmDel(false)} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-1">Cancel deletion</button>}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
