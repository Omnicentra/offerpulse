import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import MetaPixel from "@/components/MetaPixel"
import { Analytics } from "@vercel/analytics/next"
import { CANONICAL_BASE_URL, SITE_CONFIG, ORGANIZATION, SOCIAL_LINKS } from "@/lib/seo/config"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "competitor monitoring",
    "Shopify",
    "e-commerce",
    "competitive intelligence",
    "offer tracking",
    "price monitoring",
    "promotional alerts",
    "competitor offers",
    "ecommerce tools",
  ],
  authors: [{ name: ORGANIZATION.name }],
  creator: ORGANIZATION.name,
  publisher: ORGANIZATION.name,
  metadataBase: new URL(CANONICAL_BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: CANONICAL_BASE_URL,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "OfferPulse - Competitor offer changes. Instantly.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: ["/og/og-default.png"],
    site: "@OfferPulseio",
    creator: "@OfferPulseio",
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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Organization and WebSite schemas
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: ORGANIZATION.url,
    logo: ORGANIZATION.logo,
    description: ORGANIZATION.description,
    foundingDate: ORGANIZATION.foundingDate,
    email: ORGANIZATION.email,
    sameAs: Object.values(SOCIAL_LINKS).filter(Boolean),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: CANONICAL_BASE_URL,
    description: SITE_CONFIG.description,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION.name,
    },
  };

  return (
    <html lang="en-GB" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen font-sans page-bg">
        <MetaPixel />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
