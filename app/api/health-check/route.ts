import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  DESIGNER_WEB_SETTINGS_PREFIX,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import {
  checkR2Connectivity,
  checkStreamStatus,
  isR2Configured,
  isStreamConfigured,
} from "@/lib/cloudflare-media";
import { getSiteIconUrl } from "@/lib/site-icon";
import { isVideoUrl } from "@/lib/media";
import { streamUidFromUrl } from "@/lib/stream-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Status = "ok" | "warn" | "error";
interface Check {
  group: string;
  label: string;
  status: Status;
  detail: string;
}

const has = (name: string) => Boolean((process.env[name] ?? "").trim());
const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).hostname : "";
  } catch {
    return "";
  }
};

/** 完整健康檢查：資料庫、環境變數、Cloudflare R2／Stream、帳號、內容。唯讀，ADMIN only。 */
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 403 });
  }

  const checks: Check[] = [];
  const add = (group: string, label: string, status: Status, detail: string) =>
    checks.push({ group, label, status, detail });

  // === 環境設定 ===
  add("環境設定", "AUTH_SECRET", has("AUTH_SECRET") ? "ok" : "error", has("AUTH_SECRET") ? "已設定" : "未設定，登入功能無法運作");
  add("環境設定", "NEXTAUTH_URL", has("NEXTAUTH_URL") ? "ok" : "warn", process.env.NEXTAUTH_URL || "未設定");
  add("環境設定", "SITE_URL", has("SITE_URL") ? "ok" : "warn", process.env.SITE_URL || "未設定");
  if (has("NEXTAUTH_URL") && has("SITE_URL")) {
    const same = hostOf(process.env.NEXTAUTH_URL) === hostOf(process.env.SITE_URL);
    add("環境設定", "網域一致性", same ? "ok" : "warn", same ? "NEXTAUTH_URL 與 SITE_URL 同網域" : "NEXTAUTH_URL 與 SITE_URL 網域不同，正式環境登入可能異常");
  }

  // === 資料庫與內容 ===
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    add("資料庫與內容", "資料庫連線", "ok", "PostgreSQL 連線正常");
  } catch (error) {
    add("資料庫與內容", "資料庫連線", "error", error instanceof Error ? error.message : "無法連線資料庫");
  }

  if (dbOk) {
    try {
      const rows = await prisma.siteSettings.findMany({
        where: { key: { startsWith: DESIGNER_WEB_SETTINGS_KEY } },
        select: { key: true, value: true },
      });
      const subpages = rows.filter((row) => row.key.startsWith(DESIGNER_WEB_SETTINGS_PREFIX));
      let corrupt = 0;
      let active = 0;
      let videoTotal = 0;
      let videoStream = 0;
      for (const row of subpages) {
        try {
          JSON.parse(row.value);
        } catch {
          corrupt += 1;
          continue;
        }
        const content = parseDesignerWebContent(row.value);
        if (content.active) active += 1;
        const vids = [content.hero.video, ...content.videos.map((v) => v.video)].filter((u) => u && isVideoUrl(u));
        for (const v of vids) {
          videoTotal += 1;
          if (streamUidFromUrl(v)) videoStream += 1;
        }
      }
      add("資料庫與內容", "子頁面", "ok", `共 ${subpages.length} 頁，其中 ${active} 頁啟用中`);
      add("資料庫與內容", "內容格式", corrupt === 0 ? "ok" : "error", corrupt === 0 ? "所有頁面內容 JSON 正常" : `有 ${corrupt} 頁內容毀損，前台會顯示預設內容`);
      if (videoTotal > 0) {
        const onR2 = videoTotal - videoStream;
        add("資料庫與內容", "影片來源", onR2 === 0 ? "ok" : "warn", `作品／首屏影片共 ${videoTotal} 支：Stream ${videoStream} 支${onR2 > 0 ? `、仍在 R2 ${onR2} 支（可用工程模式搬移）` : ""}`);
      }
    } catch (error) {
      add("資料庫與內容", "內容讀取", "error", error instanceof Error ? error.message : "讀取頁面內容失敗");
    }

    // === 帳號 ===
    try {
      const [users, admins] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
      ]);
      add("帳號", "使用者", "ok", `共 ${users} 個帳號`);
      add("帳號", "管理員", admins > 0 ? "ok" : "error", admins > 0 ? `${admins} 個 ADMIN` : "沒有任何 ADMIN 帳號");
    } catch (error) {
      add("帳號", "帳號讀取", "error", error instanceof Error ? error.message : "讀取帳號失敗");
    }

    // === 媒體庫 ===
    try {
      const media = await prisma.media.count();
      add("Cloudflare 媒體", "媒體庫紀錄", "ok", `共 ${media} 筆媒體`);
    } catch {
      // 忽略，非關鍵
    }
  }

  // === Cloudflare R2（圖片＋影片回退）===
  const r2Ok = isR2Configured();
  add("Cloudflare 媒體", "R2 設定", r2Ok ? "ok" : "error", r2Ok ? "5 個 R2 變數齊全" : "R2 變數不完整，圖片上傳會失敗");
  if (r2Ok) {
    const conn = await checkR2Connectivity();
    add("Cloudflare 媒體", "R2 連線", conn.ok ? "ok" : "warn", conn.ok ? "可存取 bucket" : `無法列出物件：${conn.error ?? "未知錯誤"}`);
  }

  // === Cloudflare Stream（影片）===
  const streamOk = isStreamConfigured();
  add("Cloudflare 媒體", "Stream 設定", streamOk ? "ok" : "warn", streamOk ? "帳戶 ID 與 API Token 已設定" : "未設定，影片會改用 R2（載入較慢）");
  if (streamOk) {
    const status = await checkStreamStatus();
    if (!status.ok) {
      add("Cloudflare 媒體", "Stream API", "error", `Token 或帳戶錯誤：${status.error ?? "未知錯誤"}`);
    } else {
      const processing = status.processing ?? 0;
      const errored = status.errored ?? 0;
      const st: Status = errored > 0 ? "warn" : "ok";
      add("Cloudflare 媒體", "Stream API", st, `Token 有效。影片 ${status.total ?? 0} 支：可播 ${status.ready ?? 0}、轉檔中 ${processing}${errored > 0 ? `、失敗 ${errored}` : ""}`);
    }
  }

  // === 選填功能 ===
  add("選填功能", "AI SEO（Gemini）", has("GEMINI_API_KEY") ? "ok" : "warn", has("GEMINI_API_KEY") ? "已啟用 AI 自動填寫" : "未設定，SEO「AI 自動填寫」停用");
  try {
    const icon = await getSiteIconUrl();
    add("選填功能", "網站圖示", "ok", icon ? "已設定自訂 favicon" : "使用預設圖示");
  } catch {
    // 忽略
  }

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  return NextResponse.json({ checks, summary });
}
