import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserList from "@/components/admin/UserList";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  // 用戶管理僅 ADMIN 可用；其餘登入者導回頁面管理。
  if (user?.role !== "ADMIN") redirect("/admin/page-management");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: { createdAt: "asc" },
  });

  return <UserList users={users} currentUserId={user?.id ?? ""} />;
}
