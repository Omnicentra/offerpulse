"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BillingSettingsContent } from "../billing-tab";

export default function BillingPage() {
  const router = useRouter();

  return (
    <BillingSettingsContent
      wrapperClassName="mx-auto max-w-4xl"
      header={
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Button>
          <PageHeader
            title="Billing & Plan"
            description="Manage your subscription and view usage"
          />
        </div>
      }
    />
  );
}
