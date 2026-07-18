import { z } from "zod";

export const DESIGNER_WEB_SETTINGS_KEY = "designer_web_content";
export const DESIGNER_WEB_SETTINGS_PREFIX = `${DESIGNER_WEB_SETTINGS_KEY}:`;

// `home` 為保留字（不可作為頁面後綴），與 admin/api/uploads 一同保留給既有路由。
export const HOME_PAGE_SLUG = "home";
export const RESERVED_PAGE_SLUGS = [HOME_PAGE_SLUG, "admin", "api", "uploads"];

// 前台可排序/可改標題的內容區塊定義：key（資料欄位）、anchor（錨點 id）、預設中英標題。
export const SECTION_DEFS = [
  { key: "dm", anchor: "dm", zh: "活動 DM", en: "DM" },
  { key: "services", anchor: "services", zh: "接髮介紹", en: "Services" },
  { key: "otherServices", anchor: "other-services", zh: "特色項目", en: "Other Services" },
  { key: "videos", anchor: "hair-video", zh: "作品影片", en: "Works" },
  { key: "installment", anchor: "pay", zh: "分期介紹", en: "" },
  { key: "pricing", anchor: "pricing", zh: "價目表", en: "Pricing" },
  { key: "environment", anchor: "ev", zh: "環境介紹", en: "Environment" },
  { key: "contact", anchor: "contact", zh: "聯絡我們", en: "Contact" },
] as const;
export const SECTION_ANCHOR: Record<string, string> = Object.fromEntries(SECTION_DEFS.map((d) => [d.key, d.anchor]));

// 區塊預設底色＝「接髮介紹」底色（globals.css 的 --cream-3）。每個區塊可各自覆寫。
export const DEFAULT_SECTION_BG = "#f9f7f3";

// 頁面後綴：小寫英數與連字號，1-50 字，頭尾不可為連字號。
const PAGE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export function isValidPageSlug(slug: string): boolean {
  return PAGE_SLUG_PATTERN.test(slug) && !RESERVED_PAGE_SLUGS.includes(slug);
}

/** slug 省略時回傳首頁（`/`）使用的既有 key，維持舊資料相容。 */
export function pageContentKey(slug?: string | null): string {
  return slug ? `${DESIGNER_WEB_SETTINGS_PREFIX}${slug}` : DESIGNER_WEB_SETTINGS_KEY;
}

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
    headerTextColor: nullableString,
  }).optional(),
  hero: z.object({
    heading: nullableString,
    headingColor: nullableString,
    bgColor: nullableString,
    // 新版：固定一張圖片、一張影片。
    image: nullableString,
    video: nullableString,
    // 舊版相容欄位（normalize 時遷移到 image/video）。
    media: z.array(z.object({
      url: nullableString,
      type: z.enum(["image", "video"]).optional().nullable(),
    })).optional(),
    mediaUrl: nullableString,
    mediaType: z.enum(["image", "video"]).optional().nullable(),
  }).optional(),
  // 前台區塊順序、中英標題與底色（可在後台調整）。
  sections: z.array(z.object({
    key: nullableString,
    zh: nullableString,
    en: nullableString,
    bg: nullableString,
  })).optional(),
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
    category: nullableString,
  })).optional(),
  // 作品影片的分類清單（後台「管理分類」維護，影片從中挑選）。
  videoCategories: z.array(z.string()).optional(),
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
    // 前台右下角懸浮泡泡要顯示哪些聯絡管道。
    bubble: z.object({
      line: z.boolean().optional().nullable(),
      facebook: z.boolean().optional().nullable(),
      instagram: z.boolean().optional().nullable(),
      map: z.boolean().optional().nullable(),
    }).optional(),
  }).optional(),
  seo: z.object({
    title: nullableString,
    description: nullableString,
    ogImage: nullableString,
  }).optional(),
  // 個人連結頁（linktree 風格）：頭像、簡介、連結按鈕清單與 QR Code 圖。
  links: z.object({
    avatar: nullableString,
    bio: nullableString,
    qr: nullableString,
    items: z.array(z.object({
      id: nullableString,
      label: nullableString,
      url: nullableString,
    })).optional(),
    // 連結頁專屬社群（與一頁式 contact 獨立；舊資料 normalize 時由 contact 種入）。
    social: z.object({
      instagram: nullableString,
      facebook: nullableString,
      line: nullableString,
      email: nullableString,
      phone: nullableString,
      mapUrl: nullableString,
    }).optional(),
  }).optional(),
  // 子頁面是否啟用；false＝停用，前台該 slug 回 404（不刪除內容）。缺欄位＝啟用（向下相容）。
  active: z.boolean().optional().nullable(),
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
  brand: { name: string; tagline: string; themeColor: string; headerTextColor: string };
  hero: { heading: string; headingColor: string; bgColor: string; image: string; video: string };
  /** 前台區塊順序、中英標題與底色（依此順序渲染，標題與底色可自訂）。 */
  sections: { key: string; zh: string; en: string; bg: string }[];
  promos: { id: string; image: string; caption: string }[];
  services: PageService[];
  otherServices: PageService[];
  videos: { id: string; video: string; caption: string; category: string }[];
  /** 作品影片分類清單（順序即前台標籤順序）。 */
  videoCategories: string[];
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
    /** 前台右下角懸浮泡泡顯示哪些管道（line/facebook/instagram/map）。 */
    bubble: { line: boolean; facebook: boolean; instagram: boolean; map: boolean };
  };
  /** 每頁獨立 SEO；空字串代表自動使用品牌與主標題產生。 */
  seo: { title: string; description: string; ogImage: string };
  /** 個人連結頁（`/{slug}/links`，linktree 風格）內容。social 與一頁式 contact 獨立。 */
  links: {
    avatar: string;
    bio: string;
    qr: string;
    items: { id: string; label: string; url: string }[];
    social: { instagram: string; facebook: string; line: string; email: string; phone: string; mapUrl: string };
  };
  /** 子頁面是否啟用；false＝停用（前台該 slug 回 404）。首頁不使用此欄位。 */
  active: boolean;
}

export const defaultDesignerWebContent: DesignerWebContent = {
  brand: {
    name: "KIMEKO HAIR（示範）",
    tagline: "中壢接髮推薦",
    themeColor: "#d9bf77",
    headerTextColor: "#ffffff",
  },
  hero: {
    heading:
      "中壢接髮推薦 KIMEKO HAIR\n極致零感羽毛接髮｜新縮毛鏡面燙｜歐美手刷染\n日韓系光線染｜5G 網狀纖維護髮｜特殊色白金髮",
    headingColor: "#ffffff",
    bgColor: "#171717",
    image: "",
    video: "",
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
  videoCategories: [],
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
    facebook: "",
    bubble: { line: true, facebook: false, instagram: true, map: true },
  },
  seo: { title: "", description: "", ogImage: "" },
  links: { avatar: "", bio: "", qr: "", items: [], social: { instagram: "", facebook: "", line: "", email: "", phone: "", mapUrl: "" } },
  sections: SECTION_DEFS.map((d) => ({ key: d.key, zh: d.zh, en: d.en, bg: DEFAULT_SECTION_BG })),
  active: true,
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

/** 首屏媒體正規化：固定一張圖片、一張影片。新版 image/video 欄位優先，否則從舊版 media[]／mediaUrl 遷移。 */
function normalizeHeroMedia(hero: RawContent["hero"]): { image: string; video: string } {
  let image = trim(hero?.image);
  let video = trim(hero?.video);
  if (!image && !video) {
    // 舊版 media 陣列：取第一張圖片與第一支影片。
    for (const item of hero?.media ?? []) {
      const url = trim(item?.url);
      if (!url) continue;
      if (item?.type === "video") {
        if (!video) video = url;
      } else if (!image) {
        image = url;
      }
    }
    // 更舊版單一媒體欄位。
    if (!image && !video) {
      const url = trim(hero?.mediaUrl);
      if (url) {
        if (hero?.mediaType === "video") video = url;
        else image = url;
      }
    }
  }
  return { image, video };
}

function normalizeSections(input: RawContent["sections"]): DesignerWebContent["sections"] {
  const seen = new Set<string>();
  const result: DesignerWebContent["sections"] = [];
  for (const s of input ?? []) {
    const key = trim(s?.key);
    const def = SECTION_DEFS.find((d) => d.key === key);
    if (!def || seen.has(key)) continue;
    seen.add(key);
    // zh 必有（清空回預設避免無標題）；en 可清空（清空＝不顯示英文副標）；bg 缺值回預設底色。
    result.push({ key, zh: withDefault(s?.zh, def.zh), en: trim(s?.en), bg: withDefault(s?.bg, DEFAULT_SECTION_BG) });
  }
  // 補上缺少的區塊（維持預設順序在最後）。
  for (const def of SECTION_DEFS) {
    if (!seen.has(def.key)) result.push({ key: def.key, zh: def.zh, en: def.en, bg: DEFAULT_SECTION_BG });
  }
  return result;
}

function normalizeContact(contact: RawContent["contact"]): DesignerWebContent["contact"] {
  const defaults = defaultDesignerWebContent.contact;
  // 完全沒有 contact 資料（示範狀態）→ 用預設示範值當新頁起始。
  if (!contact) return { ...defaults, bubble: { ...defaults.bubble } };
  // 已有 contact 資料時：所有欄位清空就是清空（包含地址與電話），
  // 前台會隱藏空的項目，不再被塞回示範值。
  return {
    address: trim(contact.address),
    mapUrl: trim(contact.mapUrl),
    phone: trim(contact.phone),
    email: trim(contact.email),
    line: trim(contact.line),
    instagram: trim(contact.instagram),
    facebook: trim(contact.facebook),
    bubble: {
      line: contact.bubble?.line === true,
      facebook: contact.bubble?.facebook === true,
      instagram: contact.bubble?.instagram === true,
      map: contact.bubble?.map === true,
    },
  };
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
      category: trim(item.category),
    }));
  const videoCategories = Array.from(new Set(stringList(data.videoCategories)));
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
  const installment = stringList(data.installment);
  const contact = normalizeContact(data.contact);
  const linkItems = (data.links?.items ?? [])
    .filter((item) => trim(item.url) && trim(item.label))
    .map((item, index) => ({
      id: itemId(item.id, "link", index),
      label: trim(item.label),
      url: trim(item.url),
    }));

  return {
    brand: {
      name: withDefault(data.brand?.name, defaultDesignerWebContent.brand.name),
      tagline: withDefault(data.brand?.tagline, defaultDesignerWebContent.brand.tagline),
      themeColor: withDefault(data.brand?.themeColor, defaultDesignerWebContent.brand.themeColor),
      headerTextColor: withDefault(data.brand?.headerTextColor, defaultDesignerWebContent.brand.headerTextColor),
    },
    hero: {
      heading: withDefault(data.hero?.heading, defaultDesignerWebContent.hero.heading),
      headingColor: withDefault(data.hero?.headingColor, defaultDesignerWebContent.hero.headingColor),
      bgColor: withDefault(data.hero?.bgColor, defaultDesignerWebContent.hero.bgColor),
      ...normalizeHeroMedia(data.hero),
    },
    promos,
    services: normalizeServices(data.services, defaultDesignerWebContent.services),
    otherServices: normalizeServices(data.otherServices, defaultDesignerWebContent.otherServices),
    videos,
    videoCategories,
    installment: installment.length ? installment : defaultDesignerWebContent.installment,
    pricing: pricing.length ? pricing : defaultDesignerWebContent.pricing,
    environment,
    contact,
    seo: {
      title: trim(data.seo?.title),
      description: trim(data.seo?.description),
      ogImage: trim(data.seo?.ogImage),
    },
    links: {
      avatar: trim(data.links?.avatar),
      bio: trim(data.links?.bio),
      qr: trim(data.links?.qr),
      items: linkItems,
      // 有 social（新資料）→ 用其值；無 social 但有 contact（舊資料共用）→ 由 contact 種入一次，之後兩頁各自獨立；都沒有 → 空白。
      social: data.links?.social
        ? {
            instagram: trim(data.links.social.instagram),
            facebook: trim(data.links.social.facebook),
            line: trim(data.links.social.line),
            email: trim(data.links.social.email),
            phone: trim(data.links.social.phone),
            mapUrl: trim(data.links.social.mapUrl),
          }
        : data.contact
          ? {
              instagram: contact.instagram,
              facebook: contact.facebook,
              line: contact.line,
              email: contact.email,
              phone: contact.phone,
              mapUrl: contact.mapUrl,
            }
          : { instagram: "", facebook: "", line: "", email: "", phone: "", mapUrl: "" },
    },
    sections: normalizeSections(data.sections),
    // 只有明確為 false 才停用；缺欄位或其他值一律視為啟用（向下相容舊資料）。
    active: data.active !== false,
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
