"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { eventSeed } from "@/lib/data"
import { Save } from "lucide-react"

export default function SettingsAdmin() {
  const [ev, setEv] = useState(eventSeed)
  const [saved, setSaved] = useState("")
  useEffect(()=>{ const s=localStorage.getItem("galaxia_event"); if(s) setEv(JSON.parse(s)) },[])
  const save = ()=>{ localStorage.setItem("galaxia_event", JSON.stringify(ev)); setSaved("Saved locally — production writes to Supabase events table."); setTimeout(()=>setSaved(""),3000) }

  const Field = ({ label, k, placeholder }:{label:string,k:keyof typeof ev,placeholder?:string}) => (
    <div>
      <label className="text-xs font-space uppercase tracking-widest text-white/50">{label}</label>
      <input value={(ev as any)[k]} onChange={e=>setEv({...ev, [k]: e.target.value})} placeholder={placeholder} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-fuchsia-400/40" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-orbitron font-black text-2xl">Event Settings</h1>
        <p className="text-white/50 text-sm font-space">Edit title, venue, contact, socials, SEO. Public site reads from Supabase; fallback is this seed.</p>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4 border border-white/10">
        <h3 className="font-orbitron font-bold">Branding / Hero</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Event Title" k="title" />
          <Field label="Subtitle" k="subtitle" />
          <Field label="Date" k="date" />
          <Field label="Venue" k="venue" />
          <Field label="College Name" k="college_name" />
          <Field label="SEO Title" k="seo_title" />
        </div>
        <Field label="Description" k="description" />
        <Field label="About Title" k="about_title" />
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-xs font-space uppercase tracking-widest text-white/50">About Text 1</label><textarea value={ev.about_text1} onChange={e=>setEv({...ev, about_text1:e.target.value})} rows={3} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-space uppercase tracking-widest text-white/50">About Text 2</label><textarea value={ev.about_text2} onChange={e=>setEv({...ev, about_text2:e.target.value})} rows={3} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" /></div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4 border border-white/10">
        <h3 className="font-orbitron font-bold">Contact / Socials</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Address" k="address" />
          <Field label="Contact Email" k="contact_email" />
          <Field label="Contact Phone" k="contact_phone" />
          <Field label="Instagram URL" k="instagram_url" />
          <Field label="YouTube URL" k="youtube_url" />
          <Field label="X URL" k="x_url" />
          <Field label="SEO Description" k="seo_description" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="galaxy" className="rounded-full" onClick={save}><Save className="w-4 h-4"/> Save Event</Button>
        {saved && <span className="text-xs text-emerald-300">{saved}</span>}
      </div>
    </div>
  )
}
