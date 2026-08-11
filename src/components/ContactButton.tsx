'use client'

import Link from 'next/link'
import { MessageCircle, Instagram, ExternalLink, Lock } from 'lucide-react'
import { normalizeIndianPhone } from '@/lib/phone'

interface ContactButtonProps {
  editorId: string
  whatsapp: string | null
  instagramHandle: string | null
  isLoggedIn: boolean
  handle: string
}

function logClick(editorId: string) {
  // Fire-and-forget — never blocks navigation
  fetch('/api/contact-click', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ editor_id: editorId }),
  }).catch(() => {})
}

export default function ContactButton({
  editorId,
  whatsapp,
  instagramHandle,
  isLoggedIn,
  handle,
}: ContactButtonProps) {
  if (!isLoggedIn) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/login?next=/editors/${handle}`}
          className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5 rounded-xl shadow-sm"
        >
          <Lock className="w-4 h-4 text-lime-400" /> Log in to contact
        </Link>
      </div>
    )
  }

  const normalizedWa = normalizeIndianPhone(whatsapp).normalized
  const hasWhatsapp = !!normalizedWa
  const hasInstagram = !!instagramHandle?.trim()

  if (!hasWhatsapp && !hasInstagram) return null

  const waUrl = hasWhatsapp ? `https://wa.me/${normalizedWa}` : null

  const igUrl = hasInstagram
    ? `https://instagram.com/${instagramHandle!.trim().replace(/^@/, '')}`
    : null

  return (
    <div className="flex flex-wrap gap-3">
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logClick(editorId)}
          className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5 rounded-xl"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      )}

      {igUrl && (
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logClick(editorId)}
          className="inline-flex items-center gap-2 btn-secondary text-sm px-5 py-2.5 rounded-xl"
        >
          <Instagram className="w-4 h-4" />
          Instagram
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      )}
    </div>
  )
}
