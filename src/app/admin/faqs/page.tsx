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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">FAQs</h1>
        <Button variant="galaxy" className="min-h-11 w-full rounded-full font-ui tracking-normal sm:min-h-0 sm:w-auto" onClick={()=>{setEditing({id:"",question:"",answer:"",display_order:faqs.length+1}); setIsNew(true)}}><Plus className="w-4 h-4"/> Add FAQ</Button>
      </div>
      <div className="space-y-3">
        {faqs.sort((a,b)=>a.display_order-b.display_order).map(f=>(
          <div key={f.id} className="glass rounded-2xl p-4 border border-white/10 sm:p-5">
            <div className="font-space font-medium">{f.question}</div>
            <div className="text-sm text-[var(--text-body)] mt-1">{f.answer}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="min-h-11 rounded-full sm:min-h-0" onClick={()=>{setEditing(f); setIsNew(false)}}>Edit</Button>
              <Button size="sm" variant="ghost" className="h-11 w-11 rounded-full sm:h-9 sm:w-9" onClick={()=>{ if(confirm("Delete?")) setFaqs(prev=>prev.filter(x=>x.id!==f.id))}} aria-label="Delete FAQ"><Trash2 className="w-4 h-4 text-red-400"/></Button>
              <span className="text-sm text-[var(--text-muted)] ml-auto self-center">#{f.display_order}</span>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/90 flex items-center justify-center p-3 sm:p-4">
          <div className="glass rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[100dvh] overflow-y-auto space-y-3 border border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <h3 className="font-sans font-semibold">{isNew ? "Add FAQ" : "Edit FAQ"}</h3>
            <input placeholder="Question" value={editing.question} onChange={e=>setEditing({...editing,question:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <textarea placeholder="Answer" value={editing.answer} onChange={e=>setEditing({...editing,answer:e.target.value})} rows={4} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
            <input type="number" placeholder="Order" value={editing.display_order} onChange={e=>setEditing({...editing,display_order: parseInt(e.target.value)||0})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0"/>
            <div className="flex flex-col gap-2 sm:flex-row"><Button variant="galaxy" className="min-h-11 flex-1 rounded-full font-ui tracking-normal sm:min-h-0" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button><Button variant="outline" className="min-h-11 flex-1 rounded-full sm:min-h-0" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
