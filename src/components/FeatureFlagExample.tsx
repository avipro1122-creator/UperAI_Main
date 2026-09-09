'use client'

import React from 'react'
import { useFeatureFlag, Flag } from '@/lib/flags-client'

/**
 * Example Reference Component
 *
 * This file demonstrates the two ways you can wrap features with flags:
 *
 * Pattern A: Using the `useFeatureFlag` hook (best for conditional logic, data fetching, or custom flows)
 * Pattern B: Using the `<Flag>` component (best for JSX markup with optional fallback)
 */
export default function FeatureFlagExample() {
  // Pattern A: Hook usage
  const isSampleFeatureActive = useFeatureFlag('sample_new_feature')

  return (
    <div className="p-6 max-w-xl mx-auto my-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-100 space-y-4">
      <h3 className="text-base font-semibold text-white">Feature Flag Demo</h3>

      {/* Pattern A Demo */}
      <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
        <p className="text-xs text-zinc-400 mb-2">Pattern A: Hook (useFeatureFlag)</p>
        {isSampleFeatureActive ? (
          <div className="text-emerald-400 text-sm font-medium">
            ✨ [NEW FEATURE ACTIVE]: You are seeing this because the flag is ON for your session/account!
          </div>
        ) : (
          <div className="text-zinc-500 text-sm">
            🔒 [ORIGINAL FEATURE]: The flag is currently OFF for this user.
          </div>
        )}
      </div>

      {/* Pattern B Demo */}
      <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
        <p className="text-xs text-zinc-400 mb-2">Pattern B: Declarative Component (&lt;Flag&gt;)</p>
        <Flag
          name="sample_new_feature"
          fallback={
            <div className="text-zinc-500 text-sm">
              🔒 Standard UI shown to the public.
            </div>
          }
        >
          <div className="text-emerald-400 text-sm font-medium">
            🚀 New experimental feature content visible only when flag is active!
          </div>
        </Flag>
      </div>
    </div>
  )
}
