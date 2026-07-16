import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  defaultDesignerWebContent,
  isValidPageSlug,
  normalizeDesignerWebContent,
  pageContentKey,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

async function requireEditor() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });
  }
  return null;
}

async function resolveSlug(context: RouteContext) {
  const { slug } = await context.params;
  return isValidPageSlug(slug) ? slug : null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  const row = await prisma.siteSettings.findUnique({ where: { key: pageContentKey(slug) } });
  if (!row) return NextResponse.json({ error: "頁面不存在" }, { status: 404 });
  return NextResponse.json(parseDesignerWebContent(row.value));
}

/** 建立新頁面：以示範內容起始，可帶入設計師名稱設為品牌名；已存在時回 409，避免覆寫。 */
export async function POST(req: NextRequest, context: RouteContext) {
  const forbidden = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) {
    return NextResponse.json(
      { error: "頁面後綴限小寫英數與連字號（1-50 字），且不可使用保留字" },
      { status: 400 }
    );
  }

  const key = pageContentKey(slug);
  const existing = await prisma.siteSettings.findUnique({ where: { key } });
  if (existing) return NextResponse.json({ error: "頁面已存在" }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  const content = structuredClone(defaultDesignerWebContent);
  if (name) content.brand.name = name;
  await prisma.siteSettings.create({ data: { key, value: JSON.stringify(content) } });
  return NextResponse.json(content, { status: 201 });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const forbidden = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  const content = normalizeDesignerWebContent(await req.json());
  await prisma.siteSettings.upsert({
    where: { key: pageContentKey(slug) },
    create: { key: pageContentKey(slug), value: JSON.stringify(content) },
    update: { value: JSON.stringify(content) },
  });
  return NextResponse.json(content);
}

/**
 * 兩用：
 * - { slug: "新後綴" } 變更網址後綴（搬移 site_settings key，內容不變）。
 * - { active: boolean } 切換啟用/停用（停用後前台回 404）。
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const forbidden = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  const row = await prisma.siteSettings.findUnique({ where: { key: pageContentKey(slug) } });
  if (!row) return NextResponse.json({ error: "頁面不存在" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { active?: boolean; slug?: string };

  // 變更後綴：搬移 key（建立新 key、刪除舊 key），內容原封不動
  if (typeof body.slug === "string") {
    const newSlug = body.slug.trim().toLowerCase();
    if (!isValidPageSlug(newSlug)) {
      return NextResponse.json({ error: "後綴限小寫英數與連字號（1-50 字），且不可使用保留字" }, { status: 400 });
    }
    if (newSlug === slug) return NextResponse.json({ slug });

    const exists = await prisma.siteSettings.findUnique({
      where: { key: pageContentKey(newSlug) },
      select: { id: true },
    });
    if (exists) return NextResponse.json({ error: "此後綴已被使用" }, { status: 409 });

    await prisma.$transaction([
      prisma.siteSettings.create({ data: { key: pageContentKey(newSlug), value: row.value } }),
      prisma.siteSettings.delete({ where: { key: pageContentKey(slug) } }),
    ]);
    return NextResponse.json({ slug: newSlug });
  }

  // 切換啟用狀態
  const content = parseDesignerWebContent(row.value);
  content.active = body.active === true;
  await prisma.siteSettings.update({
    where: { key: pageContentKey(slug) },
    data: { value: JSON.stringify(content) },
  });
  return NextResponse.json({ active: content.active });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const forbidden = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  try {
    await prisma.siteSettings.delete({ where: { key: pageContentKey(slug) } });
  } catch {
    return NextResponse.json({ error: "頁面不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
