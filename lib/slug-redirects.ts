import prisma from "@/lib/prisma";

// 舊後綴 → 目前後綴 的對照表，存在單一 site_settings 列。
const SLUG_REDIRECTS_KEY = "designer_web_slug_redirects";

async function readMap(): Promise<Record<string, string>> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: SLUG_REDIRECTS_KEY } });
    if (!row) return {};
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    // DB 不可用或 JSON 損壞時回空對照，讓前台維持 404 而非 500。
    return {};
  }
}

/** 舊後綴 → 目前後綴（改名鏈已解析為最終值）。找不到或指向自己回 null。 */
export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  const map = await readMap();
  const target = map[slug];
  return target && target !== slug ? target : null;
}

/**
 * 記錄一次改名：old → new。
 * 同時把原本指向 old 的舊項目改指向 new（維持整條鏈最終指向現址），並移除 new 自身的轉址。
 */
export async function recordSlugRename(oldSlug: string, newSlug: string): Promise<void> {
  const map = await readMap();
  for (const key of Object.keys(map)) {
    if (map[key] === oldSlug) map[key] = newSlug;
  }
  map[oldSlug] = newSlug;
  delete map[newSlug];
  await prisma.siteSettings.upsert({
    where: { key: SLUG_REDIRECTS_KEY },
    create: { key: SLUG_REDIRECTS_KEY, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });
}

/** 新建頁面時清掉同名的舊轉址（避免新頁被舊轉址誤導）。 */
export async function clearSlugRedirect(slug: string): Promise<void> {
  const map = await readMap();
  if (!(slug in map)) return;
  delete map[slug];
  await prisma.siteSettings.update({
    where: { key: SLUG_REDIRECTS_KEY },
    data: { value: JSON.stringify(map) },
  });
}
