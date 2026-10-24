import type { MetadataRoute } from "next";

const baseUrl = "https://ghost-mode-v5-1.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1.0 },
    { path: "/guide", priority: 0.8 },
    { path: "/about", priority: 0.6 },
    { path: "/privacy", priority: 0.4 },
    { path: "/terms", priority: 0.4 },
  ];
  return routes.map(({ path, priority }) => ({
    url: baseUrl + path,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority,
  }));
}
