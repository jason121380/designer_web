import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireEditor() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) return null;
  return { id: user.id, role: user.role };
}

/** 媒體庫列表：回傳所有已上傳的圖片與影片（新到舊）。 */
export async function GET() {
  const user = await requireEditor();
  if (!user) return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });

  const media = await prisma.media.findMany({
    select: { id: true, url: true, mimeType: true, originalName: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(media);
}

/** 記錄一筆媒體（供影片直傳 R2 成功後回報；圖片上傳已於 /api/upload 直接記錄）。 */
export async function POST(req: NextRequest) {
  const user = await requireEditor();
  if (!user) return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });

  const rl = rateLimit(`media-record:${user.id}`, { limit: 60, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "操作太頻繁，請稍後再試");

  const body = (await req.json().catch(() => ({}))) as {
    url?: string;
    mimeType?: string;
    size?: number;
    originalName?: string;
  };
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  if (!url || !mimeType) return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });

  const originalName = (body.originalName || url.split("/").pop() || "media").slice(0, 200);
  const size = Number.isFinite(body.size) ? Number(body.size) : 0;

  // 同一網址已記錄過就不重複建立。
  const existing = await prisma.media.findFirst({ where: { url }, select: { id: true } });
  if (existing) return NextResponse.json({ id: existing.id }, { status: 200 });

  const media = await prisma.media.create({
    data: { filename: originalName, originalName, url, size, mimeType, userId: user.id },
    select: { id: true },
  });
  return NextResponse.json({ id: media.id }, { status: 201 });
}
