import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { themeInitScript } from "@/components/layout/theme-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL for the canonical deployment; a
 * custom domain overrides both via NEXT_PUBLIC_SITE_URL.
 */
// || not ??: a NEXT_PUBLIC_SITE_URL created blank in a dashboard would
// otherwise reach new URL("") and fail the whole build.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description =
  "Turn one meaningful goal into small daily actions you can actually follow. One goal, thirty days, a few minutes a day.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SelfMastery — 30 Days. One Meaningful Change.",
    template: "%s · SelfMastery",
  },
  description,
  applicationName: "SelfMastery",
  openGraph: {
    type: "website",
    siteName: "SelfMastery",
    title: "SelfMastery — 30 Days. One Meaningful Change.",
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "SelfMastery — 30 Days. One Meaningful Change.",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#111413" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The font variable class must sit on <html>: the design tokens consume
    // var(--font-inter) inside custom properties defined on :root, and a
    // custom property whose var() is undefined at that scope computes to
    // guaranteed-invalid — silently dropping the entire font stack to the
    // system default.
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
