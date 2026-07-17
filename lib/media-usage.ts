import type { DesignerWebContent } from "@/lib/designer-web-content";

/** 收集一頁內容裡每個媒體網址與它出現的位置標籤（供媒體庫顯示「被引用位置」）。 */
export function collectMediaUsage(content: DesignerWebContent): { url: string; label: string }[] {
  const out: { url: string; label: string }[] = [];
  const add = (url: string | undefined, label: string) => {
    if (url && /^https?:\/\//.test(url)) out.push({ url, label });
  };
  add(content.hero.image, "首屏圖片");
  add(content.hero.video, "首屏影片");
  content.promos.forEach((item, index) => add(item.image, `活動 DM ${index + 1}`));
  content.services.forEach((item, index) => add(item.image, `接髮介紹 ${index + 1}`));
  content.otherServices.forEach((item, index) => add(item.image, `特色項目 ${index + 1}`));
  content.videos.forEach((item, index) => add(item.video, `作品影片 ${index + 1}`));
  content.environment.forEach((item, index) => add(item.image, `環境介紹 ${index + 1}`));
  add(content.seo.ogImage, "SEO 分享圖");
  add(content.links.avatar, "連結頁頭像");
  add(content.links.qr, "連結頁 QR");
  return out;
}
