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
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Bookings</h1>
        <p className="text-[var(--text-muted)] text-sm font-space">Search / filter / export. Demo mode — localStorage.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ref, name, email, pass…" className="min-h-11 w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#F4EDE0]/50 md:min-h-0" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="min-h-11 w-full rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm md:min-h-0 md:w-auto">
          <option value="all" className="bg-[#050816]">All passes</option>
          <option value="regular" className="bg-[#050816]">Regular</option>
          <option value="silver" className="bg-[#050816]">Silver</option>
          <option value="gold" className="bg-[#050816]">Gold</option>
        </select>
        <Button variant="outline" className="min-h-11 w-full justify-center rounded-full md:min-h-0 md:w-auto" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-sm font-space text-[var(--text-muted)] border-b border-white/10">
              <tr><th className="text-left p-3">Ref</th><th className="text-left p-3">Attendee</th><th className="text-left p-3">Pass</th><th className="text-left p-3">Qty</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="text-left p-3">At</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No bookings match. Do a test booking on the homepage.</td></tr> : filtered.map((b,i)=> (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="p-3 font-mono text-fest-red-soft">{b.ref}</td>
                  <td className="p-3"><div className="font-medium">{b.name}</div><div className="text-sm text-[var(--text-muted)]">{b.email} • {b.phone}</div><div className="text-sm text-[var(--text-muted)]">{b.college}</div></td>
                  <td className="p-3">{b.pass}</td>
                  <td className="p-3">{b.qty}</td>
                  <td className="p-3">₹{b.total}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">{b.status}</span></td>
                  <td className="p-3 text-sm text-[var(--text-muted)]">{b.at ? new Date(b.at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-sm text-[var(--text-muted)] font-space">{filtered.length} of {bookings.length} shown</div>
    </div>
  )
}
