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
      <div className="flex items-center justify-between">
        <h1 className="font-orbitron font-black text-2xl">Schedule</h1>
        <Button variant="galaxy" className="rounded-full" onClick={()=>{setEditing({id:"",time:"",title:"",description:"",venue:"",display_order:items.length+1}); setIsNew(true)}}><Plus className="w-4 h-4"/> Add Slot</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.sort((a,b)=>a.display_order-b.display_order).map(s=>(
          <div key={s.id} className="glass rounded-2xl p-5 border border-white/10">
            <div className="text-xs font-space uppercase tracking-widest text-cyan-300">{s.time} • {s.venue}</div>
            <div className="font-orbitron font-bold mt-1">{s.title}</div>
            <div className="text-sm text-white/60">{s.description}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="rounded-full flex-1" onClick={()=>{setEditing(s); setIsNew(false)}}>Edit</Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={()=>{ if(confirm("Delete?")) setItems(prev=>prev.filter(x=>x.id!==s.id))}}><Trash2 className="w-4 h-4 text-red-400"/></Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/80 backdrop-blur flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-lg space-y-3 border border-white/10">
            <h3 className="font-orbitron font-bold">{isNew ? "Add Slot" : "Edit Slot"}</h3>
            <input placeholder="Time (e.g. Fri 19 — 07:00 PM)" value={editing.time} onChange={e=>setEditing({...editing,time:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input placeholder="Title" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input placeholder="Venue" value={editing.venue} onChange={e=>setEditing({...editing,venue:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <textarea placeholder="Description" value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input type="number" placeholder="Order" value={editing.display_order} onChange={e=>setEditing({...editing,display_order: parseInt(e.target.value)||0})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <div className="flex gap-2"><Button variant="galaxy" className="flex-1 rounded-full" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button><Button variant="outline" className="flex-1 rounded-full" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
