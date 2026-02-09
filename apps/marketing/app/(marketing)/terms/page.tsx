import { Metadata } from "next"
import { SectionHeading } from "@/components/section-heading"

export const metadata: Metadata = {
  title: "Terms of Service | OfferPulse",
  description:
    "OfferPulse Terms of Service. Read our terms and conditions for using the service.",
  openGraph: {
    title: "Terms of Service | OfferPulse",
    description: "Read our terms and conditions for using the service.",
  },
}

export default function TermsPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Terms of Service"
            description="Last updated: January 2025"
          />
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold text-foreground">
              1. Agreement to Terms
            </h2>
            <p className="mt-4 text-muted-foreground">
              By accessing or using OfferPulse (&quot;the Service&quot;), you agree to be
              bound by these Terms of Service (&quot;Terms&quot;). If you disagree with
              any part of these terms, you may not access the Service.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="mt-4 text-muted-foreground">
              OfferPulse is a competitive intelligence service that monitors
              publicly available information on competitor e-commerce websites.
              We provide alerts and reports on changes to promotional offers,
              shipping thresholds, bundle deals, and other publicly visible
              promotional content.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              3. Account Registration
            </h2>
            <p className="mt-4 text-muted-foreground">
              To use certain features of the Service, you must register for an
              account. You agree to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>
                Promptly notify us of any unauthorised use of your account
              </li>
              <li>
                Accept responsibility for all activities under your account
              </li>
            </ul>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p className="mt-4 text-muted-foreground">You agree not to:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                Use the Service for any unlawful purpose or in violation of
                applicable laws
              </li>
              <li>
                Attempt to gain unauthorised access to any part of the Service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>
                Use the Service to monitor websites you do not have legitimate
                competitive interest in
              </li>
              <li>
                Resell, redistribute, or sublicence the Service without our
                written permission
              </li>
              <li>
                Use automated means to access the Service beyond normal usage
                patterns
              </li>
              <li>
                Circumvent any usage limits or restrictions associated with your
                plan
              </li>
            </ul>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              5. Subscription and Payment
            </h2>
            <h3 className="mt-6 text-lg font-medium text-foreground">
              5.1 Free Trial
            </h3>
            <p className="mt-4 text-muted-foreground">
              We offer a 14-day free trial for new accounts. No payment
              information is required to start your trial. At the end of the
              trial period, you must subscribe to a paid plan to continue using
              the Service.
            </p>

            <h3 className="mt-6 text-lg font-medium text-foreground">
              5.2 Billing
            </h3>
            <p className="mt-4 text-muted-foreground">
              Paid subscriptions are billed monthly or annually in advance. All
              fees are quoted in British Pounds (GBP) unless otherwise stated.
              You authorise us to charge your payment method for all applicable
              fees.
            </p>

            <h3 className="mt-6 text-lg font-medium text-foreground">
              5.3 Cancellation
            </h3>
            <p className="mt-4 text-muted-foreground">
              You may cancel your subscription at any time. Upon cancellation,
              you will retain access to the Service until the end of your
              current billing period. We do not provide refunds for partial
              billing periods.
            </p>

            <h3 className="mt-6 text-lg font-medium text-foreground">
              5.4 Price Changes
            </h3>
            <p className="mt-4 text-muted-foreground">
              We reserve the right to modify our pricing. We will provide at
              least 30 days&apos; notice before any price increase takes effect.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              6. Intellectual Property
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Service, including its original content, features, and
              functionality, is owned by OfferPulse and is protected by
              intellectual property laws. Our trademarks and trade dress may not
              be used without our prior written consent.
            </p>
            <p className="mt-4 text-muted-foreground">
              Data collected from competitor websites remains publicly available
              information. We make no claim of ownership over competitor
              content. Your use of such data is subject to applicable laws and
              the terms of service of the monitored websites.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              7. Disclaimer of Warranties
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied. We do not
              warrant that:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>The Service will be uninterrupted or error-free</li>
              <li>The results obtained will be accurate or reliable</li>
              <li>
                The quality of any information obtained will meet your
                expectations
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              Competitor websites may change their structure, block monitoring,
              or display different content to different users. We cannot
              guarantee complete or accurate detection of all offers.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              8. Limitation of Liability
            </h2>
            <p className="mt-4 text-muted-foreground">
              To the maximum extent permitted by law, OfferPulse shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including loss of profits, data, or business
              opportunities, arising from your use of the Service.
            </p>
            <p className="mt-4 text-muted-foreground">
              Our total liability for any claims arising from your use of the
              Service shall not exceed the amount you paid us in the twelve (12)
              months preceding the claim.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              9. Indemnification
            </h2>
            <p className="mt-4 text-muted-foreground">
              You agree to indemnify and hold harmless OfferPulse, its officers,
              directors, employees, and agents from any claims, damages, or
              expenses arising from your use of the Service or violation of
              these Terms.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              10. Termination
            </h2>
            <p className="mt-4 text-muted-foreground">
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice, if you breach these Terms. Upon
              termination, your right to use the Service will cease immediately.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              11. Changes to Terms
            </h2>
            <p className="mt-4 text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will
              provide notice of material changes through the Service or by
              email. Your continued use of the Service after changes constitutes
              acceptance of the modified Terms.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              12. Governing Law
            </h2>
            <p className="mt-4 text-muted-foreground">
              These Terms shall be governed by and construed in accordance with
              the laws of England and Wales, without regard to conflict of law
              principles. Any disputes shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              13. Severability
            </h2>
            <p className="mt-4 text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary, and the remaining provisions shall
              remain in full force and effect.
            </p>

            <h2 className="mt-8 text-xl font-semibold text-foreground">
              14. Contact Us
            </h2>
            <p className="mt-4 text-muted-foreground">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mt-4 text-muted-foreground">
              Email: legal@offerpulse.io
              <br />
              Address: OfferPulse Ltd, London, United Kingdom
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
