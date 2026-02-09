import { cn } from "@offerpulse/lib/utils"

interface SubheadingProps {
  children: React.ReactNode
  className?: string
  /** Max width for readability */
  narrow?: boolean
  /** Size variant */
  size?: "default" | "lg"
}

export function Subheading({
  children,
  className,
  narrow = true,
  size = "default",
}: SubheadingProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground leading-relaxed",
        {
          "text-base sm:text-lg": size === "default",
          "text-lg sm:text-xl lg:text-2xl": size === "lg",
        },
        narrow && "max-w-2xl",
        className
      )}
    >
      {children}
    </p>
  )
}
