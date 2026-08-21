import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Privacy Policy — UperAI',
  description:
    'How UperAI collects, uses, shares and protects your information when you use the marketplace.',
  alternates: {
    canonical: 'https://www.uperai.in/privacy',
  },
  openGraph: {
    title: 'Privacy Policy — UperAI',
    description:
      'How UperAI collects, uses, shares and protects your information when you use the marketplace.',
    url: 'https://www.uperai.in/privacy',
  },
}

export default function PrivacyPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.uperai.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Privacy Policy',
        item: 'https://www.uperai.in/privacy',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-lime-400 selection:text-black">
      <JsonLd data={breadcrumbSchema} id="privacy-breadcrumb-schema" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-lime-400 transition-colors"
            href="/"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-lime-400 uppercase tracking-widest">
              Your Data
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-400">
            Website: <span className="text-zinc-200">uperai.in</span> &nbsp;|&nbsp; Last Updated: 21 August 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed shadow-2xl">
          <section className="space-y-2">
            <p>
              This Privacy Policy explains how UperAI (&quot;UperAI&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, shares and protects your information when you use <span className="text-zinc-200">uperai.in</span> and any related pages or services (the &quot;Platform&quot;).
            </p>
            <p>
              UperAI is a marketplace that connects content creators with video editors. By using the Platform, you agree to the practices described in this policy. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">1. Who This Policy Applies To</h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><span className="text-zinc-300 font-semibold">Editors</span> who create a profile and list their work.</li>
              <li><span className="text-zinc-300 font-semibold">Creators / clients</span> who browse profiles, post jobs, or contact editors.</li>
              <li><span className="text-zinc-300 font-semibold">Visitors</span> who browse the Platform without signing up.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-lime-400">2. Information We Collect</h2>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-200">2.1 Information you give us</h3>
              <p>
                <span className="font-semibold text-zinc-200">When you sign up:</span> We use Google Sign-In. When you authenticate with Google, we receive your name, email address, Google account ID, and profile picture. We do <span className="font-semibold text-zinc-200">not</span> receive or store your Google password.
              </p>
              <p>
                <span className="font-semibold text-zinc-200">When you create an editor profile:</span> Any information you choose to add, which may include your display name, bio or description, skills and specialisations (for example vertical shorts, long-form, VFX), your rates in INR, availability, languages, location or region, links to your portfolio work (YouTube, Instagram, Drive, Behance or similar), showreels, and contact details you choose to publish such as an email address, WhatsApp number, Instagram handle or Discord ID.
              </p>
              <p>
                <span className="font-semibold text-zinc-200">When you post a job or contact an editor:</span> The content of your listing or message, your budget, deliverables and timeline, and any contact information you include.
              </p>
              <p>
                <span className="font-semibold text-zinc-200">When you write to us:</span> Your email address and the contents of your message.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-200">2.2 Information collected automatically</h3>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><span className="text-zinc-300 font-semibold">Usage data:</span> pages viewed, profiles opened, buttons clicked (including when someone clicks to reveal or use an editor&apos;s contact details), referring pages, and time spent.</li>
                <li><span className="text-zinc-300 font-semibold">Device and technical data:</span> IP address, browser type and version, operating system, device type, language settings.</li>
                <li><span className="text-zinc-300 font-semibold">Cookies and similar technologies:</span> see Section 7.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-200">2.3 What we do not collect</h3>
              <p>
                We do <span className="font-semibold text-zinc-200">not</span> collect payment card details, bank account details, or UPI credentials. UperAI does not currently process payments between creators and editors — you arrange payment directly with each other.
              </p>
              <p>
                We do not knowingly collect government ID numbers, Aadhaar, PAN, or any similar identifiers. Please do not upload these to your profile or send them through the Platform.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Create and manage your account and verify that you are a real user.</li>
              <li>Display your editor profile publicly so creators can discover and hire you.</li>
              <li>Let creators and editors find and contact each other.</li>
              <li>Operate, maintain, debug and improve the Platform.</li>
              <li>Understand which features are used, so we can prioritise what to build.</li>
              <li>Send you service emails — for example account confirmations, important changes to the Platform, security notices, or notification of a technical migration affecting your data.</li>
              <li>Send you occasional product updates, if you have not opted out.</li>
              <li>Detect, prevent and investigate fraud, spam, scraping, abuse and violations of our terms.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="pt-1">
              We do <span className="font-semibold text-zinc-200">not</span> sell your personal information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">4. What Is Public on the Platform</h2>
            <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-4 space-y-2">
              <p>
                <span className="font-semibold text-lime-300">Editor profiles are public.</span> If you create an editor profile, the information in it — including your name or display name, your portfolio links, your stated rates, your skills and any contact details you add — is visible to anyone who visits uperai.in, including people who are not signed in. It may also be indexed by search engines such as Google.
              </p>
              <p>
                Only publish contact details you are comfortable making public. You can edit or remove your profile at any time, though search engines may retain cached copies for a period after removal.
              </p>
              <p>
                Your email address used for sign-in is <span className="font-semibold text-zinc-200">not</span> shown publicly unless you separately add it to your profile.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-lime-400">5. How We Share Information</h2>
            <p>We share information only in these situations:</p>
            <p>
              <span className="font-semibold text-zinc-200">With other users.</span> As described in Section 4, and when you contact another user through the Platform.
            </p>
            <p>
              <span className="font-semibold text-zinc-200">With service providers who run our infrastructure.</span> These providers process data on our behalf under their own privacy terms:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] sm:text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 pr-3 font-bold text-zinc-200">Provider</th>
                    <th className="text-left py-2 pr-3 font-bold text-zinc-200">Purpose</th>
                    <th className="text-left py-2 font-bold text-zinc-200">Where data may be processed</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  <tr className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3 align-top">Google Firebase (Authentication, Database, Hosting services)</td>
                    <td className="py-2 pr-3 align-top">Sign-in, account records, profile and portfolio data</td>
                    <td className="py-2 align-top">Google data centres, including outside India</td>
                  </tr>
                  <tr className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3 align-top">Google Sign-In / Google Identity</td>
                    <td className="py-2 pr-3 align-top">Authentication</td>
                    <td className="py-2 align-top">Google data centres</td>
                  </tr>
                  <tr className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3 align-top">Vercel Inc.</td>
                    <td className="py-2 pr-3 align-top">Website hosting and delivery</td>
                    <td className="py-2 align-top">Global edge network</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 align-top">Google Ads / Google Analytics</td>
                    <td className="py-2 pr-3 align-top">Advertising measurement and site analytics</td>
                    <td className="py-2 align-top">Google data centres</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              If we previously stored your data with another provider (for example Appwrite, used before our migration to Firebase in August 2026), that data has been migrated and we have taken steps to remove it from the previous provider.
            </p>
            <p>
              <span className="font-semibold text-zinc-200">For legal reasons.</span> If required by applicable law, court order, or a valid request from a law enforcement or government authority, or to protect the rights, safety or property of UperAI, our users, or the public.
            </p>
            <p>
              <span className="font-semibold text-zinc-200">In a business transfer.</span> If UperAI is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information becomes subject to a materially different privacy policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">6. International Data Transfers</h2>
            <p>
              Our service providers store and process data on servers that may be located outside India, including in the United States and other countries. By using the Platform, you consent to this transfer. We rely on providers who offer contractual and technical safeguards for such transfers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">7. Cookies &amp; Tracking</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><span className="text-zinc-300 font-semibold">Essential purposes</span> — keeping you signed in and maintaining your session. The Platform will not work correctly without these.</li>
              <li><span className="text-zinc-300 font-semibold">Analytics</span> — understanding how the site is used in aggregate.</li>
              <li><span className="text-zinc-300 font-semibold">Advertising</span> — we run Google Ads campaigns; Google may set cookies to measure ad performance and to show ads across its network.</li>
            </ul>
            <p>
              You can block or delete cookies through your browser settings. You can control personalised Google advertising at{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime-400 hover:underline"
              >
                adssettings.google.com
              </a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">8. Data Retention</h2>
            <p>
              We keep your account and profile information for as long as your account is active. If you delete your account, we delete or anonymise your personal information within a reasonable period, typically 30 days, except where we are required to retain it for legal, accounting, security or dispute-resolution purposes.
            </p>
            <p>
              Aggregated or anonymised data that cannot identify you may be retained indefinitely.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">9. Your Rights</h2>
            <p>
              Under India&apos;s Digital Personal Data Protection Act, 2023, and other applicable laws, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><span className="text-zinc-300 font-semibold">Access</span> the personal data we hold about you.</li>
              <li><span className="text-zinc-300 font-semibold">Correct</span> inaccurate or incomplete data — most profile fields you can edit yourself.</li>
              <li><span className="text-zinc-300 font-semibold">Erase</span> your data and delete your account.</li>
              <li><span className="text-zinc-300 font-semibold">Withdraw consent</span> to processing, including opting out of product emails.</li>
              <li><span className="text-zinc-300 font-semibold">Nominate</span> another person to exercise your rights in the event of your death or incapacity.</li>
              <li><span className="text-zinc-300 font-semibold">Grievance redressal</span> — raise a complaint with us and, if unresolved, with the Data Protection Board of India.</li>
            </ul>
            <p>
              To exercise any of these, email us at{' '}
              <a href="mailto:support@uperai.in" className="text-lime-400 hover:underline">support@uperai.in</a>.
              We aim to respond within 30 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">10. Security</h2>
            <p>
              We use industry-standard measures to protect your information, including authentication managed by Google Firebase, HTTPS encryption in transit, and access controls limiting who on our side can view user data.
            </p>
            <p>
              No system is completely secure. We cannot guarantee absolute security, and you share information through the Platform at your own risk. If we become aware of a breach affecting your personal data, we will notify you and the relevant authorities as required by law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">11. Children</h2>
            <p>
              The Platform is not intended for anyone under 18. We do not knowingly collect personal information from children. If you believe a minor has created an account, contact us and we will remove it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">12. Third-Party Links</h2>
            <p>
              Editor profiles contain links to external sites such as YouTube, Instagram, Google Drive and Behance. We are not responsible for the privacy practices of those sites. Review their policies separately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">13. Changes to This Policy</h2>
            <p>
              We may update this policy as the Platform develops. When we make material changes, we will update the &quot;Last Updated&quot; date at the top and, where the change significantly affects your rights, notify you by email or through a notice on the Platform. Continued use after changes take effect means you accept the revised policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">14. Contact Us</h2>
            <p>
              Questions, requests or complaints about this policy or your data:
            </p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1 text-xs font-mono text-zinc-300">
              <p>Platform: UperAI (uperai.in)</p>
              <p>
                Email: <a href="mailto:support@uperai.in" className="text-lime-400 hover:underline">support@uperai.in</a>
              </p>
              <p>Location: Daman, India</p>
            </div>
          </section>
        </div>

        {/* Cross-link to Terms */}
        <p className="text-xs text-zinc-500 text-center">
          Looking for our{' '}
          <Link href="/terms" className="text-lime-400 hover:underline">
            Terms &amp; Conditions
          </Link>
          ?
        </p>
      </main>
    </div>
  )
}
