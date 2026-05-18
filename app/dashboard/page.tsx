import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="text-gray-400">
            Here's your lead generation dashboard
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Profile
          </h2>
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <p className="text-white font-medium">{session.user?.name}</p>
              <p className="text-gray-400 text-sm">{session.user?.email}</p>
              <p className="text-gray-500 text-xs mt-1">
                ID: {session.user?.id}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Total Leads</p>
            <p className="text-3xl font-bold text-white">7</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">New Leads</p>
            <p className="text-3xl font-bold text-blue-500">5</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Responded</p>
            <p className="text-3xl font-bold text-green-500">1</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Skipped</p>
            <p className="text-3xl font-bold text-gray-500">1</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Dashboard Coming Soon
          </h3>
          <p className="text-gray-400">
            Lead feed, filters, and management features will be added in Phase 2
          </p>
        </div>
      </div>
    </div>
  );
}
