'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface RazorpayCheckoutButtonProps {
  amountPaise?: number // Amount in paise (minimum 100 paise = ₹1.00)
  currency?: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  onSuccess?: (paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  onFailure?: (error: any) => void
  onDismiss?: () => void
  buttonText?: string
  className?: string
  disabled?: boolean
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

export default function RazorpayCheckoutButton({
  amountPaise = 19900,
  currency = 'INR',
  name = 'UperAI',
  description = 'Creator Monthly Pass',
  prefill,
  notes,
  onSuccess,
  onFailure,
  onDismiss,
  buttonText = 'Pay with Razorpay',
  className = '',
  disabled = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // 1. Create order on backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          notes,
        }),
      })

      const orderData = await res.json()
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment order')
      }

      // 2. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.')
      }

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key:
          orderData.key_id ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_live_Tcpv1EI4JhhAJw',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#a3e635', // lime-400
        },
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) {
          try {
            setLoading(true)
            // 4. Verify payment on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            onSuccess?.(response)
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || 'Signature verification error')
            onFailure?.(verifyErr)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            onDismiss?.()
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)

      rzp.on('payment.failed', function (resp: any) {
        const desc = resp.error?.description || 'Payment was unsuccessful'
        setErrorMessage(desc)
        onFailure?.(resp.error)
        setLoading(false)
      })

      rzp.open()
    } catch (err: any) {
      console.error('[Razorpay Checkout Error]:', err)
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      onFailure?.(err)
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={
          className ||
          'w-full py-4 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>{buttonText}</span>
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-red-400 text-center font-medium">{errorMessage}</p>
      )}
    </div>
  )
}
