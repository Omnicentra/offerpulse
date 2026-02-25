import { OfferSnapshotToolClient } from "./offer-snapshot-tool-client";

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function OfferSnapshotToolPage({ searchParams }: Props) {
  const { url } = await searchParams;
  return <OfferSnapshotToolClient urlParam={url ?? null} />;
}
