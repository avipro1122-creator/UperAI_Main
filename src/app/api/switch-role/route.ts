import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/firebase/client'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const switchRoleSchema = z.object({
  role: z.enum(['editor', 'creator', 'EDITOR', 'CREATOR']),
  uid: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(ip, 20, 60000)
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let jsonBody: any
    try {
      jsonBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = switchRoleSchema.safeParse(jsonBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid role selection' }, { status: 400 })
    }

    const targetRole = parsed.data.role.toUpperCase()
    const uid = parsed.data.uid || request.headers.get('x-user-uid')

    if (uid) {
      const userRef = doc(db, 'users', uid)
      await setDoc(userRef, { role: targetRole, updatedAt: new Date().toISOString() }, { merge: true })
    }

    revalidatePath('/')
    revalidatePath('/editors')

    return NextResponse.json({ ok: true, role: targetRole })
  } catch (err: any) {
    console.error('Role switch error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
