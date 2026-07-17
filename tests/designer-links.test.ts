import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizeDesignerWebContent } from "../lib/designer-web-content";
import { linksPageMetadata } from "../lib/seo";
import { externalHref } from "../lib/utils";

// 外部連結補協定：沒有 http(s):// 的網址補上 https://，不被當成站內相對路徑
assert.equal(externalHref("www.google.com"), "https://www.google.com");
assert.equal(externalHref("  google.com  "), "https://google.com");
assert.equal(externalHref("https://ig.com/x"), "https://ig.com/x");
assert.equal(externalHref("http://a.com"), "http://a.com");
assert.equal(externalHref("mailto:a@b.com"), "mailto:a@b.com");
assert.equal(externalHref("/internal"), "/internal");
assert.equal(externalHref(""), "");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

// 合約：連結頁 items 正規化——保留有文字＋網址的項目，缺任一者丟棄
const normalized = normalizeDesignerWebContent({
  links: {
    avatar: "  https://cdn.example.com/a.jpg  ",
    bio: "  設計師簡介  ",
    items: [
      { label: "預約", url: "https://book.example.com" },
      { label: "", url: "https://no-label.example.com" },
      { label: "沒有網址", url: "" },
    ],
  },
});
assert.equal(normalized.links.avatar, "https://cdn.example.com/a.jpg");
assert.equal(normalized.links.bio, "設計師簡介");
assert.equal(normalized.links.items.length, 1, "缺文字或網址的連結項目要被丟棄");
assert.equal(normalized.links.items[0].label, "預約");
assert.ok(normalized.links.items[0].id, "連結項目需自動補 id");

// 舊資料無 links 欄位時 fallback 空連結頁（向下相容）
const legacy = normalizeDesignerWebContent({ brand: { name: "A" } });
assert.deepEqual(legacy.links, { avatar: "", bio: "", items: [] });

// 連結頁 metadata：canonical 指向 /{slug}/links，描述優先用 bio
const meta = linksPageMetadata(normalized, "/jason/links");
assert.deepEqual(meta.alternates, { canonical: "/jason/links" });
assert.equal((meta.description as string), "設計師簡介");

// 前台路由
const webRoute = read("app/(public)/[slug]/web/page.tsx");
assert.match(webRoute, /OnePage/);
assert.match(webRoute, /`\/\$\{slug\}\/web`/, "一頁式 canonical 需為 /{slug}/web");

const linksRoute = read("app/(public)/[slug]/links/page.tsx");
assert.match(linksRoute, /LinksPage/);
assert.match(linksRoute, /linksPageMetadata/);

const rootRoute = read("app/(public)/[slug]/page.tsx");
assert.match(rootRoute, /redirect\(`\/\$\{slug\}\/web`\)/, "根 /{slug} 需導向 /{slug}/web");

// LinksPage 內容由 props 驅動
const linksPage = read("components/public/LinksPage.tsx");
assert.match(linksPage, /links\.items/);
assert.match(linksPage, /content: DesignerWebContent/);
assert.match(linksPage, /externalHref\(item\.url\)/, "連結按鈕需補協定避免變站內相對路徑");
assert.doesNotMatch(linksPage, /getDesignerWebPageContent/);

// 後台連結頁編輯器
const adminLinks = read("app/admin/page-management/[slug]/links/page.tsx");
assert.match(adminLinks, /LinksManagementForm/);
const linksForm = read("components/admin/LinksManagementForm.tsx");
assert.match(linksForm, /`\/api\/designer-web\/\$\{slug\}`/, "連結頁存回同一筆子頁面內容");

// 頁面列表提供一頁式與連結頁兩個編輯入口
const listSource = read("components/admin/PageList.tsx");
assert.match(listSource, /連結頁/);
assert.match(listSource, /page-management\/\$\{page\.slug\}\/links/);

console.log("designer-links.test.ts passed");
