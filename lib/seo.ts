export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
export const SITE_NAME = "Designer Web";
export const SITE_DESC = "Designer Web 一頁式品牌網站。";

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
  };
}

import type { Metadata } from "next";
import type { DesignerWebContent } from "@/lib/designer-web-content";

/**
 * 每個頁面（首頁與 /{slug}）的完整 SEO metadata。
 * 後台 SEO 設定優先；未填時自動使用網頁標題（品牌名稱）與主標題。
 * 各頁獨立 title / description / canonical / og / twitter，供搜尋與 Google Ads 到達頁使用。
 */
export function designerPageMetadata(content: DesignerWebContent, path: string): Metadata {
  const title = content.seo.title || content.brand.name;
  const description =
    content.seo.description || content.hero.heading.replace(/\s*\n\s*/g, "，").slice(0, 150);
  const ogImage =
    content.seo.ogImage || content.hero.media.find((item) => item.type === "image")?.url || "";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      siteName: content.brand.name,
      locale: "zh_TW",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/** 個人連結頁（`/{slug}/links`）的 SEO metadata。標題用品牌名、描述優先用連結頁簡介。 */
export function linksPageMetadata(content: DesignerWebContent, path: string): Metadata {
  const title = content.seo.title || `${content.brand.name}｜連結`;
  const description =
    content.links.bio || content.seo.description || content.brand.tagline || content.brand.name;
  const ogImage =
    content.links.avatar ||
    content.seo.ogImage ||
    content.hero.media.find((item) => item.type === "image")?.url ||
    "";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      siteName: content.brand.name,
      locale: "zh_TW",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function jsonLdGraph(...nodes: object[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  }).replace(/</g, "\\u003c");
}
