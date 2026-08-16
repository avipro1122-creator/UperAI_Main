'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, db } from '@/lib/firebase/client'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export type Role = 'CREATOR' | 'EDITOR'

export interface UserProfile {
  uid: string
  $id?: string
  email: string | null
  displayName: string | null
  name?: string | null
  photoURL: string | null
  role: Role
  handle?: string | null
}

interface AuthContextType {
  user: UserProfile | null
  rawUser: FirebaseUser | null
  loading: boolean
  activeRole: Role
  setActiveRole: (role: Role) => void
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  setUserState: (userData: any) => void
  checkSession: () => Promise<void>
  refreshUser: () => Promise<void>
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '120227432324-4366g11qtufcuipj56aneknrtmsreucm.apps.googleusercontent.com'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rawUser, setRawUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<Role>('CREATOR')

  const fetchUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid)
      const userSnap = await getDoc(userDocRef)

      let role: Role = 'CREATOR'
      let handle: string | null = null

      if (userSnap.exists()) {
        const data = userSnap.data()
        role = (data?.role as Role) || 'CREATOR'
        handle = data?.handle || null
      } else {
        // Create initial user doc
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          role: 'CREATOR',
          createdAt: new Date().toISOString(),
        })
      }

      const profile: UserProfile = {
        uid: fbUser.uid,
        $id: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        name: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role,
        handle,
      }

      setUser(profile)
      setActiveRole(role)
      localStorage.setItem('uperai_user', JSON.stringify(profile))
      localStorage.setItem('uperai_role', role)

      // Set auth cookie for middleware / server routes
      document.cookie = `uperai_auth=${fbUser.uid}; path=/; max-age=2592000; SameSite=Lax`
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile from Firestore:', err)
      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        $id: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        name: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role: 'CREATOR',
      }
      setUser(fallbackProfile)
    }
  }, [])

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      try {
        if (!response || !response.credential) return
        const credential = GoogleAuthProvider.credential(response.credential)
        const result = await signInWithCredential(auth, credential)
        if (result.user) {
          await fetchUserData(result.user)
        }
      } catch (err) {
        console.error('[AuthContext] Google One Tap sign-in error:', err)
      }
    },
    [fetchUserData]
  )

  const checkSession = useCallback(async () => {
    setLoading(true)
    const currentUser = auth.currentUser
    if (currentUser) {
      await fetchUserData(currentUser)
    }
    setLoading(false)
  }, [fetchUserData])

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser)
    }
  }, [fetchUserData])

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setRawUser(fbUser)
      if (fbUser) {
        await fetchUserData(fbUser)
      } else {
        setUser(null)
        localStorage.removeItem('uperai_user')
        document.cookie = 'uperai_auth=; path=/; max-age=0'
      }
      setLoading(false)
    })

    const savedRole = localStorage.getItem('uperai_role') as Role
    if (savedRole) setActiveRole(savedRole)

    return () => unsubscribe()
  }, [fetchUserData])

  // Google One Tap Native In-Page Prompt Initializer
  useEffect(() => {
    if (user || loading) return

    let intervalId: any = null
    const tryInitOneTap = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          ;(window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          ;(window as any).google.accounts.id.prompt()
          clearInterval(intervalId)
        } catch (err) {
          console.warn('[AuthContext] One Tap prompt exception:', err)
        }
      }
    }

    intervalId = setInterval(tryInitOneTap, 1000)
    const timeoutId = setTimeout(() => clearInterval(intervalId), 8000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [user, loading, handleCredentialResponse])

  const loginWithGoogle = async () => {
    // 1. Try In-Page Native Google Prompt (Zero Popups)
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        ;(window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        ;(window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup if One Tap is dismissed/blocked
            const provider = new GoogleAuthProvider()
            provider.setCustomParameters({ prompt: 'select_account' })
            signInWithPopup(auth, provider).then((result) => {
              if (result.user) fetchUserData(result.user)
            }).catch((err) => {
              if (err.code !== 'auth/popup-closed-by-user') {
                console.error('[AuthContext] Popup sign-in error:', err)
              }
            })
          }
        })
        return
      } catch {
        // Fallback below
      }
    }

    // 2. Direct Popup Fallback
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      if (result.user) {
        await fetchUserData(result.user)
      }
    } catch (err: any) {
      console.error('[AuthContext] Google Sign-In error:', err)
      if (err.code === 'auth/unauthorized-domain') {
        alert('Login domain not authorized. In Firebase Console -> Authentication -> Settings -> Authorized domains, please add this domain.')
      } else if (err.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site.')
      } else if (err.code !== 'auth/popup-closed-by-user') {
        alert(`Login error: ${err.message || err.code}`)
      }
    }
  }

  const logout = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        ;(window as any).google.accounts.id.disableAutoSelect()
      }
      await firebaseSignOut(auth)
    } catch (err) {
      console.error('[AuthContext] Sign-out error:', err)
    }
    setUser(null)
    setRawUser(null)
    localStorage.removeItem('uperai_user')
    document.cookie = 'uperai_auth=; path=/; max-age=0'
    window.location.href = '/'
  }

  const handleSetRole = (role: Role) => {
    setActiveRole(role)
    localStorage.setItem('uperai_role', role)
  }

  const setUserState = (userData: any) => {
    if (userData) {
      setUser(userData)
      localStorage.setItem('uperai_user', JSON.stringify(userData))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        loading,
        activeRole,
        setActiveRole: handleSetRole,
        loginWithGoogle,
        logout,
        setUserState,
        checkSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
