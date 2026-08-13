import React from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions — UperAI',
  description: 'Terms and Conditions for using UperAI marketplace.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-lime-400 selection:text-black">
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
              <FileText className="w-5 h-5" />
            </div>
            <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-lime-400 uppercase tracking-widest">
              Legal Agreement
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-zinc-400">
            Website: <span className="text-zinc-200">uperai.in</span> &nbsp;|&nbsp; Last Updated: 13 August 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed shadow-2xl">
          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">1. Acceptance of Terms</h2>
            <p>
              Welcome to UperAI (uperai.in). By accessing or using our website and services (the &quot;Platform&quot;), you agree to be bound by these Terms &amp; Conditions. If you do not agree with any part of these Terms, please do not use the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">2. About UperAI</h2>
            <p>
              UperAI is a discovery platform designed to help content creators discover video editors, motion designers, and visual artists, and to allow editors to showcase their skills, experience, portfolio, and upfront rates. UperAI operates primarily as an open discovery and connection directory.
            </p>
            <p>
              Unless expressly stated otherwise in a separate written contract, UperAI is not the employer, agent, partner, contractor, or legal representative of any editor or creator using the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">3. User Eligibility</h2>
            <p>
              Users must be legally capable of entering into a binding agreement under applicable laws and must use the Platform solely for lawful purposes. You are responsible for ensuring compliance with all local laws and regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">4. User Accounts</h2>
            <p>
              Certain features may require creating an account. Users are responsible for providing accurate information, maintaining the confidentiality of their login credentials, and all activity carried out through their account. UperAI reserves the right to suspend or terminate accounts containing false, misleading, or fraudulent information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">5. Editor Profiles &amp; Portfolios</h2>
            <p>
              Editors may create profiles displaying professional names, skills, experience, showreels, rates, turnaround times, and contact links.
            </p>
            <p>
              Editors are solely responsible for the accuracy and legality of all uploaded content. Editors must NOT upload or showcase work for which they do not hold explicit permission or copyright license.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">6. Creator Responsibilities</h2>
            <p>
              Creators are responsible for independently evaluating editors before engaging or sending advance payments. Creators should verify an editor’s identity, portfolio, quality of work, and rates prior to starting any project.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">7. Editor–Creator Relationships</h2>
            <p>
              Any project agreement, freelance engagement, payment arrangement, or deliverable schedule between an editor and creator is strictly between those two parties. UperAI is not a party to direct editor–creator contracts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">8. Payments</h2>
            <p>
              UperAI operates as a direct-connect directory and does not currently process client payments, charge commissions, or provide escrow services between editors and creators. All financial dealings are arranged directly and independently between users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">9. Intellectual Property</h2>
            <p>
              UperAI logos, website designs, branding, and platform software are owned by UperAI. Users retain ownership of their uploaded portfolio content, granting UperAI a non-exclusive, royalty-free license to host, display, and promote their profile on the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">10. Prohibited Activities</h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Uploading stolen, copyrighted, or misleading work.</li>
              <li>Impersonating another person, creator, or business entity.</li>
              <li>Creating fake profiles or artificially inflating ratings.</li>
              <li>Harassing, scamming, or abusing other platform users.</li>
              <li>Scraping or harvesting user contact details without consent.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, UperAI and its founders/operators shall not be liable for any indirect, incidental, or consequential losses, missed deadlines, quality disputes, or payment disagreements arising from user-to-user interactions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-lime-400">12. Governing Law &amp; Contact Us</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. For any legal inquiries or support, please contact us at:
            </p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1 text-xs font-mono text-zinc-300">
              <p>Platform: UperAI (uperai.in)</p>
              <p>Email: <a href="mailto:support@uperai.in" className="text-lime-400 hover:underline">support@uperai.in</a></p>
              <p>Location: Daman, India</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
