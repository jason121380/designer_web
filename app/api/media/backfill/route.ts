import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  parseDesignerWebContent,
  type DesignerWebContent,
} from "@/lib/designer-web-content";
import { isVideoUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

/** 從一頁內容收集所有媒體網址（僅 http(s)）。 */
function collectMediaUrls(content: DesignerWebContent): string[] {
  const urls: string[] = [];
  const push = (url?: string) => { if (url && /^https?:\/\//.test(url)) urls.push(url); };
  push(content.hero.image);
  push(content.hero.video);
  content.promos.forEach((item) => push(item.image));
  content.services.forEach((item) => push(item.image));
  content.otherServices.forEach((item) => push(item.image));
  content.videos.forEach((item) => push(item.video));
  content.environment.forEach((item) => push(item.image));
  push(content.seo.ogImage);
  push(content.links.avatar);
  push(content.links.qr);
  return urls;
}

/** 回填媒體庫：掃描所有頁面內容，把尚未記錄的媒體網址補進 media 表（主要用於改版前上傳的舊影片）。 */
export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }

  const rows = await prisma.siteSettings.findMany({
    where: { key: { startsWith: DESIGNER_WEB_SETTINGS_KEY } },
    select: { value: true },
  });

  const all = new Set<string>();
  for (const row of rows) {
    for (const url of collectMediaUrls(parseDesignerWebContent(row.value))) all.add(url);
  }
  const urls = [...all];
  if (urls.length === 0) return NextResponse.json({ scanned: 0, added: 0 });

  const existing = await prisma.media.findMany({ where: { url: { in: urls } }, select: { id: true, url: true, size: true } });
  const existingByUrl = new Map(existing.map((item) => [item.url, item]));
  const toAdd = urls.filter((url) => !existingByUrl.has(url));
  // 既有但沒有大小（例如先前回填為 0）的，補抓實際大小。
  const toFixSize = existing.filter((item) => !item.size);

  // 以 HEAD 取得檔案大小（Content-Length）；失敗回 0。
  const sizeCache = new Map<string, number>();
  const targets = [...new Set([...toAdd, ...toFixSize.map((item) => item.url)])];
  await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        const length = res.headers.get("content-length");
        sizeCache.set(url, length ? Number(length) : 0);
      } catch {
        sizeCache.set(url, 0);
      }
    })
  );

  if (toAdd.length > 0) {
    await prisma.media.createMany({
      data: toAdd.map((url) => ({
        filename: url.split("/").pop() || "media",
        originalName: url.split("/").pop() || "media",
        url,
        size: sizeCache.get(url) ?? 0,
        mimeType: isVideoUrl(url) ? "video/mp4" : "image/webp",
        userId: user.id!,
      })),
    });
  }

  let updated = 0;
  for (const item of toFixSize) {
    const size = sizeCache.get(item.url) ?? 0;
    if (size > 0) {
      await prisma.media.update({ where: { id: item.id }, data: { size } });
      updated += 1;
    }
  }

  return NextResponse.json({ scanned: urls.length, added: toAdd.length, updated });
}
