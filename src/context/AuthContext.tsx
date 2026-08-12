'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { account } from '@/lib/appwrite/client'
import { client } from '@/lib/appwrite'
import { OAuthProvider } from 'appwrite'

export type Role = 'CREATOR' | 'EDITOR'

interface AuthContextType {
  user: any | null
  loading: boolean
  activeRole: Role
  setActiveRole: (role: Role) => void
  loginWithGoogle: () => void
  logout: () => Promise<void>
  setUserState: (userData: any) => void
  checkSession: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<Role>('CREATOR')

  const checkSession = useCallback(async () => {
    setLoading(true)
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
    console.log('[AuthContext Debug] NEXT_PUBLIC_APPWRITE_ENDPOINT in bundle:', endpoint)
    try {
      const activeAccount = await account.get()
      console.log('[AuthContext Debug] account.get() SUCCESS (HTTP 200):', activeAccount)
      setUser(activeAccount)
      localStorage.setItem('uperai_user', JSON.stringify(activeAccount))
      if (activeAccount.prefs?.role) {
        setActiveRole(activeAccount.prefs.role as Role)
        localStorage.setItem('uperai_role', activeAccount.prefs.role)
      }
    } catch (err: any) {
      console.error('[AuthContext Debug] account.get() FAILED:', err)
      setUser(null)
      localStorage.removeItem('uperai_user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('[AuthContext Debug] AuthProvider mounted. URL:', window.location.href)
    checkSession()
    client.ping().catch((err) => console.log('Appwrite backend ping check:', err))
    const savedRole = localStorage.getItem('uperai_role') as Role
    if (savedRole) setActiveRole(savedRole)
  }, [checkSession])

  useEffect(() => {
    console.log('[AuthContext Debug] State updated -> user:', user, '| loading:', loading)
  }, [user, loading])

  const loginWithGoogle = () => {
    account.createOAuth2Token(
      OAuthProvider.Google,
      `${window.location.origin}/auth/callback`,
      `${window.location.origin}/?error=auth_failed`
    )
  }

  const logout = async () => {
    try {
      await account.deleteSession('current')
    } catch (err) {
      console.error(err)
    }
    localStorage.removeItem('uperai_user')
    setUser(null)
    window.location.href = '/'
  }

  const handleSetRole = (role: Role) => {
    setActiveRole(role)
    localStorage.setItem('uperai_role', role)
  }

  const setUserState = (userData: any) => {
    if (userData && userData.email !== 'user@uperai.in') {
      setUser(userData)
      localStorage.setItem('uperai_user', JSON.stringify(userData))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeRole,
        setActiveRole: handleSetRole,
        loginWithGoogle,
        logout,
        setUserState,
        checkSession,
        refreshUser: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
