import Link from "next/link"
import { OfferPulseMark } from "@/components/OfferPulseMark"
import { Linkedin, Instagram } from "lucide-react"

const footerLinks = {
  product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/free-tools", label: "Free tools" },
    { href: "/faq", label: "FAQ" },
  ],
  resources: [
    { href: "/blog", label: "Blog" },
    { href: "/guides/pricing-intelligence-vs-offer-intelligence", label: "Guides" },
    { href: "/about", label: "About" },
  ],
  comparisons: [
    { href: "/compare", label: "All comparisons" },
    { href: "/compare/offerpulse-vs-prisync", label: "vs Prisync" },
    { href: "/compare/offerpulse-vs-minderest", label: "vs Minderest" },
    { href: "/compare/offerpulse-vs-dataweave", label: "vs DataWeave" },
    { href: "/compare/offerpulse-vs-visualping", label: "vs Visualping" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
}

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/offerpulseio",
    icon: Linkedin,
    label: "Follow us on LinkedIn",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/offerpulse.io",
    icon: Instagram,
    label: "Follow us on Instagram",
  },
  {
    name: "X",
    href: "https://x.com/OfferPulseio",
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    label: "Follow us on X",
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/20" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
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

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-bold text-ink">Resources</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.resources.map((link) => (
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

          {/* Comparisons Links */}
          <div>
            <h3 className="text-sm font-bold text-ink">Comparisons</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.comparisons.map((link) => (
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

        {/* Social Links */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Follow us</h3>
              <div className="mt-4 flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={social.label}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-body transition-all hover:border-primary/50 hover:bg-primary-tint hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-sm text-body/70 sm:text-right">
              Made for Shopify sellers.
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>
              © {currentYear} OfferPulse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
