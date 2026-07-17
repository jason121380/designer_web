import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 6;
const ROLES = ["ADMIN", "EDITOR", "AUTHOR"];

/** 新增後台登入帳號；僅 ADMIN 可用。不回傳任何密碼欄位。 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const actor = session?.user as { id?: string; role?: string } | undefined;
  if (!actor?.id || actor.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }

  const rl = rateLimit(`user-create:${actor.id}`, { limit: 20, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "操作太頻繁，請稍後再試");

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  };

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = ROLES.includes(body.role ?? "") ? (body.role as string) : "EDITOR";

  if (!email) return NextResponse.json({ error: "登入帳號不可空白" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "名稱不可空白" }, { status: 400 });
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `密碼至少 ${MIN_PASSWORD} 個字元` }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role },
      select: { id: true },
    });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "此登入帳號已被使用" }, { status: 409 });
    }
    throw error;
  }
}
