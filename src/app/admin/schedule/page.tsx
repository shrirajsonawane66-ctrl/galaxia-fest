"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { scheduleSeed } from "@/lib/data"
import { Plus, Trash2, Save } from "lucide-react"

export default function ScheduleAdmin(){
  const [items,setItems]=useState(scheduleSeed)
  const [editing,setEditing]=useState<any>(null)
  const [isNew,setIsNew]=useState(false)
  useEffect(()=>{ const s=localStorage.getItem("galaxia_schedule"); if(s) setItems(JSON.parse(s)) },[])
  useEffect(()=>{ localStorage.setItem("galaxia_schedule", JSON.stringify(items)) },[items])

  const save = (it:any)=>{
    if(isNew) setItems(prev=>[...prev,{...it, id: Date.now().toString()}])
    else setItems(prev=>prev.map(x=>x.id===it.id?it:x))
    setEditing(null); setIsNew(false)
  }

  return(
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Schedule</h1>
        <Button variant="galaxy" className="min-h-11 w-full rounded-full font-ui tracking-normal sm:min-h-0 sm:w-auto" onClick={()=>{setEditing({id:"",time:"",title:"",description:"",venue:"",display_order:items.length+1}); setIsNew(true)}}><Plus className="w-4 h-4"/> Add Slot</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.sort((a,b)=>a.display_order-b.display_order).map(s=>(
          <div key={s.id} className="glass rounded-2xl p-4 border border-white/10 sm:p-5">
            <div className="text-sm font-space text-[var(--accent)]">{s.time} • {s.venue}</div>
            <div className="font-sans font-semibold mt-1">{s.title}</div>
            <div className="text-sm text-[var(--text-body)]">{s.description}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="min-h-11 flex-1 rounded-full sm:min-h-0" onClick={()=>{setEditing(s); setIsNew(false)}}>Edit</Button>
              <Button size="sm" variant="ghost" className="h-11 w-11 rounded-full sm:h-9 sm:w-9" onClick={()=>{ if(confirm("Delete?")) setItems(prev=>prev.filter(x=>x.id!==s.id))}} aria-label="Delete slot"><Trash2 className="w-4 h-4 text-red-400"/></Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/90 flex items-center justify-center p-3 sm:p-4">
          <div className="glass rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[100dvh] overflow-y-auto space-y-3 border border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <h3 className="font-sans font-semibold">{isNew ? "Add Slot" : "Edit Slot"}</h3>
            <input placeholder="Time (e.g. Fri 19 — 07:00 PM)" value={editing.time} onChange={e=>setEditing({...editing,time:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <input placeholder="Title" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <input placeholder="Venue" value={editing.venue} onChange={e=>setEditing({...editing,venue:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <textarea placeholder="Description" value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input type="number" placeholder="Order" value={editing.display_order} onChange={e=>setEditing({...editing,display_order: parseInt(e.target.value)||0})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <div className="flex flex-col gap-2 sm:flex-row"><Button variant="galaxy" className="min-h-11 flex-1 rounded-full font-ui tracking-normal sm:min-h-0" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button><Button variant="outline" className="min-h-11 flex-1 rounded-full sm:min-h-0" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
