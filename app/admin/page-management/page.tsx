import PageList from "@/components/admin/PageList";
import { listDesignerWebPages } from "@/lib/designer-web-settings";

export default async function PageManagementPage() {
  // 已封存的頁面不在此列表顯示（移到左側「封存」）。
  const pages = (await listDesignerWebPages()).filter((page) => !page.archived);
  return <PageList pages={pages} />;
}
