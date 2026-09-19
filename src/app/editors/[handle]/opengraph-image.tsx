import { ImageResponse } from 'next/og'
import { getEditorByHandleOrId } from '@/lib/firebase/firestore'

export const alt = 'Verified Video Editor on UperAI'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { handle: string } }) {
  const target = params?.handle || ''
  let editor: any = null

  try {
    editor = await getEditorByHandleOrId(target)
  } catch {
    // Fallback if fetch fails
  }

  const name = editor?.full_name || editor?.name || 'Verified Video Editor'
  const headline = editor?.headline || editor?.specialty_tag || 'Short-Form & Long-Form Video Editor'
  const rate = Number(editor?.base_rate || editor?.min_rate || 1500).toLocaleString('en-IN')
  const turnaround = editor?.turnaround_time || '48 Hours'
  const formatTag = (editor?.specialty_tag || editor?.format_tag || 'Shorts / Reels').toUpperCase()
  const avatarUrl =
    editor?.avatar_url && !editor.avatar_url.includes('dicebear')
      ? editor.avatar_url
      : null
  const initial = name.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(163, 230, 53, 0.15) 0%, transparent 50%), radial-gradient(circle at 10% 85%, rgba(168, 85, 247, 0.12) 0%, transparent 45%)',
          padding: '48px 56px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* UperAI Logo Badge */}
            <div
              style={{
                backgroundColor: '#a3e635',
                color: '#09090b',
                fontWeight: 900,
                fontSize: '22px',
                letterSpacing: '-0.5px',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              UPERAI
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#a3e635',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              <span>●</span> Verified Editor Profile
            </div>
          </div>

          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#71717a',
              letterSpacing: '0.5px',
            }}
          >
            uperai.in/editors/{editor?.handle || target}
          </div>
        </div>

        {/* Center Spotlight Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#141418',
            border: '1px solid #27272a',
            borderRadius: '28px',
            padding: '40px 48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            gap: '32px',
          }}
        >
          {/* Left: Avatar + Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '9999px',
                  objectFit: 'cover',
                  border: '3px solid #a3e635',
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '9999px',
                  backgroundColor: '#a3e635',
                  color: '#09090b',
                  fontSize: '52px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #d9f99d',
                }}
              >
                {initial}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-1px',
                  lineHeight: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span>{name}</span>
                <span style={{ color: '#a3e635', fontSize: '32px' }}>✓</span>
              </div>
              <div
                style={{
                  fontSize: '20px',
                  color: '#a1a1aa',
                  fontWeight: 500,
                  maxWidth: '520px',
                  lineHeight: 1.3,
                }}
              >
                {headline}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <span
                  style={{
                    backgroundColor: '#27272a',
                    color: '#e4e4e7',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {formatTag}
                </span>
                <span
                  style={{
                    backgroundColor: '#27272a',
                    color: '#a3e635',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  ⏱ {turnaround}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Pricing Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#18181b',
              border: '2px solid rgba(163, 230, 53, 0.4)',
              borderRadius: '20px',
              padding: '24px 36px',
              textAlign: 'center',
              minWidth: '240px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#a1a1aa',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Starting From
            </div>
            <div
              style={{
                fontSize: '44px',
                fontWeight: 900,
                color: '#a3e635',
                letterSpacing: '-1px',
                fontFamily: 'monospace',
                lineHeight: 1.1,
              }}
            >
              ₹{rate}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#71717a',
                marginTop: '6px',
              }}
            >
              Per Video • Rates Upfront
            </div>
          </div>
        </div>

        {/* Bottom Call to Action Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #27272a',
            paddingTop: '20px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', fontSize: '15px', fontWeight: 600 }}>
            <span>🎬 Audition Real Showreels &amp; Portfolio Clips</span>
            <span style={{ color: '#52525b' }}>•</span>
            <span>Direct WhatsApp Connection</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#a3e635',
              color: '#09090b',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.5px',
            }}
          >
            <span>HIRE ON UPERAI →</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
