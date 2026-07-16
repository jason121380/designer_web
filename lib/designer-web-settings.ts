import { cache } from "react";
import {
  DESIGNER_WEB_HOME_PAGE_KEY,
  DESIGNER_WEB_SETTINGS_PREFIX,
  defaultDesignerWebContent,
  isValidPageSlug,
  pageContentKey,
  parseDesignerWebContent,
  type DesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";

// React cache()：同一次 request 內 Header、Footer、頁面與 metadata 共用同一筆查詢，
// 避免每次 render 對 site_settings 重複打三、四次 DB。

/** 首頁（`/`）內容：DB 未設定或讀取失敗時 fallback 到示範內容，前台永不 500。 */
export const getDesignerWebContent = cache(async (): Promise<DesignerWebContent> => {
  if (!process.env.DATABASE_URL) return defaultDesignerWebContent;

  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: pageContentKey() },
    });
    return parseDesignerWebContent(row?.value);
  } catch {
    return defaultDesignerWebContent;
  }
});

/** 子頁面（`/{slug}`）內容：頁面不存在或讀取失敗時回傳 null，由呼叫端 404。 */
export const getDesignerWebPageContent = cache(
  async (slug: string): Promise<DesignerWebContent | null> => {
    if (!process.env.DATABASE_URL) return null;

    try {
      const row = await prisma.siteSettings.findUnique({
        where: { key: pageContentKey(slug) },
      });
      return row ? parseDesignerWebContent(row.value) : null;
    } catch {
      return null;
    }
  }
);

/** 對外可見（啟用中）子頁面的 slug（不含首頁），供 sitemap 使用。 */
export const listDesignerWebPageSlugs = cache(async (): Promise<string[]> => {
  return (await listDesignerWebPages()).filter((page) => page.active).map((page) => page.slug);
});

/** 首頁顯示設定：回傳指定的子頁 slug；未設定或值無效時回傳 null（＝首頁自己的內容）。 */
export const getHomeDisplaySlug = cache(async (): Promise<string | null> => {
  if (!process.env.DATABASE_URL) return null;

  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: DESIGNER_WEB_HOME_PAGE_KEY },
    });
    const slug = row?.value?.trim() ?? "";
    return isValidPageSlug(slug) ? slug : null;
  } catch {
    return null;
  }
});

/** 首頁實際要呈現的內容：優先使用「首頁顯示」指定的子頁，該頁不存在時回退首頁自己的內容。 */
export async function getHomeDisplayContent(): Promise<DesignerWebContent> {
  const slug = await getHomeDisplaySlug();
  if (slug) {
    const content = await getDesignerWebPageContent(slug);
    if (content) return content;
  }
  return getDesignerWebContent();
}

/**
 * 首頁是否有「實際設定過」的內容可顯示：
 * 1) 有設定「首頁顯示」且該子頁存在，或
 * 2) 首頁自己在 DB 存過內容 row。
 * 皆無時回 false → 前台顯示維護頁，而非內建示範內容。
 */
export const isHomeConfigured = cache(async (): Promise<boolean> => {
  const slug = await getHomeDisplaySlug();
  if (slug && (await getDesignerWebPageContent(slug))) return true;

  if (!process.env.DATABASE_URL) return false;
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: pageContentKey() },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
});

export interface DesignerWebPageSummary {
  slug: string;
  brandName: string;
  active: boolean;
}

/** 所有子頁面的 slug、品牌名稱與啟用狀態（後台列表用），依 slug 排序。 */
export const listDesignerWebPages = cache(async (): Promise<DesignerWebPageSummary[]> => {
  if (!process.env.DATABASE_URL) return [];

  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { startsWith: DESIGNER_WEB_SETTINGS_PREFIX } },
      select: { key: true, value: true },
      orderBy: { key: "asc" },
    });
    return rows.map((row) => {
      const content = parseDesignerWebContent(row.value);
      return {
        slug: row.key.slice(DESIGNER_WEB_SETTINGS_PREFIX.length),
        brandName: content.brand.name,
        active: content.active,
      };
    });
  } catch {
    return [];
  }
});
