import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

/**
 * 一次性維運工具：把「舊站」Volume 上的上傳圖檔複製到「本機」這顆 Volume。
 *
 * 用途：搬伺服器後新 Volume 是空的 → 全站破圖。DB 路徑都是本地 /uploads/...,
 * localize-images 無外部 URL 可抓(救不了),改由本工具去舊站把同名檔抓回來。
 *
 * 必要條件：ADMIN 登入 + MAINT_TOOLS=1，且帶 ?from=<舊站網址>。
 *   ?from   舊站可連到的網址(例：https://xxx.zeabur.app)。圖片走舊站公開的
 *           /uploads/[...path] 串流路由,無需登入。
 *   ?dry=1  只統計要抓幾張、已存在幾張,不連網。
 *   ?auto=1 回傳會自己一批批跑到完的進度頁(放著別關)。
 *   ?limit  單批最多抓幾張(預設 25,上限 100)。
 *
 * 用完務必移除 MAINT_TOOLS。
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const DEFAULT_LIMIT = 25;

function normBase(raw: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s.replace(/\/+$/, "");
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// 收集 DB 內所有指向本地 /uploads/... 的圖片路徑(featuredImage + 內文 + 媒體庫)
async function collectUploadPaths(): Promise<string[]> {
  const out = new Set<string>();
  const add = (p: string | null | undefined) => {
    if (p && p.startsWith("/uploads/")) out.add(p);
  };

  const articles = await prisma.article.findMany({
    select: { featuredImage: true, content: true },
  });
  const re = /\/uploads\/[^\s"'<>)]+/g;
  for (const a of articles) {
    add(a.featuredImage);
    if (a.content) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(a.content)) !== null) add(m[0]);
    }
  }

  const media = await prisma.media.findMany({ select: { url: true } });
  for (const md of media) add(md.url);

  return [...out];
}

// /uploads/<rel> → 本機磁碟絕對路徑(防目錄穿越)
function destFor(uploadPath: string): string | null {
  const rel = uploadPath.replace(/^\/uploads\//, "");
  let decoded = rel;
  try {
    decoded = decodeURIComponent(rel);
  } catch {
    /* 保留原樣 */
  }
  const base = path.resolve(UPLOAD_DIR);
  const target = path.resolve(base, decoded);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

export async function GET(req: NextRequest) {
  if (process.env.MAINT_TOOLS !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json(
      { error: "需要以管理員身分登入後台後再開此連結" },
      { status: 401 }
    );
  }

  const from = normBase(req.nextUrl.searchParams.get("from"));
  if (!from) {
    return NextResponse.json(
      { error: "需要 ?from=舊站網址（例：?from=https://xxx.zeabur.app）" },
      { status: 400 }
    );
  }

  const paths = await collectUploadPaths();

  // 預覽：算數量,不連網
  if (req.nextUrl.searchParams.get("dry") === "1") {
    let already = 0;
    for (const p of paths) {
      const dest = destFor(p);
      if (dest && (await exists(dest))) already++;
    }
    return NextResponse.json({
      dryRun: true,
      from,
      uniqueUploadPaths: paths.length,
      alreadyOnDisk: already,
      missing: paths.length - already,
      note: `共 ${paths.length} 張本地圖片，已在本機 ${already} 張，缺 ${
        paths.length - already
      } 張。實際執行：?from=${from}&auto=1`,
    });
  }

  // 自動版：回傳會自己一批批跑到完的頁面
  if (req.nextUrl.searchParams.get("auto") === "1") {
    const api = `/api/copy-uploads?from=${encodeURIComponent(from)}&limit=25`;
    const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>從舊站複製圖片</title>
<style>body{font-family:system-ui,-apple-system,"PingFang TC",sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#222}
h1{font-size:20px}#log{white-space:pre-wrap;background:#f6f6f6;border-radius:8px;padding:14px;font-size:13px;line-height:1.7;max-height:60vh;overflow:auto}
.b{font-weight:700}.ok{color:#15803d}.err{color:#b91c1c}</style></head>
<body><h1>從舊站複製圖片中…</h1>
<p>來源：<code>${from}</code></p>
<p>請<span class="b">不要關閉這個分頁</span>，它會自己一批批跑到完。完成後會顯示「全部完成」。</p>
<div id="log">啟動中…\n</div>
<script>
const log=document.getElementById('log');
let totalDl=0,totalFail=0,round=0;
function add(t,c){const s=document.createElement('span');if(c)s.className=c;s.textContent=t+"\\n";log.appendChild(s);log.scrollTop=log.scrollHeight;}
async function tick(){
  round++;
  try{
    const r=await fetch('${api}',{cache:'no-store'});
    const j=await r.json();
    if(j.error){add('錯誤：'+j.error,'err');return;}
    totalDl+=j.filesCopied||0; totalFail+=j.failed||0;
    add('第 '+round+' 批：本批複製 '+j.filesCopied+'、已存在跳過 '+j.filesReused+'、失敗 '+j.failed+' ｜ 累計複製 '+totalDl+' 失敗 '+totalFail);
    if(j.errorsSample&&j.errorsSample.length){j.errorsSample.forEach(e=>add('  ✗ '+e,'err'));}
    if(j.done){add('✅ 全部完成！累計複製 '+totalDl+' 張，失敗 '+totalFail+'。回前台重新整理確認，確認 OK 後記得移除 MAINT_TOOLS。','ok');return;}
    setTimeout(tick,800);
  }catch(e){
    add('這批連線中斷（進度已存，會自動重試）…','err');
    setTimeout(tick,3000);
  }
}
tick();
</script></body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const limit = Math.max(
    1,
    Math.min(100, Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT))
  );

  let copied = 0;
  let reused = 0;
  let failed = 0;
  const errors: string[] = [];
  let budget = limit;
  let moreRemaining = false;

  for (const p of paths) {
    if (budget <= 0) {
      moreRemaining = true;
      break;
    }
    const dest = destFor(p);
    if (!dest) {
      failed++;
      if (errors.length < 15) errors.push(`${p} :: 路徑不合法`);
      continue;
    }
    if (await exists(dest)) {
      reused++;
      continue;
    }
    try {
      const url = from + encodeURI(p);
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      copied++;
      budget--;
    } catch (e) {
      failed++;
      if (errors.length < 15) errors.push(`${p} :: ${String(e)}`);
    }
  }

  if (!moreRemaining) {
    // 再確認是否真的全部抓完(扣掉這批失敗的)
    let stillMissing = 0;
    for (const p of paths) {
      const dest = destFor(p);
      if (dest && !(await exists(dest))) stillMissing++;
    }
    moreRemaining = stillMissing > failed; // 還有未處理且非本批失敗的
    if (stillMissing === 0) moreRemaining = false;
  }

  return NextResponse.json({
    dryRun: false,
    from,
    batchLimit: limit,
    filesCopied: copied,
    filesReused: reused,
    failed,
    errorsSample: errors,
    done: !moreRemaining,
    note: moreRemaining
      ? "這批完成，還有圖沒抓完 → 再開一次同一個網址繼續（已存在的會跳過）。"
      : "全部完成！圖片已從舊站複製到本機 /uploads。重新整理前台確認，確認 OK 後移除 MAINT_TOOLS，舊站確認可安全保留或下線。",
  });
}
