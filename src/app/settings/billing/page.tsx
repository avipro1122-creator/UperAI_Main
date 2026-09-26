import { Metadata } from 'next'
import BillingDashboardClient from '@/components/BillingDashboardClient'

export const metadata: Metadata = {
  title: 'Billing & Subscriptions | UperAI',
  description: 'Manage your creator subscription, browse package upgrades, and view past Razorpay tax invoices.',
}

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white pt-20 pb-16">
      <BillingDashboardClient />
    </main>
  )
}
