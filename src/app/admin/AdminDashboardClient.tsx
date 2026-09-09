'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  Video,
  Eye,
  MessageSquare,
  Search,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Flag as FlagIcon,
  Clock,
  Mail,
  UserCheck,
} from 'lucide-react'
import { FEATURE_FLAGS } from '@/lib/flags'

export interface AdminUserData {
  id: string
  uid: string
  name: string
  email: string
  role: 'CREATOR' | 'EDITOR' | string
  photoURL?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AdminEditorProfile {
  id: string
  name: string
  handle?: string | null
  headline?: string | null
  specialty?: string | null
  baseRate?: number | null
  whatsapp?: string | null
  youtubeUrl?: string | null
  isOpenToWork?: boolean
  isHidden?: boolean
  updatedAt?: string | null
}

interface AdminDashboardClientProps {
  adminEmail: string
  users: AdminUserData[]
  editorProfiles: AdminEditorProfile[]
  totalVisits: number
}

export default function AdminDashboardClient({
  adminEmail,
  users,
  editorProfiles,
  totalVisits,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'editors' | 'feedback' | 'flags'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CREATOR' | 'EDITOR'>('ALL')

  // KPI Calculations
  const totalUsers = users.length
  const creatorsCount = users.filter((u) => (u.role || '').toUpperCase() === 'CREATOR').length
  const editorsCount = users.filter((u) => (u.role || '').toUpperCase() === 'EDITOR').length

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || (u.role || '').toUpperCase() === roleFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, searchQuery])

  // Filtered editor profiles
  const filteredEditors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return editorProfiles
    return editorProfiles.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.handle && e.handle.toLowerCase().includes(q)) ||
        (e.headline && e.headline.toLowerCase().includes(q)) ||
        (e.specialty && e.specialty.toLowerCase().includes(q))
    )
  }, [editorProfiles, searchQuery])

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—'
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-lime-400 selection:text-black">
      {/* Top Banner / Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold font-display text-white tracking-tight">
                UperAI Admin
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400">
                Protected Route
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Logged in as <span className="text-zinc-200 font-medium">{adminEmail}</span> (Read-Only)
            </p>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
            >
              <span>View Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Users
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">{totalUsers}</span>
              <span className="text-xs text-zinc-500">registered</span>
            </div>
          </div>

          {/* Creators */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Creators
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">{creatorsCount}</span>
              <span className="text-xs text-zinc-500">
                {totalUsers > 0 ? Math.round((creatorsCount / totalUsers) * 100) : 0}% of users
              </span>
            </div>
          </div>

          {/* Editors */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Editors
              </span>
              <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">{editorsCount}</span>
              <span className="text-xs text-zinc-500">
                ({editorProfiles.length} profiles listed)
              </span>
            </div>
          </div>

          {/* Site Visits */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Visits
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">
                {totalVisits.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Recorded</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Users ({totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('editors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'editors'
                ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Editor Profiles ({editorProfiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'feedback'
                ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback & Issues</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'flags'
                ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FlagIcon className="w-4 h-4" />
            <span>Feature Flags</span>
          </button>
        </div>

        {/* TAB CONTENT: 1. REGISTERED USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/30"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    roleFilter === 'ALL'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({totalUsers})
                </button>
                <button
                  onClick={() => setRoleFilter('CREATOR')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    roleFilter === 'CREATOR'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Creators ({creatorsCount})
                </button>
                <button
                  onClick={() => setRoleFilter('EDITOR')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    roleFilter === 'EDITOR'
                      ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Editors ({editorsCount})
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/90 text-xs uppercase text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Signed Up</th>
                      <th className="px-6 py-4 font-semibold">UID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isCreator = (u.role || '').toUpperCase() === 'CREATOR'
                        const isEditor = (u.role || '').toUpperCase() === 'EDITOR'
                        return (
                          <tr key={u.id || u.uid} className="hover:bg-zinc-800/40 transition-colors">
                            {/* User Avatar + Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {u.photoURL ? (
                                  <img
                                    src={u.photoURL}
                                    alt={u.name}
                                    className="w-9 h-9 rounded-full object-cover border border-zinc-700/60"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 font-semibold text-xs">
                                    {(u.name || 'U').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-white text-sm">
                                    {u.name || 'Anonymous User'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-zinc-300">
                                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{u.email || '—'}</span>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                  isEditor
                                    ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                                    : isCreator
                                      ? 'bg-blue-400/10 text-blue-400 border-blue-400/30'
                                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                {u.role || 'CREATOR'}
                              </span>
                            </td>

                            {/* Signup Date */}
                            <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{formatDate(u.createdAt)}</span>
                              </div>
                            </td>

                            {/* UID */}
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                              {u.uid}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 2. EDITOR PROFILES */}
        {activeTab === 'editors' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-900/90 text-xs uppercase text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Editor</th>
                      <th className="px-6 py-4 font-semibold">Headline & Specialty</th>
                      <th className="px-6 py-4 font-semibold">Starting Rate</th>
                      <th className="px-6 py-4 font-semibold">WhatsApp</th>
                      <th className="px-6 py-4 font-semibold">Showreel / Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredEditors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                          No editor profiles found.
                        </td>
                      </tr>
                    ) : (
                      filteredEditors.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                          {/* Name + Handle */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-semibold text-white">{e.name}</p>
                            {e.handle && (
                              <p className="text-xs text-lime-400 font-mono">@{e.handle}</p>
                            )}
                          </td>

                          {/* Headline / Specialty */}
                          <td className="px-6 py-4 max-w-xs truncate text-xs text-zinc-400">
                            <p className="truncate text-zinc-300">{e.headline || '—'}</p>
                            {e.specialty && (
                              <span className="text-[11px] text-zinc-500">{e.specialty}</span>
                            )}
                          </td>

                          {/* Base Rate */}
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                            {e.baseRate ? `₹${e.baseRate.toLocaleString('en-IN')}` : 'Custom'}
                          </td>

                          {/* WhatsApp */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400 font-mono">
                            {e.whatsapp || '—'}
                          </td>

                          {/* Actions / Links */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {e.handle ? (
                              <Link
                                href={`/editors/${e.handle}`}
                                target="_blank"
                                className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 font-medium"
                              >
                                <span>Public Profile</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-xs text-zinc-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 3. USER FEEDBACK & ISSUES */}
        {activeTab === 'feedback' && (
          <div className="p-12 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No reports received yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                There is currently no user feedback or bug reports submitted. Once a feedback form or
                issue report button is added to the site, incoming messages will appear here.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All services operational
              </span>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 4. FEATURE FLAGS STATUS */}
        {activeTab === 'flags' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Feature Flags Status</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configured in <code className="text-lime-400 font-mono text-[11px]">src/lib/flags.ts</code>
                  </p>
                </div>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {Object.entries(FEATURE_FLAGS).map(([flagKey, status]) => (
                  <div key={flagKey} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-medium text-white">{flagKey}</p>
                      <p className="text-xs text-zinc-500">
                        {status === 'admin' && '🔒 Enabled only for admin accounts and test sessions'}
                        {status === 'on' && '🚀 Active for 100% of production users'}
                        {status === 'off' && '❌ Disabled completely'}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        status === 'admin'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                          : status === 'on'
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
