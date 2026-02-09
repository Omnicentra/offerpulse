/**
 * Metadata generators for SEO
 */

import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_MARKETING_APP_URL || "https://offerpulse.com";

export function generateToolMetadata(config: {
  title: string;
  description: string;
  slug: string;
  keywords?: string[];
}): Metadata {
  const url = `${baseUrl}/free-tools/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      siteName: "OfferPulse",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateResourceMetadata(config: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  keywords?: string[];
}): Metadata {
  const url = `${baseUrl}/resources/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      siteName: "OfferPulse",
      type: "article",
      publishedTime: config.publishedAt,
      modifiedTime: config.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateTopicMetadata(config: {
  title: string;
  description: string;
  slug: string;
}): Metadata {
  const url = `${baseUrl}/resources/topic/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      siteName: "OfferPulse",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: url,
    },
  };
}
