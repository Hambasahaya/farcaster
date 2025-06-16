import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { FarcasterProvider } from "@/components/farcaster-provider"

const inter = Inter({ subsets: ["latin"] })

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const metadata: Metadata = {
  title: "Clenxi - Daily Claim & Referral Game",
  description: "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project.",
  keywords: ["CLENXI", "Clenxi", "crypto game", "daily claim", "referral", "farcaster", "web3", "community"],
  authors: [{ name: "Clenxi", url: "https://farcaster.xyz/clenix.eth" }],
  creator: "Clenxi (@clenix.eth)",
  publisher: "Clenxi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clenxi - Daily Claim & Referral Game",
    description: "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project.",
    url: baseUrl,
    siteName: "Clenxi",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "CLENXI Game Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clenxi - Daily Claim & Referral Game",
    description: "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project.",
    images: ["/logo.png"],
    creator: "@clenix",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  other: {
    // Farcaster Frame Meta Tags
    "fc:frame": "vNext",
    "fc:frame:image": `${baseUrl}/logo.png`,
    "fc:frame:button:1": "🎮 Play Clenxi Game",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": baseUrl,
    // Farcaster Mini App Meta Tags
    "farcaster:miniapp": "true",
    "farcaster:miniapp:name": "Clenxi",
    "farcaster:miniapp:description":
      "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project.",
    "farcaster:miniapp:icon": `${baseUrl}/logo.png`,
    "farcaster:miniapp:url": baseUrl,
    "farcaster:miniapp:manifest": `${baseUrl}/farcaster.config.json`,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* Farcaster Frame Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/logo.png`} />
        <meta property="fc:frame:button:1" content="🎮 Play Clenxi Game" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={baseUrl} />

        {/* Farcaster Mini App Meta Tags */}
        <meta property="farcaster:miniapp" content="true" />
        <meta property="farcaster:miniapp:name" content="Clenxi" />
        <meta
          property="farcaster:miniapp:description"
          content="Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project."
        />
        <meta property="farcaster:miniapp:icon" content={`${baseUrl}/logo.png`} />
        <meta property="farcaster:miniapp:url" content={baseUrl} />
        <meta property="farcaster:miniapp:manifest" content={`${baseUrl}/farcaster.config.json`} />
      </head>
      <body className={inter.className}>
        <FarcasterProvider>
          {children}
          <Toaster />
        </FarcasterProvider>
      </body>
    </html>
  )
}
