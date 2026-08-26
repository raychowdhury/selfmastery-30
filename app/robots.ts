import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything below these is personal to a signed-in account.
      disallow: ["/today", "/calendar", "/progress", "/reviews", "/challenge", "/settings", "/onboarding", "/api/"],
    },
  };
}
