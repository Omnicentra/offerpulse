import { OfferClarityCheckToolClient } from "./offer-clarity-check-tool-client";

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function OfferClarityCheckToolPage({ searchParams }: Props) {
  const { url } = await searchParams;
  return <OfferClarityCheckToolClient urlParam={url ?? null} />;
}
