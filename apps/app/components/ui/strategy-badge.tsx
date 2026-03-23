import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import {
  RECOMMENDATION_STRATEGY_LABELS,
  RecommendationStrategy,
} from "@offerpulse/lib/constants";

export const RECOMMENDATION_STRATEGY_BADGE_CLASSES: Record<RecommendationStrategy, string> = {
  [RecommendationStrategy.MATCH]: "bg-blue-100 text-blue-800 border-blue-200",
  [RecommendationStrategy.COUNTER]: "bg-purple-100 text-purple-800 border-purple-200",
  [RecommendationStrategy.IGNORE]: "bg-slate-100 text-slate-800 border-slate-200",
  [RecommendationStrategy.TEST]: "bg-orange-100 text-orange-800 border-orange-200",
};

const RECOMMENDATION_STRATEGY_VALUES = new Set<string>(Object.values(RecommendationStrategy));

function normalizeRecommendationStrategy(raw: string): RecommendationStrategy {
  return RECOMMENDATION_STRATEGY_VALUES.has(raw)
    ? (raw as RecommendationStrategy)
    : RecommendationStrategy.TEST;
}

interface StrategyBadgeProps {
  /** `RecommendationStrategy` value from DB / tRPC (string literal union is accepted at call sites) */
  strategy: string;
  className?: string;
}

export function StrategyBadge({ strategy, className }: StrategyBadgeProps) {
  const s = normalizeRecommendationStrategy(String(strategy));
  return (
    <Badge variant="outline" className={cn(RECOMMENDATION_STRATEGY_BADGE_CLASSES[s], className)}>
      {RECOMMENDATION_STRATEGY_LABELS[s]}
    </Badge>
  );
}
