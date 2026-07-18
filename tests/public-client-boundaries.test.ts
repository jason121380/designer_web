import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const mediaView = read("components/public/MediaView.tsx");
const header = read("components/public/Header.tsx");
const onePage = read("components/public/OnePage.tsx");

// 圖片媒體不需要 hydration；MediaView 應保留為 Server Component。
assert.doesNotMatch(mediaView, /^["']use client["'];/m);

// Header 只接收最小導覽資料，不把完整內容合約與 Zod 帶入 public client bundle。
assert.doesNotMatch(header, /designer-web-content/);
assert.doesNotMatch(header, /DesignerWebContent/);
assert.match(header, /links: \{ href: string; label: string \}\[\]/);
assert.match(onePage, /<Header\s+title=/);

console.log("public-client-boundaries.test.ts passed");
