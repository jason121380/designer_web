import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSiteIconUrl, setSiteIconUrl } from "@/lib/site-icon";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === "ADMIN";
}

/** 取得目前網站圖示網址。 */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  return NextResponse.json({ url: await getSiteIconUrl() });
}

/** 設定網站圖示網址（favicon / App icon 共用）；空字串＝清除，回退預設圖示。 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = typeof body.url === "string" ? body.url.trim() : "";
  await setSiteIconUrl(url);
  return NextResponse.json({ url });
}
