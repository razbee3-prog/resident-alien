import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/students", "/professionals", "/safety", "/about", "/waitlist", "/legal/disclosures", "/legal/privacy", "/legal/terms"].map(
    (p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }),
  );
}
