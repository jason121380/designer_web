import PageList from "@/components/admin/PageList";
import {
  getDesignerWebContent,
  getHomeDisplaySlug,
  listDesignerWebPages,
} from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  const [home, pages, homeDisplaySlug] = await Promise.all([
    getDesignerWebContent(),
    listDesignerWebPages(),
    getHomeDisplaySlug(),
  ]);
  return <PageList homeBrandName={home.brand.name} pages={pages} homeDisplaySlug={homeDisplaySlug} />;
}
