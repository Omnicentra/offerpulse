"use client";

interface PriceComparisonBadgeProps {
  yourPrice: number;
  theirPrice: number;
  currency?: string;
}

export function PriceComparisonBadge({
  yourPrice,
  theirPrice,
  currency = "GBP",
}: PriceComparisonBadgeProps) {
  if (yourPrice === theirPrice) return null;

  const diff = yourPrice - theirPrice;
  const pct = yourPrice > 0 ? ((diff / yourPrice) * 100).toFixed(0) : "0";
  const isCheaper = diff > 0;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(p);

  if (isCheaper) {
    return (
      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
        {`You're ${formatPrice(Math.abs(diff))} cheaper`}
      </span>
    );
  }

  return (
    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
      {pct}% more vs competitor
    </span>
  );
}
