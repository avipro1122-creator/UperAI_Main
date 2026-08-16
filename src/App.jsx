import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SelectRole from './pages/SelectRole';
import { EditorOnly, CreatorOnly } from './components/RoleGate';

function Dashboard() {
  const { currentUser, userRole, setUserRole, logout } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [uploadedPosts, setUploadedPosts] = useState([
    {
      id: 1,
      title: 'Alex Hormozi Style High-Retention Reel',
      author: 'Rohit Sharma',
      rate: '₹3,500 / reel',
      software: 'Premiere Pro, After Effects',
      tag: 'Shorts / Reels',
    },
    {
      id: 2,
      title: 'Documentary Style 4K Color Grading & Sound Design',
      author: 'Priya Verma',
      rate: '₹12,000 / video',
      software: 'DaVinci Resolve Studio',
      tag: 'YouTube Long-form',
    },
  ]);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;
    setUploadedPosts([
      {
        id: Date.now(),
        title: uploadTitle,
        author: currentUser?.displayName || 'Verified Editor',
        rate: '₹5,000 / project',
        software: 'DaVinci Resolve, Premiere Pro',
        tag: 'Portfolio Feature',
      },
      ...uploadedPosts,
    ]);
    setUploadTitle('');
    setUploadLink('');
    setShowUploadModal(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime-400 text-black font-black flex items-center justify-center text-lg shadow-lg shadow-lime-400/20">
            U
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              Uper<span className="text-lime-400">AI</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-zinc-900 border-zinc-700 text-zinc-300">
              {userRole === 'editor' ? '✂️ Editor Mode' : '🎬 Creator Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-lime-500/20 text-lime-400 text-[10px] font-bold flex items-center justify-center">
                {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
              </div>
            )}
            <span className="font-medium truncate max-w-[140px]">
              {currentUser?.displayName || currentUser?.email}
            </span>
          </div>

          {/* Quick Role Switcher Button */}
          <button
            onClick={() => setUserRole(userRole === 'editor' ? 'creator' : 'editor')}
            title="Switch your active viewing role"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            Switch to {userRole === 'editor' ? 'Creator' : 'Editor'}
          </button>

          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <section className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
                Dashboard Overview
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {currentUser?.displayName || 'Creator'}!
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {userRole === 'editor'
                  ? 'Manage your editing showcase, upload fresh work reels, and respond to direct client inquiries.'
                  : 'Discover verified video editors across India, compare rates, and hire without platform fees.'}
              </p>
            </div>

            {/* Role-Gated Action Buttons: Upload and New Post are wrapped in EditorOnly */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Wrapped with EditorOnly */}
              <EditorOnly
                fallback={
                  <div className="text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
                    <span className="text-sky-400 font-semibold">Creator View:</span> Browse editors below or switch to Editor mode to post work.
                  </div>
                }
              >
                <button
                  type="button"
                  id="upload-portfolio-btn"
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-lime-400 hover:bg-lime-300 text-black transition-all hover:scale-105 shadow-lg shadow-lime-400/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>📤</span> Upload Portfolio
                </button>

                <button
                  type="button"
                  id="new-post-btn"
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <span>✨</span> New Post
                </button>
              </EditorOnly>
            </div>
          </div>
        </section>

        {/* Upload Modal (Triggered by EditorOnly buttons) */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>✨</span> Upload New Project / Post
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-zinc-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                    Project / Video Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Commercial Color Grade for Tech Brand"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase">
                    YouTube / Drive Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={uploadLink}
                    onChange={(e) => setUploadLink(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-lime-400 hover:bg-lime-300 text-black rounded-xl"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Marketplace Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Featured Editor Showcases</h2>
              <p className="text-xs text-zinc-400">
                Live portfolio listings active on the network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
                    {post.tag}
                  </span>
                  <span className="text-xs font-bold text-zinc-300">{post.rate}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base leading-snug">{post.title}</h3>
                  <p className="text-xs text-zinc-400">By {post.author}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>🛠 {post.software}</span>
                  <button className="text-lime-400 hover:underline font-semibold">
                    View Reel →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function LoginPrompt() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-8 text-center">
        {/* Logo and Intro */}
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-lime-400 text-black font-black flex items-center justify-center text-2xl mx-auto shadow-xl shadow-lime-400/20">
            U
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Sign in to <span className="text-lime-400">UperAI</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            The direct marketplace connecting Indian video editors and content creators.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Action Card */}
        <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl space-y-6">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-white hover:bg-zinc-100 text-black transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <p className="text-xs text-zinc-500">
            By signing in, you agree to UperAI Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function MainRouter() {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Loading UperAI...
        </p>
      </div>
    );
  }

  // 1. If not logged in, prompt to log in
  if (!currentUser) {
    return <LoginPrompt />;
  }

  // 2. If logged in without a role, render SelectRole
  if (!userRole) {
    return <SelectRole />;
  }

  // 3. If logged in with a role, render Dashboard with EditorOnly protection on upload/new post
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
