"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Mail, Users, Download, Sparkles } from "lucide-react"
import { CTA_LABELS } from "@/lib/constants/cta"

interface RecurringValueBridgeProps {
  competitorDomain?: string
}

const paidBenefits = [
  {
    icon: Bell,
    title: "Promo change alerts",
    description: "Get instant email notifications when offers change",
  },
  {
    icon: Clock,
    title: "30/90 day offer history",
    description: "Timeline view of all offer changes over time",
  },
  {
    icon: Mail,
    title: "Weekly competitor pulse digest",
    description: "Summary of all competitor activity delivered every Monday",
  },
  {
    icon: Users,
    title: "Monitor multiple competitors",
    description: "Track up to 10 competitors on Growth plan, unlimited on Scale",
  },
  {
    icon: Download,
    title: "Export & share reports",
    description: "Download CSV or share reports with your team",
  },
]

export function RecurringValueBridge({ competitorDomain }: RecurringValueBridgeProps) {
  return (
    <section className="border-t border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <Badge className="mb-4 bg-blue-600 text-white">
            <Sparkles className="mr-1 h-3 w-3" />
            The conversion bridge
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Make this recurring: get alerts and history
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            This was a <strong>free one-time snapshot</strong>.{" "}
            {competitorDomain && (
              <>
                Turn on monitoring for <strong>{competitorDomain}</strong> to:
              </>
            )}
            {!competitorDomain && "Turn on monitoring to:"}
          </p>
        </div>

        {/* Paid benefits grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paidBenefits.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <Card key={idx} className="border-slate-200 bg-white transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{benefit.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/snapshot">{CTA_LABELS.POST_RESULT}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/snapshot">{CTA_LABELS.ADD_COMPETITORS}</Link>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
