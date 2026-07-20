import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ArchivedPageList from "@/components/admin/ArchivedPageList";
import { listDesignerWebPages } from "@/lib/designer-web-settings";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
  // 封存列表僅限管理員。
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") redirect("/admin/page-management");

  const pages = (await listDesignerWebPages()).filter((page) => page.archived);
  return <ArchivedPageList pages={pages} />;
}
