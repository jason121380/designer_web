export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
export const SITE_NAME = "Designer Web";
export const SITE_DESC =
  "Designer Web 一頁式品牌網站與內容管理系統。";

export function abs(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESC,
    inLanguage: "zh-TW",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

interface ArticleInput {
  title: string;
  slug: string;
  description: string;
  image?: string | null;
  imageAlt?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  authorName: string;
  categoryName?: string | null;
  tags?: string[];
}

export function articleJsonLd(a: ArticleInput) {
  const url = `${SITE_URL}/article/${a.slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.description,
    ...(a.image
      ? { image: { "@type": "ImageObject", url: abs(a.image), caption: a.imageAlt ?? a.title } }
      : {}),
    datePublished: (a.publishedAt ?? a.updatedAt).toISOString(),
    dateModified: a.updatedAt.toISOString(),
    inLanguage: "zh-TW",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: a.authorName },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(a.categoryName ? { articleSection: a.categoryName } : {}),
    ...(a.tags && a.tags.length ? { keywords: a.tags.join(", ") } : {}),
  };
}

export function jsonLdGraph(...nodes: object[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  }).replace(/</g, "\\u003c");
}
