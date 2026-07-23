/**
 * 驗證 Google 代碼 ID：GA4（G-）、Google Ads（AW-）、GTM（GTM-）、舊版 Analytics（UA-）。
 * 只允許固定前綴 + 英數與連字號，避免管理員誤填或惡意內容被注入到 inline script。
 * 不合法回 null（前台就不載入代碼）。
 */
export function sanitizeGtagId(id: string | null | undefined): string | null {
  const value = (id ?? "").trim();
  return /^(G|AW|GTM|UA)-[A-Z0-9-]{4,20}$/i.test(value) ? value : null;
}
