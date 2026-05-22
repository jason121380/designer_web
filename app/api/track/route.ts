import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensurePageViewsTable } from "@/lib/page-views";
import { rateLimit, debounce, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // 每 IP 每分鐘最多 60 次,單純擋洪水(被擋直接回 204 不告知,避免被當壓測 oracle)
  if (!rateLimit(`track:${ip}`, { limit: 60, windowMs: 60_000 }).ok) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    let path: unknown = body?.path;

    if (typeof path !== "string") return new NextResponse(null, { status: 204 });
    // 只收同站、合理長度的路徑;略過後台與資產
    if (!path.startsWith("/") || path.startsWith("//") || path.length > 512) {
      return new NextResponse(null, { status: 204 });
    }
    if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
      return new NextResponse(null, { status: 204 });
    }
    path = path.split("#")[0].slice(0, 512);

    // 去抖:同 IP+path 2 秒內重複觸發(SPA 多次 effect / 連按)→ 不重複寫 DB
    if (debounce(`track:${ip}:${path}`, 2000)) {
      return new NextResponse(null, { status: 204 });
    }

    const articleId =
      typeof body?.articleId === "string" ? body.articleId.slice(0, 64) : null;
    const ref = req.headers.get("referer");
    const referrer = ref ? ref.slice(0, 512) : null;

    await ensurePageViewsTable();
    await prisma.pageView.create({
      data: { path: path as string, articleId, referrer },
    });
  } catch {
    // 追蹤失敗不可影響使用者
  }
  return new NextResponse(null, { status: 204 });
}
