import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/src/server/auth";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { BillingSettingsContent } from "../billing-tab";

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    trpc.billing.getSubscription.queryOptions()
  );

  return (
    <HydrateClient>
      <div className="mx-auto max-w-4xl">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" /> Back to Settings
            </Link>
          </Button>
          <PageHeader
            title="Billing & Plan"
            description="Manage your subscription and view usage"
          />
        </div>
        <BillingSettingsContent />
      </div>
    </HydrateClient>
  );
}
