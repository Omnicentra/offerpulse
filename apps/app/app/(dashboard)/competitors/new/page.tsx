"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";

const competitorSchema = z.object({
  url: z.url("Please enter a valid URL"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  tags: z.array(z.string()).optional(),
  frequency: z.enum(["daily", "6h", "1h"]),
  trackPromos: z.boolean(),
  trackShipping: z.boolean(),
  trackBundles: z.boolean(),
  trackCart: z.boolean(),
  trackDeliveryReturns: z.boolean(),
});

type CompetitorForm = z.infer<typeof competitorSchema>;

export default function NewCompetitorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompetitorForm>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      frequency: "daily",
      trackPromos: true,
      trackShipping: true,
      trackBundles: true,
      trackCart: true,
      trackDeliveryReturns: true,
    },
  });

  const frequency = watch("frequency");

  // Auto-suggest name from URL
  const suggestName = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      const name = domain
        .split(".")[0]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setValue("name", name);
    } catch {
      // Invalid URL, ignore
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const createMutation = useMutation(
    trpc.competitors.create.mutationOptions({
      onSuccess: (competitor) => {
        queryClient.invalidateQueries(trpc.competitors.list.queryFilter());
        toast({
          title: "Competitor added",
          description: `${competitor.name} is now being monitored.`,
        });
        router.push(`/competitors/${competitor.id}`);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add competitor",
          variant: "destructive",
        });
      },
    })
  );

  const onSubmit = (data: CompetitorForm) => {
    if (!workspaceId) return;
    const urlObj = new URL(data.url);
    const baseUrl = urlObj.origin;
    const domain = urlObj.hostname.replace(/^www\./, "");
    createMutation.mutate({
      workspaceId,
      name: data.name,
      domain,
      baseUrl,
      tags,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Add Competitor"
        description="Start monitoring a competitor's offers and pricing"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Basic Information</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="url">Competitor URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://competitor.com"
                {...register("url")}
                onBlur={(e) => suggestName(e.target.value)}
                aria-invalid={errors.url ? "true" : "false"}
              />
              {errors.url && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Competitor Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Competitor Name"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  type="text"
                  placeholder="Add a tag (e.g., fashion, premium)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-slate-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Monitoring Settings</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Capture Frequency</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["daily", "6h", "1h"] as const).map((freq) => (
                  <label
                    key={freq}
                    className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors ${
                      frequency === freq
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={freq}
                      {...register("frequency")}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {freq === "daily" ? "Daily" : freq === "6h" ? "Every 6h" : "Hourly"}
                    </span>
                    {freq === "1h" && (
                      <Badge variant="secondary" className="mt-2 w-fit text-xs">
                        Pro
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
              {frequency === "1h" && (
                <p className="text-xs text-slate-600">
                  Hourly monitoring provides the most real-time insights for fast-moving competitors
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>What to Track</Label>
              <div className="space-y-2">
                {[
                  { key: "trackPromos", label: "Promotions & Discounts" },
                  { key: "trackShipping", label: "Shipping Offers" },
                  { key: "trackBundles", label: "Bundle Deals" },
                  { key: "trackCart", label: "Cart Incentives" },
                  { key: "trackDeliveryReturns", label: "Delivery & Returns" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      {...register(key as any)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    />
                    <span className="text-sm font-medium text-slate-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add Competitor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
