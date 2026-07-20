import { cache } from "react";
import {
  DESIGNER_WEB_SETTINGS_PREFIX,
  pageContentKey,
  parseDesignerWebContent,
  type DesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";

// React cache()：同一次 request 內頁面與 metadata 共用同一筆查詢，
// 避免每次 render 對 site_settings 重複打 DB。

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

/** 對外可見（啟用中且未封存）子頁面的 slug，供 sitemap 使用。 */
export const listDesignerWebPageSlugs = cache(async (): Promise<string[]> => {
  return (await listDesignerWebPages()).filter((page) => page.active && !page.archived).map((page) => page.slug);
});

export interface DesignerWebPageSummary {
  slug: string;
  brandName: string;
  active: boolean;
  archived: boolean;
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
        archived: content.archived,
      };
    });
  } catch {
    return [];
  }
});
