import { getSiteIconUrl } from "@/lib/site-icon";

export const dynamic = "force-dynamic";

export async function GET() {
  const icon = await getSiteIconUrl();
  const icons = icon
    ? [
        { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: icon, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ];

  const manifest = {
    name: "Designer Web",
    short_name: "Designer Web",
    description: "一頁式品牌網站",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#171717",
    icons,
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
