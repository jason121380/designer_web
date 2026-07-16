import { notFound } from "next/navigation";
import PageManagementForm from "@/components/admin/PageManagementForm";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";

export default async function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!isValidPageSlug(slug)) notFound();
  const content = await getDesignerWebPageContent(slug);
  if (!content) notFound();
  return <PageManagementForm initialContent={content} slug={slug} />;
}
