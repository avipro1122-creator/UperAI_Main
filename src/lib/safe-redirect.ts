// Only ever redirect to a same-origin relative path. `next` comes from a
// query string an attacker can craft, so without this a value like
// "https://evil.example" or "//evil.example" (protocol-relative) passed
// through unchecked would turn the login flow into an open redirect.
export function safeRedirectPath(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/') || next.startsWith('//')) return null
  return next
}
