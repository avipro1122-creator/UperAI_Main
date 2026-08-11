'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Wraps a link to /login with ?next=<current path> so the callback route
// can send the user back to where they clicked "Log in" from, instead of
// always to home.
export default function LoginLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const href = `/login?next=${encodeURIComponent(pathname || '/')}`

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
