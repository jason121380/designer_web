import assert from "node:assert/strict";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  defaultDesignerWebContent,
  normalizeDesignerWebContent,
} from "../lib/designer-web-content";
import { getDesignerWebContent } from "../lib/designer-web-settings";

const normalized = normalizeDesignerWebContent({
  brand: {
    name: "  KIMEKO HAIR  ",
    themeColor: "  #d9bf77  ",
  },
  hero: {
    heading: "  中壢接髮推薦  ",
    mediaUrl: "  https://cdn.example.com/hero.mp4  ",
    mediaType: "video",
  },
  services: [
    {
      id: " service-1 ",
      title: " 極致零感羽毛接髮 ",
      description: " 一頁式形象網站 ",
      features: [" 輕盈 ", " 隱形 "],
      suitableFor: [" 細軟髮 "],
    },
    { title: "", description: "應被移除" },
  ],
  otherServices: [
    { id: "other-1", title: " 鏡面燙 ", description: " 柔順亮麗 " },
  ],
  promos: [
    { id: "dm-1", image: " https://cdn.example.com/dm.jpg ", caption: " 活動 DM " },
  ],
  videos: [
    { id: "video-1", video: " https://cdn.example.com/work.mp4 ", caption: " 接髮作品 " },
  ],
  installment: [" 三期零利率 ", ""],
  environment: [
    { id: "ev-1", image: "  https://cdn.example.com/salon.jpg  ", alt: "  店內環境  " },
    { image: "", alt: "應被移除" },
  ],
  contact: {
    phone: "0900-000-000",
  },
  seo: {
    title: "  中壢接髮第一品牌  ",
    description: "  廣告到達頁描述  ",
    ogImage: " https://cdn.example.com/og.jpg ",
  },
});

assert.equal(DESIGNER_WEB_SETTINGS_KEY, "designer_web_content");
assert.equal(defaultDesignerWebContent.brand.name, "KIMEKO HAIR（示範）");
assert.equal(defaultDesignerWebContent.pricing[0].name, "極致零感羽毛接髮");
assert.equal(normalized.brand.name, "KIMEKO HAIR");
assert.equal(normalized.brand.themeColor, "#d9bf77");
assert.equal(normalized.hero.heading, "中壢接髮推薦");
assert.equal(normalized.hero.mediaType, "video");
assert.equal(normalized.hero.mediaUrl, "https://cdn.example.com/hero.mp4");
assert.equal(normalized.services.length, 1);
assert.equal(normalized.services[0].title, "極致零感羽毛接髮");
assert.deepEqual(normalized.services[0].features, ["輕盈", "隱形"]);
assert.deepEqual(normalized.services[0].suitableFor, ["細軟髮"]);
assert.equal(normalized.otherServices[0].title, "鏡面燙");
assert.equal(normalized.promos[0].image, "https://cdn.example.com/dm.jpg");
assert.equal(normalized.videos[0].video, "https://cdn.example.com/work.mp4");
assert.deepEqual(normalized.installment, ["三期零利率"]);
assert.equal(normalized.environment.length, 1);
assert.equal(normalized.environment[0].image, "https://cdn.example.com/salon.jpg");
assert.equal(normalized.environment[0].alt, "店內環境");
assert.equal(normalized.contact.phone, "0900-000-000");
assert.equal(normalized.contact.email, defaultDesignerWebContent.contact.email);
// 已提供 contact 資料時，連結欄位清空就是清空，不回填示範連結
assert.equal(normalized.contact.line, "");
assert.equal(normalized.contact.instagram, "");
assert.equal(normalized.contact.facebook, "");
assert.equal(normalized.contact.mapUrl, "");
// 地址與電話仍保留預設，避免聯絡區塊空白
assert.equal(normalized.contact.address, defaultDesignerWebContent.contact.address);

// 完全沒有 contact 資料（示範狀態）→ 沿用預設示範聯絡資訊
const demoNormalized = normalizeDesignerWebContent({});
assert.deepEqual(demoNormalized.contact, defaultDesignerWebContent.contact);

// SEO 設定：trim；舊資料沒有 seo 欄位時給空字串（＝自動產生），不可讓整頁 500
assert.equal(normalized.seo.title, "中壢接髮第一品牌");
assert.equal(normalized.seo.description, "廣告到達頁描述");
assert.equal(normalized.seo.ogImage, "https://cdn.example.com/og.jpg");
assert.deepEqual(demoNormalized.seo, { title: "", description: "", ogImage: "" });

async function main() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const fallback = await getDesignerWebContent();
  assert.equal(fallback.hero.heading, defaultDesignerWebContent.hero.heading);
  if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
}

main();
