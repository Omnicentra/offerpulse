"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@offerpulse/lib/utils"
import { 
  Plus, 
  Activity, 
  Bell, 
  CheckCircle, 
  Clock,
  Mail,
  MessageSquare
} from "lucide-react"

const steps = [
  {
    id: 0,
    label: "Step 1",
    title: "Add your competitors",
    description: "Paste competitor URLs and choose what to track.",
    bullets: ["Works best on Shopify stores", "Track promos, bundles, free shipping"],
    proofChip: "~2 mins setup",
    icon: Plus,
  },
  {
    id: 1,
    label: "Step 2",
    title: "We monitor for changes",
    description: "We snapshot pages multiple times per day and detect offer changes.",
    bullets: ["Before/after proof", "Change timeline"],
    proofChip: "Checks 6×/day",
    icon: Activity,
  },
  {
    id: 2,
    label: "Step 3",
    title: "Get alerted instantly",
    description: "Instant alerts with context — plus a weekly Competitive Pulse.",
    bullets: ["Email + Slack alerts", "Monday digest"],
    proofChip: "Alerts in <60s",
    icon: Bell,
  },
]

export function HowItWorksStepper() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      {/* Left: Vertical stepper */}
      <div className="lg:col-span-5">
        <div className="relative space-y-1">
          {/* Vertical progress line */}
          <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border" aria-hidden />
          
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            const isComplete = activeStep > step.id
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "group relative w-full rounded-xl p-5 text-left transition-all",
                  isActive && "bg-primary-tint/50 ring-1 ring-primary/20",
                  !isActive && "hover:bg-muted/40"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all",
                      isActive && "bg-primary text-white shadow-glow",
                      isComplete && "bg-mint/20 text-mint",
                      !isActive && !isComplete && "bg-muted text-body"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-body/60">
                        {step.label}
                      </span>
                      <div className="rounded-full bg-mint-tint px-2 py-0.5 text-xs font-medium text-mint">
                        {step.proofChip}
                      </div>
                    </div>
                    <h3 className={cn(
                      "text-lg font-bold transition-colors",
                      isActive ? "text-ink" : "text-ink/80"
                    )}>
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-body">
                      {step.description}
                    </p>
                    
                    {/* Bullets - only show when active */}
                    {isActive && (
                      <ul className="mt-3 space-y-2">
                        {step.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-body">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Product preview */}
      <div className="lg:col-span-7">
        <Card className="rounded-2xl bg-surface shadow-soft-lg">
          <CardContent className="p-0">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-ink">Offer Snapshot</span>
                <span className="text-sm text-body/60">— competitor-store.com</span>
              </div>
              <Badge className="rounded-full border-mint/30 bg-mint-tint px-2.5 py-0.5 text-xs font-medium text-mint">
                High confidence
              </Badge>
            </div>

            {/* Preview panels */}
            <div className="p-7 min-h-[380px]">
              {/* Step 0: Add competitors */}
              {activeStep === 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-ink">
                        Competitor URL
                      </label>
                      <Input 
                        placeholder="https://competitor-store.com"
                        className="h-11"
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-ink">
                        What to track
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-lg border border-mint/30 bg-mint-tint/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-mint" />
                            <span className="text-sm font-medium text-ink">Free shipping</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-mint/30 bg-mint-tint/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-mint" />
                            <span className="text-sm font-medium text-ink">Discount banners</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-mint/30 bg-mint-tint/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-mint" />
                            <span className="text-sm font-medium text-ink">Bundles</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button size="lg" className="w-full sm:w-auto" disabled>
                        Generate Snapshot
                      </Button>
                    </div>

                    <p className="text-xs leading-relaxed text-body/70">
                      We don't store competitor data unless you create an account.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Monitoring */}
              {activeStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-5">
                    <div className="rounded-xl bg-muted/40 p-5">
                      <h4 className="mb-4 text-sm font-bold text-ink">Monitoring schedule</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body">Next check</span>
                          <span className="font-semibold text-ink">12 min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body">Frequency</span>
                          <span className="font-semibold text-ink">6×/day</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-4 text-sm font-bold text-ink">Change timeline</h4>
                      <div className="space-y-3">
                        {[
                          { time: "2h ago", label: "Free shipping changed", status: "detected" },
                          { time: "Yesterday", label: "Promo banner updated", status: "detected" },
                          { time: "3 days ago", label: "Bundle offer removed", status: "ended" },
                        ].map((entry, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                          >
                            <Activity className="h-4 w-4 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink">{entry.label}</p>
                              <p className="text-xs text-body/60">{entry.time}</p>
                            </div>
                            <Badge className="rounded-full border-mint/30 bg-mint-tint px-2 py-0.5 text-xs font-medium text-mint">
                              {entry.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Alerts */}
              {activeStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-5">
                    <div className="rounded-xl border border-primary/20 bg-primary-tint/30 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-ink">Change detected</span>
                        </div>
                        <span className="text-xs font-medium text-body/60">Just now</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-ink">
                          Free shipping threshold changed
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="rounded bg-destructive/10 px-2 py-1 font-medium text-destructive line-through">
                            £50
                          </span>
                          <span className="text-body">→</span>
                          <span className="rounded bg-mint-tint px-2 py-1 font-semibold text-mint">
                            £35
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-tint/50 p-5 ring-1 ring-amber/20">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber/80">
                        Suggestion
                      </p>
                      <p className="text-sm leading-relaxed text-ink">
                        Match £35 threshold to protect basket size.
                      </p>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-body/60">
                        Send to
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-sm">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-ink">Email</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-sm">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-ink">Slack</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
