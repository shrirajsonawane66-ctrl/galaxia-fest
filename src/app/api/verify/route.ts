import { NextRequest, NextResponse } from "next/server"
import { verifySignature } from "@/lib/payment/razorpay"
import { genRef } from "@/lib/utils"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = body
  // booking: { passId, quantity, name, email, phone, college, collegeId }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 })
  }

  const ok = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!ok) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 })

  const bookingRef = genRef()
  let stored = null

  if (booking) {
    try {
      // Check capacity using passesSeed data
      const { passesSeed } = await import("@/lib/data")
      const pass = passesSeed.find(p => p.id === booking.passId)
      const unitPrice = pass?.price || booking.unitPrice || 0
      if (pass && pass.sold_count + booking.quantity > pass.capacity) {
        return NextResponse.json({ error: "Sold out during payment" }, { status: 409 })
      }
      const bk = {
        booking_reference: bookingRef,
        event_id: "galaxia-2025",
        customer_name: booking.name,
        email: booking.email,
        phone: booking.phone,
        college_name: booking.college,
        college_id: booking.collegeId || null,
        total: unitPrice * booking.quantity,
        currency: "INR",
        payment_status: "paid",
        booking_status: "confirmed",
        created_at: new Date().toISOString(),
        id: "bk_" + Date.now(),
      }
      stored = bk

      // Save to localStorage for demo
      const bookings = JSON.parse(localStorage.getItem("galaxia_bookings") || "[]")
      bookings.push({
        ref: bookingRef,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        college: booking.college,
        pass: booking.passId,
        qty: booking.quantity,
        total: unitPrice * booking.quantity,
        status: "confirmed",
        at: new Date().toISOString(),
      })
      localStorage.setItem("galaxia_bookings", JSON.stringify(bookings))

      // Update sold_count in localStorage (demo persistence)
      const passes = JSON.parse(localStorage.getItem("galaxia_passes") || "[]")
      const passIndex = passes.findIndex((p: any) => p.id === booking.passId)
      if (passIndex >= 0) {
        passes[passIndex].sold_count += booking.quantity
        localStorage.setItem("galaxia_passes", JSON.stringify(passes))
      }
    } catch (e: any) {
      stored = { booking_reference: bookingRef, mocked: true, error: e.message }
    }
  }

  return NextResponse.json({ success: true, bookingRef, booking: stored })
}