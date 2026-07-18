import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

// 網站圖示（favicon / App icon 共用同一張）的公開網址，存單一 site_settings 列。
const SITE_ICON_KEY = "site_icon_url";
const SITE_ICON_TAG = "site-icon";

// 以標籤快取，避免根 layout 與 manifest 在每次請求都查一次 DB；設定時以 revalidateTag 失效。
const readSiteIcon = unstable_cache(
  async () => {
    try {
      const row = await prisma.siteSettings.findUnique({ where: { key: SITE_ICON_KEY } });
      return row?.value?.trim() || "";
    } catch {
      // 建置期（靜態產生 not-found 等）沒有 DB 連線時回空字串，改用預設圖示。
      return "";
    }
  },
  ["site-icon"],
  { tags: [SITE_ICON_TAG], revalidate: 3600 }
);

export async function getSiteIconUrl(): Promise<string> {
  return readSiteIcon();
}

export async function setSiteIconUrl(url: string): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: SITE_ICON_KEY },
    create: { key: SITE_ICON_KEY, value: url },
    update: { value: url },
  });
  revalidateTag(SITE_ICON_TAG);
}
