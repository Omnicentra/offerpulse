"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import { PriceComparisonBadge } from "./price-comparison-badge";

interface StoreContextCardProps {
  productName: string;
  yourPrice: number;
  competitorPrice: number;
  currency?: string;
  priceHistory?: Array<{ date: string; price: number }>; // Reserved for future chart
  activePromos?: Array<{ name: string; discountType: string; discountValue: string | number }>;
}

export function StoreContextCard({
  productName,
  yourPrice,
  competitorPrice,
  currency = "GBP",
  priceHistory: _priceHistory,
  activePromos,
}: StoreContextCardProps) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(p);

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-slate-900">Your store</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-slate-600">{productName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {formatPrice(yourPrice)}
            </span>
            <PriceComparisonBadge
              yourPrice={yourPrice}
              theirPrice={competitorPrice}
              currency={currency}
            />
          </div>
        </div>
        {activePromos && activePromos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activePromos.map((p) => (
              <Badge key={p.name} variant="secondary" className="text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
