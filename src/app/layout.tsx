import type { Metadata } from 'next'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'UperAI — Indian editors. Rates upfront.',
  description:
    'A marketplace for YouTube creators and video editors to find each other, audition real work, and agree on upfront rates in INR.',
  other: {
    'google-adsense-account': 'ca-pub-9701077184398829',
  },
  openGraph: {
    title: 'UperAI — Indian editors. Rates upfront.',
    description:
      'Real portfolios you can play. Upfront rates in INR. Stop hiring in Instagram DMs.',
    url: 'https://www.uperai.in',
    siteName: 'UperAI',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UperAI — Indian editors. Rates upfront.',
    description:
      'Real portfolios you can play. Upfront rates in INR. Stop hiring in Instagram DMs.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to critical asset & image origins */}
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />

        <Script id="consent-mode-default" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 500
            });
          `}
        </Script>
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="d5c9bb0a-b958-4310-b7d3-3f9f5f4bb32b"
          data-blockingmode="auto"
          strategy="afterInteractive"
        />
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
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-purple-500 selection:text-white">
        <AuthProvider>
          <OnboardingProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </OnboardingProvider>
        </AuthProvider>
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <Analytics />
      </body>
    </html>
  )
}
