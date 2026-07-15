export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "Designer Web 後台",
    short_name: "Designer Web",
    description: "一頁式網站內容管理後台",
    start_url: "/admin/page-management",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
