"use client"
import { useEffect, useState } from "react"
import { Ticket, Users, IndianRupee, TrendingUp, AlertTriangle } from "lucide-react"
import { passesSeed } from "@/lib/data"
import Link from "next/link"

export default function Dashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  useEffect(() => {
    setBookings(JSON.parse(localStorage.getItem("galaxia_bookings") || "[]"))
  }, [])

  const totalTickets = bookings.reduce((a,b)=>a+(b.qty||0),0)
  const revenue = bookings.reduce((a,b)=>a+(b.total||0),0)
  const byPass: Record<string, number> = {}
  bookings.forEach(b=> { byPass[b.pass] = (byPass[b.pass]||0) + (b.qty||0) })

  const inventory = passesSeed.map(p=>({ name: p.name, capacity: p.capacity, sold: p.sold_count, rem: p.capacity - p.sold_count }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm font-space">Demo mode — using localStorage.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-space text-[var(--text-muted)]">Total Bookings</div>
          <div className="font-sans font-semibold text-3xl mt-1 tabular-nums">{bookings.length}</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">{totalTickets} tickets sold (demo)</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-space text-[var(--text-muted)]">Revenue</div>
          <div className="font-sans font-semibold text-3xl mt-1 tabular-nums flex items-center gap-1"><IndianRupee className="w-6 h-6 text-fest-red-soft" />{revenue.toLocaleString("en-IN")}</div>
          <div className="text-sm text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> All paid (test)</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-space text-[var(--text-muted)]">Inventory</div>
          <div className="font-sans font-semibold text-3xl mt-1 tabular-nums">{inventory.reduce((a,b)=>a+b.rem,0)} <span className="text-sm font-space font-normal text-[var(--text-muted)]">left</span></div>
          <div className="text-sm text-[var(--text-muted)] mt-1">{inventory.reduce((a,b)=>a+b.capacity,0)} capacity</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-space text-[var(--text-muted)]">Sales by Pass</div>
          <div className="space-y-1 mt-2 text-sm font-space">
            {Object.keys(byPass).length===0 ? <span className="text-[var(--text-muted)]">No sales yet</span> : Object.entries(byPass).map(([k,v])=> <div key={k} className="flex justify-between"><span>{k}</span><span className="font-bold">{v}</span></div>)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-sans font-semibold mb-3">Inventory by Tier</h3>
          <div className="space-y-3">
            {inventory.map(i=> (
              <div key={i.name} className="flex items-center gap-3">
                <div className="text-sm font-space w-20">{i.name}</div>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#E5121F]" style={{ width: `${(i.sold/i.capacity)*100}%` }} />
                </div>
                <div className="text-sm font-space text-[var(--text-body)] sm:w-24 sm:text-right">{i.sold}/{i.capacity} • {i.rem} left</div>
                {i.rem<30 && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
              </div>
            ))}
          </div>
          <Link href="/admin/passes" className="mt-3 inline-flex min-h-11 items-center text-sm text-fest-red-soft hover:text-[var(--text-strong)] sm:min-h-0">Manage passes →</Link>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-sans font-semibold mb-3">Recent Bookings</h3>
          {bookings.length===0 ? <div className="text-sm text-[var(--text-muted)]">No bookings yet. Do a test booking on the homepage.</div> : (
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {bookings.slice(0,8).map((b,i)=> (
                <div key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-white/5 pb-2 text-sm font-space sm:flex-nowrap">
                  <span className="font-mono text-fest-red-soft">{b.ref}</span>
                  <span className="text-[var(--text-body)]">{b.name} — {b.pass} ×{b.qty}</span>
                  <span className="text-[var(--text-muted)]">₹{b.total}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/bookings" className="mt-3 inline-flex min-h-11 items-center text-sm text-fest-red-soft hover:text-[var(--text-strong)] sm:min-h-0">View all bookings →</Link>
        </div>
      </div>
    </div>
  )
}
