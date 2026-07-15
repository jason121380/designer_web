import PageList from "@/components/admin/PageList";
import { getDesignerWebContent, listDesignerWebPages } from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  const [home, pages] = await Promise.all([getDesignerWebContent(), listDesignerWebPages()]);
  return <PageList homeBrandName={home.brand.name} pages={pages} />;
}
