import { Toaster } from "@/components/ui/toaster";
import { TRPCProvider } from "@/src/providers/trpc-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
