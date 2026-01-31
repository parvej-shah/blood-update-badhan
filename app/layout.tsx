import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { BottomNav } from "@/components/BottomNav";
import { PWAUpdater } from "@/components/PWAUpdater";
import { Toaster } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6B1E28",
};

export const metadata: Metadata = {
  title: "Badhan - Blood Donation",
  description: "Volunteer blood donation management system for Badhan - Amar Ekushey Hall Unit, Bangladesh",
  keywords: ["blood donation", "Bangladesh", "Badhan", "volunteer", "healthcare", "Amar Ekushey Hall"],
  authors: [{ name: "Badhan - Amar Ekushey Hall Unit" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Badhan Blood",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
    apple: { url: "/icon.svg", type: "image/svg+xml" },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Badhan Blood" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Badhan" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6B1E28" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-background font-sans">
        <Navigation />
        <main className="page-enter pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
        <PWAUpdater />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
