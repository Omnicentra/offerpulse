import { render } from "@react-email/render";
import { Resend } from "resend";
import { env } from "@/env";
import { WelcomeEmail } from "./emails/welcome-email";
import { ChangeAlertEmail } from "./emails/change-alert-email";
import { WeeklyPulseEmail } from "./emails/weekly-pulse-email";
import { CaptureCompleteEmail } from "./emails/capture-complete-email";

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
    const logoUrl = `${env.NEXT_PUBLIC_MARKETING_APP_URL ?? "https://offerpulse.io"}/favicon.svg`;
    const html = await render(
      ChangeAlertEmail({
        ...data,
        logoUrl,
      })
    );
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
    const logoUrl = `${env.NEXT_PUBLIC_MARKETING_APP_URL ?? "https://offerpulse.io"}/favicon.svg`;
    const html = await render(
      WeeklyPulseEmail({
        ...data,
        logoUrl,
      })
    );
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

export interface CaptureCompleteEmailData {
  competitorName: string;
  competitorUrl: string;
  status: "success" | "failed" | "changes_detected";
  snapshotUrl: string;
  timestamp: Date;
  errorMessage?: string;
}

/**
 * Send capture complete notification email
 */
export async function sendCaptureCompleteEmail(
  to: string,
  data: CaptureCompleteEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const statusConfig = {
      success: "✅",
      failed: "❌",
      changes_detected: "📋",
    };
    const statusLabel =
      data.status === "success"
        ? "Completed"
        : data.status === "changes_detected"
          ? "Changes detected"
          : "Failed";
    const statusEmoji = statusConfig[data.status];

    const logoUrl = `${env.NEXT_PUBLIC_MARKETING_APP_URL ?? "https://offerpulse.io"}/favicon.svg`;
    const html = await render(
      CaptureCompleteEmail({
        ...data,
        logoUrl,
      })
    );
    const result = await resend.emails.send({
      from: WELCOME_FROM,
      to,
      subject: `${statusEmoji} Capture ${statusLabel}: ${data.competitorName}`,
      html,
    });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("Capture complete email failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
