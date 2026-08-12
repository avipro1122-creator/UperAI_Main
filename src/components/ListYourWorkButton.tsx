'use client'

import Link from 'next/link'

interface ListYourWorkButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function ListYourWorkButton({
  className = 'btn-primary text-xs px-4 py-2',
  children = 'List your work',
}: ListYourWorkButtonProps) {
  return (
    <Link href="/profile" className={className}>
      {children}
    </Link>
  )
}
