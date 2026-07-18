import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  defaultDesignerWebContent,
  isValidPageSlug,
  normalizeDesignerWebContent,
  pageContentKey,
  parseDesignerWebContent,
} from "@/lib/designer-web-content";
import prisma from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { clearSlugRedirect, recordSlugRename } from "@/lib/slug-redirects";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

async function requireEditor() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return { error: NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 }), userId: "" };
  }
  return { error: null, userId: user.id ?? "" };
}

async function resolveSlug(context: RouteContext) {
  const { slug } = await context.params;
  return isValidPageSlug(slug) ? slug : null;
}

/** 編輯後立即刷新該子頁的前台快取（ISR），讓變更馬上生效。 */
function revalidateSlug(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/web`);
  revalidatePath(`/${slug}/links`);
  revalidatePath("/sitemap.xml");
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
  const { error: forbidden } = await requireEditor();
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

  const body = (await req.json().catch(() => ({}))) as { name?: string; from?: string };
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const from = typeof body?.from === "string" ? body.from.trim().toLowerCase() : "";

  // from 有值＝複製來源頁內容；否則以示範內容起始。
  let content = structuredClone(defaultDesignerWebContent);
  if (from) {
    if (!isValidPageSlug(from)) return NextResponse.json({ error: "來源頁面後綴無效" }, { status: 400 });
    const srcRow = await prisma.siteSettings.findUnique({ where: { key: pageContentKey(from) } });
    if (!srcRow) return NextResponse.json({ error: "來源頁面不存在" }, { status: 404 });
    content = parseDesignerWebContent(srcRow.value);
    content.active = true; // 複製出來的新頁預設啟用
  }
  if (name) content.brand.name = name;

  await prisma.siteSettings.create({ data: { key, value: JSON.stringify(content) } });
  await clearSlugRedirect(slug); // 若此後綴曾是別頁的舊轉址，建立實體頁後清掉，避免被導走
  revalidateSlug(slug);
  return NextResponse.json(content, { status: 201 });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { error: forbidden, userId } = await requireEditor();
  if (forbidden) return forbidden;

  const rl = rateLimit(`designer-web-put:${userId}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "儲存太頻繁，請稍後再試");

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  const content = normalizeDesignerWebContent(await req.json());
  await prisma.siteSettings.upsert({
    where: { key: pageContentKey(slug) },
    create: { key: pageContentKey(slug), value: JSON.stringify(content) },
    update: { value: JSON.stringify(content) },
  });
  revalidateSlug(slug);
  return NextResponse.json(content);
}

/**
 * 兩用：
 * - { slug: "新後綴" } 變更網址後綴（搬移 site_settings key，內容不變）。
 * - { active: boolean } 切換啟用/停用（停用後前台回 404）。
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { error: forbidden } = await requireEditor();
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
    // 記錄舊後綴 → 新後綴，前台會 308 永久轉址（保住廣告到達頁與 SEO）。
    await recordSlugRename(slug, newSlug);
    revalidateSlug(slug);
    revalidateSlug(newSlug);
    return NextResponse.json({ slug: newSlug });
  }

  // 切換啟用狀態
  const content = parseDesignerWebContent(row.value);
  content.active = body.active === true;
  await prisma.siteSettings.update({
    where: { key: pageContentKey(slug) },
    data: { value: JSON.stringify(content) },
  });
  revalidateSlug(slug);
  return NextResponse.json({ active: content.active });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { error: forbidden } = await requireEditor();
  if (forbidden) return forbidden;

  const slug = await resolveSlug(context);
  if (!slug) return NextResponse.json({ error: "無效的頁面後綴" }, { status: 400 });

  try {
    await prisma.siteSettings.delete({ where: { key: pageContentKey(slug) } });
  } catch {
    return NextResponse.json({ error: "頁面不存在" }, { status: 404 });
  }
  revalidateSlug(slug);
  return NextResponse.json({ ok: true });
}
