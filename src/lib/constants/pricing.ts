import { PricingPlan } from '@/lib/types/billing'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free_starter',
    name: 'Free Starter',
    priceInr: 0,
    billingPeriod: 'monthly',
    description: 'Perfect for creators exploring editor portfolios and discovering talent.',
    features: [
      '3 Free verified editor contacts',
      'Direct WhatsApp number viewing',
      'Search & filter 100+ editors',
      'Standard community support',
    ],
    ctaText: 'Current Plan',
  },
  {
    id: 'creator_monthly',
    name: 'Creator Monthly Pass',
    badge: 'Popular',
    popular: true,
    priceInr: 199,
    billingPeriod: 'monthly',
    description: 'Direct, unlimited access to WhatsApp & phone numbers of every verified editor.',
    features: [
      'Unlimited WhatsApp & direct phone access',
      '0% Commission – Agree on your own rates',
      'Direct access to all verified Indian editors',
      'Instant 30-day activation & renewal',
      'Priority email & WhatsApp support',
    ],
    ctaText: 'Get Monthly Pass — ₹199',
  },
]
