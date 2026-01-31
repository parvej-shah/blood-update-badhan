import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/toast";

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

export const metadata: Metadata = {
  title: "Badhan - Blood Donation Management",
  description: "Volunteer blood donation management system for Badhan organization in Bangladesh",
  keywords: ["blood donation", "Bangladesh", "Badhan", "volunteer", "healthcare"],
  authors: [{ name: "Badhan" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen bg-background font-sans">
        <Navigation />
        <main className="page-enter">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
