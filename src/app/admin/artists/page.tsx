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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-black text-2xl">Artists</h1>
          <p className="text-white/50 text-sm font-space">Add / edit / delete / reorder. Images via URL or upload (Supabase Storage in prod).</p>
        </div>
        <Button variant="galaxy" className="rounded-full" onClick={()=>{ setEditing({ id:"", name:"", genre:"", role:"", year:"2025", bio:"", image_url:"https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80", display_order: artists.length+1, featured:false, size:96, orbit:300, duration:60, startAngle:0, spin:5, label:"#8B5CF6", glow:"rgba(139,92,246,0.6)", accent:"#C084FC" } as any); setIsNew(true)}}><Plus className="w-4 h-4" /> Add Artist</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {artists.sort((a,b)=>a.display_order-b.display_order).map(a=> (
          <div key={a.id} className="glass rounded-2xl overflow-hidden border border-white/10">
            <img src={a.image_url} alt={a.name} className="w-full h-40 object-cover" />
            <div className="p-4 space-y-2">
              <div className="font-orbitron font-bold text-sm">{a.name}</div>
              <div className="text-xs text-cyan-300 font-space">{a.genre} • {a.role}</div>
              <div className="text-xs text-white/50 line-clamp-2">{a.bio}</div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="rounded-full flex-1" onClick={()=>{ setEditing(a); setIsNew(false)}}>Edit</Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={()=>remove(a.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
              <div className="text-[11px] font-space text-white/30">Order {a.display_order} • {a.featured ? "Featured" : "Standard"}</div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-[#050816]/80 backdrop-blur flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto space-y-3 border border-white/10">
            <h3 className="font-orbitron font-bold">{isNew ? "Add Artist" : "Edit Artist"}</h3>
            <input placeholder="Name" value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <input placeholder="Genre" value={editing.genre} onChange={e=>setEditing({...editing, genre:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <input placeholder="Role (e.g. Main Stage Sun 21)" value={editing.role} onChange={e=>setEditing({...editing, role:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <textarea placeholder="Bio" value={editing.bio} onChange={e=>setEditing({...editing, bio:e.target.value})} rows={3} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <input placeholder="Image URL" value={editing.image_url} onChange={e=>setEditing({...editing, image_url:e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Display order" type="number" value={editing.display_order} onChange={e=>setEditing({...editing, display_order: parseInt(e.target.value)||0})} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              <input placeholder="Label color" value={(editing as any).label} onChange={e=>setEditing({...editing, label:e.target.value} as any)} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-xs font-space"><input type="checkbox" checked={(editing as any).featured} onChange={e=>setEditing({...editing, featured:e.target.checked} as any)} /> Featured</label>
            </div>
            {/* image upload stub */}
            <div className="text-xs text-white/40 font-space">Upload to Supabase Storage in production: bucket <code>artist-images</code>. For demo paste URL above or use <a href="https://images.unsplash.com" target="_blank" className="text-cyan-300">Unsplash</a>.</div>
            <div className="flex gap-2">
              <Button variant="galaxy" className="rounded-full flex-1" onClick={()=>save(editing)}><Save className="w-4 h-4"/> Save</Button>
              <Button variant="outline" className="rounded-full flex-1" onClick={()=>{setEditing(null); setIsNew(false)}}>Cancel</Button>
            </div>
            {isNew && <div className="text-xs text-amber-300/80">ID auto-generated from name. Adjust orbit/size/label later for vinyl styling.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
