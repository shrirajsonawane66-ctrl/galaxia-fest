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
      <div className="flex min-h-[100svh] items-center justify-center p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
          <Ticket className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)]">No ticket found</h1>
          <p className="type-body mb-6 mt-2">Book a pass to get your GAL-XXXXXX reference.</p>
          <Link href="/#passes"><Button variant="galaxy" className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto">Browse passes</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[var(--text-body)] sm:p-6">
      <div className="noise fixed inset-0 pointer-events-none opacity-20" />
      <div className="relative w-full max-w-xl">
        <div className="mb-6 text-center">
          <div className="type-small inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[var(--text-strong)]">Booking confirmed</div>
          <h1 className="type-h2 mt-3">Galaxia ticket</h1>
          <p className="type-small mt-2">{eventSeed.college_name} • {eventSeed.date}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="h-2 bg-[#E5121F]" />
          <div className="space-y-6 p-5 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="min-w-0 flex-1">
                <div className="type-small">Booking reference</div>
                <div className="mt-1 break-words font-mono text-2xl font-bold tracking-[0.12em] text-[var(--accent)]">{data.ref}</div>
                <div className="type-small mt-1">{data.pass} × {data.qty} • ₹{data.total}</div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-base sm:grid-cols-2 sm:text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-body)]"><User className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> <span className="min-w-0 break-words">{data.name}</span></div>
                  <div className="flex items-center gap-2 text-[var(--text-body)]"><Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> <span className="min-w-0 break-words">{data.email}</span></div>
                  <div className="flex items-center gap-2 text-[var(--text-body)]"><Phone className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> {data.phone}</div>
                  <div className="flex items-center gap-2 text-[var(--text-body)]"><Calendar className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> {eventSeed.date}</div>
                  <div className="flex items-center gap-2 text-[var(--text-body)] sm:col-span-2"><MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> {eventSeed.venue}</div>
                </div>
              </div>
              <div className="mx-auto flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#050816] p-2 sm:mx-0">
                {qr ? <img src={qr} alt="QR" className="h-full w-full rounded-xl" /> : <div className="text-[13px] text-[var(--text-muted)]">QR {data.ref}</div>}
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-white/10 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[var(--text-muted)]">Payment • Razorpay test • Paid</span>
              <span className="text-[var(--text-muted)]">Valid for entry — show QR</span>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2 bg-[#F4EDE0] px-5 py-4 text-[#050816] sm:items-center sm:px-8">
            <span className="text-sm opacity-70">Western College of Business Management</span>
            <Ticket className="h-5 w-5 shrink-0 opacity-40" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="w-full sm:w-auto"><Button variant="outline" className="min-h-11 w-full rounded-full sm:min-h-0">Back home</Button></Link>
          <Button className="min-h-11 w-full rounded-full bg-[#F4EDE0] text-[#050816] sm:min-h-0 sm:w-auto" onClick={() => window.print()}>Print ticket</Button>
        </div>
        <p className="type-small mt-4 text-center">This ticket was generated in test-mode. Server verification via /api/verify would happen in production.</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="flex min-h-[100svh] items-center justify-center text-[var(--text-muted)]">Loading ticket…</div>}><SuccessInner /></Suspense>
}
