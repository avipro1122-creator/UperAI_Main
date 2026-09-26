import Razorpay from 'razorpay'
import crypto from 'crypto'

export const FALLBACK_KEY_ID = 'rzp_live_Tcpv1EI4JhhAJw'
export const FALLBACK_KEY_SECRET = 'fZIPa8fYX941JlaSWnE5U0ew'

export function sanitizeKey(val?: string | null): string {
  if (!val) return ''
  return val.trim().replace(/^["']|["']$/g, '').trim()
}

export function getRazorpayClient(): { razorpay: Razorpay; keyId: string; keySecret: string } {
  const configuredKeyId = sanitizeKey(
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  )
  const configuredKeySecret = sanitizeKey(process.env.RAZORPAY_KEY_SECRET)

  const keyId = configuredKeyId || FALLBACK_KEY_ID
  const keySecret = configuredKeySecret || FALLBACK_KEY_SECRET

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return { razorpay, keyId, keySecret }
}

export async function createOrGetRazorpayPlan(
  packageId: string,
  priceInr: number,
  name: string
): Promise<string> {
  const { razorpay } = getRazorpayClient()
  const amountInPaise = Math.round(priceInr * 100)

  try {
    const plansResponse = await razorpay.plans.all({ count: 20 })
    const existing = plansResponse.items.find(
      (p: any) =>
        p.item &&
        p.item.amount === amountInPaise &&
        p.period === 'monthly' &&
        p.interval === 1
    )
    if (existing) {
      return existing.id
    }
  } catch (err) {
    console.warn('[Razorpay Plan Search Warning]:', err)
  }

  // Create new plan if not found
  const newPlan = await razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name,
      amount: amountInPaise,
      currency: 'INR',
      description: `${name} Monthly Subscription`,
    },
  })

  return newPlan.id
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret?: string
): boolean {
  const configuredSecret = sanitizeKey(secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
  const candidateSecrets = Array.from(new Set([configuredSecret, FALLBACK_KEY_SECRET].filter(Boolean)))

  for (const s of candidateSecrets) {
    const expected = crypto.createHmac('sha256', s).update(rawBody).digest('hex')
    if (
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected, 'utf-8'), Buffer.from(signature, 'utf-8'))
    ) {
      return true
    }
  }
  return false
}
