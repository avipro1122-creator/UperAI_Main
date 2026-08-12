import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { Query, Permission, Role } from 'node-appwrite'
import { z } from 'zod'

const switchRoleSchema = z.object({
  role: z.enum(['editor', 'creator']),
})

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(ip, 20, 60000)
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    if (!isAppwriteConfigured()) {
      return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
    }

    const { account } = await createSessionClient(request)
    const user = await account.get()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to complete onboarding' }, { status: 401 })
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

    const targetRole = parsed.data.role
    const admin = await createAdminClient()

    const documentPermissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]

    const handle = user.name ? user.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) : user.$id

    try {
      await admin.databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        user.$id,
        { role: targetRole }
      )
    } catch {
      await admin.databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        user.$id,
        {
          name: user.name || 'User',
          handle,
          role: targetRole,
          last_active_at: new Date().toISOString(),
        },
        documentPermissions
      )
    }

    revalidatePath('/', 'layout')
    revalidatePath('/onboarding')
    revalidatePath('/onboarding/editor')
    revalidatePath('/editors')

    if (targetRole === 'creator') {
      return NextResponse.json({ redirect: '/editors' })
    }

    const itemsRes = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.portfolio_items,
      [Query.equal('editor_id', user.$id)]
    )

    if (itemsRes.documents.length === 0) {
      return NextResponse.json({ redirect: '/onboarding/editor' })
    }

    return NextResponse.json({
      redirect: `/editors/${user.$id}`,
    })
  } catch (err: any) {
    console.error('[switch-role] Error:', err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
