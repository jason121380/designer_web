import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildStreamIframeUrl } from "@/lib/cloudflare-media";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const uid = typeof body.uid === "string" ? body.uid.trim() : "";
  if (!uid) return NextResponse.json({ error: "缺少 Cloudflare Stream UID" }, { status: 400 });

  const originalName = typeof body.originalName === "string" && body.originalName.trim() ? body.originalName.trim() : `${uid}.mp4`;
  const size = Number.isFinite(Number(body.size)) ? Number(body.size) : 0;
  const mimeType = typeof body.mimeType === "string" && body.mimeType.trim() ? body.mimeType.trim() : "video/mp4";

  const media = await prisma.media.create({
    data: {
      filename: uid,
      originalName,
      url: buildStreamIframeUrl(uid),
      size,
      mimeType,
      userId: user.id,
    },
  });

  return NextResponse.json({ id: media.id, url: media.url, filename: media.originalName }, { status: 201 });
}
