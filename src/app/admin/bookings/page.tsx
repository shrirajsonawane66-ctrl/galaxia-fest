"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(()=>{ setBookings(JSON.parse(localStorage.getItem("galaxia_bookings")||"[]")) },[])

  const filtered = bookings.filter(b=>{
    const matchQ = !q || `${b.ref} ${b.name} ${b.email} ${b.pass}`.toLowerCase().includes(q.toLowerCase())
    const matchF = filter==="all" || (b.pass||"").toLowerCase().includes(filter)
    return matchQ && matchF
  })

  const exportCSV = () => {
    const rows = [["ref","name","email","phone","college","pass","qty","total","status","at"], ...filtered.map(b=>[b.ref,b.name,b.email,b.phone,b.college,b.pass,b.qty,b.total,b.status,b.at])]
    const csv = rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type:"text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download="galaxia_bookings.csv"; a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron font-black text-2xl">Bookings</h1>
        <p className="text-white/50 text-sm font-space">Search / filter / export. In prod: Supabase + RLS, payment_status, booking_status, etc.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ref, name, email, pass…" className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-400/40" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm">
          <option value="all" className="bg-[#050816]">All passes</option>
          <option value="regular" className="bg-[#050816]">Regular</option>
          <option value="silver" className="bg-[#050816]">Silver</option>
          <option value="gold" className="bg-[#050816]">Gold</option>
        </select>
        <Button variant="outline" className="rounded-full" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs font-space uppercase tracking-widest text-white/40 border-b border-white/10">
              <tr><th className="text-left p-3">Ref</th><th className="text-left p-3">Attendee</th><th className="text-left p-3">Pass</th><th className="text-left p-3">Qty</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="text-left p-3">At</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan={7} className="p-8 text-center text-white/40">No bookings match. Do a test booking on the homepage.</td></tr> : filtered.map((b,i)=> (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="p-3 font-mono text-cyan-300">{b.ref}</td>
                  <td className="p-3"><div className="font-medium">{b.name}</div><div className="text-xs text-white/40">{b.email} • {b.phone}</div><div className="text-xs text-white/30">{b.college}</div></td>
                  <td className="p-3">{b.pass}</td>
                  <td className="p-3">{b.qty}</td>
                  <td className="p-3">₹{b.total}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">{b.status}</span></td>
                  <td className="p-3 text-xs text-white/40">{b.at ? new Date(b.at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-white/30 font-space">{filtered.length} of {bookings.length} shown</div>
    </div>
  )
}
