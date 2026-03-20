"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Sync form with server state */
import { Button } from "@/components/ui/button";
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
  initialStore: RouterOutputs["ownStore"]["get"];
  store: RouterOutputs["ownStore"]["get"] | undefined;
  isFetching: boolean;
}

export function StoreDetailsForm({
  workspaceId,
  initialStore,
  store,
  isFetching,
}: StoreDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const resolved = store ?? initialStore;

  const [storeName, setStoreName] = useState(resolved.storeName);
  const [storeUrl, setStoreUrl] = useState(resolved.storeUrl ?? "");
  const [currency, setCurrency] = useState(resolved.currency);

  useEffect(() => {
    const next = store ?? initialStore;
    setStoreName(next.storeName);
    setStoreUrl(next.storeUrl ?? "");
    setCurrency(next.currency);
  }, [store, initialStore]);

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

  const hasChanges =
    storeName !== resolved.storeName ||
    (storeUrl || "") !== (resolved.storeUrl ?? "") ||
    currency !== resolved.currency;

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
