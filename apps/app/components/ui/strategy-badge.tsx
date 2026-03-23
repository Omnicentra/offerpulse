import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

/** Aligned with `recommendation_strategy` in the database */
export type RecommendationStrategy =
  RouterOutputs["recommendations"]["list"][number]["strategy"];

export const RECOMMENDATION_STRATEGY_BADGE_CLASSES: Record<RecommendationStrategy, string> = {
  MATCH: "bg-blue-100 text-blue-800 border-blue-200",
  COUNTER: "bg-purple-100 text-purple-800 border-purple-200",
  IGNORE: "bg-slate-100 text-slate-800 border-slate-200",
  TEST: "bg-orange-100 text-orange-800 border-orange-200",
};

/** Human-readable labels for filters and UI */
export const RECOMMENDATION_STRATEGY_LABELS: Record<RecommendationStrategy, string> = {
  MATCH: "Match",
  COUNTER: "Counter",
  IGNORE: "Ignore",
  TEST: "Test",
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
