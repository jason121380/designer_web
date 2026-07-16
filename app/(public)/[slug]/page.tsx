import { notFound, redirect } from "next/navigation";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";

type PageProps = { params: Promise<{ slug: string }> };

// 設計師根網址（/{slug}）導向一頁式網站 /{slug}/web。
// 頁面不存在或已停用則 404。
export default async function DesignerRootPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) notFound();
  const content = await getDesignerWebPageContent(slug);
  if (!content || !content.active) notFound();
  redirect(`/${slug}/web`);
}
