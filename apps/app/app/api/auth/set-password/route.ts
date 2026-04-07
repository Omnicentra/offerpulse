import { auth } from "@/src/server/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const result = await auth.api.setPassword({
      body: { newPassword: parsed.data.newPassword },
      headers: request.headers,
    });

    const resultWithError = result as { error?: { message?: string }; status?: boolean };
    if (resultWithError.error) {
      return NextResponse.json(
        { error: resultWithError.error.message ?? "Failed to set password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
