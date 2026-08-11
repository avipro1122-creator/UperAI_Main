'use client'

import { useState } from 'react'
import PortfolioThumb, { PortfolioThumbItem } from '@/components/PortfolioThumb'

export default function PortfolioGrid({ items }: { items: PortfolioThumbItem[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <PortfolioThumb
          key={item.id}
          item={item}
          isPlaying={playingId === item.id}
          onPlay={() => setPlayingId(item.id)}
        />
      ))}
    </div>
  )
}
