import type { Metadata } from 'next'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'UperAI — Indian editors. Rates upfront.',
  description:
    'A marketplace for YouTube creators and video editors to find each other, audition real work, and agree on upfront rates in INR.',
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
        <Script id="consent-mode-default" strategy="beforeInteractive">
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
          strategy="beforeInteractive"
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
      </body>
    </html>
  )
}
