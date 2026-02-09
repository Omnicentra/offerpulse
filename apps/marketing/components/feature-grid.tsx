import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, Truck, Gift, ShoppingCart, RotateCcw } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const features = [
  {
    icon: Tag,
    title: "Promos & discounts",
    description:
      "Percentage off, fixed discounts, flash sales, and seasonal promotions. Know when competitors drop prices before your customers do.",
    example: "e.g. 20% OFF sitewide, SAVE15 code",
  },
  {
    icon: Truck,
    title: "Free shipping thresholds",
    description:
      "Track when competitors adjust their free shipping minimums. A £5 drop in threshold can shift basket sizes across your market.",
    example: "e.g. Free shipping over £35",
  },
  {
    icon: Gift,
    title: "Bundles & multi-buy",
    description:
      "Buy-one-get-one, 3-for-2, and bundle deals. These offers often outperform straight discounts — and your competitors know it.",
    example: "e.g. 3 for 2 on selected lines",
  },
  {
    icon: ShoppingCart,
    title: "Cart & checkout incentives",
    description:
      "Countdown timers, exit-intent popups, and upsells. We capture the psychological triggers competitors use at the point of purchase.",
    example: "e.g. Spend £10 more for free gift",
  },
  {
    icon: RotateCcw,
    title: "Delivery & returns promises",
    description:
      "Next-day delivery, extended returns, and money-back guarantees. These trust signals can be the deciding factor for hesitant shoppers.",
    example: "e.g. Next-day delivery, 30-day returns",
  },
]

export function FeatureGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className={cn(
            "transition-shadow hover:shadow-md",
            index === features.length - 1 && features.length % 3 === 2 && "sm:col-span-2 lg:col-span-1"
          )}
        >
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <feature.icon className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-lg">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              {feature.description}
            </CardDescription>
            <p className="mt-3 rounded border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {feature.example}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
