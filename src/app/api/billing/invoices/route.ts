import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayClient } from '@/lib/razorpay/client'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { InvoiceItem } from '@/lib/types/billing'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const xUid = req.headers.get('x-user-uid')
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/uperai_auth=([^;]+)/)
    const userId = xUid || (match ? match[1] : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { razorpay } = getRazorpayClient()
    const invoices: InvoiceItem[] = []

    // 1. Fetch invoices directly via Razorpay Invoices API
    try {
      const rzpInvoices: any = await razorpay.invoices.all({ count: 30 })
      if (rzpInvoices && rzpInvoices.items) {
        for (const item of rzpInvoices.items) {
          // If invoice belongs to this user or matches notes/customer
          const notes = item.notes || {}
          const belongsToUser =
            notes.userId === userId ||
            item.customer_details?.email === notes.email

          // Include if matches or if customer has this subscription
          if (belongsToUser || !notes.userId) {
            const rawStatus = (item.status || 'issued').toLowerCase()
            let status: 'paid' | 'attempted' | 'failed' | 'issued' = 'issued'
            if (rawStatus === 'paid') status = 'paid'
            else if (rawStatus === 'expired' || rawStatus === 'cancelled') status = 'failed'
            else if (rawStatus === 'attempted') status = 'attempted'

            const amountInr = (item.amount || item.gross_amount || 0) / 100
            const dateStr = item.date || item.issued_at || item.created_at
              ? new Date((item.date || item.issued_at || item.created_at) * 1000).toISOString()
              : new Date().toISOString()

            invoices.push({
              id: item.id,
              invoiceNumber: item.invoice_number || item.receipt || item.id,
              date: dateStr,
              amount: amountInr || 199,
              currency: item.currency || 'INR',
              status,
              pdfUrl: item.short_url || `https://dashboard.razorpay.com/app/invoices/${item.id}`,
              hostedUrl: item.short_url,
              subscriptionId: item.subscription_id,
              planName: notes.packageName || 'Monthly Pass',
            })
          }
        }
      }
    } catch (rzpErr) {
      console.warn('[Razorpay Invoices fetch warning]:', rzpErr)
    }

    // 2. Supplement with Firestore payments audit log if needed
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
      const snap = await getDocs(q)
      for (const d of snap.docs) {
        const p = d.data()
        // If not already in invoices array
        if (!invoices.some((inv) => inv.id === p.orderId || inv.id === p.paymentId)) {
          invoices.push({
            id: p.paymentId || p.orderId || d.id,
            invoiceNumber: p.receipt || `RCPT-${(p.orderId || d.id).slice(-8).toUpperCase()}`,
            date: p.createdAt || new Date().toISOString(),
            amount: p.amountInr || Number(process.env.MONTHLY_PASS_PRICE_INR || 199),
            currency: p.currency || 'INR',
            status: 'paid',
            pdfUrl: `https://dashboard.razorpay.com/app/payments/${p.paymentId || p.orderId}`,
            hostedUrl: null,
            subscriptionId: p.subscriptionId || null,
            planName: p.plan === 'pro' ? 'Creator Pro' : 'Creator Monthly Pass',
          })
        }
      }
    } catch (dbErr) {
      console.warn('[Firestore payments audit read warning]:', dbErr)
    }

    // Sort by date descending
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      invoices,
    })
  } catch (err: any) {
    console.error('[Get Invoices API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
