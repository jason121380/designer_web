import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { listDesignerWebPageSlugs } from "@/lib/designer-web-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listDesignerWebPageSlugs();
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...slugs.flatMap((slug) => [
      {
        url: `${SITE_URL}/${slug}/web`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/${slug}/links`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ]),
  ];
}
