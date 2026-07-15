import assert from "node:assert/strict";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  defaultDesignerWebContent,
  normalizeDesignerWebContent,
} from "../lib/designer-web-content";
import { getDesignerWebContent } from "../lib/designer-web-settings";

const normalized = normalizeDesignerWebContent({
  hero: {
    eyebrow: "  Designer Web  ",
    title: "  空間美學設計師  ",
  },
  services: [
    { title: "品牌網站", description: "一頁式形象網站", price: "NT$ 38,000 起" },
    { title: "", description: "應被移除" },
  ],
  contact: {
    phone: "0900-000-000",
  },
});

assert.equal(DESIGNER_WEB_SETTINGS_KEY, "designer_web_content");
assert.equal(defaultDesignerWebContent.brand.name, "designer_web");
assert.equal(normalized.hero.eyebrow, "Designer Web");
assert.equal(normalized.hero.title, "空間美學設計師");
assert.equal(normalized.services.length, 1);
assert.equal(normalized.services[0].title, "品牌網站");
assert.equal(normalized.contact.phone, "0900-000-000");
assert.equal(normalized.contact.email, defaultDesignerWebContent.contact.email);

async function main() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const fallback = await getDesignerWebContent();
  assert.equal(fallback.hero?.title, defaultDesignerWebContent.hero.title);
  if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
}

main();
