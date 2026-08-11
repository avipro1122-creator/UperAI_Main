import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query } from 'node-appwrite'

export async function POST(request: Request) {
  try {
    if (!isAppwriteConfigured()) {
      return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
    }

    const { account } = await createSessionClient()
    const user = await account.get()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to complete onboarding' }, { status: 401 })
    }

    let targetRole: 'editor' | 'creator'
    try {
      const body = await request.json()
      if (body.role !== 'editor' && body.role !== 'creator') {
        return NextResponse.json({ error: 'Invalid role selection' }, { status: 400 })
      }
      targetRole = body.role
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Update user document role attribute
    try {
      await admin.databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        user.$id,
        { role: targetRole }
      )
    } catch {
      // Create user document if it doesn't exist
      await admin.databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        user.$id,
        {
          name: user.name || 'User',
          handle: user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : user.$id,
          role: targetRole,
          last_active_at: new Date().toISOString(),
        }
      )
    }

    revalidatePath('/', 'layout')
    revalidatePath('/onboarding')
    revalidatePath('/onboarding/editor')
    revalidatePath('/editors')

    if (targetRole === 'creator') {
      return NextResponse.json({ redirect: '/editors' })
    }

    // Check portfolio items for editor
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
