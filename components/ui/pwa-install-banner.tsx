'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Bell, BellOff } from 'lucide-react';
import { usePWA } from '@/components/providers/pwa-provider';

// ─── Install Banner ───────────────────────────────────────────────────────────

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Remember dismissal in sessionStorage so it doesn't keep re-appearing
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed') === '1';
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  const handleInstall = async () => {
    await install();
    setDismissed(true);
  };

  const show = isInstallable && !isInstalled && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="relative flex items-center gap-4 bg-gray-900 border border-violet-500/30 rounded-2xl p-4 shadow-2xl shadow-violet-900/30">
            {/* Icon */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install Lead Hunter</p>
              <p className="text-xs text-gray-400 mt-0.5">Add to home screen for quick access</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Notification Button ──────────────────────────────────────────────────────

export function NotificationToggleButton() {
  const { notificationPermission, requestNotifications } = usePWA();

  if (notificationPermission === 'unsupported') return null;
  if (notificationPermission === 'granted') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-400">
        <Bell className="w-3.5 h-3.5" />
        <span>Notifications on</span>
      </div>
    );
  }
  if (notificationPermission === 'denied') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
        <BellOff className="w-3.5 h-3.5" />
        <span>Notifications blocked</span>
      </div>
    );
  }

  // 'default' — can ask
  return (
    <button
      onClick={requestNotifications}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
    >
      <Bell className="w-4 h-4" />
      <span>Enable Notifications</span>
    </button>
  );
}
