export default function SetupNotice() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="subtle-panel p-8 rounded-2xl inner-border space-y-2">
        <h1 className="font-display text-lg font-bold text-white">Almost there</h1>
        <p className="text-sm text-zinc-400">
          This deploy isn't connected to a Supabase project yet, so sign-in and profiles aren't live. See{' '}
          <code className="text-zinc-300">SETUP.md</code> for the steps.
        </p>
      </div>
    </div>
  )
}
