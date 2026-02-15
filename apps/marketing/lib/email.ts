import { Resend } from "resend";
import { env } from "@/env";
import { PurchaseConfirmationEmail } from "@/emails/PurchaseConfirmation";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendPurchaseConfirmationParams {
  to: string;
  sessionId: string;
}

export async function sendPurchaseConfirmation({
  to,
  sessionId,
}: SendPurchaseConfirmationParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "OfferPulse <chisom@omnicentra.com>",
      to: [to],
      subject: "Your OfferPulse Snapshot Report - Slot Reserved ✅",
      react: PurchaseConfirmationEmail({
        customerEmail: to,
        sessionId,
      }),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Failed to send purchase confirmation email:", error);
    throw error;
  }
}
