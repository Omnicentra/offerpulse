/**
 * JSON-LD schema generators for SEO
 */

import type { Tool } from "../tools/registry";
import type { Resource } from "../resources/registry";
import type { Topic } from "../topics/registry";

export function generateToolSchema(tool: Tool, url: string) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.longDescription,
    url,
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    featureList: tool.features,
  };

  if (tool.faqs.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    return [schema, faqSchema];
  }

  return [schema];
}

export function generateArticleSchema(resource: Resource, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: resource.title,
    description: resource.description,
    author: {
      "@type": "Organization",
      name: resource.author,
    },
    datePublished: resource.publishedAt,
    dateModified: resource.updatedAt,
    url,
  };
}

export function generateToolListSchema(tools: Tool[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.shortDescription,
      },
    })),
  };
}

export function generateTopicSchema(topic: Topic, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: topic.name,
    description: topic.description,
    url,
  };
}
