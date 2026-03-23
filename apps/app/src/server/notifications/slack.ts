import { WebClient } from "@slack/web-api";
import { logger } from "@offerpulse/lib";
import { EmailAlertData } from "./email";

export type SlackAlertData = EmailAlertData;

export function createSlackClient(accessToken: string) {
  return new WebClient(accessToken);
}

function buildChangeAlertBlocks(data: SlackAlertData): Array<Record<string, unknown>> {
  const confidenceEmoji = {
    high: ":red_circle:",
    medium: ":large_yellow_circle:",
    low: ":white_circle:",
  };

  const changeTypeEmoji: Record<string, string> = {
    PROMO: "🎁",
    SHIPPING: "📦",
    BUNDLE: "📦",
    CART_INCENTIVE: "🛒",
    DELIVERY_RETURNS: "🚚",
  };

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${confidenceEmoji[data.confidence]} Competitor Change Detected`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Competitor:*\n${data.competitorName}`,
        },
        {
          type: "mrkdwn",
          text: `*Change Type:*\n${changeTypeEmoji[data.changeType] || ""} ${data.changeType}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*What Changed:*\n${data.changeSummary}`,
      },
    },
  ];

  if (data.recommendationTitle && data.recommendationStrategy) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Recommended Action:* ${data.recommendationStrategy}\n${data.recommendationTitle}`,
      },
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View in Dashboard",
          emoji: true,
        },
        url: data.dashboardUrl,
        style: "primary",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Visit Competitor Site",
          emoji: true,
        },
        url: data.competitorUrl,
      },
    ],
  });

  return blocks;
}

export type SlackAlertTarget =
  | { accessToken: string; channel: string }
  | { webhookUrl: string };

/**
 * Send alert to Slack via Web API or webhook
 */
export async function sendSlackAlert(
  target: SlackAlertTarget,
  data: SlackAlertData
): Promise<{ success: boolean; error?: string }> {
  try {
    const blocks = buildChangeAlertBlocks(data);

    if ("accessToken" in target) {
      const client = createSlackClient(target.accessToken);
      await client.chat.postMessage({
        channel: target.channel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Slack Block Kit payload
        blocks: blocks as any,
      });
    } else {
      const response = await fetch(target.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        throw new Error(
          `Slack webhook returned ${response.status}: ${await response.text()}`
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Slack alert send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SlackWeeklyPulseData {
  weekOf: Date;
  totalChanges: number;
  topChanges: Array<{
    competitorName: string;
    changeType: string;
    summary: string;
  }>;
  dashboardUrl: string;
}

function buildWeeklyPulseBlocks(data: SlackWeeklyPulseData): Array<Record<string, unknown>> {
  const weekLabel = data.weekOf.toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 Your Weekly Pulse",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Week of ${weekLabel}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${data.totalChanges}* competitor changes detected this week`,
      },
    },
  ];

  if (data.topChanges.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Top Moves This Week:*",
      },
    });

    for (let i = 0; i < Math.min(5, data.topChanges.length); i++) {
      const change = data.topChanges[i];
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${i + 1}. *${change.competitorName}* - ${change.changeType}\n_${change.summary}_`,
        },
      });
    }
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Full Report",
          emoji: true,
        },
        url: data.dashboardUrl,
        style: "primary",
      },
    ],
  });

  return blocks;
}

export type SlackWeeklyPulseTarget =
  | { accessToken: string; channel: string }
  | { webhookUrl: string };

/**
 * Send weekly pulse to Slack via Web API or webhook
 */
export async function sendSlackWeeklyPulse(
  target: SlackWeeklyPulseTarget,
  data: SlackWeeklyPulseData
): Promise<{ success: boolean; error?: string }> {
  try {
    const blocks = buildWeeklyPulseBlocks(data);

    if ("accessToken" in target) {
      const client = createSlackClient(target.accessToken);
      await client.chat.postMessage({
        channel: target.channel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Slack Block Kit payload
        blocks: blocks as any,
      });
    } else {
      const response = await fetch(target.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        throw new Error(
          `Slack webhook returned ${response.status}: ${await response.text()}`
        );
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Slack weekly pulse send failed", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SlackChannelInfo {
  id: string;
  name: string;
  is_channel: boolean;
  is_private?: boolean;
}

/**
 * List Slack channels the bot can access
 */
export async function listSlackChannels(
  accessToken: string
): Promise<SlackChannelInfo[]> {
  const client = createSlackClient(accessToken);
  const result = await client.conversations.list({
    exclude_archived: true,
    types: "public_channel,private_channel",
    limit: 200,
  });

  const channels = (result.channels ?? []) as SlackChannelInfo[];
  return channels;
}

/**
 * Validate Slack connection (token still valid)
 */
export async function validateSlackConnection(
  accessToken: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = createSlackClient(accessToken);
    await client.auth.test();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SlackCaptureCompleteData {
  competitorName: string;
  competitorUrl: string;
  status: "success" | "failed" | "changes_detected";
  snapshotUrl: string;
  timestamp: Date;
  errorMessage?: string;
}

/**
 * Send capture complete notification to Slack
 */
export async function sendSlackCaptureComplete(
  target: SlackAlertTarget,
  data: SlackCaptureCompleteData
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusLabel =
      data.status === "success"
        ? "Completed"
        : data.status === "changes_detected"
          ? "Changes detected"
          : "Failed";
    const statusEmoji =
      data.status === "success" ? "✅" : data.status === "failed" ? "❌" : "📋";

    const blocks: Array<Record<string, unknown>> = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${statusEmoji} Capture ${statusLabel}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Competitor:*\n${data.competitorName}` },
          {
            type: "mrkdwn",
            text: `*Time:*\n${data.timestamp.toLocaleString()}`,
          },
        ],
      },
    ];
    if (data.errorMessage) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Error:* ${data.errorMessage}` },
      });
    }
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Snapshot", emoji: true },
          url: data.snapshotUrl,
          style: "primary",
        },
      ],
    });

    if ("accessToken" in target) {
      const client = createSlackClient(target.accessToken);
      await client.chat.postMessage({
        channel: target.channel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Slack Block Kit payload
        blocks: blocks as any,
      });
    } else {
      const response = await fetch(target.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (!response.ok) {
        throw new Error(
          `Slack webhook returned ${response.status}: ${await response.text()}`
        );
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Slack capture complete send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
