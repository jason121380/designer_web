import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DESIGNER_WEB_SETTINGS_PREFIX, parseDesignerWebContent } from "@/lib/designer-web-content";
import { sanitizeGtagId } from "@/lib/analytics";

export const dynamic = "force-dynamic";

interface GaPage {
  slug: string;
  brandName: string;
  active: boolean;
  gaId: string;
  status: "ok" | "invalid" | "unset";
}

/** 盤點各子頁的 GA 設定（格式是否正確、是否已設定）。ADMIN only。 */
export async function GET() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });

  const rows = await prisma.siteSettings.findMany({
    where: { key: { startsWith: DESIGNER_WEB_SETTINGS_PREFIX } },
    select: { key: true, value: true },
    orderBy: { key: "asc" },
  });

  const pages: GaPage[] = [];
  for (const row of rows) {
    let content;
    try {
      content = parseDesignerWebContent(row.value);
    } catch {
      continue;
    }
    if (content.archived) continue; // 已封存頁不列
    const slug = row.key.slice(DESIGNER_WEB_SETTINGS_PREFIX.length);
    const gaId = content.seo.gaId?.trim() ?? "";
    const status: GaPage["status"] = gaId ? (sanitizeGtagId(gaId) ? "ok" : "invalid") : "unset";
    pages.push({ slug, brandName: content.brand.name, active: content.active, gaId, status });
  }

  // 啟用中排前面，其次未設定的提醒在上。
  pages.sort((a, b) => Number(b.active) - Number(a.active));

  return NextResponse.json({
    pages,
    summary: {
      ok: pages.filter((p) => p.status === "ok").length,
      invalid: pages.filter((p) => p.status === "invalid").length,
      unset: pages.filter((p) => p.status === "unset").length,
    },
  });
}
