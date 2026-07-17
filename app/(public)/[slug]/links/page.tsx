import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import LinksPage from "@/components/public/LinksPage";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";
import { resolveSlugRedirect } from "@/lib/slug-redirects";
import { linksPageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

async function loadPage(params: PageProps["params"]) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) return null;
  const content = await getDesignerWebPageContent(slug);
  return content && content.active ? content : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadPage(params);
  if (!content) return {};
  return linksPageMetadata(content, `/${slug}/links`);
}

export default async function DesignerLinksRoute({ params }: PageProps) {
  const content = await loadPage(params);
  if (!content) {
    const { slug } = await params;
    const target = await resolveSlugRedirect(slug);
    if (target) permanentRedirect(`/${target}/links`);
    notFound();
  }
  return <LinksPage content={content} />;
}
