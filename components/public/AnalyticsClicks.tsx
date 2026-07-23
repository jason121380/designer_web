"use client";

import { useEffect } from "react";

type Gtag = (command: string, event: string, params?: Record<string, unknown>) => void;

/**
 * 具名按鈕點擊事件：以事件委派監聽帶 data-ga-event 的連結／按鈕，
 * 點擊時送出對應的 GA4 事件（並可帶 data-ga-label 作為 label 參數）。
 * 只有該頁有載入 gtag（seo.gaId 有設定）時才會真的送出。
 */
export default function AnalyticsClicks() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-ga-event]");
      const name = el?.getAttribute("data-ga-event");
      if (!name) return;
      const label = el?.getAttribute("data-ga-label") || undefined;
      const gtag = (window as unknown as { gtag?: Gtag }).gtag;
      if (typeof gtag === "function") gtag("event", name, label ? { label } : undefined);
    };
    // capture 階段先攔到，確保開新分頁前就送出（gtag 預設用 sendBeacon，導覽也不會遺失）。
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}
