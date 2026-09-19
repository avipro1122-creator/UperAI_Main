import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const conciergeLeadSchema = z.object({
  whatsapp: z.string().min(8, 'Please enter a valid WhatsApp number').max(20),
  niche: z.string().min(1, 'Please select your niche / format').max(100),
  budget: z.string().min(1, 'Please select your budget').max(100),
  notes: z.string().max(2000).optional().default(''),
  source: z.string().max(100).optional().default('homepage_sticky_bar'),
})

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(ip, 5, 60000) // 5 submissions per minute per IP
    if (!limitCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const parsed = conciergeLeadSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Invalid input'
      return NextResponse.json({ success: false, error: firstError }, { status: 400 })
    }

    const { whatsapp, niche, budget, notes, source } = parsed.data
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Save lead in Firestore
    if (adminDb) {
      try {
        await adminDb.collection('concierge_leads').doc(leadId).set({
          leadId,
          whatsapp,
          niche,
          budget,
          notes,
          source,
          ip,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        })
      } catch (err) {
        console.warn('[Concierge API] Failed saving to Firestore:', err)
      }
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Brief received! We are matching 3 verified editors for your WhatsApp.',
    })
  } catch (error: any) {
    console.error('[Concierge API Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
