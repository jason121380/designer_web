import PageList from "@/components/admin/PageList";
import { listDesignerWebPages } from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  const pages = await listDesignerWebPages();
  return <PageList pages={pages} />;
}
