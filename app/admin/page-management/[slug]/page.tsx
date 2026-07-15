import { notFound } from "next/navigation";
import PageManagementForm from "@/components/admin/PageManagementForm";
import { HOME_PAGE_SLUG, isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebContent, getDesignerWebPageContent } from "@/lib/designer-web-settings";

export default async function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === HOME_PAGE_SLUG) {
    return <PageManagementForm initialContent={await getDesignerWebContent()} />;
  }

  if (!isValidPageSlug(slug)) notFound();
  const content = await getDesignerWebPageContent(slug);
  if (!content) notFound();
  return <PageManagementForm initialContent={content} slug={slug} />;
}
