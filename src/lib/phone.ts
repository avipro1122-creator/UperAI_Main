export function normalizeIndianPhone(input: string | null | undefined): { normalized: string | null; error: string | null } {
  if (!input || !input.trim()) return { normalized: null, error: null }
  const digits = input.trim().replace(/\D/g, '')
  if (digits.length === 10) {
    return { normalized: `91${digits}`, error: null }
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { normalized: digits, error: null }
  }
  return {
    normalized: null,
    error: 'Please enter a valid 10-digit Indian WhatsApp number (e.g. 9876543210 or 919876543210).',
  }
}
