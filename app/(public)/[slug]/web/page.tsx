import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import OnePage from "@/components/public/OnePage";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";
import { resolveSlugRedirect } from "@/lib/slug-redirects";
import { designerPageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

async function loadPage(params: PageProps["params"]) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) return null;
  const content = await getDesignerWebPageContent(slug);
  // 停用的頁面對外視為不存在（404）
  return content && content.active ? content : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadPage(params);
  if (!content) return {};
  return designerPageMetadata(content, `/${slug}/web`);
}

export default async function DesignerWebPage({ params }: PageProps) {
  const content = await loadPage(params);
  if (!content) {
    const { slug } = await params;
    const target = await resolveSlugRedirect(slug);
    if (target) permanentRedirect(`/${target}/web`);
    notFound();
  }
  return <OnePage content={content} />;
}
