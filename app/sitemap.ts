import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listDesignerWebPageSlugs } from "@/lib/designer-web-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listDesignerWebPageSlugs();
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
