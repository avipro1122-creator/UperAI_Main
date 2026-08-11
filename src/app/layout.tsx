import type { Metadata } from 'next'
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
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-purple-500 selection:text-white">
        <AuthProvider>
          <OnboardingProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
