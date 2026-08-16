import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SelectRole() {
  const { currentUser, setUserRole } = useAuth();
  const [submittingRole, setSubmittingRole] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectRole = async (selectedRole) => {
    if (!currentUser || submittingRole) return;
    setSubmittingRole(selectedRole);
    setError(null);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          role: selectedRole,
          email: currentUser.email || null,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Instantly trigger dashboard rendering in AuthContext
      setUserRole(selectedRole.toLowerCase());
    } catch (err) {
      console.error('Failed to update role in Firestore:', err);
      setError(err.message || 'Failed to save role. Please try again.');
      setSubmittingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full z-10 space-y-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-lime-500/10 border border-lime-500/30 text-lime-400">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            Step 1 of 1 · Account Onboarding
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Choose your role on <span className="text-lime-400">UperAI</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
            Personalize your experience. Select how you plan to use the platform today.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Two Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Creator / Client */}
          <button
            type="button"
            disabled={!!submittingRole}
            onClick={() => handleSelectRole('creator')}
            className={`group relative p-8 rounded-3xl text-left bg-zinc-900/80 border-2 transition-all duration-300 flex flex-col justify-between space-y-6 hover:shadow-2xl hover:shadow-sky-500/10 ${
              submittingRole === 'creator'
                ? 'border-sky-400 bg-sky-950/30 scale-[0.99]'
                : submittingRole
                ? 'opacity-40 border-zinc-800 cursor-not-allowed'
                : 'border-zinc-800 hover:border-sky-400/80 hover:-translate-y-1'
            }`}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎬
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                    Creator / Client
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Hire
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  Find, compare, and hire verified Indian video editors. Browse showreels and pricing upfront.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span> Direct WhatsApp & email contact
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span> Filter by software & niche
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">✓</span> Transparent INR pricing
                </li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 group-hover:text-sky-300 flex items-center gap-1.5">
                {submittingRole === 'creator' ? 'Setting up Creator...' : 'Continue as Creator →'}
              </span>
              {submittingRole === 'creator' && (
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>

          {/* Card 2: Editor */}
          <button
            type="button"
            disabled={!!submittingRole}
            onClick={() => handleSelectRole('editor')}
            className={`group relative p-8 rounded-3xl text-left bg-zinc-900/80 border-2 transition-all duration-300 flex flex-col justify-between space-y-6 hover:shadow-2xl hover:shadow-lime-500/10 ${
              submittingRole === 'editor'
                ? 'border-lime-400 bg-lime-950/30 scale-[0.99]'
                : submittingRole
                ? 'opacity-40 border-zinc-800 cursor-not-allowed'
                : 'border-zinc-800 hover:border-lime-400/80 hover:-translate-y-1'
            }`}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                ✂️
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white group-hover:text-lime-300 transition-colors">
                    Editor
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-lime-500/20 text-lime-300 border border-lime-500/30">
                    Get Hired
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed">
                  List your portfolio, display upfront pricing, feature YouTube work, and get client inquiries directly.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                <li className="flex items-center gap-2">
                  <span className="text-lime-400 font-bold">✓</span> Create custom editor profile
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400 font-bold">✓</span> Upload and feature video projects
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lime-400 font-bold">✓</span> 0% commission on direct client leads
                </li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-lime-400 group-hover:text-lime-300 flex items-center gap-1.5">
                {submittingRole === 'editor' ? 'Setting up Editor...' : 'Continue as Editor →'}
              </span>
              {submittingRole === 'editor' && (
                <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
