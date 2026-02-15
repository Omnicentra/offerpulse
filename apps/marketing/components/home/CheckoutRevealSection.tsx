import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";
import { CheckoutRevealDemo } from "./CheckoutRevealDemo";
import { CheckCircle } from "lucide-react";

export function CheckoutRevealSection() {
  return (
    <Section className="border-b border-border">
      <Container>
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy + CTA */}
          <div className="order-2 lg:order-1 max-w-xl lg:max-w-none">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Price trackers miss what happens at checkout
            </h2>
            
            <p className="mt-6 text-lg leading-relaxed text-body">
              Competitors don't always change price. They change the offer stack: free shipping thresholds, bundles, gifts, and cart incentives. OfferPulse detects it and alerts you.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Detect promo mechanics, not just prices",
                "See evidence, history, and what changed",
                "Respond with the right lever to protect CVR and AOV",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-mint" />
                  <span className="text-base text-body leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/snapshot">Generate free snapshot</Link>
              </Button>
            </div>
          </div>

          {/* Right: Animated demo */}
          <div className="order-1 lg:order-2">
            <CheckoutRevealDemo />
          </div>
        </div>
      </Container>
    </Section>
  );
}
