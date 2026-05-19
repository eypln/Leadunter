import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { PWAInstallBanner } from "@/components/ui/pwa-install-banner";

export const metadata: Metadata = {
  title: "Lead Hunter - Real Estate Lead Generation",
  description: "Automated lead generation and outreach for Malta real estate",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lead Hunter",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-512x512.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <SessionProvider>
          <PWAProvider>
            <ToastProvider>
              {children}
              <PWAInstallBanner />
            </ToastProvider>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
