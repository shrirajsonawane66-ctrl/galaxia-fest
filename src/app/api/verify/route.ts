import { NextRequest, NextResponse } from "next/server"
import { verifySignature } from "@/lib/payment/razorpay"
import { genRef } from "@/lib/utils"

type BookingRequest = {
  passId: string
  quantity: number
  name: string
  email: string
  phone: string
  college?: string
  collegeId?: string
  unitPrice?: number
}

type StoredBooking = {
  booking_reference: string
  event_id: string
  customer_name: string
  email: string
  phone: string
  college_name?: string
  college_id: string | null
  total: number
  currency: string
  payment_status: string
  booking_status: string
  created_at: string
  id: string
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
  const booking = body.booking as BookingRequest | undefined

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 })
  }

  const ok = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!ok) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 })

  const bookingRef = genRef()
  let stored: StoredBooking | null = null

  if (booking) {
    // Check capacity using passesSeed data
    const { passesSeed } = await import("@/lib/data")
    const pass = passesSeed.find(p => p.id === booking.passId)
    const unitPrice = pass?.price || booking.unitPrice || 0
    if (pass && pass.sold_count + booking.quantity > pass.capacity) {
      return NextResponse.json({ error: "Sold out during payment" }, { status: 409 })
    }

    // The browser persists the confirmed booking in localStorage; this route
    // only owns signature verification and the capacity check.
    stored = {
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
  }

  return NextResponse.json({ success: true, bookingRef, booking: stored })
}