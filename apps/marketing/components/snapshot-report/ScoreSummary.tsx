import { Badge } from "@/components/ui/badge";
import type { OfferScore } from "@/lib/tools/scoring";

interface ScoreSummaryMetrics {
  discounts: number;
  shippingIncentives: number;
  bundles: number;
  gifts: number;
  cartIncentives: number;
  urgencyWidgets: number;
}

interface ScoreSummaryProps {
  score: OfferScore;
  interpretation: string;
  metrics: ScoreSummaryMetrics;
}

export function ScoreSummary({ score, interpretation, metrics }: ScoreSummaryProps) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "from-green-500 to-emerald-600";
    if (grade.startsWith("B")) return "from-blue-500 to-indigo-600";
    if (grade.startsWith("C")) return "from-yellow-500 to-orange-600";
    return "from-slate-400 to-slate-500";
  };

  const getIntensityBadge = (totalScore: number) => {
    if (totalScore >= 80) {
      return {
        label: "Very high",
        className: "bg-green-100 text-green-800",
      };
    }

    if (totalScore >= 50) {
      return {
        label: "High",
        className: "bg-emerald-50 text-emerald-800",
      };
    }

    if (totalScore >= 30) {
      return {
        label: "Moderate",
        className: "bg-yellow-50 text-yellow-800",
      };
    }

    return {
      label: "Low",
      className: "bg-slate-100 text-slate-800",
    };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Circular Score Ring */}
      <div className="flex justify-center">
        <div className="relative">
          {/* SVG Circle */}
          <svg className="h-64 w-64 -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(score.total / 100) * 534} 534`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`text-green-500`} stopColor="currentColor" />
                <stop offset="100%" className={`text-emerald-600`} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`mb-2 text-6xl font-bold bg-gradient-to-br ${getGradeColor(score.grade)} bg-clip-text text-transparent`}>
              {score.grade}
            </div>
            <div className="text-2xl font-semibold text-slate-900">{score.total}/100</div>
            <div className="mt-2 text-xs font-medium text-slate-600">Promo Intensity</div>
          </div>
        </div>
      </div>

      {/* Summary Text + Promo Intensity */}
      <div className="flex flex-col justify-center space-y-6">
        <div>
          {(() => {
            const intensity = getIntensityBadge(score.total);
            return (
              <Badge className={intensity.className}>
                {intensity.label} promo intensity
              </Badge>
            );
          })()}
          <p className="mt-4 text-xl text-slate-700 leading-relaxed">
            {interpretation}
          </p>
        </div>

        {/* Score Breakdown - real offer mechanics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { key: "discounts", label: "Discounts", value: metrics.discounts },
            { key: "shippingIncentives", label: "Shipping", value: metrics.shippingIncentives },
            { key: "bundles", label: "Bundles", value: metrics.bundles },
            { key: "gifts", label: "Gifts", value: metrics.gifts },
            { key: "cartIncentives", label: "Cart incentives", value: metrics.cartIncentives },
            { key: "urgencyWidgets", label: "Urgency", value: metrics.urgencyWidgets },
          ]
            .filter((item) => item.value > 0)
            .map((item) => (
              <div key={item.key} className="rounded-lg bg-slate-50 p-3">
                <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                <div className="text-xs text-slate-600">{item.label}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
