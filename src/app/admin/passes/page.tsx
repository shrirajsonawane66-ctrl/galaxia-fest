"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { passesSeed } from "@/lib/data"
import { formatINR } from "@/lib/utils"
import { Save, AlertTriangle, Trash2 } from "lucide-react"

export default function PassesAdmin() {
  const [passes, setPasses] = useState(passesSeed)
  const [saved, setSaved] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("galaxia_passes")
    if (stored) setPasses(JSON.parse(stored))
  }, [])

  const save = () => {
    localStorage.setItem("galaxia_passes", JSON.stringify(passes))
    setSaved("Saved locally.")
    setTimeout(()=>setSaved(""), 4000)
  }

  const update = (id: string, patch: any) => setPasses(prev => prev.map(p => p.id===id ? {...p, ...patch} : p))

  const remove = (id: string) => {
    const pass = passes.find(p => p.id===id)
    if (!confirm(`Delete "${pass?.name}" pass? Existing bookings are unaffected.`)) return
    const next = passes.filter(p => p.id!==id)
    setPasses(next)
    // persist immediately so the removal takes effect without needing Save
    localStorage.setItem("galaxia_passes", JSON.stringify(next))
    setSaved("Pass deleted.")
    setTimeout(()=>setSaved(""), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron font-black text-2xl">Passes / Price Management</h1>
        <p className="text-white/50 text-sm font-space">Edit price, description, benefits, capacity. Changes reflect on homepage instantly (DB-driven in prod).</p>
        <div className="mt-2 text-xs font-space text-amber-300/80 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> New price affects future bookings only. Existing bookings keep unit_price.</div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {passes.map(p => (
          <div key={p.id} className="glass rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-orbitron font-black">{p.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 font-space uppercase tracking-widest">{p.slug}</span>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={()=>remove(p.id)} aria-label={`Delete ${p.name} pass`}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-space uppercase tracking-widest text-white/50">Price (INR)</label>
              <input type="number" value={p.price} onChange={e=>update(p.id,{price: parseInt(e.target.value)||0})} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-space uppercase tracking-widest text-white/50">Description</label>
              <input value={p.description} onChange={e=>update(p.id,{description:e.target.value})} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-space uppercase tracking-widest text-white/50">Benefits (comma separated)</label>
              <textarea value={p.benefits.join(", ")} onChange={e=>update(p.id,{benefits: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} rows={3} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-space uppercase tracking-widest text-white/50">Capacity</label>
                <input type="number" value={p.capacity} onChange={e=>update(p.id,{capacity: parseInt(e.target.value)||0})} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-space uppercase tracking-widest text-white/50">Sold</label>
                <input type="number" value={p.sold_count} onChange={e=>update(p.id,{sold_count: parseInt(e.target.value)||0})} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-space flex items-center gap-2"><input type="checkbox" checked={p.is_active} onChange={e=>update(p.id,{is_active:e.target.checked})} /> Active</label>
              <span className="text-xs font-space text-white/40 ml-auto">{p.capacity - p.sold_count} remaining • {(p.is_active && (p.capacity - p.sold_count) >0) ? <span className="text-emerald-400">On Sale</span> : <span className="text-red-400">Sold Out</span>}</span>
            </div>
            <div className="text-xs font-space text-white/30">Current: {formatINR(p.price)} • Preview card will show this price.</div>
          </div>
        ))}
      </div>

      {passes.length===0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center space-y-3">
          <div className="text-white/50 font-space text-sm">All passes have been deleted.</div>
          <Button variant="outline" className="rounded-full" onClick={()=>{ const fresh = passesSeed.map(p=>({...p})); setPasses(fresh); localStorage.setItem("galaxia_passes", JSON.stringify(fresh)); setSaved("Default passes restored."); setTimeout(()=>setSaved(""),4000) }}>Restore default passes</Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} variant="galaxy" className="rounded-full"><Save className="w-4 h-4" /> Save All</Button>
        {saved && <span className="text-xs text-emerald-300 font-space">{saved}</span>}
      </div>
    </div>
  )
}
