"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { artistsSeed } from "@/lib/data"
import { Trash2, Plus, Save } from "lucide-react"

type Artist = typeof artistsSeed[0]

export default function ArtistsAdmin() {
  const [artists, setArtists] = useState<Artist[]>(artistsSeed)
  const [editing, setEditing] = useState<Artist | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("galaxia_artists")
    if (stored) setArtists(JSON.parse(stored))
  }, [])
  useEffect(()=>{ localStorage.setItem("galaxia_artists", JSON.stringify(artists)) },[artists])

  const save = (a: Artist) => {
    if (isNew) setArtists(prev=>[...prev, {...a, id: a.id || a.name.toLowerCase().replace(/\s/g,"_")}])
    else setArtists(prev=>prev.map(x=>x.id===a.id ? a : x))
    setEditing(null); setIsNew(false)
  }

  const remove = (id: string) => { if (confirm("Delete artist?")) setArtists(prev=>prev.filter(a=>a.id!==id)) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Artists</h1>
          <p className="text-[var(--text-muted)] text-sm font-space">Add / edit / delete / reorder. Images via URL.</p>
        </div>
        <Button variant="galaxy" className="min-h-11 w-full rounded-full font-ui tracking-normal sm:min-h-0 sm:w-auto" onClick={()=>{ setEditing({ id:"", name:"", genre:"", role:"", year:"2025", bio:"", image_url:"https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80", display_order: artists.length+1, featured:false, size:96, orbit:300, duration:60, startAngle:0, spin:5, label:"#FF4D58", glow:"rgba(255,77,88,0.6)", accent:"#FFB3A8" } as any); setIsNew(true)}}><Plus className="w-4 h-4" /> Add Artist</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artists.sort((a,b)=>a.display_order-b.display_order).map(a=> (
          <div key={a.id} className="glass rounded-2xl overflow-hidden border border-white/10">
            <img src={a.image_url} alt={a.name} className="w-full h-40 object-cover" />
            <div className="p-4 space-y-2">
              <div className="font-sans font-semibold text-sm">{a.name}</div>
              <div className="text-sm text-fest-red-soft font-space">{a.genre} • {a.role}</div>
              <div className="text-sm text-[var(--text-muted)] line-clamp-2">{a.bio}</div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="min-h-11 flex-1 rounded-full sm:min-h-0" onClick={()=>{ setEditing(a); setIsNew(false)}}>Edit</Button>
                <Button size="sm" variant="ghost" className="h-11 w-11 rounded-full sm:h-9 sm:w-9" onClick={()=>remove(a.id)} aria-label={`Delete ${a.name}`}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
              <div className="text-[13px] font-space text-[var(--text-muted)]">Order {a.display_order} • {a.featured ? "Featured" : "Standard"}</div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/90 flex items-center justify-center p-3 sm:p-4">
          <div className="glass rounded-2xl p-4 sm:p-6 w-full max-w-xl max-h-[100dvh] overflow-y-auto space-y-3 border border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <h3 className="font-sans font-semibold">{isNew ? "Add Artist" : "Edit Artist"}</h3>
            <input placeholder="Name" value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
            <input placeholder="Genre" value={editing.genre} onChange={e=>setEditing({...editing, genre:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
            <input placeholder="Role (e.g. Main Stage Sun 21)" value={editing.role} onChange={e=>setEditing({...editing, role:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
            <textarea placeholder="Bio" value={editing.bio} onChange={e=>setEditing({...editing, bio:e.target.value})} rows={3} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <input placeholder="Image URL" value={editing.image_url} onChange={e=>setEditing({...editing, image_url:e.target.value})} className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input placeholder="Display order" type="number" value={editing.display_order} onChange={e=>setEditing({...editing, display_order: parseInt(e.target.value)||0})} className="min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
              <input placeholder="Label color" value={(editing as any).label} onChange={e=>setEditing({...editing, label:e.target.value} as any)} className="min-h-11 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm md:min-h-0" />
              <label className="flex min-h-11 items-center gap-2 text-sm font-space md:min-h-0"><input type="checkbox" checked={(editing as any).featured} onChange={e=>setEditing({...editing, featured:e.target.checked} as any)} /> Featured</label>
            </div>
            {/* image upload stub */}
            <div className="text-sm text-[var(--text-muted)] font-space">For demo paste URL above or use <a href="https://images.unsplash.com" target="_blank" className="text-fest-red-soft">Unsplash</a>.</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="galaxy" className="min-h-11 flex-1 rounded-full font-ui tracking-normal sm:min-h-0" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button>
              <Button variant="outline" className="min-h-11 flex-1 rounded-full sm:min-h-0" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button>
            </div>
            {isNew && <div className="text-sm text-amber-300/80">ID auto-generated from name. Adjust orbit/size/label later for vinyl styling.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
