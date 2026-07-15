import { z } from "zod";

export const DESIGNER_WEB_SETTINGS_KEY = "designer_web_content";

const nullableString = z.string().optional().nullable();
const nullableStringList = z.array(z.string()).optional().nullable();

const serviceSchema = z.object({
  id: nullableString,
  title: nullableString,
  description: nullableString,
  features: nullableStringList,
  suitableFor: nullableStringList,
  image: nullableString,
  price: nullableString,
});

const pricingSchema = z.object({
  name: nullableString,
  price: nullableString,
  description: nullableString,
  features: nullableStringList,
});

export const designerWebContentSchema = z.object({
  brand: z.object({
    name: nullableString,
    tagline: nullableString,
    themeColor: nullableString,
  }).optional(),
  hero: z.object({
    heading: nullableString,
    mediaUrl: nullableString,
    mediaType: z.enum(["image", "video"]).optional().nullable(),
  }).optional(),
  promos: z.array(z.object({
    id: nullableString,
    image: nullableString,
    caption: nullableString,
  })).optional(),
  services: z.array(serviceSchema).optional(),
  otherServices: z.array(serviceSchema).optional(),
  videos: z.array(z.object({
    id: nullableString,
    video: nullableString,
    caption: nullableString,
  })).optional(),
  installment: z.array(z.string()).optional(),
  pricing: z.array(pricingSchema).optional(),
  environment: z.array(z.object({
    id: nullableString,
    image: nullableString,
    alt: nullableString,
  })).optional(),
  contact: z.object({
    address: nullableString,
    mapUrl: nullableString,
    phone: nullableString,
    email: nullableString,
    line: nullableString,
    instagram: nullableString,
    facebook: nullableString,
    mapEmbedUrl: nullableString,
  }).optional(),
});

export interface PageService {
  id: string;
  title: string;
  description: string;
  features: string[];
  suitableFor: string[];
  image: string;
  price: string;
}

export interface DesignerWebContent {
  brand: { name: string; tagline: string; themeColor: string };
  hero: { heading: string; mediaUrl: string; mediaType: "image" | "video" };
  promos: { id: string; image: string; caption: string }[];
  services: PageService[];
  otherServices: PageService[];
  videos: { id: string; video: string; caption: string }[];
  installment: string[];
  pricing: { name: string; price: string; description: string; features: string[] }[];
  environment: { id: string; image: string; alt: string }[];
  contact: {
    address: string;
    mapUrl: string;
    phone: string;
    email: string;
    line: string;
    instagram: string;
    facebook: string;
    mapEmbedUrl: string;
  };
}

export const defaultDesignerWebContent: DesignerWebContent = {
  brand: {
    name: "KIMEKO HAIR（示範）",
    tagline: "中壢接髮推薦",
    themeColor: "#d9bf77",
  },
  hero: {
    heading:
      "中壢接髮推薦 KIMEKO HAIR\n極致零感羽毛接髮｜新縮毛鏡面燙｜歐美手刷染\n日韓系光線染｜5G 網狀纖維護髮｜特殊色白金髮",
    mediaUrl: "",
    mediaType: "image",
  },
  promos: [],
  services: [
    {
      id: "feather-extension",
      title: "1. 極致零感羽毛接髮",
      description: "一種超輕量、超隱形的接髮技術，強調零感佩戴，像羽毛一樣輕盈柔順。",
      features: ["小接點設計，接合處幾乎隱形", "適合細軟髮、髮量少，增量不增負擔", "可自然擺動，洗髮梳理都方便"],
      suitableFor: ["希望接髮後仍維持自然輕盈感的人", "容易因接髮重量頭皮不適的人"],
      image: "",
      price: "",
    },
  ],
  otherServices: [
    {
      id: "mirror-perm",
      title: "1. 新縮毛鏡面燙",
      description: "升級版縮毛矯正，讓頭髮達到超順直與高光澤，像鏡面一樣反光。",
      features: ["比傳統縮毛矯正更溫和", "光澤感提升，柔順亮麗"],
      suitableFor: ["自然捲、毛躁髮想要柔順光澤的人"],
      image: "",
      price: "",
    },
    {
      id: "balayage",
      title: "2. 歐美手刷染",
      description: "來自歐美的 Balayage 手刷染，創造自然漸層與光影。",
      features: ["自然漸層，不會一塊一塊", "維護簡單，布丁頭不明顯"],
      suitableFor: ["想要層次感、不喜歡單一髮色的人"],
      image: "",
      price: "",
    },
  ],
  videos: [],
  installment: [
    "【zingala 銀角零卡】先享受、後付款，不需要任何信用卡。",
    "分期可分 3/6/9 期，美麗無壓力，先享受下個月再付款。",
    "申請條件：1. 年滿 18 歲 2. 需有工作收入 3. 信用正常。",
  ],
  pricing: [
    {
      name: "極致零感羽毛接髮",
      price: "私訊報價",
      description: "依原生髮長、髮量與希望呈現的長度現場評估。",
      features: ["小接點設計", "輕盈自然", "可染可燙可造型"],
    },
    {
      name: "染燙造型",
      price: "私訊報價",
      description: "鏡面燙、歐美手刷染與日韓系光線染，依髮況提供完整建議。",
      features: ["髮況評估", "客製色彩", "居家整理建議"],
    },
    {
      name: "5G 網狀纖維護髮",
      price: "私訊報價",
      description: "依受損程度與髮長評估護髮用量及完整療程。",
      features: ["強韌髮芯", "改善乾燥毛躁", "提升光澤與柔順度"],
    },
  ],
  environment: [],
  contact: {
    address: "桃園市中壢區中平路106號2樓",
    mapUrl: "https://maps.app.goo.gl/nRbRwUan3vsPeUmT8",
    phone: "0938-323-506",
    email: "",
    line: "https://lin.ee/Urb3nYc",
    instagram: "https://www.instagram.com/kimeko0905",
    facebook: "https://www.facebook.com/",
    mapEmbedUrl: "",
  },
};

type RawContent = z.infer<typeof designerWebContentSchema>;

const trim = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const withDefault = (value: unknown, fallback: string) => trim(value) || fallback;
const stringList = (items: string[] | null | undefined) => (items ?? []).map(trim).filter(Boolean);
const itemId = (value: unknown, prefix: string, index: number) => trim(value) || `${prefix}-${index + 1}`;

function normalizeServices(items: RawContent["services"], fallback: PageService[]) {
  const normalized = (items ?? [])
    .filter((item) => trim(item.title))
    .map((item, index) => ({
      id: itemId(item.id, "service", index),
      title: trim(item.title),
      description: trim(item.description),
      features: stringList(item.features),
      suitableFor: stringList(item.suitableFor),
      image: trim(item.image),
      price: trim(item.price),
    }));
  return normalized.length ? normalized : fallback;
}

export function normalizeDesignerWebContent(input: unknown): DesignerWebContent {
  const parsed = designerWebContentSchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};
  const legacyDesignerSeed = trim(data.brand?.name).toLowerCase() === "designer_web";
  if (legacyDesignerSeed) return structuredClone(defaultDesignerWebContent);

  const promos = (data.promos ?? [])
    .filter((item) => trim(item.image))
    .map((item, index) => ({
      id: itemId(item.id, "dm", index),
      image: trim(item.image),
      caption: trim(item.caption),
    }));
  const videos = (data.videos ?? [])
    .filter((item) => trim(item.video))
    .map((item, index) => ({
      id: itemId(item.id, "video", index),
      video: trim(item.video),
      caption: trim(item.caption),
    }));
  const pricing = (data.pricing ?? [])
    .filter((item) => trim(item.name))
    .map((item) => ({
      name: trim(item.name),
      price: trim(item.price),
      description: trim(item.description),
      features: stringList(item.features),
    }));
  const environment = (data.environment ?? [])
    .filter((item) => trim(item.image))
    .map((item, index) => ({
      id: itemId(item.id, "environment", index),
      image: trim(item.image),
      alt: trim(item.alt),
    }));

  return {
    brand: {
      name: withDefault(data.brand?.name, defaultDesignerWebContent.brand.name),
      tagline: withDefault(data.brand?.tagline, defaultDesignerWebContent.brand.tagline),
      themeColor: withDefault(data.brand?.themeColor, defaultDesignerWebContent.brand.themeColor),
    },
    hero: {
      heading: withDefault(data.hero?.heading, defaultDesignerWebContent.hero.heading),
      mediaUrl: trim(data.hero?.mediaUrl),
      mediaType: data.hero?.mediaType ?? defaultDesignerWebContent.hero.mediaType,
    },
    promos,
    services: normalizeServices(data.services, defaultDesignerWebContent.services),
    otherServices: normalizeServices(data.otherServices, defaultDesignerWebContent.otherServices),
    videos,
    installment: stringList(data.installment).length
      ? stringList(data.installment)
      : defaultDesignerWebContent.installment,
    pricing: pricing.length ? pricing : defaultDesignerWebContent.pricing,
    environment,
    contact: {
      address: withDefault(data.contact?.address, defaultDesignerWebContent.contact.address),
      mapUrl: withDefault(data.contact?.mapUrl, defaultDesignerWebContent.contact.mapUrl),
      phone: withDefault(data.contact?.phone, defaultDesignerWebContent.contact.phone),
      email: trim(data.contact?.email),
      line: withDefault(data.contact?.line, defaultDesignerWebContent.contact.line),
      instagram: withDefault(data.contact?.instagram, defaultDesignerWebContent.contact.instagram),
      facebook: withDefault(data.contact?.facebook, defaultDesignerWebContent.contact.facebook),
      mapEmbedUrl: trim(data.contact?.mapEmbedUrl),
    },
  };
}

export function parseDesignerWebContent(value: string | null | undefined): DesignerWebContent {
  if (!value) return structuredClone(defaultDesignerWebContent);
  try {
    return normalizeDesignerWebContent(JSON.parse(value));
  } catch {
    return structuredClone(defaultDesignerWebContent);
  }
}
