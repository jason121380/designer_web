import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DESIGNER_WEB_HOME_PAGE_KEY,
  DESIGNER_WEB_SETTINGS_KEY,
  isValidPageSlug,
  normalizeDesignerWebContent,
  pageContentKey,
} from "@/lib/designer-web-content";
import { getDesignerWebContent } from "@/lib/designer-web-settings";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDesignerWebContent());
}

/** 清除首頁自己的內容，讓 `/` 回到維護頁（不影響子頁面與首頁顯示設定）。 */
export async function DELETE() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });
  }
  await prisma.siteSettings.deleteMany({ where: { key: DESIGNER_WEB_SETTINGS_KEY } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });
  }

  const content = normalizeDesignerWebContent(await req.json());
  await prisma.siteSettings.upsert({
    where: { key: DESIGNER_WEB_SETTINGS_KEY },
    create: {
      key: DESIGNER_WEB_SETTINGS_KEY,
      value: JSON.stringify(content),
    },
    update: {
      value: JSON.stringify(content),
    },
  });

  return NextResponse.json(content);
}

/** 首頁顯示設定：{ homePageSlug: "kimiko" } 指定子頁、{ homePageSlug: null } 恢復首頁自己的內容。 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });
  }

  const body = (await req.json()) as { homePageSlug?: string | null };
  const slug = body.homePageSlug?.trim() || null;

  if (slug === null) {
    await prisma.siteSettings.deleteMany({ where: { key: DESIGNER_WEB_HOME_PAGE_KEY } });
    return NextResponse.json({ homePageSlug: null });
  }

  if (!isValidPageSlug(slug)) {
    return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });
  }
  const page = await prisma.siteSettings.findUnique({ where: { key: pageContentKey(slug) } });
  if (!page) return NextResponse.json({ error: "頁面不存在" }, { status: 404 });

  await prisma.siteSettings.upsert({
    where: { key: DESIGNER_WEB_HOME_PAGE_KEY },
    create: { key: DESIGNER_WEB_HOME_PAGE_KEY, value: slug },
    update: { value: slug },
  });
  return NextResponse.json({ homePageSlug: slug });
}
