import Link from "next/link"
import { OfferPulseMark } from "@/components/OfferPulseMark"

const footerLinks = {
  product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
  ],
  company: [
    { href: "/blog", label: "Blog" },
    { href: "/how-it-works", label: "About" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/20" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="OfferPulse home"
            >
              <OfferPulseMark size={24} animated={false} />
              <span className="text-xl font-bold tracking-tight text-ink">
                OfferPulse
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-body">
              Get instant alerts when competitors change their offers. 
              Track promos, bundles, free shipping, and cart incentives automatically.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-bold text-ink">Product</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-body transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-bold text-ink">Company</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-body transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-bold text-ink">Legal</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-body transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border pt-8">
          <p className="text-center text-sm text-body/70">
            Made for Shopify sellers. © {currentYear} OfferPulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
