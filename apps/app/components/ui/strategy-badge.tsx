import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import type { RecommendationStrategy } from "@/src/mock/types";

interface StrategyBadgeProps {
  strategy: RecommendationStrategy;
  className?: string;
}

export function StrategyBadge({ strategy, className }: StrategyBadgeProps) {
  const variants: Record<RecommendationStrategy, string> = {
    MATCH: "bg-blue-100 text-blue-800 border-blue-200",
    COUNTER: "bg-purple-100 text-purple-800 border-purple-200",
    IGNORE: "bg-slate-100 text-slate-800 border-slate-200",
    TEST: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return (
    <Badge variant="outline" className={cn(variants[strategy], className)}>
      {strategy}
    </Badge>
  );
}
