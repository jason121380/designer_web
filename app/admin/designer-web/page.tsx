import DesignerWebSettingsForm from "@/components/admin/DesignerWebSettingsForm";
import { getDesignerWebContent } from "@/lib/designer-web-settings";

export default async function DesignerWebAdminPage() {
  return <DesignerWebSettingsForm initialContent={await getDesignerWebContent()} />;
}
