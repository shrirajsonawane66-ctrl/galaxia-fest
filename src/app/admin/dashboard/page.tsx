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
        <h1 className="font-orbitron font-black text-2xl">Dashboard</h1>
        <p className="text-white/50 text-sm font-space">Live from Supabase (fallback: localStorage demo).</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-space uppercase tracking-widest text-white/40">Total Bookings</div>
          <div className="font-orbitron font-black text-3xl mt-1">{bookings.length}</div>
          <div className="text-xs text-white/30 mt-1">{totalTickets} tickets sold (demo)</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-space uppercase tracking-widest text-white/40">Revenue</div>
          <div className="font-orbitron font-black text-3xl mt-1 flex items-center gap-1"><IndianRupee className="w-6 h-6 text-cyan-300" />{revenue.toLocaleString("en-IN")}</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> All paid (test)</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-space uppercase tracking-widest text-white/40">Inventory</div>
          <div className="font-orbitron font-black text-3xl mt-1">{inventory.reduce((a,b)=>a+b.rem,0)} <span className="text-sm font-space font-normal text-white/40">left</span></div>
          <div className="text-xs text-white/30 mt-1">{inventory.reduce((a,b)=>a+b.capacity,0)} capacity</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-space uppercase tracking-widest text-white/40">Sales by Pass</div>
          <div className="space-y-1 mt-2 text-xs font-space">
            {Object.keys(byPass).length===0 ? <span className="text-white/30">No sales yet</span> : Object.entries(byPass).map(([k,v])=> <div key={k} className="flex justify-between"><span>{k}</span><span className="font-bold">{v}</span></div>)}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-orbitron font-bold mb-3">Inventory by Tier</h3>
          <div className="space-y-3">
            {inventory.map(i=> (
              <div key={i.name} className="flex items-center gap-3">
                <div className="text-xs font-space w-20">{i.name}</div>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${(i.sold/i.capacity)*100}%` }} />
                </div>
                <div className="text-xs font-space text-white/60 w-24 text-right">{i.sold}/{i.capacity} • {i.rem} left</div>
                {i.rem<30 && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              </div>
            ))}
          </div>
          <Link href="/admin/passes" className="text-xs text-cyan-300 hover:text-white mt-3 inline-block">Manage passes →</Link>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-orbitron font-bold mb-3">Recent Bookings</h3>
          {bookings.length===0 ? <div className="text-sm text-white/40">No bookings yet. Do a test booking on the homepage.</div> : (
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {bookings.slice(0,8).map((b,i)=> (
                <div key={i} className="flex items-center justify-between text-xs font-space border-b border-white/5 pb-2">
                  <span className="font-mono text-cyan-300">{b.ref}</span>
                  <span className="text-white/70">{b.name} — {b.pass} ×{b.qty}</span>
                  <span className="text-white/50">₹{b.total}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/bookings" className="text-xs text-cyan-300 hover:text-white mt-3 inline-block">View all bookings →</Link>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-amber-400/20 bg-amber-500/5">
        <h3 className="font-space font-semibold text-amber-200 text-sm">Supabase Setup Required for Production</h3>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">This dashboard reads from <code className="bg-white/10 px-1 rounded">localStorage</code> in demo. Connect Supabase (see <code>.env.example</code> + <code>supabase/migrations</code>) to get live DB, RLS, and Atomic inventory via RPC <code>increment_pass_sold</code>. Admin mutations already check for <code>supabaseService</code> before writing.</p>
      </div>
    </div>
  )
}
