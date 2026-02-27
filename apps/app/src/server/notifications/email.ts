import { render } from "@react-email/render";
import { Resend } from "resend";
import { env } from "@/env";
import { WelcomeEmail } from "./emails/welcome-email";

const resend = new Resend(env.RESEND_API_KEY);

export interface EmailAlertData {
  competitorName: string;
  competitorUrl: string;
  changeType: string;
  changeSummary: string;
  confidence: "low" | "medium" | "high";
  recommendationTitle?: string;
  recommendationStrategy?: string;
  dashboardUrl: string;
}

const WELCOME_FROM = `OfferPulse <${env.RESEND_FROM_EMAIL}>`;

/**
 * Send welcome email to new signups. Uses React Email template.
 * Skips sending if RESEND_API_KEY is not configured.
 */
export async function sendWelcomeEmail(
  to: string,
  options: { userName?: string | null; dashboardUrl?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const dashboardUrl =
      options.dashboardUrl ?? env.NEXT_PUBLIC_DASHBOARD_APP_URL ?? "https://app.offerpulse.com";
    const logoUrl = `${env.NEXT_PUBLIC_MARKETING_APP_URL ?? "https://offerpulse.io"}/favicon.svg`;
    const html = await render(
      WelcomeEmail({
        userName: options.userName ?? null,
        dashboardUrl,
        logoUrl,
      })
    );
    const result = await resend.emails.send({
      from: WELCOME_FROM,
      to,
      subject: "Welcome to OfferPulse — add your first competitor",
      html,
    });
    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Welcome email send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send change alert email
 */
export async function sendChangeAlertEmail(
  to: string,
  data: EmailAlertData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const confidenceEmoji = {
      high: "🔴",
      medium: "🟡",
      low: "⚪",
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f6f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #e6e6e6;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                ${confidenceEmoji[data.confidence]} Competitor Change Detected
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Competitor</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  ${data.competitorName}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
                  <a href="${data.competitorUrl}" style="color: #3b82f6; text-decoration: none;">
                    ${data.competitorUrl}
                  </a>
                </p>
              </div>

              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Change Type</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  ${data.changeType}
                </p>
              </div>

              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">What Changed</p>
                <p style="margin: 0; font-size: 16px; color: #1a1a1a; line-height: 1.5;">
                  ${data.changeSummary}
                </p>
              </div>

              ${
                data.recommendationTitle
                  ? `
              <div style="margin-bottom: 24px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e40af;">
                  Recommended Action
                </p>
                <p style="margin: 0; font-size: 16px; color: #1a1a1a;">
                  ${data.recommendationTitle}
                </p>
                ${
                  data.recommendationStrategy
                    ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Strategy: ${data.recommendationStrategy}</p>`
                    : ""
                }
              </div>
              `
                  : ""
              }

              <div style="margin-top: 32px;">
                <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View in Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e6e6e6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                You're receiving this because you have alerts enabled for competitor changes.<br>
                Manage your alert settings in the dashboard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const result = await resend.emails.send({
      from: WELCOME_FROM,
      to,
      subject: `[${data.changeType}] ${data.competitorName} changed their offer`,
      html,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Email send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send weekly pulse email
 */
export async function sendWeeklyPulseEmail(
  to: string,
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
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const weekLabel = data.weekOf.toLocaleDateString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Pulse</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f6f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #e6e6e6;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                📊 Your Weekly Pulse
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
                Week of ${weekLabel}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px;">
              <div style="margin-bottom: 24px; text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                <p style="margin: 0; font-size: 48px; font-weight: 700; color: #1a1a1a;">
                  ${data.totalChanges}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: #666;">
                  Competitor changes detected
                </p>
              </div>

              ${
                data.topChanges.length > 0
                  ? `
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                  Top Moves This Week
                </h2>
                ${data.topChanges
                  .map(
                    (change, idx) => `
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
                  <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">
                    ${idx + 1}. ${change.competitorName}
                  </p>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${change.changeType}
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #1a1a1a;">
                    ${change.summary}
                  </p>
                </div>
                `
                  )
                  .join("")}
              </div>
              `
                  : ""
              }

              <div style="margin-top: 32px; text-align: center;">
                <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Full Report
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e6e6e6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Your weekly competitive intelligence summary<br>
                Manage your settings in the dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const result = await resend.emails.send({
      from: WELCOME_FROM,
      to,
      subject: `📊 Your Weekly Pulse - ${data.totalChanges} changes detected`,
      html,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Weekly pulse email send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
