"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Unlink } from "lucide-react";

function SlackLogo({ className }: { className?: string }) {
  return (
    <img
      src="/slack-new-logo.svg"
      alt=""
      className={className}
      aria-hidden
    />
  );
}
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

  const searchParams = useSearchParams();
  const { data: settings, isLoading } = useQuery(
    trpc.alerts.get.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const { data: channels = [], isLoading: channelsLoading } = useQuery(
    trpc.alerts.listChannels.queryOptions(
      { workspaceId: workspaceId! },
      {
        enabled:
          !!workspaceId &&
          !!settings?.slackAccessToken &&
          !!settings?.slackTeamName,
      }
    )
  );

  const publicChannels = channels.filter((ch) => !ch.is_private);
  const privateChannels = channels.filter((ch) => ch.is_private);

  const [localSettings, setLocalSettings] = useState(settings);

  const disconnectMutation = useMutation(
    trpc.alerts.disconnectSlack.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.alerts.get.queryFilter());
        setLocalSettings((prev) =>
          prev
            ? {
                ...prev,
                slackTeamId: null,
                slackTeamName: null,
                slackAccessToken: null,
                slackBotUserId: null,
                slackChannel: null,
                slackChannelName: null,
                slackEnabled: false,
              }
            : prev
        );
        toast({
          title: "Slack disconnected",
          description: "Your workspace is no longer connected to Slack.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to disconnect Slack",
          variant: "destructive",
        });
      },
    })
  );

  // Update local settings when data loads
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Toast for OAuth callback result
  useEffect(() => {
    const slackConnected = searchParams.get("slack_connected");
    const error = searchParams.get("error");
    if (slackConnected === "true") {
      toast({
        title: "Slack connected",
        description: "Your workspace is now connected to Slack. Choose a channel below.",
      });
      window.history.replaceState({}, "", "/alerts");
    } else if (error === "oauth_failed") {
      toast({
        title: "Slack connection failed",
        description: "Could not connect to Slack. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/alerts");
    }
  }, [searchParams, toast]);

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
      slackChannel: localSettings.slackChannel ?? undefined,
      slackChannelName: localSettings.slackChannelName ?? undefined,
      captureNotificationsEnabled: localSettings.captureNotificationsEnabled,
      eventTypes: localSettings.eventTypes ?? undefined,
      minConfidence: localSettings.minConfidence,
    });
  };

  const handleDisconnectSlack = () => {
    if (!workspaceId) return;
    disconnectMutation.mutate({ workspaceId });
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
              Send alerts to a Slack channel via OAuth or webhook
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
            {!localSettings.slackTeamName ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (!workspaceId) return;
                    window.location.href = `/api/slack/install?workspace_id=${workspaceId}`;
                  }}
                >
                  <SlackLogo className="h-4 w-4" />
                  Connect to Slack
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Connected to {localSettings.slackTeamName}
                    </p>
                    {localSettings.slackChannelName && (
                      <p className="mt-0.5 text-xs text-slate-600">
                        Channel: #{localSettings.slackChannelName}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectSlack}
                    disabled={disconnectMutation.isPending}
                    className="gap-1.5"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="slack-channel">Notification Channel</Label>
                  <Select
                    value={localSettings.slackChannel ?? ""}
                    onValueChange={(channelId) => {
                      const ch = channels.find((c) => c.id === channelId);
                      setLocalSettings({
                        ...localSettings,
                        slackChannel: channelId || null,
                        slackChannelName: ch?.name ?? null,
                      });
                    }}
                    disabled={channelsLoading}
                  >
                    <SelectTrigger id="slack-channel" className="mt-2">
                      <SelectValue placeholder="Select a channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Public Channels</SelectLabel>
                        {publicChannels.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>
                            #{ch.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {privateChannels.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Private Channels</SelectLabel>
                            {privateChannels.map((ch) => (
                              <SelectItem key={ch.id} value={ch.id}>
                                🔒 {ch.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-slate-500">
                    Notifications will be sent to this channel. Invite the app to
                    private channels if needed.
                  </p>
                </div>
              </div>
            )}
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

      {/* Capture Notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Capture Notifications
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Get notified after every scheduled scan, even if no changes are
              detected
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Note: This may result in frequent notifications
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={localSettings.captureNotificationsEnabled ?? false}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  captureNotificationsEnabled: e.target.checked,
                })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600"></div>
          </label>
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
