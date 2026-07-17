import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import EngineeringTools from "@/components/admin/EngineeringTools";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  // 工程模式僅 ADMIN 可用；其餘登入者導回頁面管理。
  if (user?.role !== "ADMIN") redirect("/admin/page-management");

  return <EngineeringTools />;
}
