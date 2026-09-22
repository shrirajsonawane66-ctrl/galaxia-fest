"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { faqsSeed } from "@/lib/data"
import { Plus, Trash2, Save } from "lucide-react"

export default function FaqsAdmin(){
  const [faqs,setFaqs]=useState(faqsSeed)
  const [editing,setEditing]=useState<any>(null)
  const [isNew,setIsNew]=useState(false)
  useEffect(()=>{ const s=localStorage.getItem("galaxia_faqs"); if(s) setFaqs(JSON.parse(s)) },[])
  useEffect(()=>{ localStorage.setItem("galaxia_faqs", JSON.stringify(faqs)) },[faqs])

  const save=(f:any)=>{
    if(isNew) setFaqs(prev=>[...prev,{...f,id:Date.now().toString()}])
    else setFaqs(prev=>prev.map(x=>x.id===f.id?f:x))
    setEditing(null); setIsNew(false)
  }

  return(
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-orbitron font-black text-2xl">FAQs</h1>
        <Button variant="galaxy" className="rounded-full" onClick={()=>{setEditing({id:"",question:"",answer:"",display_order:faqs.length+1}); setIsNew(true)}}><Plus className="w-4 h-4"/> Add FAQ</Button>
      </div>
      <div className="space-y-3">
        {faqs.sort((a,b)=>a.display_order-b.display_order).map(f=>(
          <div key={f.id} className="glass rounded-2xl p-5 border border-white/10">
            <div className="font-space font-medium">{f.question}</div>
            <div className="text-sm text-white/60 mt-1">{f.answer}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="rounded-full" onClick={()=>{setEditing(f); setIsNew(false)}}>Edit</Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={()=>{ if(confirm("Delete?")) setFaqs(prev=>prev.filter(x=>x.id!==f.id))}}><Trash2 className="w-4 h-4 text-red-400"/></Button>
              <span className="text-xs text-white/30 ml-auto self-center">#{f.display_order}</span>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/80 backdrop-blur flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-lg space-y-3 border border-white/10">
            <h3 className="font-orbitron font-bold">{isNew ? "Add FAQ" : "Edit FAQ"}</h3>
            <input placeholder="Question" value={editing.question} onChange={e=>setEditing({...editing,question:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <textarea placeholder="Answer" value={editing.answer} onChange={e=>setEditing({...editing,answer:e.target.value})} rows={4} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input type="number" placeholder="Order" value={editing.display_order} onChange={e=>setEditing({...editing,display_order: parseInt(e.target.value)||0})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <div className="flex gap-2"><Button variant="galaxy" className="flex-1 rounded-full" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button><Button variant="outline" className="flex-1 rounded-full" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
