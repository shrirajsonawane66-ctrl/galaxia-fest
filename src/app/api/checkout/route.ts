import { NextRequest, NextResponse } from "next/server"
import { passesSeed } from "@/lib/data"
import { createOrder } from "@/lib/payment/razorpay"

export async function POST(req: NextRequest) {
  const { passId, quantity } = await req.json()
  if (!passId || !quantity || quantity < 1 || quantity > 6) {
    return NextResponse.json({ error: "Invalid pass or quantity" }, { status: 400 })
  }

  // price integrity: always fetch from seed data, never trust client price
  const pass = passesSeed.find(p => p.id === passId)
  if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 })

  const price = pass.price
  const capacity = pass.capacity
  const sold = pass.sold_count
  const isActive = pass.is_active

  if (!isActive) return NextResponse.json({ error: "Pass inactive" }, { status: 400 })
  if (sold + quantity > capacity) return NextResponse.json({ error: `Only ${capacity - sold} left` }, { status: 400 })

  const amount = price * quantity
  const receipt = `gal_${Date.now()}_${passId}`
  const order = await createOrder(amount * 100, receipt)

  return NextResponse.json({ orderId: order.id, amount, currency: "INR", receipt, pricePerUnit: price })
}