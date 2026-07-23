/**
 * 驗證 Google 代碼 ID：GA4（G-）、Google Ads（AW-）、GTM（GTM-）、舊版 Analytics（UA-）。
 * 只允許固定前綴 + 英數與連字號，避免管理員誤填或惡意內容被注入到 inline script。
 * 不合法回 null（前台就不載入代碼）。
 */
export function sanitizeGtagId(id: string | null | undefined): string | null {
  const value = (id ?? "").trim();
  return /^(G|AW|GTM|UA)-[A-Z0-9-]{4,20}$/i.test(value) ? value : null;
}

/** 前台可追蹤點擊的按鈕與其預設 GA 事件名稱（事件名稱可在後台各頁自訂）。 */
export const ANALYTICS_EVENT_DEFS = [
  { key: "line", label: "LINE（懸浮泡泡／聯絡我／連結頁）", default: "click_line" },
  { key: "facebook", label: "Facebook", default: "click_facebook" },
  { key: "instagram", label: "Instagram", default: "click_instagram" },
  { key: "map", label: "Google 地圖", default: "click_map" },
  { key: "phone", label: "電話", default: "click_phone" },
  { key: "email", label: "Email", default: "click_email" },
  { key: "moreWorks", label: "查看更多作品按鈕", default: "click_more_works" },
  { key: "link", label: "連結頁的每個連結按鈕", default: "click_link" },
] as const;

export type AnalyticsEventKey = (typeof ANALYTICS_EVENT_DEFS)[number]["key"];

/** GA4 事件名稱規則：英文字母開頭，僅英數與底線，長度 ≤ 40；不合法就退回預設。 */
export function sanitizeEventName(value: string | null | undefined, fallback: string): string {
  const v = (value ?? "").trim();
  return /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(v) ? v : fallback;
}

export function defaultAnalyticsEvents(): Record<string, string> {
  return Object.fromEntries(ANALYTICS_EVENT_DEFS.map((d) => [d.key, d.default]));
}

/** 正規化事件名稱對照：補齊所有 key、逐一驗證，不合法退回預設。 */
export function normalizeAnalyticsEvents(input: unknown): Record<string, string> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const def of ANALYTICS_EVENT_DEFS) {
    const value = typeof raw[def.key] === "string" ? (raw[def.key] as string) : "";
    out[def.key] = sanitizeEventName(value, def.default);
  }
  return out;
}
