import { redirect } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { AccountClient } from "./account-client";
import { getServerSession } from "@/src/server/auth/server-session";

export default async function AccountSettingsPage() {
  const session = await getServerSession();

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
