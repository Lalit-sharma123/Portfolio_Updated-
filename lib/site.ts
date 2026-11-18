/* Single source of truth for the site's public URL.
   Used by metadata (canonical, Open Graph), JSON-LD, sitemap,
   robots.txt and /llms.txt. Set NEXT_PUBLIC_SITE_URL to your real
   domain in production (e.g. https://lalitsharma.dev). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lks.com"
).replace(/\/+$/, "");
