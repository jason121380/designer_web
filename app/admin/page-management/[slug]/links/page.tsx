import { notFound } from "next/navigation";
import LinksManagementForm from "@/components/admin/LinksManagementForm";
import { isValidPageSlug } from "@/lib/designer-web-content";
import { getDesignerWebPageContent } from "@/lib/designer-web-settings";

export default async function LinksEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidPageSlug(slug)) notFound();
  const content = await getDesignerWebPageContent(slug);
  if (!content) notFound();
  return <LinksManagementForm initialContent={content} slug={slug} />;
}
