import { getSiteIconUrl } from "@/lib/site-icon";

export const dynamic = "force-dynamic";

export async function GET() {
  // 後台 App icon 跟前台一致：優先用上傳的網站圖示，未設定才回退 admin 預設圖示。
  const icon = await getSiteIconUrl();
  const icons = icon
    ? [
        { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: icon, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        { src: "/admin-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/admin-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ];

  const manifest = {
    name: "Designer Web 後台",
    short_name: "Designer Web",
    description: "一頁式網站內容管理後台",
    start_url: "/admin/page-management",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
