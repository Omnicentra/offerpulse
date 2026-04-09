import { DiscountDetectorToolClient } from "./discount-detector-tool-client";

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function DiscountDetectorToolPage({ searchParams }: Props) {
  const { url } = await searchParams;
  return <DiscountDetectorToolClient urlParam={url ?? null} />;
}
