import { env } from "@/env";
import { logger } from "@/lib/logger";

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}`;

async function createRecord(tableName: string, fields: Record<string, unknown>) {
  const response = await fetch(`${AIRTABLE_BASE_URL}/${tableName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export interface PurchaseRecord {
  contactEmail: string;
  contactName?: string;
  competitorUrl?: string;
  purchaseDate: string;
  sourceForm: string;
  promoReportType: string;
  stripeSessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function createPurchaseRecord(data: PurchaseRecord) {
  const fields: Record<string, unknown> = {
    "Purchase Name": `${data.contactEmail} - ${new Date(data.purchaseDate).toLocaleDateString()}`,
    "Contact Email": data.contactEmail,
    "Purchase Date": data.purchaseDate,
    "Source Form": data.sourceForm,
    "Promo Report Type": data.promoReportType,
  };

  if (data.contactName) {
    fields["Contact Name"] = data.contactName;
  }

  if (data.competitorUrl) {
    fields["Competitor URL"] = data.competitorUrl;
  }

  logger.debug("createPurchaseRecord — fields to send", fields);

  return createRecord("Promo Report Purchases", fields);
}

export interface WaitlistRecord {
  email: string;
  signupDate: string;
  status: string;
  notes?: string;
  competitorUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function createWaitlistRecord(data: WaitlistRecord) {
  const notesArray = [];
  if (data.competitorUrl) {
    notesArray.push(`Competitor URL: ${data.competitorUrl}`);
  }
  if (data.utmSource || data.utmMedium || data.utmCampaign) {
    notesArray.push(
      `UTM: source=${data.utmSource ?? "none"}, medium=${data.utmMedium ?? "none"}, campaign=${data.utmCampaign ?? "none"}`
    );
  }

  const fields: Record<string, unknown> = {
    Email: data.email,
    "Signup Date": data.signupDate,
    Status: data.status,
  };

  if (notesArray.length > 0 || data.notes) {
    fields.Notes = [data.notes, ...notesArray].filter(Boolean).join("\n");
  }

  return createRecord("Waitlist", fields);
}
