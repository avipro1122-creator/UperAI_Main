// In-memory rate limiter for public routes (resets per container/deployment restart).
const trackingMap = new Map<string, { count: number; expiresAt: number }>()

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { success: boolean } {
  const now = Date.now()
  const record = trackingMap.get(ip)

  if (!record || now > record.expiresAt) {
    trackingMap.set(ip, { count: 1, expiresAt: now + windowMs })
    return { success: true }
  }

  if (record.count >= limit) {
    return { success: false }
  }

  record.count += 1
  return { success: true }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || '127.0.0.1'
}
