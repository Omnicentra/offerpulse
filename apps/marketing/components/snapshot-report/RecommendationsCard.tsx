import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle, Lock, ArrowRight } from "lucide-react";

interface Recommendation {
  title: string;
  description: string;
  effort: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
}

interface RecommendationsCardProps {
  visibleRecommendations: Recommendation[];
  lockedCount: number;
  signupUrl: string;
}

export function RecommendationsCard({ visibleRecommendations, lockedCount, signupUrl }: RecommendationsCardProps) {
  const getEffortColor = (effort: string) => {
    if (effort === "Low") return "bg-green-100 text-green-800";
    if (effort === "Medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getImpactColor = (impact: string) => {
    if (impact === "High") return "bg-green-100 text-green-800";
    if (impact === "Medium") return "bg-yellow-100 text-yellow-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Suggested Actions to Respond</CardTitle>
        <p className="text-sm text-slate-600">
          Based on what we detected, here's how you could respond strategically
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visible Recommendations */}
        <div className="space-y-4">
          {visibleRecommendations.map((rec, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{rec.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={`text-xs ${getEffortColor(rec.effort)}`}>
                    {rec.effort} effort
                  </Badge>
                  <Badge className={`text-xs ${getImpactColor(rec.impact)}`}>
                    {rec.impact} impact
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Locked Recommendations */}
        {lockedCount > 0 && (
          <div className="space-y-3">
            {Array.from({ length: lockedCount }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 opacity-60 blur-sm"
              >
                <Lock className="h-5 w-5 text-slate-400" />
                <div className="h-4 w-full max-w-md rounded bg-slate-200" />
              </div>
            ))}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-blue-600" />
              <p className="mt-3 font-semibold text-slate-900">
                Unlock {lockedCount} more strategic recommendations
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Get alerts when competitors change + see full recommended responses
              </p>
              <Button asChild size="lg" className="mt-4">
                <Link href={signupUrl}>
                  Start monitoring
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
