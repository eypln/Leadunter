'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
/// <reference types="@/types/pwa" />

// ─── Context ─────────────────────────────────────────────────────────────────

interface PWAContextValue {
  isInstallable: boolean;
  isInstalled: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  install: () => Promise<void>;
  requestNotifications: () => Promise<void>;
}

const PWAContext = createContext<PWAContextValue>({
  isInstallable: false,
  isInstalled: false,
  notificationPermission: 'default',
  install: async () => {},
  requestNotifications: async () => {},
});

export function usePWA() {
  return useContext(PWAContext);
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUserToPush(): Promise<void> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push skipped');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const keyBuffer = urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuffer,
  });

  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  console.log('[PWA] Push subscription saved');
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => console.log('[PWA] SW registered, scope:', reg.scope))
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    }

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    // Notification permission state
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setIsInstallable(false);
    if (outcome === 'accepted') setIsInstalled(true);
  }, []);

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        await subscribeUserToPush();
      } catch (err) {
        console.error('[PWA] Push subscription failed:', err);
      }
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{ isInstallable, isInstalled, notificationPermission, install, requestNotifications }}
    >
      {children}
    </PWAContext.Provider>
  );
}
