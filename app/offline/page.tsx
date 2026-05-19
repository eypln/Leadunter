'use client';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3l18 18M8.11 5.41A10 10 0 0120.49 17m-2.6 2.6A10 10 0 013.51 7M12 12v.01M12 16h.01"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re offline</h1>
        <p className="text-gray-400 text-sm mb-6">
          Lead Hunter needs an internet connection. Please check your network and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
