import { Toaster } from "@/components/ui/toaster";
import { TRPCProvider } from "@/src/providers/trpc-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-tourlight/styles.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "OfferPulse Dashboard",
    template: "%s | OfferPulse",
  },
  description: "Monitor competitor offers and stay ahead of the competition",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <TRPCProvider>
          {children}
          <Toaster />
        </TRPCProvider>
      </body>
    </html>
  );
}
