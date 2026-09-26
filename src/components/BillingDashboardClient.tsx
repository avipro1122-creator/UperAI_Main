'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Sparkles,
  ArrowRight,
  Download,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  X,
  Calendar,
  Clock,
  Check,
  Loader2,
  FileText,
  BadgeAlert,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { PRICING_PLANS } from '@/lib/constants/pricing'
import { UserSubscription, InvoiceItem, PackageTier } from '@/lib/types/billing'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).Razorpay) return resolve(true)

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingDashboardClient() {
  const { user, rawUser, loginWithGoogle } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const googleSub =
    rawUser?.providerData?.find((p) => p.providerId === 'google.com')?.uid ||
    (rawUser as any)?.reloadUserInfo?.localId ||
    user?.uid ||
    ''

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 5000)
  }

  // Fetch subscription & invoices
  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const headers: Record<string, string> = {
        'x-user-uid': user.uid,
        ...(googleSub ? { 'x-google-sub': googleSub } : {}),
      }

      // 1. Fetch Subscription
      const subRes = await fetch('/api/billing/subscription', { headers })
      const subData = await subRes.json()
      if (subRes.ok && subData.subscription) {
        setSubscription(subData.subscription)
      }

      // 2. Fetch Invoices
      const invRes = await fetch('/api/billing/invoices', { headers })
      const invData = await invRes.json()
      if (invRes.ok && invData.invoices) {
        setInvoices(invData.invoices)
      }
    } catch (err) {
      console.error('[Billing UI] Fetch error:', err)
      showToast('Failed to load billing information', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.uid, googleSub])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle Upgrade or Subscribe click
  const handleUpgrade = async (packageId: PackageTier) => {
    if (!user) {
      loginWithGoogle()
      return
    }

    setActionLoading(packageId)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          packageId,
          googleSub,
          userId: user.uid,
        }),
      })

      const checkoutData = await res.json()
      if (!res.ok || (!checkoutData.subscriptionId && !checkoutData.orderId)) {
        throw new Error(checkoutData.error || 'Failed to initialize payment')
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Razorpay Checkout failed to load. Please check your connection.')
      }

      const options: any = {
        key: checkoutData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tcpv1EI4JhhAJw',
        amount: checkoutData.amount,
        currency: checkoutData.currency || 'INR',
        name: 'UperAI',
        description: `${checkoutData.packageName} - Unlimited Contacts`,
        prefill: {
          name: user.displayName || user.name || '',
          email: user.email || '',
        },
        theme: { color: '#a3e635' },
        modal: {
          ondismiss: function () {
            setActionLoading(null)
          },
        },
        handler: async function (response: any) {
          try {
            setActionLoading('verifying')
            const verifyRes = await fetch('/api/billing/verify-checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-uid': user.uid,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || checkoutData.orderId,
                razorpay_subscription_id: response.razorpay_subscription_id || checkoutData.subscriptionId,
                razorpay_signature: response.razorpay_signature,
                packageId,
                userId: user.uid,
                googleSub,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              showToast(`🎉 Activated ${checkoutData.packageName}!`, 'success')
              await fetchData()
            } else {
              showToast(verifyData.error || 'Payment verification failed', 'error')
            }
          } catch (err: any) {
            showToast(err.message || 'Error verifying payment', 'error')
          } finally {
            setActionLoading(null)
          }
        },
      }

      // Prioritize order_id for standard checkout (UPI/cards)
      if (checkoutData.orderId) {
        options.order_id = checkoutData.orderId
      } else if (checkoutData.subscriptionId) {
        options.subscription_id = checkoutData.subscriptionId
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (errResp: any) {
        showToast(errResp.error?.description || 'Payment was unsuccessful', 'error')
        setActionLoading(null)
      })
      rzp.open()
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error')
      setActionLoading(null)
    }
  }

  // Handle Cancel Subscription
  const handleCancelSubscription = async () => {
    setActionLoading('canceling')
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user?.uid || '',
          ...(googleSub ? { 'x-google-sub': googleSub } : {}),
        },
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast('Subscription scheduled for cancellation at cycle end.', 'success')
        setIsCancelModalOpen(false)
        await fetchData()
      } else {
        showToast(data.error || 'Failed to cancel subscription', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel subscription', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Reactivate / Resume
  const handleReactivate = async () => {
    setActionLoading('reactivating')
    try {
      const res = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user?.uid || '',
          ...(googleSub ? { 'x-google-sub': googleSub } : {}),
        },
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast('Subscription reactivated successfully!', 'success')
        await fetchData()
      } else {
        showToast(data.error || 'Failed to reactivate subscription', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reactivate subscription', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const currentPlanId = subscription?.packageId || 'free_starter'
  const isCanceledPending = Boolean(subscription?.cancelAtCycleEnd)
  const isPaidActive = subscription && subscription.priceInr > 0 && subscription.status === 'active'

  const formattedPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  if (!user && !loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <CreditCard className="w-8 h-8 text-lime-400" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">
          Billing & Subscriptions
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mb-8">
          Sign in with your Google account to manage active passes, view invoice history, and upgrade your creator tier.
        </p>
        <button
          onClick={loginWithGoogle}
          className="px-8 py-3.5 bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-extrabold text-sm rounded-xl transition-all shadow-xl flex items-center gap-2"
        >
          <span>Sign In with Google</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-[120] px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-2xl transition-all border animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-3 ${
            toastMsg.type === 'success'
              ? 'bg-zinc-900 text-lime-400 border-lime-500/40 shadow-lime-950/40'
              : 'bg-zinc-900 text-red-400 border-red-500/40 shadow-red-950/40'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[11px] font-semibold text-zinc-400 mb-3">
            <CreditCard className="w-3.5 h-3.5 text-lime-400" />
            <span>Settings &bull; Billing & Subscription Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            Plans & Billing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your subscription status, explore package upgrades, and download past tax invoices.
          </p>
        </div>

        {/* Authenticated Google Account Badge */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt={user.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-lime-400 text-black font-black flex items-center justify-center text-xs">
                {user.name?.[0] || 'U'}
              </div>
            )}
            <div className="text-left text-xs">
              <div className="font-bold text-white truncate max-w-[180px]">{user.name || user.email}</div>
              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span>Google ID:</span>
                <span className="font-mono text-zinc-400">{googleSub ? `${googleSub.slice(0, 10)}...` : 'Linked'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: CURRENT ACTIVE PACKAGE CARD */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime-400" /> Current Subscription & Access
        </h2>

        <div className="relative bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
              <span className="text-xs font-semibold">Loading subscription status...</span>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              {/* Top row: Plan title + Status Badge + Price */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {subscription?.packageName || 'Free Starter'}
                    </h3>

                    {/* Status Pill */}
                    {isCanceledPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" /> Pending Cancellation
                      </span>
                    ) : subscription?.status === 'active' && subscription.priceInr > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-lime-400/15 text-lime-400 border border-lime-400/30 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" /> Active
                      </span>
                    ) : subscription?.status === 'past_due' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <BadgeAlert className="w-3.5 h-3.5" /> Past Due
                      </span>
                    ) : subscription?.status === 'halted' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        <X className="w-3.5 h-3.5" /> Halted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-white/10">
                        Free Tier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    {isPaidActive
                      ? 'You have unlimited access to verified editors with 0% platform commission and direct WhatsApp connections.'
                      : 'You are on the Free Starter plan with 3 direct editor contacts. Upgrade anytime to unlock unlimited connections.'}
                  </p>
                </div>

                {/* Price Display */}
                <div className="text-left sm:text-right shrink-0 bg-white/[0.03] sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-0">
                  <div className="flex items-baseline sm:justify-end gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      ₹{subscription?.priceInr || 0}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">/ month</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mt-0.5">
                    {subscription?.billingFrequency || 'Monthly'} Billing
                  </span>
                </div>
              </div>

              {/* Status Banner for cancel_at_cycle_end */}
              {isCanceledPending && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        Access remains fully active until {formattedPeriodEnd}
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        Your subscription will not renew automatically. You can reactivate anytime before your period ends.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReactivate}
                    disabled={actionLoading === 'reactivating'}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === 'reactivating' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Reactivate Subscription</span>
                  </button>
                </div>
              )}

              {/* Meta Grid & Action Buttons */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
                  {formattedPeriodEnd && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <span>
                        {isCanceledPending ? 'Expires on:' : 'Next billing date:'}{' '}
                        <strong className="text-white font-semibold">{formattedPeriodEnd}</strong>
                      </span>
                    </div>
                  )}

                  {subscription?.razorpaySubscriptionId && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-zinc-500" />
                      <span>
                        Sub ID:{' '}
                        <code className="text-zinc-300 font-mono text-[11px]">
                          {subscription.razorpaySubscriptionId}
                        </code>
                      </span>
                    </div>
                  )}
                </div>

                {/* Self-serve cancel action */}
                {isPaidActive && !isCanceledPending && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-semibold underline underline-offset-4 text-left sm:text-right"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: CREATOR MONTHLY PASS TIER */}
      <section className="space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-center sm:justify-start gap-2">
            <Zap className="w-3.5 h-3.5 text-lime-400" /> Creator Pass Upgrade
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Unlock unlimited direct WhatsApp and phone access to every verified video editor on UperAI.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {PRICING_PLANS.filter((p) => p.id !== 'free_starter').map((plan) => {
            const isCurrent = currentPlanId === plan.id && isPaidActive && !isCanceledPending
            const isUpgrading = actionLoading === plan.id

            return (
              <div
                key={plan.id}
                className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-zinc-900/90 border border-lime-400/50 shadow-[0_0_40px_rgba(163,230,53,0.12)] space-y-6"
              >
                {/* Popular Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-lime-400 text-black font-black text-[10px] uppercase tracking-wider rounded-full shadow-lg">
                  Popular &bull; Full Access
                </div>

                <div className="space-y-4">
                  {/* Title & Description */}
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">₹{plan.priceInr}</span>
                    <span className="text-sm text-zinc-400 font-semibold">/ month</span>
                  </div>

                  <div className="h-px bg-white/[0.08]" />

                  {/* Features list */}
                  <ul className="space-y-3 text-xs text-zinc-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                <div className="space-y-3 pt-2">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-4 bg-zinc-800 text-zinc-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl cursor-default flex items-center justify-center gap-2 border border-white/5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-lime-400" />
                      <span>Current Plan &bull; Active</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={Boolean(actionLoading)}
                      className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-[0.99] bg-lime-400 hover:bg-lime-300 text-black"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening Checkout...</span>
                        </>
                      ) : (
                        <>
                          <span>{plan.ctaText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-[11px] text-center text-zinc-500">
                    Secure payment powered by Razorpay &bull; UPI (GPay/PhonePe), Cards & NetBanking
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 3: PAYMENT & INVOICE HISTORY TABLE */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-lime-400" /> Payment & Tax Invoices
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Official Razorpay invoices and payment receipts for your tax accounting records.
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-400">No payment invoices found yet</p>
              <p className="text-[11px] text-zinc-600">
                Invoices generated from your Razorpay passes and subscriptions will appear here with direct PDF download links.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-4 px-6">Invoice ID</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Plan</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Invoice Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono text-[11px] font-semibold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-6 text-zinc-400">
                        {new Date(inv.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 font-medium text-white">{inv.planName || 'Monthly Pass'}</td>
                      <td className="py-4 px-6 font-extrabold text-white">₹{inv.amount}</td>
                      <td className="py-4 px-6">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-lime-500/10 text-lime-400 font-bold rounded-full text-[10px] border border-lime-500/25">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : inv.status === 'attempted' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 font-bold rounded-full text-[10px] border border-amber-500/25">
                            Attempted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-400 font-bold rounded-full text-[10px] border border-red-500/25">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {inv.pdfUrl ? (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] transition-colors shadow-sm"
                          >
                            <span>Download PDF</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* CONFIRMATION MODAL: CANCEL SUBSCRIPTION */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#12131A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Cancel Subscription
                </h3>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Are you sure you want to cancel your{' '}
                <strong className="text-white">{subscription?.packageName}</strong>?
              </p>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Access remains active until:</span>
                  <strong className="text-lime-400 font-bold">{formattedPeriodEnd}</strong>
                </div>
                <div className="h-px bg-white/5" />
                <p className="text-[11px] text-zinc-400">
                  You will keep unlimited editor access, WhatsApp numbers, and verified features until your billing cycle ends on {formattedPeriodEnd}.
                </p>
              </div>
              <p className="text-zinc-500 text-[11px]">
                After this date, your account will return to the Free Starter tier (3 contacts limit).
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Keep My Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'canceling'}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40"
              >
                {actionLoading === 'canceling' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
