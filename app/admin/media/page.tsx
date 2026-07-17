import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  DESIGNER_WEB_SETTINGS_PREFIX,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import { collectMediaUsage } from "@/lib/media-usage";
import MediaLibrary, { type MediaItem } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  // 媒體庫供編輯與管理員使用；未登入或角色不符導回頁面管理。
  if (user?.role !== "ADMIN" && user?.role !== "EDITOR") redirect("/admin/page-management");

  const [rows, settings] = await Promise.all([
    prisma.media.findMany({
      select: { id: true, url: true, mimeType: true, originalName: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.siteSettings.findMany({
      where: { key: { startsWith: DESIGNER_WEB_SETTINGS_KEY } },
      select: { key: true, value: true },
    }),
  ]);

  // 建立「媒體網址 → 被引用位置」對照。
  const usageMap = new Map<string, string[]>();
  for (const row of settings) {
    const slug = row.key === DESIGNER_WEB_SETTINGS_KEY ? "首頁" : row.key.slice(DESIGNER_WEB_SETTINGS_PREFIX.length);
    for (const { url, label } of collectMediaUsage(parseDesignerWebContent(row.value))) {
      const list = usageMap.get(url) ?? [];
      list.push(`${slug} · ${label}`);
      usageMap.set(url, list);
    }
  }

  const media: MediaItem[] = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    usages: usageMap.get(row.url) ?? [],
  }));

  return <MediaLibrary initialMedia={media} />;
}
