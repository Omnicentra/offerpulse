import { cn } from "@offerpulse/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  /** Optional subtle background tint */
  variant?: "default" | "muted" | "gradient"
}

export function Section({ children, className, variant = "default" }: SectionProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-24 lg:py-28",
        variant === "muted" && "bg-muted/30",
        variant === "gradient" && "electric-glow",
        className
      )}
    >
      {children}
    </section>
  )
}
