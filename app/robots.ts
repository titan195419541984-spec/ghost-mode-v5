import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://ghost-mode-v5-1.onrender.com/sitemap.xml",
    host: "https://ghost-mode-v5-1.onrender.com",
  };
}
