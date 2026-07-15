import { cache } from "react";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  defaultDesignerWebContent,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";

// React cache()：同一次 request 內 Header、Footer、頁面與 metadata 共用同一筆查詢，
// 避免每次 render 對 site_settings 重複打三、四次 DB。
export const getDesignerWebContent = cache(async () => {
  if (!process.env.DATABASE_URL) return defaultDesignerWebContent;

  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: DESIGNER_WEB_SETTINGS_KEY },
    });
    return parseDesignerWebContent(row?.value);
  } catch {
    return defaultDesignerWebContent;
  }
});
