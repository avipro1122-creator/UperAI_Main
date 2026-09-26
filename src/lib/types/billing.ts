export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'expired'
  | 'canceled'
  | 'past_due'
  | 'halted'
  | 'created'
  | 'inactive'

export type PackageTier = 'free_starter' | 'creator_monthly' | 'creator_pro' | 'enterprise'

export interface PricingPlan {
  id: PackageTier
  name: string
  badge?: string
  popular?: boolean
  priceInr: number
  billingPeriod: 'monthly'
  description: string
  features: string[]
  ctaText: string
  razorpayPlanId?: string
}

export interface UserSubscription {
  id: string
  userId: string
  googleSub?: string | null
  email?: string | null
  packageId: PackageTier
  packageName: string
  status: SubscriptionStatus
  subscriptionStatus: 'free' | 'active' | 'expired'
  subscriptionExpiresAt?: string | null
  unlockedEditorIds?: string[]
  billingFrequency: 'monthly'
  priceInr: number
  currency: 'INR'
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  nextBillingDate?: string | null
  cancelAtCycleEnd: boolean
  canceledAt?: string | null
  razorpaySubscriptionId?: string | null
  razorpayCustomerId?: string | null
  razorpayPlanId?: string | null
  unlockedContactsCount?: number
  freeLimit?: number
  freeRemaining?: number | 'unlimited'
}

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  date: string
  amount: number
  currency: string
  status: 'paid' | 'attempted' | 'failed' | 'issued'
  pdfUrl?: string | null
  hostedUrl?: string | null
  subscriptionId?: string | null
  planName?: string | null
}
