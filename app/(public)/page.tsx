import type { Metadata } from "next";
import OnePage from "@/components/public/OnePage";
import { getDesignerWebContent } from "@/lib/designer-web-settings";

// SEO title / description 跟著後台品牌設定走，不再硬編碼示範文案。
export async function generateMetadata(): Promise<Metadata> {
  const { brand, hero } = await getDesignerWebContent();
  return {
    title: { absolute: `${brand.tagline}｜${brand.name}` },
    description: hero.heading.replace(/\s*\n\s*/g, "，").slice(0, 150),
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const content = await getDesignerWebContent();
  return <OnePage content={content} />;
}
