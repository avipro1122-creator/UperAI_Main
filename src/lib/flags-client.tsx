'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { FEATURE_FLAGS, FeatureFlag, isAdminEmail } from './flags'

export { FEATURE_FLAGS, type FeatureFlag, type FlagStatus } from './flags'

/**
 * Client hook to check if a feature flag is enabled.
 *
 * Evaluation rules:
 * 1. If status is 'on' -> returns true for everyone.
 * 2. If status is 'off' -> returns false for everyone.
 * 3. If status is 'admin' -> defaults to FALSE for regular users.
 *    Returns TRUE if:
 *    a) You are logged in with your admin email (from ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS), OR
 *    b) URL has `?preview_flag=<flag_name>` (e.g. for testing before logging in), OR
 *    c) You set localStorage: `localStorage.setItem('ff_<flag_name>', 'true')`
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { user, loading } = useAuth()
  const [sessionOverride, setSessionOverride] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // 1. Check URL query params for quick testing: ?preview_flag=sample_new_feature
      const params = new URLSearchParams(window.location.search)
      const previewFlag = params.get('preview_flag')
      if (previewFlag === flag) {
        setSessionOverride(true)
        return
      }

      // 2. Check localStorage override: localStorage.setItem('ff_sample_new_feature', 'true')
      const localVal = window.localStorage.getItem(`ff_${flag}`)
      if (localVal === 'true') {
        setSessionOverride(true)
        return
      } else if (localVal === 'false') {
        setSessionOverride(false)
        return
      }
    } catch {
      // Ignore storage access issues if cookies/storage are disabled
    }
  }, [flag])

  const status = FEATURE_FLAGS[flag]

  if (status === 'on') return true
  if (status === 'off' || !status) return false

  // If there is an explicit session override (query param or localStorage)
  if (sessionOverride !== null) return sessionOverride

  // While auth is loading, default to false to avoid flickering for normal visitors
  if (loading) return false

  // Check if current user is admin
  return isAdminEmail(user?.email)
}

/**
 * Declarative component for wrapping features in JSX.
 *
 * @example
 * <Flag name="sample_new_feature" fallback={<OldHero />}>
 *   <NewHero />
 * </Flag>
 */
export function Flag({
  name,
  children,
  fallback = null,
}: {
  name: FeatureFlag
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const isEnabled = useFeatureFlag(name)
  return isEnabled ? <>{children}</> : <>{fallback}</>
}
