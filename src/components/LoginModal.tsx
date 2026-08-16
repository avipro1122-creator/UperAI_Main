'use client'

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { LogoMark } from '@/components/Logo'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '120227432324-4366g11qtufcuipj56aneknrtmsreucm.apps.googleusercontent.com'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user } = useAuth()
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && isOpen) {
      onClose()
    }
  }, [user, isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const renderGoogleBtn = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleBtnRef.current) {
        try {
          ;(window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          })
          // Also trigger One Tap prompt in page
          ;(window as any).google.accounts.id.prompt()
        } catch (err) {
          console.warn('[LoginModal] Failed to render Google button:', err)
        }
      }
    }

    const timer = setTimeout(renderGoogleBtn, 300)
    return () => clearTimeout(timer)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#14161F]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="space-y-2 flex flex-col items-center">
          <LogoMark className="w-12 h-12" />
          <h2 className="text-2xl font-black font-display text-white mt-2">Sign in to UperAI</h2>
          <p className="text-xs text-gray-400 max-w-xs">
            Connect your Google account to discover editors or manage your video portfolio.
          </p>
        </div>

        {/* In-Page Native Google Sign-In Container */}
        <div className="flex flex-col items-center justify-center pt-2 min-h-[50px]">
          <div ref={googleBtnRef} id="google-inpage-signin-btn" />
        </div>

        {/* Terms footer */}
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          By signing in, you agree to UperAI's{' '}
          <a href="/terms" className="text-lime-400 underline underline-offset-2">
            Terms of Service
          </a>{' '}
          and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
