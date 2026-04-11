"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Sync form with server state */
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

const CURRENCIES = ["GBP", "USD", "EUR"] as const;

interface StoreDetailsFormProps {
  workspaceId: string;
  store: RouterOutputs["ownStore"]["get"] | undefined;
  isFetching: boolean;
}

export function StoreDetailsForm({
  workspaceId,
  store,
  isFetching,
}: StoreDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [currency, setCurrency] = useState<string>("GBP");

  useEffect(() => {
    if (!store) return;
    setStoreName(store.storeName);
    setStoreUrl(store.storeUrl ?? "");
    setCurrency(store.currency);
  }, [store]);

  const updateMutation = useMutation(
    trpc.ownStore.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.get.queryFilter({ workspaceId })
        );
        toast({
          title: "Store details saved",
          description: "Your store information has been updated.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to update store",
          variant: "destructive",
        });
      },
    })
  );

  const handleSave = () => {
    updateMutation.mutate({
      workspaceId,
      storeName,
      storeUrl: storeUrl.trim() || null,
      currency,
    });
  };

  if (!store) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const hasChanges =
    storeName !== store.storeName ||
    (storeUrl || "") !== (store.storeUrl ?? "") ||
    currency !== store.currency;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="storeName" className="mb-2 block">
          Store name
        </Label>
        <Input
          id="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="My Store"
          disabled={isFetching}
        />
      </div>
      <div>
        <Label htmlFor="storeUrl" className="mb-2 block">
          Store URL (optional)
        </Label>
        <Input
          id="storeUrl"
          type="url"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://yourstore.com"
          disabled={isFetching}
        />
      </div>
      <div>
        <Label htmlFor="currency" className="mb-2 block">
          Currency
        </Label>
        <Select value={currency} onValueChange={setCurrency} disabled={isFetching}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending || isFetching}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
