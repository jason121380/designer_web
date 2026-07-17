import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { getR2PresignedUploadUrl, isR2Configured } from "@/lib/cloudflare-media";

export const dynamic = "force-dynamic";

// MIME → 副檔名（副檔名由實際 MIME 推導，不信任使用者檔名）
const VIDEO_MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

/** 回傳影片直傳 R2 的 presigned PUT URL 與上傳後的公開播放網址。 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { id?: string } | undefined;
  if (!u?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`video-url:${u.id}`, { limit: 30, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "上傳太頻繁，請稍後再試");

  if (!isR2Configured()) {
    return NextResponse.json({ error: "尚未設定 Cloudflare R2，無法上傳影片" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { contentType?: string; size?: number };
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const size = Number(body.size ?? 0);

  const ext = VIDEO_MIME_EXT[contentType];
  if (!ext) return NextResponse.json({ error: "不支援此影片格式（限 mp4、webm、mov）" }, { status: 400 });
  if (!Number.isFinite(size) || size <= 0) return NextResponse.json({ error: "檔案大小無效" }, { status: 400 });
  if (size > MAX_SIZE) return NextResponse.json({ error: "影片大小不得超過 200MB" }, { status: 400 });

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const key = `uploads/videos/${folder}/${filename}`;

  try {
    const { uploadUrl, publicUrl } = await getR2PresignedUploadUrl({ key, contentType });
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch {
    return NextResponse.json({ error: "產生上傳連結失敗，請稍後再試" }, { status: 502 });
  }
}
