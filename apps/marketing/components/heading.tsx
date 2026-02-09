import { cn } from "@offerpulse/lib/utils"

interface HeadingProps {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3"
  className?: string
  /** Tight leading for large headlines */
  tight?: boolean
  /** Apply gradient effect */
  gradient?: boolean
}

export function Heading({
  children,
  as: Tag = "h2",
  className,
  tight = true,
  gradient = false,
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        "font-bold tracking-tight",
        Tag === "h1" && "text-4xl sm:text-5xl lg:text-6xl",
        Tag === "h2" && "text-3xl sm:text-4xl lg:text-5xl",
        Tag === "h3" && "text-2xl sm:text-3xl lg:text-4xl",
        tight && "leading-tight",
        gradient 
          ? "bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent"
          : "text-foreground",
        className
      )}
    >
      {children}
    </Tag>
  )
}
