import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// Rounded and highly legible at small sizes — matches the logo's friendly
// character and holds up on a cheap phone screen.
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Recipe Keeper",
    template: "%s · Recipe Keeper",
  },
  description:
    "A Cookery learning module for Grade 9 students — recipes, procedures, safety reminders, and quizzes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Recipe Keeper",
    statusBarStyle: "default",
  },
  // Students share phones and screenshots; keep the module out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#B84E64",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom: some students need it to read comfortably.
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
