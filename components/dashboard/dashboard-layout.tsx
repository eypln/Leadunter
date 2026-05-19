'use client';

import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Loader2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { usePWA } from '@/components/providers/pwa-provider';
import { NotificationToggleButton } from '@/components/ui/pwa-install-banner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isInstallable, isInstalled, install } = usePWA();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 z-50"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Lead Hunter
          </h1>
          <p className="text-xs text-gray-500 mt-1">Real Estate CRM</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="w-full flex items-center gap-2 px-4 py-2 mb-2 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}

          {/* Notification Toggle */}
          <NotificationToggleButton />

          <div className="flex items-center gap-3 mb-3 mt-1">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full ring-2 ring-blue-500/20"
                unoptimized
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
