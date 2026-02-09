import { cn } from "@offerpulse/lib/utils"

const steps = [
  {
    number: "01",
    title: "Add your competitors",
    description:
      "Paste the URLs of the competitor pages you want to monitor. Works best with Shopify stores, but supports most e-commerce platforms.",
  },
  {
    number: "02",
    title: "We monitor for changes",
    description:
      "OfferPulse checks your competitors multiple times per day, detecting promos, shipping thresholds, bundles, and cart incentives automatically.",
  },
  {
    number: "03",
    title: "Get alerted instantly",
    description:
      "Receive instant alerts via email or Slack when something changes. Plus, get a weekly competitive pulse digest summarising all activity.",
  },
]

interface HowItWorksStepsProps {
  detailed?: boolean
}

export function HowItWorksSteps({ detailed = false }: HowItWorksStepsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.number} className="relative">
          {/* Connector line for desktop */}
          {index < steps.length - 1 && (
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-border md:block" />
          )}

          <div className="relative flex flex-col items-center text-center">
            {/* Step number */}
            <div
              className={cn(
                "relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-soft",
                "ring-4 ring-background"
              )}
            >
              {step.number}
            </div>

            {/* Content */}
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-muted-foreground",
                detailed ? "text-base" : "text-sm"
              )}
            >
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
