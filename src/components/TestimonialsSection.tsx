'use client'

import React from 'react'
import { Star, Quote, ExternalLink, ShieldCheck } from 'lucide-react'
import { Testimonial } from '@/lib/types/appwrite.types'

export interface TestimonialCardProps {
  testimonial: Testimonial
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const rating = Math.min(Math.max(Number(testimonial.rating) || 5, 1), 5)
  const initials = testimonial.clientName
    ? testimonial.clientName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CL'

  return (
    <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between gap-5 group overflow-hidden">
      {/* Top subtle glow bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-lime-400/30 to-transparent group-hover:via-lime-400/70 transition-all duration-300" />

      {/* Card Header: Rating + Quote Icon */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700 fill-transparent'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-zinc-400 ml-1">
            {rating.toFixed(1)}
          </span>
        </div>

        <Quote className="w-5 h-5 text-zinc-700 group-hover:text-lime-400/40 transition-colors shrink-0" />
      </div>

      {/* Quote Body */}
      <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed italic">
        "{testimonial.quote}"
      </p>

      {/* Card Footer: Client Info & Channel */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-lime-950 border border-lime-800/60 text-lime-400 font-black text-xs flex items-center justify-center shrink-0 tracking-wider">
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {testimonial.clientName}
              </p>
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            </div>

            {testimonial.channelOrBrand && (
              <p className="text-[11px] font-semibold text-zinc-400 truncate">
                {testimonial.channelOrBrand}
              </p>
            )}
          </div>
        </div>

        {testimonial.clientLink && (
          <a
            href={testimonial.clientLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/70 hover:bg-zinc-800 text-[11px] font-bold text-lime-400 hover:text-lime-300 rounded-lg border border-zinc-700/60 transition-all shrink-0"
            title="View Channel / Brand"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export interface TestimonialsSectionProps {
  testimonials?: Testimonial[] | null
  editorName?: string
}

export default function TestimonialsSection({
  testimonials,
  editorName,
}: TestimonialsSectionProps) {
  if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) {
    return null
  }

  return (
    <section className="space-y-4" aria-labelledby="client-testimonials-heading">
      <div className="flex items-center justify-between">
        <h2
          id="client-testimonials-heading"
          className="text-xl font-black text-lime-400 font-display flex items-center gap-2"
        >
          <span>Client Testimonials</span>
          <span className="text-xs font-bold text-zinc-400 font-sans">
            ({testimonials.length})
          </span>
        </h2>

        <span className="text-[10px] font-bold text-lime-400 bg-lime-950 border border-lime-800/50 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Verified Reviews
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {testimonials.map((t, idx) => (
          <TestimonialCard key={idx} testimonial={t} />
        ))}
      </div>
    </section>
  )
}
