import { getAllBlogPosts } from "@/lib/blog/registry";
import { CANONICAL_BASE_URL, SITE_CONFIG } from "@/lib/seo/config";

export async function GET() {
  const posts = getAllBlogPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_CONFIG.name} Blog</title>
    <link>${CANONICAL_BASE_URL}/blog</link>
    <description>${SITE_CONFIG.description}</description>
    <language>en-GB</language>
    <atom:link href="${CANONICAL_BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${CANONICAL_BASE_URL}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid>${CANONICAL_BASE_URL}/blog/${post.slug}</guid>
      <category>${post.category}</category>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
