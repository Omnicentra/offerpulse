import { redirect } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
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

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.users.getProfile.queryOptions());

  return (
    <HydrateClient>
      <AccountClient />
    </HydrateClient>
  );
}
