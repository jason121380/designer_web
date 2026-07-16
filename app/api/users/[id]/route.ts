import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 6;

/** 重設指定用戶密碼；僅 ADMIN 可用。不回傳任何密碼欄位。 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }

  const rl = rateLimit(`user-pw:${actor.id}`, { limit: 30, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "操作太頻繁，請稍後再試");

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `密碼至少 ${MIN_PASSWORD} 個字元` }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "用戶不存在" }, { status: 404 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
