import { z } from "zod";

export const DESIGNER_WEB_SETTINGS_KEY = "designer_web_content";

const nullableString = z.string().optional().nullable();

const heroSchema = z.object({
  eyebrow: nullableString,
  title: nullableString,
  subtitle: nullableString,
  description: nullableString,
  primaryCtaLabel: nullableString,
  primaryCtaHref: nullableString,
  secondaryCtaLabel: nullableString,
  secondaryCtaHref: nullableString,
  image: nullableString,
});

const serviceSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
});

const portfolioSchema = z.object({
  title: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

const pricingSchema = z.object({
  name: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
});

const processSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const designerWebContentSchema = z.object({
  brand: z.object({
    name: nullableString,
    tagline: nullableString,
  }).optional(),
  hero: heroSchema.optional(),
  announcement: z.object({
    title: nullableString,
    body: nullableString,
  }).optional(),
  services: z.array(serviceSchema).optional(),
  portfolio: z.array(portfolioSchema).optional(),
  pricing: z.array(pricingSchema).optional(),
  process: z.array(processSchema).optional(),
  contact: z.object({
    address: nullableString,
    phone: nullableString,
    email: nullableString,
    line: nullableString,
    instagram: nullableString,
    facebook: nullableString,
    mapEmbedUrl: nullableString,
  }).optional(),
});

export type DesignerWebContent = z.infer<typeof designerWebContentSchema>;

const trim = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const withDefault = (value: unknown, fallback: string) => trim(value) || fallback;

export const defaultDesignerWebContent = {
  brand: {
    name: "designer_web",
    tagline: "設計師個人品牌・一頁式形象網站",
  },
  hero: {
    eyebrow: "DESIGNER WEB STUDIO",
    title: "讓專業服務被看見，也讓預約變得更簡單",
    subtitle: "一頁式品牌網站・內容後台・作品集展示",
    description:
      "專為設計師、美業職人與個人服務品牌打造的單頁官網。從首屏形象、服務介紹、作品展示、價目資訊到聯絡預約，所有內容都能在後台更新。",
    primaryCtaLabel: "立即諮詢",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "查看服務",
    secondaryCtaHref: "#services",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
  },
  announcement: {
    title: "限量品牌改版方案",
    body: "適合需要快速建立專業形象頁、作品集與預約入口的個人品牌。",
  },
  services: [
    {
      title: "一頁式品牌網站",
      description: "以手機優先設計首頁、錨點導覽、服務介紹、作品展示與聯絡 CTA。",
      price: "NT$ 38,000 起",
    },
    {
      title: "內容後台建置",
      description: "保留 CMS 管理能力，可更新前台文字、作品、價目、聯絡資訊與圖片。",
      price: "NT$ 18,000 起",
    },
    {
      title: "SEO 與轉換優化",
      description: "設定標題描述、結構化內容與預約動線，讓訪客更容易採取行動。",
      price: "NT$ 12,000 起",
    },
  ],
  portfolio: [
    {
      title: "Hair Artist Landing",
      category: "美業設計師",
      image:
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Interior Profile",
      category: "空間設計",
      image:
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Personal Brand System",
      category: "顧問服務",
      image:
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    },
  ],
  pricing: [
    {
      name: "Starter",
      price: "NT$ 38,000",
      description: "適合剛開始建立個人品牌的設計師。",
      features: ["單頁形象網站", "手機版 RWD", "基本 SEO", "聯絡 CTA"],
    },
    {
      name: "Studio",
      price: "NT$ 68,000",
      description: "適合需要後台管理與作品集的工作室。",
      features: ["內容管理後台", "作品與價目管理", "媒體庫", "流量分析"],
    },
    {
      name: "Growth",
      price: "客製報價",
      description: "適合需要多頁內容、AI 輔助與長期優化的品牌。",
      features: ["內容策略", "進階 SEO", "AI 產文輔助", "部署與維運"],
    },
  ],
  process: [
    { title: "01 訪談", description: "釐清品牌定位、服務內容、目標客群與預約流程。" },
    { title: "02 設計", description: "建立一頁式資訊架構、視覺方向與手機版動線。" },
    { title: "03 建置", description: "串接前台與後台，讓內容可以由管理者自行更新。" },
    { title: "04 上線", description: "完成 SEO、部署、測試與後續優化建議。" },
  ],
  contact: {
    address: "台北市信義區設計路 88 號",
    phone: "02-2345-6789",
    email: "hello@designer-web.tw",
    line: "https://line.me/R/ti/p/@designerweb",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    mapEmbedUrl: "",
  },
} satisfies DesignerWebContent;

function compactItems<T extends Record<string, unknown>>(items: T[] | undefined, requiredKey: keyof T) {
  return (items ?? []).filter((item) => trim(item[requiredKey]).length > 0);
}

export function normalizeDesignerWebContent(input: unknown): DesignerWebContent {
  const parsed = designerWebContentSchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  const content: DesignerWebContent = {
    brand: {
      name: withDefault(data.brand?.name, defaultDesignerWebContent.brand.name),
      tagline: withDefault(data.brand?.tagline, defaultDesignerWebContent.brand.tagline),
    },
    hero: {
      eyebrow: withDefault(data.hero?.eyebrow, defaultDesignerWebContent.hero.eyebrow),
      title: withDefault(data.hero?.title, defaultDesignerWebContent.hero.title),
      subtitle: withDefault(data.hero?.subtitle, defaultDesignerWebContent.hero.subtitle),
      description: withDefault(data.hero?.description, defaultDesignerWebContent.hero.description),
      primaryCtaLabel: withDefault(data.hero?.primaryCtaLabel, defaultDesignerWebContent.hero.primaryCtaLabel),
      primaryCtaHref: withDefault(data.hero?.primaryCtaHref, defaultDesignerWebContent.hero.primaryCtaHref),
      secondaryCtaLabel: withDefault(data.hero?.secondaryCtaLabel, defaultDesignerWebContent.hero.secondaryCtaLabel),
      secondaryCtaHref: withDefault(data.hero?.secondaryCtaHref, defaultDesignerWebContent.hero.secondaryCtaHref),
      image: withDefault(data.hero?.image, defaultDesignerWebContent.hero.image),
    },
    announcement: {
      title: withDefault(data.announcement?.title, defaultDesignerWebContent.announcement.title),
      body: withDefault(data.announcement?.body, defaultDesignerWebContent.announcement.body),
    },
    services: compactItems(data.services, "title").map((item) => ({
      title: trim(item.title),
      description: trim(item.description),
      price: trim(item.price),
    })),
    portfolio: compactItems(data.portfolio, "title").map((item) => ({
      title: trim(item.title),
      category: trim(item.category),
      image: trim(item.image),
    })),
    pricing: compactItems(data.pricing, "name").map((item) => ({
      name: trim(item.name),
      price: trim(item.price),
      description: trim(item.description),
      features: (item.features ?? []).map((feature) => feature.trim()).filter(Boolean),
    })),
    process: compactItems(data.process, "title").map((item) => ({
      title: trim(item.title),
      description: trim(item.description),
    })),
    contact: {
      address: withDefault(data.contact?.address, defaultDesignerWebContent.contact.address),
      phone: withDefault(data.contact?.phone, defaultDesignerWebContent.contact.phone),
      email: withDefault(data.contact?.email, defaultDesignerWebContent.contact.email),
      line: withDefault(data.contact?.line, defaultDesignerWebContent.contact.line),
      instagram: withDefault(data.contact?.instagram, defaultDesignerWebContent.contact.instagram),
      facebook: withDefault(data.contact?.facebook, defaultDesignerWebContent.contact.facebook),
      mapEmbedUrl: trim(data.contact?.mapEmbedUrl),
    },
  };

  return {
    ...content,
    services: content.services?.length ? content.services : defaultDesignerWebContent.services,
    portfolio: content.portfolio?.length ? content.portfolio : defaultDesignerWebContent.portfolio,
    pricing: content.pricing?.length ? content.pricing : defaultDesignerWebContent.pricing,
    process: content.process?.length ? content.process : defaultDesignerWebContent.process,
  };
}

export function parseDesignerWebContent(value: string | null | undefined): DesignerWebContent {
  if (!value) return defaultDesignerWebContent;
  try {
    return normalizeDesignerWebContent(JSON.parse(value));
  } catch {
    return defaultDesignerWebContent;
  }
}
