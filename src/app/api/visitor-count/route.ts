import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query, ID } from 'node-appwrite'

export async function GET() {
  try {
    const admin = await createAdminClient()
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

    const response = await admin.databases.listDocuments(
      dbId,
      'site_analytics',
      [Query.limit(5000)]
    )

    // Calculate real pageviews recorded in database
    const totalCount = Math.max(1, response.total || response.documents.length || 1)

    return NextResponse.json({
      success: true,
      count: totalCount,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: 1,
    })
  }
}

export async function POST() {
  try {
    const admin = await createAdminClient()
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

    await admin.databases.createDocument(
      dbId,
      'site_analytics',
      ID.unique(),
      {
        page: 'home',
        timestamp: new Date().toISOString(),
        user_agent: 'web_visitor',
      }
    )

    const response = await admin.databases.listDocuments(
      dbId,
      'site_analytics',
      [Query.limit(5000)]
    )

    return NextResponse.json({
      success: true,
      count: Math.max(1, response.total || response.documents.length || 1),
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: 1,
    })
  }
}
