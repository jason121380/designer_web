import PageList from "@/components/admin/PageList";
import {
  getDesignerWebContent,
  getHomeDisplaySlug,
  isHomeConfigured,
  listDesignerWebPages,
} from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  const [home, pages, homeDisplaySlug, homeConfigured] = await Promise.all([
    getDesignerWebContent(),
    listDesignerWebPages(),
    getHomeDisplaySlug(),
    isHomeConfigured(),
  ]);
  return (
    <PageList
      homeBrandName={home.brand.name}
      pages={pages}
      homeDisplaySlug={homeDisplaySlug}
      homeConfigured={homeConfigured}
    />
  );
}
