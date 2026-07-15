import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const u = session?.user as { role?: string } | undefined;
  if (!u || (u.role !== "ADMIN" && u.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { alt } = await req.json();
  const media = await prisma.media.update({ where: { id }, data: { alt } });
  return NextResponse.json(media);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (media.url.startsWith("/uploads/")) {
    try {
      await unlink(join(process.cwd(), "public", media.url));
    } catch {}
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
