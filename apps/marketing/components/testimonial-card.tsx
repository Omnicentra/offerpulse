"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

interface TestimonialCardProps {
  quote: string
  role: string
  image?: string
  className?: string
}

export function TestimonialCard({ quote, role, image, className }: TestimonialCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border bg-white transition-all hover:shadow-soft-lg hover:-translate-y-1",
        className
      )}
    >
      <CardContent className={cn("p-6", image && "pb-32 sm:pb-24")}>
        <Quote className="mb-4 h-7 w-7 text-primary/30" aria-hidden />
        <p className="text-base leading-relaxed text-ink">
          "{quote}"
        </p>
        <p className="mt-5 text-sm font-medium text-body">
          {role}
        </p>
      </CardContent>
      
      {/* Testimonial Image - Bottom Right with white background blend */}
      {image && (
        <div className="absolute bottom-0 right-0 h-40 w-32 overflow-hidden rounded-tl-3xl bg-white">
          <div className="relative h-full w-full">
            <Image
              src={image}
              alt={role}
              fill
              className="object-cover object-top"
              sizes="128px"
            />
          </div>
        </div>
      )}
    </Card>
  )
}
