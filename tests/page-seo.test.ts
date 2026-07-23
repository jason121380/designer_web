import assert from "node:assert/strict";
import { defaultDesignerWebContent } from "../lib/designer-web-content";
import { designerPageMetadata } from "../lib/seo";

// 未填 SEO 設定：自動使用網頁標題（品牌名稱）
const auto = designerPageMetadata(structuredClone(defaultDesignerWebContent), "/kimiko");
assert.deepEqual(auto.title, {
  absolute: defaultDesignerWebContent.brand.name,
});
assert.ok(typeof auto.description === "string" && auto.description.length > 0);
assert.ok(!auto.description!.includes("\n"), "描述不可含換行");
assert.deepEqual(auto.alternates, { canonical: "/kimiko" });
assert.equal((auto.openGraph as { url?: string }).url, "/kimiko");
assert.equal((auto.twitter as { card?: string }).card, "summary_large_image");

// 已填 SEO 設定：完全以後台設定為準，og/twitter 同步帶分享圖
const custom = structuredClone(defaultDesignerWebContent);
custom.seo = {
  title: "中壢接髮｜KIMIKO 專屬預約",
  description: "Google Ads 到達頁專用描述",
  ogImage: "https://cdn.example.com/og.jpg",
  gaId: "",
};
const meta = designerPageMetadata(custom, "/kimiko");
assert.deepEqual(meta.title, { absolute: "中壢接髮｜KIMIKO 專屬預約" });
assert.equal(meta.description, "Google Ads 到達頁專用描述");
assert.deepEqual((meta.openGraph as { images?: unknown }).images, [
  { url: "https://cdn.example.com/og.jpg" },
]);
assert.deepEqual((meta.twitter as { images?: unknown }).images, ["https://cdn.example.com/og.jpg"]);

// 沒有 og 設定但首屏是圖片 → 用首屏圖當分享圖
const heroFallback = structuredClone(defaultDesignerWebContent);
heroFallback.hero.image = "https://cdn.example.com/hero.webp";
const heroMeta = designerPageMetadata(heroFallback, "/");
assert.deepEqual((heroMeta.openGraph as { images?: unknown }).images, [
  { url: "https://cdn.example.com/hero.webp" },
]);

console.log("page-seo tests passed");
