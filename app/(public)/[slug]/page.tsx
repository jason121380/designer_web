import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OnePage from "@/components/public/OnePage";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";
import { designerPageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

async function loadPage(params: PageProps["params"]) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) return null;
  return getDesignerWebPageContent(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadPage(params);
  if (!content) return {};
  return designerPageMetadata(content, `/${slug}`);
}

export default async function DesignerPage({ params }: PageProps) {
  const content = await loadPage(params);
  if (!content) notFound();
  return <OnePage content={content} />;
}
