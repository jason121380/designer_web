import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

// 與 upload / localize 寫入路徑一致（Zeabur runtime cwd = /src）
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// 只服務上傳白名單允許的點陣圖類型（與 /api/upload 一致）。
// 不含 svg/txt：SVG 可夾帶腳本，作為使用者上傳目錄的靜態服務有 XSS 風險，
// 且上傳流程本就不會產生這些檔案。
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;
  const base = path.resolve(UPLOAD_DIR);
  const target = path.resolve(base, parts.join("/"));

  // 防目錄穿越
  if (target !== base && !target.startsWith(base + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
