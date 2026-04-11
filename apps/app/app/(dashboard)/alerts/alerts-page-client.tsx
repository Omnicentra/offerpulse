"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Unlink, Mail, MessageSquare, SlidersHorizontal, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type AlertSettings = RouterOutputs["alerts"]["get"];

interface AlertsPageClientProps {
  workspaceId: string;
}

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 2447.6 2452.5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill="#36c5f0"
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill="#2eb67d"
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill="#ecb22e"
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill="#e01e5a"
        />
      </g>
    </svg>
  );
}

type ChangeEventType =
  | "PROMO"
  | "SHIPPING"
  | "BUNDLE"
  | "CART_INCENTIVE"
  | "DELIVERY_RETURNS";

type TabValue = "channels" | "rules" | "digests";

const TAB_VALUES: TabValue[] = ["channels", "rules", "digests"];

function alertsPathWithTab(tab: TabValue) {
  return `/alerts?tab=${tab}`;
}

export function AlertsPageClient({ workspaceId }: AlertsPageClientProps) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab: TabValue =
    tabParam && TAB_VALUES.includes(tabParam) ? tabParam : "channels";

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    router.push(alertsPathWithTab(tab), { scroll: false });
  };

  const { data: settings } = useQuery({
    ...trpc.alerts.get.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery(
    trpc.alerts.listChannels.queryOptions(
      { workspaceId },
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

  const [localSettings, setLocalSettings] = useState<AlertSettings | undefined>(
    undefined
  );
  const currentSettings = localSettings ?? settings;

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

  useEffect(() => {
    const slackConnected = searchParams.get("slack_connected");
    const error = searchParams.get("error");
    const tab = searchParams.get("tab") as TabValue | null;
    const tabQuery = tab && TAB_VALUES.includes(tab) ? `?tab=${tab}` : "";
    if (slackConnected === "true") {
      toast({
        title: "Slack connected",
        description: "Your workspace is now connected to Slack. Choose a channel below.",
      });
      router.replace(`/alerts${tabQuery || "?tab=channels"}`);
    } else if (error === "oauth_failed") {
      toast({
        title: "Slack connection failed",
        description: "Could not connect to Slack. Please try again.",
        variant: "destructive",
      });
      router.replace(`/alerts${tabQuery || "?tab=channels"}`);
    }
  }, [searchParams, toast, router]);

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
    if (!currentSettings || !workspaceId) return;
    updateMutation.mutate({
      workspaceId,
      emailEnabled: currentSettings.emailEnabled,
      slackEnabled: currentSettings.slackEnabled,
      slackWebhookUrl: currentSettings.slackWebhookUrl ?? undefined,
      slackChannel: currentSettings.slackChannel ?? undefined,
      slackChannelName: currentSettings.slackChannelName ?? undefined,
      captureNotificationsEnabled: currentSettings.captureNotificationsEnabled,
      weeklyPulseAlertsEnabled: currentSettings.weeklyPulseAlertsEnabled,
      eventTypes: currentSettings.eventTypes ?? undefined,
      minConfidence: currentSettings.minConfidence,
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

  if (!currentSettings) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="mt-1 text-sm text-slate-600">Loading…</p>
        </div>
        <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[min(100%,calc(100vh-6rem))] max-w-6xl flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose channels, rules, and optional digests — same layout as Settings (tab navigation).
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="inline-flex h-auto w-full shrink-0 flex-wrap justify-start gap-6 border-b border-slate-200 bg-transparent p-0 sm:gap-8">
          <TabsTrigger
            value="channels"
            className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Mail className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            Channels
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            Rules
          </TabsTrigger>
          <TabsTrigger
            value="digests"
            className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Bell className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            Digests
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 min-h-0 flex-1">
          <TabsContent value="channels" className="m-0 space-y-6 focus-visible:outline-none">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Mail className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Email</h2>
                      <p className="mt-0.5 text-sm text-slate-600">
                        Alerts to your registered email when changes match your rules.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={currentSettings.emailEnabled}
                      onChange={(e) =>
                        setLocalSettings({ ...currentSettings, emailEnabled: e.target.checked })
                      }
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600" />
                  </label>
                </div>
                {currentSettings.emailEnabled && (
                  <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    Delivered to your account email.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <MessageSquare className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Slack</h2>
                      <p className="mt-0.5 text-sm text-slate-600">
                        Post to a channel via OAuth or webhook.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={currentSettings.slackEnabled}
                      onChange={(e) =>
                        setLocalSettings({ ...currentSettings, slackEnabled: e.target.checked })
                      }
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600" />
                  </label>
                </div>

                {currentSettings.slackEnabled && (
                  <div className="mt-4 space-y-3">
                    {!currentSettings.slackTeamName ? (
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
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {currentSettings.slackTeamName}
                            </p>
                            {currentSettings.slackChannelName && (
                              <p className="mt-0.5 text-xs text-slate-600">
                                #{currentSettings.slackChannelName}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnectSlack}
                            disabled={disconnectMutation.isPending}
                            className="gap-1.5 shrink-0"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor="slack-channel">Channel</Label>
                          <Select
                            value={currentSettings.slackChannel ?? ""}
                            onValueChange={(channelId) => {
                              const ch = channels.find((c) => c.id === channelId);
                              setLocalSettings({
                                ...currentSettings,
                                slackChannel: channelId || null,
                                slackChannelName: ch?.name ?? null,
                              });
                            }}
                            disabled={channelsLoading}
                          >
                            <SelectTrigger id="slack-channel" className="mt-1.5">
                              <SelectValue placeholder="Select a channel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Public</SelectLabel>
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
                                    <SelectLabel>Private</SelectLabel>
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
                            Invite the app to private channels if needed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="m-0 space-y-6 focus-visible:outline-none">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Change types</h2>
              <p className="mt-1 text-sm text-slate-600">
                Only these types will trigger real-time alerts.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(Object.keys(eventTypeLabels) as ChangeEventType[]).map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={currentSettings.eventTypes?.includes(type) || false}
                      onChange={(e) => {
                        const currentTypes = currentSettings.eventTypes || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, type]
                          : currentTypes.filter((t) => t !== type);
                        setLocalSettings({ ...currentSettings, eventTypes: newTypes });
                      }}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    />
                    <span className="text-sm font-medium leading-tight text-slate-900">
                      {eventTypeLabels[type]}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Minimum confidence</h2>
              <p className="mt-1 text-sm text-slate-600">
                Alerts only fire at or above this level.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["low", "medium", "high"] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-colors ${
                      currentSettings.minConfidence === level
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="confidence"
                      value={level}
                      checked={currentSettings.minConfidence === level}
                      onChange={(e) =>
                        setLocalSettings({
                          ...currentSettings,
                          minConfidence: e.target.value as "low" | "medium" | "high",
                        })
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold capitalize text-slate-900">{level}</span>
                    <span className="mt-0.5 text-xs text-slate-600">
                      {level === "low" && "All changes"}
                      {level === "medium" && "Medium & high"}
                      {level === "high" && "High only"}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="digests" className="m-0 space-y-6 focus-visible:outline-none">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Weekly Pulse digest</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Each Monday after your report is generated, send a summary via the channels
                    you enabled above.
                  </p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={currentSettings.weeklyPulseAlertsEnabled ?? false}
                    onChange={(e) =>
                      setLocalSettings({
                        ...currentSettings,
                        weeklyPulseAlertsEnabled: e.target.checked,
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600" />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Capture notifications</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Notify after every scheduled scan, even when nothing changed.
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-800">Can be noisy — use sparingly.</p>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={currentSettings.captureNotificationsEnabled ?? false}
                    onChange={(e) =>
                      setLocalSettings({
                        ...currentSettings,
                        captureNotificationsEnabled: e.target.checked,
                      })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-600" />
                </label>
              </div>
            </section>
          </TabsContent>
        </div>
      </Tabs>

      <div className="sticky bottom-0 z-30 -mx-6 mt-10 border-t border-slate-200 bg-slate-50/95 px-6 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-slate-50/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestNotification}
              disabled={testMutation.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {testMutation.isPending ? "Sending…" : "Send test"}
            </Button>
            <span className="hidden text-sm text-slate-500 sm:inline">Verify email & Slack</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLocalSettings(undefined)}
              disabled={updateMutation.isPending}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
