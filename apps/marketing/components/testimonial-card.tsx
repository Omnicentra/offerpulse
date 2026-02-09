"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

interface TestimonialCardProps {
  quote: string
  role: string
  className?: string
}

export function TestimonialCard({ quote, role, className }: TestimonialCardProps) {
  return (
    <Card
      className={cn(
        "border-border bg-surface transition-all hover:shadow-soft-lg hover:-translate-y-1",
        className
      )}
    >
      <CardContent className="p-6">
        <Quote className="mb-4 h-7 w-7 text-primary/30" aria-hidden />
        <p className="text-base leading-relaxed text-ink">
          "{quote}"
        </p>
        <p className="mt-5 text-sm font-medium text-body">
          {role}
        </p>
      </CardContent>
    </Card>
  )
}
