/**
 * Simple Feature Flags System for UperAI
 *
 * Each flag has one of 3 statuses:
 * - 'off': Disabled for everyone (in dev and prod).
 * - 'admin': Defaults to OFF for all visitors. Enabled ONLY for admin accounts
 *            (matching ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS) or active test sessions.
 * - 'on': Enabled for 100% of visitors in production.
 */

export type FlagStatus = 'off' | 'admin' | 'on'

export type FeatureFlag =
  | 'sample_new_feature'
  | 'admin_panel'
  // Add your new feature flags here as you build them, e.g.:
  // | 'new_booking_flow'
  // | 'editor_analytics'

/**
 * Central Feature Flags Registry
 *
 * HOW TO USE:
 * 1. Testing a new feature safely on prod:
 *    Set status to 'admin'. It will ONLY show for you (your admin email or test session).
 *    Regular visitors will NEVER see it.
 *
 * 2. Flipping it ON for everyone:
 *    Change the status from 'admin' to 'on' and deploy.
 *
 * 3. Disabling a feature completely:
 *    Change the status to 'off'.
 */
export const FEATURE_FLAGS: Record<FeatureFlag, FlagStatus> = {
  // Safe default: only you can see this feature
  sample_new_feature: 'admin',
  // Admin panel feature flag: double-locks /admin route
  admin_panel: 'admin',
}

/**
 * Returns the list of configured admin emails.
 */
export function getAdminEmails(): Set<string> {
  const envEmails =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    'AviPro1122@gmail.com,karan@uperai.in'

  return new Set(
    envEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

/**
 * Check if a given email belongs to an admin.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return getAdminEmails().has(email.trim().toLowerCase())
}

/**
 * Server-side / API route feature flag evaluator.
 *
 * @example
 * // In a Server Component or Route Handler:
 * import { isFeatureEnabled } from '@/lib/flags'
 *
 * export default async function Page() {
 *   const showNewSearch = isFeatureEnabled('sample_new_feature', user?.email)
 *   return showNewSearch ? <NewSearch /> : <OldSearch />
 * }
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  userEmail?: string | null
): boolean {
  const status = FEATURE_FLAGS[flag]

  if (status === 'on') return true
  if (status === 'off' || !status) return false

  // 'admin' mode: only active for admin accounts
  return isAdminEmail(userEmail)
}
