import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 一次性維運工具:移除文章內文中的「延伸閱讀」段落(整個 <p>...延伸閱讀...</p>,
 * 含其中的連結)。用 raw SQL 更新 content,繞過 Prisma @updatedAt 自動覆寫。
 * 受 MAINT_TOOLS 控管,需 ADMIN。?dry=1 預覽。
 */
const RE = /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?延伸閱讀[\s\S]*?<\/p>/gi;

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

  const articles = await prisma.article.findMany({
    select: { id: true, title: true, content: true },
  });

  let changed = 0;
  let removedParagraphs = 0;
  const sample: { title: string; removed: string[] }[] = [];

  for (const a of articles) {
    if (!a.content) continue;
    const matches = a.content.match(RE);
    if (!matches || matches.length === 0) continue;

    removedParagraphs += matches.length;
    const next = a.content.replace(RE, "").replace(/(\s*<p>\s*<\/p>\s*)+/gi, "");

    if (sample.length < 5) {
      sample.push({
        title: (a.title ?? "").slice(0, 30),
        removed: matches.map((m) => m.replace(/<[^>]+>/g, "").trim().slice(0, 80)),
      });
    }

    if (!dry) {
      await prisma.$executeRaw`UPDATE "articles" SET "content" = ${next} WHERE "id" = ${a.id}`;
    }
    changed++;
  }

  return NextResponse.json({
    stripRelatedReading: true,
    dryRun: dry,
    totalArticles: articles.length,
    articlesAffected: changed,
    paragraphsRemoved: removedParagraphs,
    sample,
    note: dry
      ? "預覽(dry=1),未寫入。確認 sample 無誤後拿掉 ?dry=1 再開一次即實際移除。"
      : `完成:已從 ${changed} 篇移除 ${removedParagraphs} 個「延伸閱讀」段落。`,
  });
}
