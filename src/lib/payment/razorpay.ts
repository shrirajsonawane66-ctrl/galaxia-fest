import Razorpay from "razorpay"

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return null
  return new Razorpay({ key_id, key_secret })
}

export async function createOrder(amountPaisa: number, receipt: string, currency = "INR") {
  const rp = getRazorpay()
  if (!rp) {
    // mock for dev without keys
    return { id: "order_mock_" + receipt, amount: amountPaisa, currency, receipt, status: "created" }
  }
  return await rp.orders.create({ amount: amountPaisa, currency, receipt })
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET || ""
  if (!secret) return true // mock pass in dev
  const crypto = require("crypto")
  const expected = crypto.createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex")
  return expected === signature
}
