import PageManagementForm from "@/components/admin/PageManagementForm";
import { getDesignerWebContent } from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  return <PageManagementForm initialContent={await getDesignerWebContent()} />;
}
