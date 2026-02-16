import { EmailAlertData } from "./email";

export interface SlackAlertData extends EmailAlertData {}

/**
 * Send alert to Slack webhook
 */
export async function sendSlackAlert(
  webhookUrl: string,
  data: SlackAlertData
): Promise<{ success: boolean; error?: string }> {
  try {
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

    const payload = {
      blocks: [
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
      ],
    };

    // Add recommendation section if available
    if (data.recommendationTitle && data.recommendationStrategy) {
      payload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recommended Action:* ${data.recommendationStrategy}\n${data.recommendationTitle}`,
        },
      });
    }

    // Add action buttons
    payload.blocks.push({
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

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${await response.text()}`);
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

/**
 * Send weekly pulse to Slack
 */
export async function sendSlackWeeklyPulse(
  webhookUrl: string,
  data: {
    weekOf: Date;
    totalChanges: number;
    topChanges: Array<{
      competitorName: string;
      changeType: string;
      summary: string;
    }>;
    dashboardUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const weekLabel = data.weekOf.toLocaleDateString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const payload = {
      blocks: [
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
      ],
    };

    // Add top changes
    if (data.topChanges.length > 0) {
      payload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Top Moves This Week:*",
        },
      });

      for (let i = 0; i < Math.min(5, data.topChanges.length); i++) {
        const change = data.topChanges[i];
        payload.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${i + 1}. *${change.competitorName}* - ${change.changeType}\n_${change.summary}_`,
          },
        });
      }
    }

    // Add action button
    payload.blocks.push({
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

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${await response.text()}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Slack weekly pulse send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
