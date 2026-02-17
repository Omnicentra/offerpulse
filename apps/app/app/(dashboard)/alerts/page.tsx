"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type ChangeEventType =
  | "PROMO"
  | "SHIPPING"
  | "BUNDLE"
  | "CART_INCENTIVE"
  | "DELIVERY_RETURNS";

export default function AlertsPage() {
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery(
    trpc.alerts.get.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when data loads
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateMutation = useMutation(
    trpc.alerts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.alerts.get.queryFilter());
        toast({
          title: "Settings saved",
          description: "Your alert settings have been updated.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update settings",
          variant: "destructive",
        });
      },
    })
  );

  const testMutation = useMutation(
    trpc.alerts.test.mutationOptions({
      onSuccess: (result) => {
        toast({
          title: result.message,
          description: "Check your inbox or Slack channel",
        });
      },
      onError: (error) => {
        toast({
          title: "Test failed",
          description: error.message || "Failed to send test notification",
          variant: "destructive",
        });
      },
    })
  );

  const handleSave = () => {
    if (!localSettings || !workspaceId) return;
    updateMutation.mutate({
      workspaceId,
      emailEnabled: localSettings.emailEnabled,
      slackEnabled: localSettings.slackEnabled,
      slackWebhookUrl: localSettings.slackWebhookUrl ?? undefined,
      eventTypes: localSettings.eventTypes ?? undefined,
      minConfidence: localSettings.minConfidence,
    });
  };

  const handleTestNotification = () => {
    if (!workspaceId) return;
    testMutation.mutate({ workspaceId });
  };

  const eventTypeLabels: Record<ChangeEventType, string> = {
    PROMO: "Promotions & Discounts",
    SHIPPING: "Shipping Changes",
    BUNDLE: "Bundle Offers",
    CART_INCENTIVE: "Cart Incentives",
    DELIVERY_RETURNS: "Delivery & Returns",
  };

  if (isLoading || !localSettings) {
    return (
      <div>
        <PageHeader title="Alerts" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Alerts"
        description="Configure how you want to be notified about competitor changes"
      />

      {/* Email Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Email Notifications</h2>
            <p className="mt-1 text-sm text-slate-600">
              Receive email alerts when changes are detected
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={localSettings.emailEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, emailEnabled: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600"></div>
          </label>
        </div>

        {localSettings.emailEnabled && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              Alerts will be sent to your registered email
            </p>
          </div>
        )}
      </div>

      {/* Slack Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Slack Notifications</h2>
            <p className="mt-1 text-sm text-slate-600">
              Send alerts to a Slack channel via webhook
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={localSettings.slackEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, slackEnabled: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600"></div>
          </label>
        </div>

        {localSettings.slackEnabled && (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="slackWebhook">Webhook URL</Label>
              <Input
                id="slackWebhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={localSettings.slackWebhookUrl || ""}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, slackWebhookUrl: e.target.value })
                }
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Create an{" "}
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Incoming Webhook
                </a>{" "}
                in your Slack workspace
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Event Types */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Alert Triggers</h2>
        <p className="mb-6 text-sm text-slate-600">
          Choose which types of changes should trigger alerts
        </p>

        <div className="space-y-3">
          {(Object.keys(eventTypeLabels) as ChangeEventType[]).map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localSettings.eventTypes?.includes(type) || false}
                onChange={(e) => {
                  const currentTypes = localSettings.eventTypes || [];
                  const newTypes = e.target.checked
                    ? [...currentTypes, type]
                    : currentTypes.filter((t) => t !== type);
                  setLocalSettings({ ...localSettings, eventTypes: newTypes });
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              />
              <span className="text-sm font-medium text-slate-900">
                {eventTypeLabels[type]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Confidence Threshold</h2>
        <p className="mb-6 text-sm text-slate-600">
          Only send alerts for changes with at least this confidence level
        </p>

        <div className="grid grid-cols-3 gap-3">
          {(["low", "medium", "high"] as const).map((level) => (
            <label
              key={level}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors ${
                localSettings.minConfidence === level
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="confidence"
                value={level}
                checked={localSettings.minConfidence === level}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    minConfidence: e.target.value as "low" | "medium" | "high",
                  })
                }
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize text-slate-900">{level}</span>
              <span className="mt-1 text-xs text-slate-600">
                {level === "low" && "All changes"}
                {level === "medium" && "Medium & High"}
                {level === "high" && "High confidence only"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div>
          <p className="text-sm font-medium text-slate-900">Test your alert settings</p>
          <p className="mt-1 text-sm text-slate-600">
            Send a test notification to verify your configuration
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleTestNotification}
          disabled={testMutation.isPending}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {testMutation.isPending ? "Sending..." : "Send Test"}
        </Button>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => setLocalSettings(settings)}
          variant="outline"
          disabled={updateMutation.isPending}
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
