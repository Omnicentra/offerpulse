import { redirect } from "next/navigation";
import { createCaller } from "@/src/lib/trpc/server";
import { AccountClient } from "./account-client";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const caller = await createCaller();
  const profile = await caller.users.getProfile();

  return <AccountClient initialProfile={profile} />;
}
