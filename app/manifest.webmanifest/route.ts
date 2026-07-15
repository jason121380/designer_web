export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "Designer Web",
    short_name: "Designer Web",
    description: "一頁式品牌網站",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#C4837A",
    theme_color: "#C4837A",
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
