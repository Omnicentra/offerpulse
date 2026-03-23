"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/src/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  FileJson,
  Globe,
  Loader2,
  Package,
  Search,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedProduct {
  /** Temp ID used only for selection tracking in this dialog */
  _id: string;
  name: string;
  externalId?: string;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  description?: string;
  variants: Record<string, unknown>[];
  images: { src: string; alt?: string }[];
  tags: string[];
  productType?: string | null;
  vendor?: string | null;
}

// ---------------------------------------------------------------------------
// Parser — supports Shopify /products.json and generic formats
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toFixedPrice(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = parseFloat(String(raw));
  if (isNaN(n) || n <= 0) return null;
  return n.toFixed(2);
}

function parseProductsJson(raw: unknown): ParsedProduct[] {
  let items: unknown[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.products)) {
      items = obj.products as unknown[];
    } else if (Array.isArray(obj.items)) {
      items = obj.items as unknown[];
    } else {
      items = [raw];
    }
  }

  return items.flatMap((item, idx) => {
    if (typeof item !== "object" || item === null) return [];
    const p = item as Record<string, unknown>;

    const isShopifyFormat = p.title !== undefined || p.variants !== undefined;

    if (isShopifyFormat) {
      const title = String(p.title || "Untitled");
      const rawVariants = Array.isArray(p.variants)
        ? (p.variants as Record<string, unknown>[])
        : [];
      const firstVariant = rawVariants[0] ?? {};

      const price = toFixedPrice(firstVariant.price ?? p.price) ?? "0.00";
      const compareAtPrice = toFixedPrice(
        firstVariant.compare_at_price ?? p.compare_at_price
      );

      const rawImages = Array.isArray(p.images)
        ? (p.images as Record<string, unknown>[])
        : [];
      const images = rawImages
        .map((img) => ({
          src: String(img.src || ""),
          alt: img.alt ? String(img.alt) : undefined,
        }))
        .filter((img) => img.src);

      const tags =
        typeof p.tags === "string"
          ? p.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : Array.isArray(p.tags)
            ? p.tags.map(String)
            : [];

      const bodyHtml = String(p.body_html ?? p.description ?? "");
      const description = bodyHtml ? stripHtml(bodyHtml) : undefined;

      const available =
        rawVariants.length > 0
          ? rawVariants.some(
              (v) => (v as Record<string, unknown>).available !== false
            )
          : p.available !== false;

      const sku = firstVariant.sku ? String(firstVariant.sku) : undefined;
      const externalId = sku || (p.id ? String(p.id) : undefined);

      return [
        {
          _id: String(p.id ?? idx),
          name: title,
          externalId,
          price,
          compareAtPrice,
          available: Boolean(available),
          description,
          variants: rawVariants,
          images,
          tags,
          productType: p.product_type ? String(p.product_type) : null,
          vendor: p.vendor ? String(p.vendor) : null,
        } satisfies ParsedProduct,
      ];
    }

    // Generic format
    const name = String(p.name ?? p.title ?? "Untitled");
    const price = toFixedPrice(p.price) ?? "0.00";
    const compareAtPrice = toFixedPrice(
      p.compare_at_price ?? p.compareAtPrice
    );

    return [
      {
        _id: String(p.id ?? idx),
        name,
        externalId: p.sku
          ? String(p.sku)
          : p.id
            ? String(p.id)
            : undefined,
        price,
        compareAtPrice,
        available: p.available !== false,
        description: p.description ? String(p.description) : undefined,
        variants: [],
        images: [],
        tags: [],
        productType: null,
        vendor: null,
      } satisfies ParsedProduct,
    ];
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JsonImportDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "source" | "preview";
type SourceTab = "url" | "file" | "paste";

export function JsonImportDialog({
  workspaceId,
  open,
  onOpenChange,
}: JsonImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [step, setStep] = useState<Step>("source");
  const [activeTab, setActiveTab] = useState<SourceTab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation(
    trpc.ownStore.products.create.mutationOptions({})
  );

  const reset = useCallback(() => {
    setStep("source");
    setUrlInput("");
    setPasteInput("");
    setFetchError("");
    setParsedProducts([]);
    setSelectedIds(new Set());
    setSearchQuery("");
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (!val) reset();
      onOpenChange(val);
    },
    [onOpenChange, reset]
  );

  const processJson = useCallback((json: unknown) => {
    const products = parseProductsJson(json);
    if (products.length === 0) {
      setFetchError(
        "No products found in the JSON. Please check the format and try again."
      );
      return;
    }
    setParsedProducts(products);
    setSelectedIds(new Set(products.map((p) => p._id)));
    setFetchError("");
    setStep("preview");
  }, []);

  const normalizeShopifyUrl = (raw: string): string => {
    let url = raw.trim();
    if (!url.startsWith("http")) url = `https://${url}`;
    url = url.replace(/\/$/, "");
    if (!url.endsWith(".json")) {
      if (!url.includes("/products")) url += "/products.json";
      else if (!url.endsWith(".json")) url += ".json";
    }
    return url;
  };

  const handleUrlFetch = async () => {
    const url = urlInput.trim();
    if (!url) return;

    setIsFetching(true);
    setFetchError("");

    try {
      const fetchUrl = normalizeShopifyUrl(url);
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json() as unknown;
      processJson(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const isCors =
        msg.toLowerCase().includes("cors") ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("network");
      setFetchError(
        isCors
          ? "Couldn't fetch the URL — this may be a CORS restriction. Try opening the URL in your browser, copying the JSON content, and pasting it in the Paste tab."
          : msg
      );
    } finally {
      setIsFetching(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFetchError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as unknown;
        processJson(json);
      } catch {
        setFetchError("Invalid JSON file. Please check the file and try again.");
      }
    };
    reader.readAsText(file);
  };

  const handlePasteParse = () => {
    try {
      const json = JSON.parse(pasteInput.trim()) as unknown;
      setFetchError("");
      processJson(json);
    } catch {
      setFetchError(
        "Invalid JSON. Please make sure you've pasted valid JSON content."
      );
    }
  };

  // Filtered products
  const filteredProducts = parsedProducts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.vendor?.toLowerCase().includes(q) ?? false) ||
      (p.productType?.toLowerCase().includes(q) ?? false) ||
      (p.externalId?.toLowerCase().includes(q) ?? false)
    );
  });

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p._id));

  const toggleSelectAll = () => {
    const newSet = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredProducts.forEach((p) => newSet.delete(p._id));
    } else {
      filteredProducts.forEach((p) => newSet.add(p._id));
    }
    setSelectedIds(newSet);
  };

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedCount = parsedProducts.filter((p) =>
    selectedIds.has(p._id)
  ).length;

  const handleImport = async () => {
    const toImport = parsedProducts.filter((p) => selectedIds.has(p._id));
    if (toImport.length === 0) return;

    setIsImporting(true);
    let succeeded = 0;
    let failed = 0;

    for (const product of toImport) {
      try {
        await createMutation.mutateAsync({
          workspaceId,
          name: product.name,
          externalId: product.externalId,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          available: product.available,
          description: product.description,
          variants: product.variants,
          images: product.images,
          tags: product.tags,
          productType: product.productType,
          vendor: product.vendor,
        });
        succeeded++;
      } catch {
        failed++;
      }
    }

    setIsImporting(false);
    queryClient.invalidateQueries(
      trpc.ownStore.products.list.queryFilter({ workspaceId })
    );

    if (failed === 0) {
      toast({
        title: `${succeeded} product${succeeded !== 1 ? "s" : ""} imported`,
        description: "Products have been added to your store.",
      });
    } else {
      toast({
        title: `${succeeded} imported, ${failed} failed`,
        description: "Some products couldn't be imported.",
        variant: "destructive",
      });
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          step === "preview" ? "max-w-3xl" : "max-w-lg"
        )}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="mb-1 flex items-center gap-2">
            <FileJson className="h-5 w-5 text-slate-400" />
            <DialogTitle className="text-base font-semibold">
              {step === "source"
                ? "Import products from JSON"
                : "Review & select products"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            {step === "source"
              ? "Fetch from your Shopify store, upload a file, or paste JSON directly."
              : `${parsedProducts.length} product${parsedProducts.length !== 1 ? "s" : ""} found — choose which ones to import.`}
          </DialogDescription>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            <StepDot active={step === "source"} complete={step === "preview"} label="Source" />
            <div className="h-px flex-1 bg-slate-200" />
            <StepDot active={step === "preview"} complete={false} label="Preview" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "source" && (
            <div className="space-y-5">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as SourceTab);
                  setFetchError("");
                }}
              >
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="url" className="gap-1.5 text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="file" className="gap-1.5 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    File
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="gap-1.5 text-xs">
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Paste
                  </TabsTrigger>
                </TabsList>

                {/* URL tab */}
                <TabsContent value="url" className="mt-5 space-y-3">
                  <p className="text-sm text-slate-600">
                    Enter your Shopify store URL. Your products are publicly
                    available at{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      /products.json
                    </code>
                    .
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="your-store.myshopify.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleUrlFetch();
                      }}
                      className="h-10 text-sm"
                    />
                    <Button
                      onClick={() => void handleUrlFetch()}
                      disabled={isFetching || !urlInput.trim()}
                      className="h-10 shrink-0"
                    >
                      {isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Fetch
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    e.g.{" "}
                    <span className="font-mono">
                      acme-store.myshopify.com
                    </span>{" "}
                    or the full URL including{" "}
                    <span className="font-mono">/products.json</span>
                  </p>
                </TabsContent>

                {/* File tab */}
                <TabsContent value="file" className="mt-5 space-y-3">
                  <p className="text-sm text-slate-600">
                    Upload a JSON file exported from your store or
                    downloaded from{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      /products.json
                    </code>
                    .
                  </p>
                  <button
                    type="button"
                    className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 transition-shadow group-hover:shadow-md">
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                        Click to upload a JSON file
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        products.json or any JSON format
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleFilePick}
                    />
                  </button>
                </TabsContent>

                {/* Paste tab */}
                <TabsContent value="paste" className="mt-5 space-y-3">
                  <p className="text-sm text-slate-600">
                    Open{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      your-store.com/products.json
                    </code>{" "}
                    in a browser, copy all the content, and paste it here.
                  </p>
                  <textarea
                    placeholder={'{\n  "products": [...]\n}'}
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    rows={8}
                    spellCheck={false}
                  />
                  <Button
                    onClick={handlePasteParse}
                    disabled={!pasteInput.trim()}
                    className="w-full"
                  >
                    Parse JSON
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>
              </Tabs>

              {fetchError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">{fetchError}</p>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by name, vendor, type, SKU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm"
                  />
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 tabular-nums"
                >
                  {selectedCount} / {parsedProducts.length} selected
                </Badge>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Price
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Compare-at
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-sm text-slate-400"
                        >
                          No products match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const isSelected = selectedIds.has(product._id);
                        return (
                          <TableRow
                            key={product._id}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected
                                ? "bg-blue-50/40 hover:bg-blue-50/60"
                                : "hover:bg-slate-50"
                            )}
                            onClick={() => toggleProduct(product._id)}
                          >
                            <TableCell
                              className="pl-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProduct(product._id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                                aria-label={`Select ${product.name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.images[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.images[0].src}
                                    alt={
                                      product.images[0].alt ?? product.name
                                    }
                                    className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                    <Package className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {product.name}
                                  </p>
                                  {(product.vendor ??
                                    product.productType) && (
                                    <p className="truncate text-xs text-slate-400">
                                      {[product.vendor, product.productType]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">
                              ${product.price}
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {product.compareAtPrice
                                ? `$${product.compareAtPrice}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  product.available
                                    ? "bg-green-50 text-green-700"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    product.available
                                      ? "bg-green-500"
                                      : "bg-slate-400"
                                  )}
                                />
                                {product.available
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          {step === "source" ? (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-9"
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setStep("source")}
              className="h-9 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {step === "preview" && (
            <div className="flex items-center gap-3">
              {selectedCount === 0 && (
                <p className="text-xs text-slate-400">
                  Select at least one product
                </p>
              )}
              <Button
                onClick={() => void handleImport()}
                disabled={selectedCount === 0 || isImporting}
                className="h-9 min-w-[140px]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Import {selectedCount}{" "}
                    {selectedCount === 1 ? "product" : "products"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step indicator dot
// ---------------------------------------------------------------------------

function StepDot({
  active,
  complete,
  label,
}: {
  active: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "h-2 w-2 rounded-full transition-colors",
          complete
            ? "bg-blue-500"
            : active
              ? "bg-blue-600 ring-4 ring-blue-100"
              : "bg-slate-200"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium",
          active ? "text-slate-900" : complete ? "text-blue-600" : "text-slate-400"
        )}
      >
        {label}
      </span>
    </div>
  );
}
