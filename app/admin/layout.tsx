import type { Metadata, Viewport } from "next";
import { auth } from "@/lib/auth";
import { getSiteIconUrl } from "@/lib/site-icon";
import AdminShell from "@/components/admin/AdminShell";
import { SessionProvider } from "next-auth/react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export async function generateMetadata(): Promise<Metadata> {
  // 後台 favicon 跟前台一致：優先用後台上傳的網站圖示，未設定才回退 admin 預設圖示。
  const icon = await getSiteIconUrl();
  return {
    title: { absolute: "Designer Web 後台" },
    manifest: "/admin/manifest.webmanifest",
    robots: { index: false, follow: false },
    icons: icon
      ? { icon: [{ url: icon }], shortcut: [{ url: icon }], apple: [{ url: icon }] }
      : { icon: "/admin-icon.png", apple: "/admin-apple-icon.png" },
    appleWebApp: {
      capable: true,
      title: "Designer Web 後台",
      statusBarStyle: "default",
    },
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const user = session.user as any;

  return (
    <SessionProvider session={session}>
      <AdminShell userName={user.name ?? ""} userRole={user.role ?? "AUTHOR"}>
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
