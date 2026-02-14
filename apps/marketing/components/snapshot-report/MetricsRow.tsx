import { Card, CardContent } from "@/components/ui/card";
import { Percent, Truck, Package, Gift, ShoppingCart, Clock } from "lucide-react";

interface MetricsRowProps {
  metrics: {
    discounts: number;
    shippingIncentives: number;
    bundles: number;
    gifts: number;
    cartIncentives: number;
    urgencyWidgets: number;
  };
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  const metricItems = [
    { label: "Discounts", value: metrics.discounts, icon: Percent, color: "text-purple-600" },
    { label: "Shipping", value: metrics.shippingIncentives, icon: Truck, color: "text-blue-600" },
    { label: "Bundles", value: metrics.bundles, icon: Package, color: "text-orange-600" },
    { label: "Gifts", value: metrics.gifts, icon: Gift, color: "text-green-600" },
    { label: "Cart", value: metrics.cartIncentives, icon: ShoppingCart, color: "text-indigo-600" },
    { label: "Urgency", value: metrics.urgencyWidgets, icon: Clock, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {metricItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="p-4 text-center">
              <Icon className={`mx-auto h-6 w-6 ${item.color}`} />
              <div className="mt-2 text-2xl font-bold text-slate-900">{item.value}</div>
              <div className="text-xs text-slate-600">{item.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
