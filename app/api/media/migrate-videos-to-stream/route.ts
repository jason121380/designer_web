import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  DESIGNER_WEB_SETTINGS_PREFIX,
  parseDesignerWebContent,
  type DesignerWebContent,
} from "@/lib/designer-web-content";
import { isVideoUrl } from "@/lib/media";
import { buildStreamIframeUrl, copyStreamFromUrl, isStreamConfigured } from "@/lib/cloudflare-media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 一次最多搬移的影片數，避免異常內容造成大量對外請求。
const MAX_MIGRATE = 50;

/**
 * 從一頁內容收集所有「可放影片」欄位的網址：首屏影片、作品影片，以及
 * 促銷/DM、接髮介紹、特色項目、環境等項目（這些欄位圖片影片兩用）。
 * 是否真的是影片，由呼叫端以 isVideoUrl 過濾。
 */
function collectVideoUrls(content: DesignerWebContent): string[] {
  const urls: string[] = [];
  const push = (url?: string) => { if (url && /^https?:\/\//.test(url)) urls.push(url); };
  push(content.hero.video);
  content.videos.forEach((item) => push(item.video));
  content.promos.forEach((item) => push(item.image));
  content.services.forEach((item) => push(item.image));
  content.otherServices.forEach((item) => push(item.image));
  content.environment.forEach((item) => push(item.image));
  return urls;
}

/**
 * 把舊 R2 影片搬到 Cloudflare Stream：
 * 掃描所有頁面的影片欄位，對本站 R2 上的影片請 Stream 從網址匯入，
 * 再把所有頁面內容與媒體庫中的舊網址整批換成新的 Stream 播放網址。
 * 安全可重複執行（已是 Stream 網址的不會被再次收集）。ADMIN only。
 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }
  if (!isStreamConfigured()) {
    return NextResponse.json({ error: "尚未設定 Cloudflare Stream，無法搬移" }, { status: 503 });
  }

  const r2Base = (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/+$/, "");
  const isOwnR2 = (url: string) => Boolean(r2Base) && url.startsWith(`${r2Base}/`);

  const rows = await prisma.siteSettings.findMany({
    where: { key: { startsWith: DESIGNER_WEB_SETTINGS_KEY } },
    select: { key: true, value: true },
  });

  // 需搬移的目標：本站 R2 上的影片網址（Stream 網址不含 R2 base，天然被排除）。
  const targets = new Set<string>();
  for (const row of rows) {
    for (const url of collectVideoUrls(parseDesignerWebContent(row.value))) {
      if (isOwnR2(url) && isVideoUrl(url)) targets.add(url);
    }
  }
  const urls = [...targets].slice(0, MAX_MIGRATE);
  if (urls.length === 0) {
    return NextResponse.json({ scanned: 0, migrated: 0, failed: [] });
  }

  // 逐一請 Stream 從 R2 網址匯入，建立「舊網址 → 新 iframe 網址」對照。
  const mapping = new Map<string, string>();
  const failed: { url: string; error: string }[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const { uid } = await copyStreamFromUrl(url, url.split("/").pop() || undefined);
        mapping.set(url, buildStreamIframeUrl(uid));
      } catch (error) {
        failed.push({ url, error: error instanceof Error ? error.message : "匯入失敗" });
      }
    })
  );

  if (mapping.size === 0) {
    return NextResponse.json({ scanned: urls.length, migrated: 0, failed });
  }

  // 把所有頁面內容中的舊網址整批換成新網址（字串取代，最小變動、不重排其他欄位）。
  for (const row of rows) {
    let value = row.value;
    let changed = false;
    for (const [oldUrl, newUrl] of mapping) {
      if (value.includes(oldUrl)) {
        value = value.split(oldUrl).join(newUrl);
        changed = true;
      }
    }
    if (changed) {
      await prisma.siteSettings.update({ where: { key: row.key }, data: { value } });
      // 刷新該子頁前台快取（ISR），讓新的 Stream 網址立即生效。
      const slug = row.key.startsWith(DESIGNER_WEB_SETTINGS_PREFIX)
        ? row.key.slice(DESIGNER_WEB_SETTINGS_PREFIX.length)
        : "";
      if (slug) {
        revalidatePath(`/${slug}`);
        revalidatePath(`/${slug}/web`);
        revalidatePath(`/${slug}/links`);
      }
    }
  }

  // 同步媒體庫紀錄，讓舊影片列指向新的 Stream 播放網址（衝突則略過，不影響搬移結果）。
  for (const [oldUrl, newUrl] of mapping) {
    try {
      await prisma.media.updateMany({ where: { url: oldUrl }, data: { url: newUrl } });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ scanned: urls.length, migrated: mapping.size, failed });
}
