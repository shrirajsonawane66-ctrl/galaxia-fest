"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Ticket, Calendar, MapPin, User, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { eventSeed } from "@/lib/data"
import Link from "next/link"

function SuccessInner() {
  const params = useSearchParams()
  const refParam = params.get("ref")
  const [data, setData] = useState<any>(null)
  const [qr, setQr] = useState<string>("")

  useEffect(() => {
    const bookings = JSON.parse(localStorage.getItem("galaxia_bookings") || "[]")
    const found = bookings.find((b: any) => b.ref === refParam) || bookings[0]
    if (found) {
      setData(found)
      // generate QR as data URL via simple canvas fallback if qrcode not available client side
      import("qrcode").then(QR => {
        QR.toDataURL(found.ref, { width: 220, margin: 1, color: { dark: "#ffffff", light: "#050816" } }).then(setQr).catch(()=>{})
      }).catch(()=>{})
    }
  }, [refParam])

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <Ticket className="w-10 h-10 mx-auto text-white/40 mb-4" />
          <h1 className="font-orbitron font-black text-xl mb-2">No ticket found</h1>
          <p className="text-white/60 text-sm mb-6">Book a pass to get your GAL-XXXXXX reference.</p>
          <Link href="/#passes"><Button variant="galaxy" className="rounded-full">Browse Passes</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-6">
      <div className="noise fixed inset-0 pointer-events-none opacity-20" />
      <div className="relative w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-space uppercase tracking-widest text-cyan-300">Booking Confirmed</div>
          <h1 className="font-orbitron font-black text-3xl mt-3">GALAXIA <span className="text-gradient-galaxy">Ticket</span></h1>
          <p className="text-white/50 text-sm mt-2">{eventSeed.college_name} • {eventSeed.date}</p>
        </div>

        <div className="glass rounded-3xl overflow-hidden border border-white/10">
          <div className="h-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400" />
          <div className="p-8 space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="text-xs font-space uppercase tracking-[0.3em] text-white/40">Booking Reference</div>
                <div className="font-mono font-black text-2xl tracking-[0.2em] text-cyan-300 mt-1">{data.ref}</div>
                <div className="text-xs font-space text-white/50 mt-1">{data.pass} × {data.qty} • ₹{data.total}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-white/70"><User className="w-4 h-4 text-white/40" /> {data.name}</div>
                  <div className="flex items-center gap-2 text-white/70"><Mail className="w-4 h-4 text-white/40" /> {data.email}</div>
                  <div className="flex items-center gap-2 text-white/70"><Phone className="w-4 h-4 text-white/40" /> {data.phone}</div>
                  <div className="flex items-center gap-2 text-white/70"><Calendar className="w-4 h-4 text-white/40" /> {eventSeed.date}</div>
                  <div className="col-span-2 flex items-center gap-2 text-white/70"><MapPin className="w-4 h-4 text-white/40" /> {eventSeed.venue}</div>
                </div>
              </div>
              <div className="w-36 h-36 rounded-2xl bg-[#050816] border border-white/10 p-2 flex items-center justify-center shrink-0">
                {qr ? <img src={qr} alt="QR" className="w-full h-full rounded-xl" /> : <div className="text-[10px] text-white/30">QR {data.ref}</div>}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs font-space">
              <span className="text-white/40">Payment • Razorpay Test • PAID</span>
              <span className="text-white/40">Valid for entry — show QR</span>
            </div>
          </div>
          <div className="bg-white text-[#050816] px-8 py-4 flex items-center justify-between">
            <span className="font-space text-xs uppercase tracking-widest opacity-60">Western College of Business Management</span>
            <Ticket className="w-5 h-5 opacity-40" />
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <Link href="/"><Button variant="outline" className="rounded-full">Back Home</Button></Link>
          <Button className="rounded-full bg-white text-[#050816]" onClick={() => window.print()}>Print Ticket</Button>
        </div>
        <p className="text-center text-[11px] font-space text-white/30 mt-4">This ticket was generated in test-mode. Server verification via /api/verify would happen in production.</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#050816] flex items-center justify-center text-white/50">Loading ticket…</div>}><SuccessInner /></Suspense>
}
