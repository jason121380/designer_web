import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);
const legacyAdminPrefixes = [
  "/admin/dashboard",
  "/admin/designer-web",
  "/admin/articles",
  "/admin/categories",
  "/admin/tags",
  "/admin/media",
  "/admin/analytics",
  "/admin/tools",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(
      new URL(`/admin/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, req.url)
    );
  }

  if (legacyAdminPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/admin/page-management", req.url));
  }
});

export const config = {
  // Match all /admin routes EXCEPT:
  // - /admin/login（避免 redirect loop）
  // - /admin/manifest.webmanifest（瀏覽器抓 PWA manifest 不帶 cookie，擋住會讓後台無法安裝成 PWA）
  matcher: ["/admin/((?!login$|manifest\\.webmanifest$).*)"],
};
