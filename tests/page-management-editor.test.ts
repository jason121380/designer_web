import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "components/admin/PageManagementForm.tsx"), "utf8");

for (const title of [
  "網站基本設定",
  "Banner 橫幅設定",
  "活動 DM",
  "接髮介紹",
  "特色項目",
  "作品影片",
  "分期資訊",
  "價目表",
  "環境介紹",
  "聯絡資訊",
  "SEO 設定",
]) {
  assert.match(source, new RegExp(title));
}
assert.match(source, /\/api\/designer-web/);
assert.match(source, /ImageUpload/);
