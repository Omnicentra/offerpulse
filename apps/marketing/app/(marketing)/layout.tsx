import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SkipToContent } from "@/components/skip-to-content"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
