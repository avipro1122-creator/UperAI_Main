import type { Metadata } from 'next'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.uperai.in'),
  title: {
    default: 'UperAI — Hire Verified Indian Video Editors | Rates Upfront in INR',
    template: '%s | UperAI',
  },
  description:
    'The premier open marketplace to hire verified Indian video editors for YouTube, Shorts, and Reels. Audition real showreels, compare upfront pricing in INR, and hire on WhatsApp.',
  keywords: [
    'hire video editors',
    'freelance video editor India',
    'youtube video editor',
    'short form video editor',
    'reels video editor',
    'video editing marketplace',
    'freelance editor portfolio',
    'hire editors in INR',
    'gaming video editor',
    'vfx artist India',
  ],
  authors: [{ name: 'UperAI Team', url: 'https://www.uperai.in' }],
  creator: 'UperAI',
  publisher: 'UperAI',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-9701077184398829',
  },
  openGraph: {
    title: 'UperAI — Hire Verified Indian Video Editors | Rates Upfront in INR',
    description:
      'Real portfolios you can play. Upfront rates in INR. Stop hiring in Instagram DMs.',
    url: 'https://www.uperai.in',
    siteName: 'UperAI',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'UperAI - Video Editor Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UperAI — Hire Verified Indian Video Editors | Rates Upfront in INR',
    description:
      'Real portfolios you can play. Upfront rates in INR. Stop hiring in Instagram DMs.',
    images: ['/icon.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UperAI',
    url: 'https://www.uperai.in',
    logo: 'https://www.uperai.in/icon.svg',
    description:
      'The open marketplace connecting India’s top video editors directly with content creators with transparent upfront rates in INR.',
    founder: [
      {
        '@type': 'Person',
        name: 'Avanish Rai',
        jobTitle: 'Founder & Full-Stack Developer',
        sameAs: 'https://www.linkedin.com/in/avanish-rai-proshot/',
      },
      {
        '@type': 'Person',
        name: 'Kumar Karan',
        jobTitle: 'Co-Founder & Operations Lead',
        sameAs: 'https://www.linkedin.com/in/karan-kr-v-83746b272/',
      },
    ],
    sameAs: [
      'https://www.linkedin.com/in/avanish-rai-proshot/',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UperAI',
    url: 'https://www.uperai.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.uperai.in/editors?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className="dark">
      <head>
        <JsonLd data={organizationSchema} id="organization-schema" />
        <JsonLd data={websiteSchema} id="website-schema" />
        {/* Preconnect to critical asset & image origins */}
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7WCGX60TSE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7WCGX60TSE', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `}
        </Script>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9701077184398829"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-purple-500 selection:text-white w-full max-w-full overflow-x-hidden">
        <AuthProvider>
          <OnboardingProvider>
            <Navbar />
            <main className="flex-grow w-full max-w-full overflow-x-hidden">{children}</main>
            <Footer />
          </OnboardingProvider>
        </AuthProvider>
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <Analytics />
      </body>
    </html>
  )
}
