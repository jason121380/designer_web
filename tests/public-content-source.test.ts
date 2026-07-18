import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

// 首頁 / 固定為維護頁（不對外呈現內容）；子頁面透過 DB 設定讀取層取得內容
const homeSource = read("app/(public)/page.tsx");
assert.match(homeSource, /MaintenancePage/);
assert.doesNotMatch(homeSource, /frontendDemo|getDesignerWebContent/);

const slugSource = read("app/(public)/[slug]/page.tsx");
assert.match(slugSource, /getDesignerWebPageContent/);
assert.match(slugSource, /isValidPageSlug/);
assert.match(slugSource, /notFound\(\)/);

// OnePage 為共用輸出元件，內容一律來自 props，不自行讀取或硬編碼
const onePageSource = read("components/public/OnePage.tsx");
assert.match(onePageSource, /content\.services/);
assert.match(onePageSource, /content\.otherServices/);
assert.match(onePageSource, /content\.videos/);
assert.match(onePageSource, /content\.installment/);
assert.doesNotMatch(onePageSource, /frontendDemo|getDesignerWebContent/);

// Header 只接收 OnePage 算好的最小 props，避免把完整內容 schema 帶入 client bundle；Footer 仍由內容 props 驅動。
const headerSource = read("components/public/Header.tsx");
assert.match(headerSource, /title: string/);
assert.match(headerSource, /links: \{ href: string; label: string \}\[\]/);
assert.match(onePageSource, /<Header\s+title=/);
assert.doesNotMatch(headerSource, /DesignerWebContent|designer-web-content|frontendDemo|getDesignerWebContent/);

const footerSource = read("components/public/Footer.tsx");
assert.match(footerSource, /content: DesignerWebContent/);
assert.doesNotMatch(footerSource, /frontendDemo|Powered by LURE|getDesignerWebContent/);
