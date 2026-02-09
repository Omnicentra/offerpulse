import { cn } from "@offerpulse/lib/utils"

interface SectionHeadingProps {
  badge?: string
  title: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeading({
  badge,
  title,
  description,
  centered = true,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        centered && "mx-auto text-center",
        className
      )}
    >
      {badge && (
        <div
          className={cn(
            "mb-5 inline-flex rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary",
            centered && "mx-auto"
          )}
        >
          {badge}
        </div>
      )}
      <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-relaxed text-body">{description}</p>
      )}
    </div>
  )
}
