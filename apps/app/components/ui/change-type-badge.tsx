import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import type { ChangeEventType } from "@/src/mock/types";

interface ChangeTypeBadgeProps {
  type: ChangeEventType;
  className?: string;
}

export function ChangeTypeBadge({ type, className }: ChangeTypeBadgeProps) {
  const variants: Record<ChangeEventType, string> = {
    PROMO: "bg-purple-100 text-purple-800 border-purple-200",
    SHIPPING: "bg-blue-100 text-blue-800 border-blue-200",
    BUNDLE: "bg-orange-100 text-orange-800 border-orange-200",
    CART_INCENTIVE: "bg-green-100 text-green-800 border-green-200",
    DELIVERY_RETURNS: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  const labels: Record<ChangeEventType, string> = {
    PROMO: "Promo",
    SHIPPING: "Shipping",
    BUNDLE: "Bundle",
    CART_INCENTIVE: "Cart",
    DELIVERY_RETURNS: "Delivery",
  };

  return (
    <Badge variant="outline" className={cn(variants[type], className)}>
      {labels[type]}
    </Badge>
  );
}
