"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Sync form with server state */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = ["GBP", "USD", "EUR"] as const;

interface StoreDetailsFormProps {
  workspaceId: string;
  initialStoreName: string;
  initialStoreUrl: string | null;
  initialCurrency: string;
}

export function StoreDetailsForm({
  workspaceId,
  initialStoreName,
  initialStoreUrl,
  initialCurrency,
}: StoreDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [storeName, setStoreName] = useState(initialStoreName);
  const [storeUrl, setStoreUrl] = useState(initialStoreUrl ?? "");
  const [currency, setCurrency] = useState(initialCurrency);

  const { data: store } = useQuery({
    ...trpc.ownStore.get.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (store) {
      setStoreName(store.storeName);
      setStoreUrl(store.storeUrl ?? "");
      setCurrency(store.currency);
    }
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

  const hasChanges =
    storeName !== (store?.storeName ?? initialStoreName) ||
    (storeUrl || "") !== (store?.storeUrl ?? initialStoreUrl ?? "") ||
    currency !== (store?.currency ?? initialCurrency);

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
        />
      </div>
      <div>
        <Label htmlFor="currency" className="mb-2 block">
          Currency
        </Label>
        <Select value={currency} onValueChange={setCurrency}>
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
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
