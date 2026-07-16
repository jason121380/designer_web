import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 6;

/**
 * 編輯指定用戶：可更新登入帳號（email）、名稱、密碼；僅 ADMIN 可用。
 * 只更新有帶入的欄位；密碼留空＝不變更。不回傳任何密碼欄位。
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }

  const rl = rateLimit(`user-edit:${actor.id}`, { limit: 30, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "操作太頻繁，請稍後再試");

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
  };

  const data: Prisma.UserUpdateInput = {};

  if (typeof body.email === "string") {
    const email = body.email.trim();
    if (!email) return NextResponse.json({ error: "登入帳號不可空白" }, { status: 400 });
    data.email = email;
  }

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "名稱不可空白" }, { status: 400 });
    data.name = name;
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < MIN_PASSWORD) {
      return NextResponse.json({ error: `密碼至少 ${MIN_PASSWORD} 個字元` }, { status: 400 });
    }
    data.password = await bcrypt.hash(body.password, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "沒有要更新的欄位" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "用戶不存在" }, { status: 404 });

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (error) {
    // email 已被其他帳號使用
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "此登入帳號已被使用" }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
