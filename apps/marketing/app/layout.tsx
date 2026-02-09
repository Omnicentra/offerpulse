import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "OfferPulse | Competitor Offer Monitoring for Shopify Sellers",
    template: "%s | OfferPulse",
  },
  description:
    "OfferPulse alerts you when competitors change their offers — promos, bundles, free shipping thresholds, and cart incentives — so you can react fast and protect conversion.",
  keywords: [
    "competitor monitoring",
    "Shopify",
    "e-commerce",
    "competitive intelligence",
    "offer tracking",
    "price monitoring",
    "promotional alerts",
  ],
  authors: [{ name: "OfferPulse" }],
  creator: "OfferPulse",
  publisher: "OfferPulse",
  metadataBase: new URL("https://offerpulse.io"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://offerpulse.io",
    siteName: "OfferPulse",
    title: "OfferPulse | Competitor Offer Monitoring for Shopify Sellers",
    description:
      "Get alerted when competitors change their offers. Monitor promos, bundles, shipping thresholds, and cart incentives.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "OfferPulse - Competitor Offer Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OfferPulse | Competitor Offer Monitoring for Shopify Sellers",
    description:
      "Get alerted when competitors change their offers. Monitor promos, bundles, shipping thresholds, and cart incentives.",
    images: ["/og.png"],
    creator: "@offerpulse",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="min-h-screen font-sans page-bg">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
