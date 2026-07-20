import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * 登入頁專屬 layout：已登入者直接導向頁面管理，避免出現「側欄＋登入表單」的怪畫面
 * （middleware 為避免導向迴圈而排除 /admin/login，故在此於伺服器端補上已登入導離）。
 */
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/admin/page-management");
  return <>{children}</>;
}
