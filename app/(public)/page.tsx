import type { Metadata } from "next";
import OnePage from "@/components/public/OnePage";
import { getHomeDisplayContent } from "@/lib/designer-web-settings";
import { designerPageMetadata } from "@/lib/seo";

// 首頁內容可在後台指定為某個子頁面；SEO 跟著實際顯示的內容走，canonical 維持 /。
export async function generateMetadata(): Promise<Metadata> {
  return designerPageMetadata(await getHomeDisplayContent(), "/");
}

export default async function HomePage() {
  const content = await getHomeDisplayContent();
  return <OnePage content={content} />;
}
