import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/cloudflare-media";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
// MIME → 副檔名：副檔名一律由檔案的實際 MIME 推導，不信任使用者檔名。
// （舊寫法用 file.name 推副檔名，無副檔名或怪異檔名會讓本機儲存的檔案
//  透過 /uploads 服務時 Content-Type 變成 octet-stream 而破圖。）
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const ALLOWED_TYPES = Object.keys(MIME_EXT);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 1600;
const QUALITY = 80;

export async function POST(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 上傳寫磁碟,限速以保護 Volume 容量與 CPU
  const rl = rateLimit(`upload:${u.id}`, { limit: 60, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "上傳太頻繁,請稍後再試");

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "未選擇檔案" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "不支援此檔案類型" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "檔案大小不得超過 10MB" }, { status: 400 });

  const original = Buffer.from(await file.arrayBuffer());

  // jpeg/png 一律縮到 1600px + 轉 webp（與 /api/optimize-images 同規格,讓新上傳不再是大原圖）。
  // gif 可能是動圖、avif/webp 已壓過 → 維持原樣不重壓,避免破壞動畫或無謂放大。
  // 型別用 Uint8Array：sharp().toBuffer() 是 Buffer<ArrayBufferLike>，
  // 與 Buffer.from(arrayBuffer) 的 Buffer<ArrayBuffer> 在新版 @types/node 不相容，
  // 統一成兩者都可指派的 Uint8Array（writeFile / .length 皆可吃）。
  let buffer: Uint8Array = original;
  let mimeType = file.type;
  let ext = MIME_EXT[file.type] ?? "bin";
  if (file.type === "image/jpeg" || file.type === "image/png") {
    try {
      buffer = await sharp(original)
        .rotate() // 依 EXIF 方向修正後去掉方位資訊
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      ext = "webp";
      mimeType = "image/webp";
    } catch {
      // 轉檔失敗就存原檔,不擋上傳
      buffer = original;
    }
  }

  // Create year/month folder
  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const key = `uploads/${folder}/${filename}`;
  let url: string;

  if (isR2Configured()) {
    url = await uploadToR2({ key, body: buffer, contentType: mimeType });
  } else {
    const uploadPath = join(UPLOAD_DIR, folder);
    await mkdir(uploadPath, { recursive: true });
    await writeFile(join(uploadPath, filename), buffer);
    url = `/${key}`;
  }

  const media = await prisma.media.create({
    data: {
      filename,
      originalName: file.name,
      url,
      size: buffer.length,
      mimeType,
      userId: u.id,
    },
  });

  return NextResponse.json({ id: media.id, url, filename: media.originalName }, { status: 201 });
}
