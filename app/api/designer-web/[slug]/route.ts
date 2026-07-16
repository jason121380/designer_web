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

/** 切換頁面啟用狀態：{ active: false } 停用（前台回 404）、{ active: true } 重新啟用。 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const forbidden = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  const row = await prisma.siteSettings.findUnique({ where: { key: pageContentKey(slug) } });
  if (!row) return NextResponse.json({ error: "頁面不存在" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { active?: boolean };
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
