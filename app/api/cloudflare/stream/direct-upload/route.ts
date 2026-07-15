import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildStreamIframeUrl,
  buildStreamThumbnailUrl,
  createStreamDirectUpload,
} from "@/lib/cloudflare-media";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`stream-upload:${user.id}`, { limit: 30, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "影片上傳太頻繁,請稍後再試");

  const body = await req.json().catch(() => ({}));
  const maxDurationSeconds = Math.min(Math.max(Number(body.maxDurationSeconds ?? 3600), 1), 21600);

  try {
    const upload = await createStreamDirectUpload(maxDurationSeconds);
    return NextResponse.json({
      ...upload,
      iframeUrl: buildStreamIframeUrl(upload.uid),
      thumbnailUrl: buildStreamThumbnailUrl(upload.uid),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cloudflare Stream 上傳設定失敗" }, { status: 500 });
  }
}
