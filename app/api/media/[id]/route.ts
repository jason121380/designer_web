import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromR2, isR2Configured, r2KeyFromPublicUrl } from "@/lib/cloudflare-media";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function requireEditor() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) return null;
  return user;
}

/** 刪除媒體：先刪 R2 物件（本站 R2 網址才刪），再刪 DB 紀錄。外部貼上的網址只刪紀錄。 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await requireEditor();
  if (!user) return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });

  const { id } = await context.params;
  const media = await prisma.media.findUnique({ where: { id }, select: { id: true, url: true } });
  if (!media) return NextResponse.json({ error: "媒體不存在" }, { status: 404 });

  const key = r2KeyFromPublicUrl(media.url);
  if (key && isR2Configured()) {
    try {
      await deleteFromR2(key);
    } catch (error) {
      console.error("刪除 R2 物件失敗", error);
      // R2 刪除失敗仍繼續刪 DB 紀錄，避免媒體庫殘留死列。
    }
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
