import { Metadata } from "next"
import { SectionHeading } from "@/components/section-heading"

export const metadata: Metadata = {
  title: "Privacy Policy | OfferPulse",
  description:
    "OfferPulse Privacy Policy. Learn how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy | OfferPulse",
    description: "Learn how we collect, use, and protect your data.",
  },
}

export default function PrivacyPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Privacy Policy"
            description="Last updated: January 2025"
          />
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold text-foreground">
              1. Introduction
            </h2>
            <p className="mt-4 text-muted-foreground">
              OfferPulse (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              competitor offer monitoring service.
            </p>
            <p className="mt-4 text-muted-foreground">
              By using OfferPulse, you agree to the collection and use of
              information in accordance with this policy.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <h3 className="mt-6 text-lg font-medium text-foreground">
              2.1 Information You Provide
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Account Information:</strong> Email address, password,
                and optional store URL when you create an account.
              </li>
              <li>
                <strong>Competitor URLs:</strong> The URLs of competitor pages
                you choose to monitor.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details processed
                securely through our payment provider (Stripe). We do not store
                full card numbers.
              </li>
              <li>
                <strong>Communications:</strong> Information you provide when
                contacting our support team.
              </li>
            </ul>

            <h3 className="mt-6 text-lg font-medium text-foreground">
              2.2 Information Collected Automatically
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our service, including features used and time spent.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, and device identifiers.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and pages
                viewed.
              </li>
              <li>
                <strong>Analytics:</strong> We use analytics tools (e.g.
                PostHog) to improve our product and user experience. With your
                consent or where otherwise permitted, this may include your
                email address in association with usage events (e.g. sign-up
                completion) for analysis and support.
              </li>
            </ul>

            <h3 className="mt-6 text-lg font-medium text-foreground">
              2.3 Competitor Data
            </h3>
            <p className="mt-4 text-muted-foreground">
              We collect publicly available information from competitor websites
              you specify, including promotional offers, pricing displays,
              shipping information, and other publicly visible content. This
              data is collected solely to provide our monitoring service to you.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <p className="mt-4 text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide, maintain, and improve our service</li>
              <li>
                Monitor competitor pages and deliver alerts and reports to you
              </li>
              <li>Process payments and manage your subscription</li>
              <li>
                Send you service-related communications (alerts, digests,
                account notifications)
              </li>
              <li>Respond to your enquiries and provide customer support</li>
              <li>
                Analyse usage patterns to improve our product and user
                experience
              </li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              4. Information Sharing
            </h2>
            <p className="mt-4 text-muted-foreground">
              We do not sell your personal information. We may share information
              with:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong>Service Providers:</strong> Third parties that help us
                operate our service (hosting, payment processing, email
                delivery).
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets.
              </li>
            </ul>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              5. Data Retention
            </h2>
            <p className="mt-4 text-muted-foreground">
              We retain your account information for as long as your account is
              active. Competitor monitoring data is retained according to your
              plan&apos;s history limits (30, 90, or unlimited days). You may request
              deletion of your data at any time by contacting us.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              6. Data Security
            </h2>
            <p className="mt-4 text-muted-foreground">
              We implement appropriate technical and organisational measures to
              protect your personal information, including encryption in transit
              and at rest, secure access controls, and regular security
              assessments. However, no method of transmission over the internet
              is 100% secure.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p className="mt-4 text-muted-foreground">
              Depending on your location, you may have the right to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Request portability of your data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              To exercise these rights, contact us at privacy@offerpulse.io.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              8. Cookies
            </h2>
            <p className="mt-4 text-muted-foreground">
              We use essential cookies to operate our service and optional
              analytics cookies to understand usage. You can control cookie
              preferences through your browser settings.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              9. International Transfers
            </h2>
            <p className="mt-4 text-muted-foreground">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              for such transfers in compliance with applicable data protection
              laws.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              10. Children&apos;s Privacy
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our service is not intended for individuals under 18 years of age.
              We do not knowingly collect personal information from children.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              11. Changes to This Policy
            </h2>
            <p className="mt-4 text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by email or through our service.
              Your continued use after changes constitutes acceptance of the
              updated policy.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              12. Contact Us
            </h2>
            <p className="mt-4 text-muted-foreground">
              If you have questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <p className="mt-4 text-muted-foreground">
              Email: privacy@offerpulse.io
              <br />
              Address: OfferPulse Ltd, London, United Kingdom
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
