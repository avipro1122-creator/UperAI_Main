'use client'

import React, { useState } from 'react'
import { X, CheckCircle2, Zap, ShieldCheck, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  editorId?: string
  editorName?: string
  onPaymentSuccess?: (unlockedPhone?: string) => void
}

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

export default function PaywallModal({
  isOpen,
  onClose,
  editorId,
  editorName = 'Editor',
  onPaymentSuccess,
}: PaywallModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCheckout = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Create order via /api/create-order (or /api/paywall/create-order)
      const authHeader = (user as any)?.token ? `Bearer ${(user as any).token}` : ''
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
          'x-user-uid': user?.uid || '',
        },
        body: JSON.stringify({
          amount: 19900,
          currency: 'INR',
          notes: {
            userId: user?.uid || '',
            editorIdToUnlock: editorId || '',
          },
        }),
      })

      const orderData = await orderRes.json()
      const resolvedOrderId = orderData.order_id || orderData.orderId
      if (!orderRes.ok || !resolvedOrderId) {
        throw new Error(orderData.error || 'Failed to initialize payment')
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key_id || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'UperAI',
        description: 'Creator Monthly Pass - Unlimited Contacts',
        order_id: resolvedOrderId,
        prefill: {
          name: user?.displayName || user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#a3e635', // lime-400
        },
        handler: async function (response: any) {
          try {
            setLoading(true)
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-uid': user?.uid || '',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user?.uid || '',
                editorIdToUnlock: editorId,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              onPaymentSuccess?.(verifyData.phone)
              onClose()
            } else {
              setErrorMsg(verifyData.error || 'Payment verification failed.')
            }
          } catch (err: any) {
            setErrorMsg(err.message || 'Error verifying payment.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg(response.error?.description || 'Payment was unsuccessful.')
        setLoading(false)
      })
      rzp.open()
    } catch (err: any) {
      console.error('[Paywall Error]:', err)
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#12131A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition-colors text-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="space-y-2 text-center pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> 1 Free Contact Used
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Unlock Unlimited Editor Contacts
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Directly connect on WhatsApp with <span className="text-white font-bold">{editorName}</span> and every verified editor on UperAI.
          </p>
        </div>

        {/* Plan Pricing Card */}
        <div className="bg-zinc-900/90 border border-lime-400/30 rounded-2xl p-5 space-y-4 relative">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime-400">
                Creator Monthly Pass
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white">₹199</span>
                <span className="text-xs text-zinc-400 font-semibold">/ month</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-lime-400 text-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Popular
            </span>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Perks list */}
          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span><strong>Unlimited</strong> WhatsApp & direct phone access</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-lime-400 shrink-0" />
              <span><strong>0% Commission</strong> – Agree on your own rates</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Direct access to <strong>verified Indian editors</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Full <strong>30-day access</strong> with instant activation</span>
            </li>
          </ul>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800/50 rounded-xl text-xs text-red-300 text-center">
            {errorMsg}
          </div>
        )}

        {/* CTA Button */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 bg-lime-400 hover:bg-lime-300 active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing with Razorpay...</span>
              </>
            ) : (
              <>
                <span>Get Monthly Pass — ₹199</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-zinc-500">
            Secure payment powered by Razorpay • UPI (GPay/PhonePe), Cards & NetBanking
          </p>
        </div>
      </div>
    </div>
  )
}
