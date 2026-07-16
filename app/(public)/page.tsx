import type { Metadata } from "next";
import OnePage from "@/components/public/OnePage";
import MaintenancePage from "@/components/public/MaintenancePage";
import { getHomeDisplayContent, isHomeConfigured } from "@/lib/designer-web-settings";
import { designerPageMetadata } from "@/lib/seo";

// 首頁內容可在後台指定為某個子頁面；SEO 跟著實際顯示的內容走，canonical 維持 /。
// 首頁尚未設定任何內容時顯示維護頁（不顯示內建示範內容），並標記 noindex。
export async function generateMetadata(): Promise<Metadata> {
  if (!(await isHomeConfigured())) {
    return { title: { absolute: "網站建置中" }, robots: { index: false, follow: false } };
  }
  return designerPageMetadata(await getHomeDisplayContent(), "/");
}

export default async function HomePage() {
  if (!(await isHomeConfigured())) return <MaintenancePage />;
  return <OnePage content={await getHomeDisplayContent()} />;
}
