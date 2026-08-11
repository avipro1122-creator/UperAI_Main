'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { databases } from '@/lib/appwrite/client'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import SetupNotice from '@/components/SetupNotice'
import { Query } from 'appwrite'

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileDocId, setProfileDocId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    specialtyTag: 'Video Editor',
    baseRate: 1500,
    turnaroundTime: '2 Days',
    youtubeUrl: '',
    whatsappNumber: '',
  })

  if (!isAppwriteConfigured()) {
    return <SetupNotice />
  }

  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
        let response = await databases.listDocuments(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.equal('user_id', user.$id)]
        ).catch(() => ({ documents: [] }))

        if (response.documents.length === 0) {
          response = await databases.listDocuments(
            dbId,
            APPWRITE_CONFIG.collections.editor_profiles,
            [Query.equal('$id', user.$id)]
          ).catch(() => ({ documents: [] }))
        }

        if (response.documents.length > 0) {
          const doc = response.documents[0]
          setProfileDocId(doc.$id)
          setFormData({
            fullName: doc.full_name || user.name || '',
            specialtyTag: doc.specialty_tag || 'Video Editor',
            baseRate: doc.base_rate || 1500,
            turnaroundTime: doc.turnaround_time || '2 Days',
            youtubeUrl: doc.youtube_url || '',
            whatsappNumber: doc.whatsapp_number || '',
          })
        } else {
          setFormData((prev) => ({ ...prev, fullName: user.name || '' }))
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const extractYouTubeId = (url: string) => {
    if (!url) return ''
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    return match ? match[1] : ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    try {
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

      if (profileDocId) {
        await databases.updateDocument(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          profileDocId,
          {
            full_name: formData.fullName,
            specialty_tag: formData.specialtyTag,
            base_rate: Number(formData.baseRate),
            turnaround_time: formData.turnaroundTime,
            youtube_url: formData.youtubeUrl,
            whatsapp_number: formData.whatsappNumber,
          }
        )
      } else {
        const created = await databases.createDocument(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          user.$id,
          {
            user_id: user.$id,
            full_name: formData.fullName,
            specialty_tag: formData.specialtyTag,
            base_rate: Number(formData.baseRate),
            turnaround_time: formData.turnaroundTime,
            youtube_url: formData.youtubeUrl,
            whatsapp_number: formData.whatsappNumber,
          }
        )
        setProfileDocId(created.$id)
      }
      alert('Profile updated successfully!')
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const videoId = extractYouTubeId(formData.youtubeUrl)

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen bg-[#09090b] text-white">
      <div>
        <h1 className="text-3xl font-black font-display">Editor Profile Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your public listing, YouTube showreel, rates, and direct brief contacts.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading your profile...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Column */}
          <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-lime-400">Edit Details</h2>

            <div>
              <label className="text-xs font-bold text-zinc-400">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400">Specialty Tag</label>
              <input
                type="text"
                value={formData.specialtyTag}
                onChange={(e) => setFormData({ ...formData, specialtyTag: e.target.value })}
                placeholder="e.g. Gaming Videos, 3D Motion Graphics"
                className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400">Base Rate (₹)</label>
                <input
                  type="number"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400">Turnaround Time</label>
                <input
                  type="text"
                  value={formData.turnaroundTime}
                  onChange={(e) => setFormData({ ...formData, turnaroundTime: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400">YouTube Showreel URL</label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full mt-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-lime-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-black font-black text-xs rounded-xl transition-all shadow-md"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Live Preview Column */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-300">Marketplace Preview</h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-lime-400 shrink-0">
                  <img
                    src={user?.prefs?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.fullName || 'Editor')}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{formData.fullName || 'Your Name'}</h3>
                  <span className="inline-block text-[10px] bg-pink-950 text-pink-400 font-bold px-2 py-0.5 rounded-full border border-pink-800/40 truncate">
                    {formData.specialtyTag}
                  </span>
                </div>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <span className="text-xs text-zinc-500">Paste YouTube URL to view preview</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-zinc-800">
                <span className="text-white">₹{Number(formData.baseRate).toLocaleString()} / Video</span>
                <span className="text-zinc-400">⏱ {formData.turnaroundTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
