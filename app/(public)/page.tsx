import type { Metadata } from "next";
import MaintenancePage from "@/components/public/MaintenancePage";

// 根網址 `/` 固定為維護頁：不對外呈現內容、標記 noindex。
// 公開內容一律放在子頁面（/{slug}），首頁不提供設定。
export const metadata: Metadata = {
  title: { absolute: "網站建置中" },
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return <MaintenancePage />;
}
