import { NextRequest, NextResponse } from "next/server"
import { supabaseService, supabaseAnon } from "@/lib/supabase"
import { passesSeed } from "@/lib/data"
import { createOrder } from "@/lib/payment/razorpay"

export async function POST(req: NextRequest) {
  const { passId, quantity } = await req.json()
  if (!passId || !quantity || quantity < 1 || quantity > 6) {
    return NextResponse.json({ error: "Invalid pass or quantity" }, { status: 400 })
  }

  // price integrity: always fetch from DB, never trust client price
  let price = 0
  let capacity = 0
  let sold = 0
  let isActive = true

  const supa = supabaseService || supabaseAnon
  if (supa) {
    const { data, error } = await supa.from("passes").select("price,capacity,sold_count,is_active").eq("id", passId).single()
    if (!error && data) {
      price = data.price
      capacity = data.capacity
      sold = data.sold_count
      isActive = data.is_active
    } else {
      // fallback to seed if not found
      const seed = passesSeed.find(p=>p.id===passId)
      if (!seed) return NextResponse.json({ error: "Pass not found" }, { status: 404 })
      price = seed.price
      capacity = seed.capacity
      sold = seed.sold_count
      isActive = seed.is_active
    }
  } else {
    const seed = passesSeed.find(p=>p.id===passId)
    if (!seed) return NextResponse.json({ error: "Pass not found" }, { status: 404 })
    price = seed.price
    capacity = seed.capacity
    sold = seed.sold_count
    isActive = seed.is_active
  }

  if (!isActive) return NextResponse.json({ error: "Pass inactive" }, { status: 400 })
  if (sold + quantity > capacity) return NextResponse.json({ error: `Only ${capacity - sold} left` }, { status: 400 })

  const amount = price * quantity
  const receipt = `gal_${Date.now()}_${passId}`
  const order = await createOrder(amount * 100, receipt)

  return NextResponse.json({ orderId: order.id, amount, currency: "INR", receipt, pricePerUnit: price })
}
