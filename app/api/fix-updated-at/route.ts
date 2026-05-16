import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 一次性維運工具:把匯入文章的 updatedAt 還原成真實文章日期。
 * seed-data 的 updatedAt/createdAt 都是匯入當天(無意義),真實日期在
 * publishedAt,故將 updatedAt 設為 publishedAt。需用 raw SQL,因為
 * Prisma 的 @updatedAt 會在一般 update 時自動覆寫成現在時間。
 * 受 MAINT_TOOLS 控管,需 ADMIN。
 */
export async function GET(req: NextRequest) {
  if (process.env.MAINT_TOOLS !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理員身分" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";

  let seed: { id: string; publishedAt: string | number | null }[];
  try {
    const raw = await readFile(
      path.join(process.cwd(), "scripts", "seed-data", "articles.json"),
      "utf-8"
    );
    seed = JSON.parse(raw);
  } catch (e) {
    return NextResponse.json(
      { error: "讀不到 seed-data/articles.json", detail: String(e) },
      { status: 500 }
    );
  }

  let updated = 0;
  let skipped = 0;
  const sample: { id: string; updatedAt: string }[] = [];

  for (const a of seed) {
    if (!a.publishedAt) {
      skipped++;
      continue;
    }
    const d = new Date(a.publishedAt);
    if (isNaN(d.getTime())) {
      skipped++;
      continue;
    }
    if (sample.length < 5) sample.push({ id: a.id, updatedAt: d.toISOString() });
    if (!dry) {
      // 參數化 raw SQL;繞過 @updatedAt 自動覆寫
      await prisma.$executeRaw`UPDATE "articles" SET "updatedAt" = ${d} WHERE "id" = ${a.id}`;
    }
    updated++;
  }

  return NextResponse.json({
    fixUpdatedAt: true,
    dryRun: dry,
    seedArticles: seed.length,
    willUpdate: updated,
    skipped,
    sample,
    note: dry
      ? "預覽(dry=1),未寫入。確認後拿掉 ?dry=1 再開一次即實際還原。"
      : `完成:已將 ${updated} 篇的 updatedAt 設為其真實 publishedAt。`,
  });
}
