import { env } from "@/env";
import { logger } from "@offerpulse/lib";

interface CancelScheduledCapturesOptions {
  workspaceId: string;
  functionId: string;
  startedAfter?: Date;
  startedBefore?: Date;
}

interface InngestCancellationResponse {
  id: string;
  environment_id: string;
  function_id: string;
  started_after?: string;
  started_before?: string;
  if?: string;
}

/**
 * Cancel pending scheduled capture jobs for a workspace using Inngest's bulk cancellation API.
 * 
 * @see https://www.inngest.com/docs/guides/cancel-running-functions#bulk-cancel-via-the-rest-api
 * @see https://api-docs.inngest.com/docs/inngest-api/8gh90chdy0gw4-create-a-cancellation
 */
export async function cancelScheduledCaptures({
  workspaceId,
  functionId,
  startedAfter,
  startedBefore,
}: CancelScheduledCapturesOptions): Promise<InngestCancellationResponse | null> {
  if (!env.INNGEST_SIGNING_KEY) {
    logger.warn("INNGEST_SIGNING_KEY not configured, skipping bulk cancellation");
    return null;
  }

  const appId = "offerpulse";
  const fullFunctionId = `${appId}-${functionId}`;
  
  // Default to last 7 days if not specified (Inngest max sleep duration)
  const defaultStartedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const defaultStartedBefore = new Date();

  const requestBody = {
    app_id: appId,
    function_id: fullFunctionId,
    started_after: (startedAfter ?? defaultStartedAfter).toISOString(),
    started_before: (startedBefore ?? defaultStartedBefore).toISOString(),
    if: `event.data.workspaceId == "${workspaceId}"`,
  };

  logger.debug("Calling Inngest bulk cancellation API", {
    workspaceId,
    functionId: fullFunctionId,
    ...requestBody,
  });

  try {
    const response = await fetch("https://api.inngest.com/v1/cancellations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.INNGEST_SIGNING_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Inngest bulk cancellation failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Inngest cancellation failed: ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as InngestCancellationResponse;
    
    logger.info("Successfully cancelled scheduled captures", {
      workspaceId,
      cancellationId: result.id,
      functionId: result.function_id,
    });

    return result;
  } catch (error) {
    logger.error("Error calling Inngest bulk cancellation API", error);
    throw error;
  }
}
