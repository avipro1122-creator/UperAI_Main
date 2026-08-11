import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Query } from 'node-appwrite'

export default async function EditorProfilePage({ params }: { params: { handle: string } }) {
  if (!isAppwriteConfigured()) return notFound()

  const admin = await createAdminClient()
  let profile: any = null

  try {
    // 1. Primary query: match editor_profiles by $id, user_id, or instagram_handle
    const directRes = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      [Query.equal('$id', params.handle)]
    )

    if (directRes.documents.length > 0) {
      profile = directRes.documents[0]
    }
  } catch {
    // Continue fallbacks
  }

  if (!profile) {
    try {
      const handleRes = await admin.databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.editor_profiles,
        [Query.equal('user_id', params.handle)]
      )
      if (handleRes.documents.length > 0) {
        profile = handleRes.documents[0]
      }
    } catch {
      // Continue fallbacks
    }
  }

  if (!profile) {
    try {
      const userRes = await admin.databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        [Query.equal('handle', params.handle)]
      )
      const userDoc = userRes.documents[0]
      if (userDoc) {
        const profRes = await admin.databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.equal('user_id', userDoc.$id)]
        )
        if (profRes.documents.length > 0) {
          profile = {
            ...profRes.documents[0],
            full_name: userDoc.name,
            avatar_url: userDoc.avatar_url,
            bio: userDoc.bio,
          }
        }
      }
    } catch {
      // Continue fallbacks
    }
  }

  if (!profile) return notFound()

  // Fetch portfolio items
  let portfolioItems: any[] = []
  try {
    const editorId = profile.user_id || profile.$id
    const itemsRes = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.portfolio_items,
      [Query.equal('editor_id', editorId)]
    )
    portfolioItems = itemsRes.documents || []
  } catch {
    portfolioItems = []
  }

  profile.portfolio_items = portfolioItems

  const extractYouTubeId = (url?: string) => {
    if (!url) return ''
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
    return match ? match[1] : ''
  }

  const firstPortfolioUrl = profile.portfolio_items?.[0]?.youtube_url || profile.portfolio_items?.[0]?.video_url
  const primaryVideoId = extractYouTubeId(profile.youtube_url || firstPortfolioUrl)

  const fullName = profile.full_name || profile.name || 'Editor'
  const firstName = fullName.split(' ')[0] || 'EDITOR'
  const specialtyTag = profile.specialty_tag || profile.headline || 'VIDEO EDITOR'
  const headlineOrBio = profile.headline || profile.bio || 'I create high-converting video edits that scale channels.'
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
  const baseRate = profile.base_rate ?? profile.min_rate ?? profile.rate_short ?? profile.rate_long ?? 0
  const turnaroundTime = profile.turnaround_time || (profile.turnaround_days ? `${profile.turnaround_days} Days` : '48 Hours')
  const whatsappNumber = profile.whatsapp_number || profile.whatsapp || ''

  const whatsappMessage = encodeURIComponent(
    `Hi ${fullName}, I saw your portfolio on UperAI and want to hire you for a video edit!`
  )
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : '#'

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Banner & Hero Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 rounded-3xl p-8 text-black flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10">
          <span className="text-xs font-black tracking-widest uppercase bg-black text-white px-3 py-1 rounded-full inline-block">
            {specialtyTag}
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
            HELLO! I'M {firstName}
          </h1>
          <p className="text-lg font-bold text-zinc-900 max-w-md">
            {headlineOrBio}
          </p>
        </div>

        {/* Profile Avatar / Hero Image */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-black shadow-2xl shrink-0">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Featured Portfolio Video Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-2xl font-black uppercase tracking-wider text-lime-400">WHAT I DID</h2>
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-700 bg-black">
          {primaryVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${primaryVideoId}?autoplay=0`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">No Featured Video</div>
          )}
        </div>
      </div>

      {/* Selected Work Grid & Stats */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-wider">SELECTED WORK</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-2xl p-4 border border-blue-400/30 space-y-2">
            <span className="text-xs font-bold text-zinc-400">SPECIALTY</span>
            <p className="text-lg font-bold">{specialtyTag}</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-blue-400/30 space-y-2">
            <span className="text-xs font-bold text-zinc-400">BASE RATE</span>
            <p className="text-xl font-black text-lime-400">₹{Number(baseRate).toLocaleString()} / Video</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-blue-400/30 space-y-2">
            <span className="text-xs font-bold text-zinc-400">TURNAROUND</span>
            <p className="text-lg font-bold">{turnaroundTime}</p>
          </div>
        </div>

        {/* Additional Portfolio Video Grid */}
        {profile.portfolio_items && profile.portfolio_items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {profile.portfolio_items.map((item: any, idx: number) => {
              const videoId = extractYouTubeId(item.youtube_url || item.video_url)
              const thumb = item.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '')

              return (
                <div key={item.$id || idx} className="bg-zinc-900 rounded-2xl overflow-hidden border border-blue-400/30">
                  <div className="aspect-video relative bg-black">
                    {videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : thumb ? (
                      <img src={thumb} alt={item.title || 'Portfolio video'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No Video</div>
                    )}
                  </div>
                  {item.title && (
                    <div className="p-3">
                      <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.title}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Contact Banner */}
      <div className="bg-lime-400 text-black rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black uppercase">LET'S CREATE SOMETHING GREAT!</h3>
          <p className="font-bold text-zinc-800">Have a project in mind? Send a brief directly on WhatsApp.</p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors inline-block"
        >
          CONTACT ME ↗
        </a>
      </div>
    </div>
  )
}
