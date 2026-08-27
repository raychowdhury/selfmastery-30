import type { MetadataRoute } from "next";

// || not ??: a NEXT_PUBLIC_SITE_URL created blank in a dashboard would
// otherwise reach new URL("") and fail the whole build.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/templates", "/sign-up", "/sign-in"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
