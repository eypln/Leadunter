'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Bell, CheckCircle2, Download, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { usePWA } from '@/components/providers/pwa-provider';
import { GroupsManager } from './groups-manager';
import { MarketplaceManager } from './marketplace-manager';

export function SettingsPanel() {
  const { data: session } = useSession();
  const { isInstallable, isInstalled, install, notificationPermission, requestNotifications } = usePWA();
  const notificationsAvailable = notificationPermission !== 'unsupported';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage how Lead Hunter keeps your outreach workflow moving.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-800 bg-gray-900/45 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>
          <div className="flex items-center gap-4">
            {session?.user?.image ? <Image src={session.user.image} alt="Profile" width={48} height={48} unoptimized className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 bg-gray-800 rounded-full" />}
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{session?.user?.name ?? 'Lead Hunter user'}</p>
              <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Facebook account connected</div>
        </div>

        <div className="border border-gray-800 bg-gray-900/45 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-6"><Bell className="w-5 h-5 text-blue-400" /><h2 className="text-lg font-semibold text-white">Notifications</h2></div>
          <p className="text-sm text-gray-400 mb-5">Receive an alert when a scraper run finds new leads.</p>
          {notificationsAvailable && notificationPermission !== 'granted' && notificationPermission !== 'denied' && <button onClick={requestNotifications} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-lg transition-colors"><Bell className="w-4 h-4" /> Enable notifications</button>}
          {notificationPermission === 'granted' && <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Notifications enabled</p>}
          {notificationPermission === 'denied' && <p className="text-sm text-amber-400">Notifications are blocked in your browser settings.</p>}
          {!notificationsAvailable && <p className="text-sm text-gray-500">Notifications are not available in this browser.</p>}
        </div>

        <div className="border border-gray-800 bg-gray-900/45 p-6 rounded-lg lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="p-3 bg-violet-500/10 rounded-lg"><MonitorSmartphone className="w-6 h-6 text-violet-400" /></div>
          <div className="flex-1"><h2 className="text-lg font-semibold text-white">Lead Hunter app</h2><p className="text-sm text-gray-400 mt-1">Keep the dashboard one click away on desktop or mobile.</p></div>
          {isInstalled ? <span className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Installed</span> : isInstallable ? <button onClick={install} className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white rounded-lg transition-colors"><Download className="w-4 h-4" /> Install app</button> : <span className="text-sm text-gray-500">Available from your browser menu</span>}
        </div>
      </section>

      <GroupsManager />
      <MarketplaceManager />
    </div>
  );
}