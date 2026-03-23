import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import {
  RECOMMENDATION_STRATEGY_LABELS,
  type RecommendationStrategy,
} from "@offerpulse/lib/constants";

export type { RecommendationStrategy };
export { RECOMMENDATION_STRATEGY_LABELS };

export const RECOMMENDATION_STRATEGY_BADGE_CLASSES: Record<RecommendationStrategy, string> = {
  MATCH: "bg-blue-100 text-blue-800 border-blue-200",
  COUNTER: "bg-purple-100 text-purple-800 border-purple-200",
  IGNORE: "bg-slate-100 text-slate-800 border-slate-200",
  TEST: "bg-orange-100 text-orange-800 border-orange-200",
};

interface StrategyBadgeProps {
  strategy: RecommendationStrategy;
  className?: string;
}

export function StrategyBadge({ strategy, className }: StrategyBadgeProps) {
  return (
    <Badge variant="outline" className={cn(RECOMMENDATION_STRATEGY_BADGE_CLASSES[strategy], className)}>
      {RECOMMENDATION_STRATEGY_LABELS[strategy]}
    </Badge>
  );
}
