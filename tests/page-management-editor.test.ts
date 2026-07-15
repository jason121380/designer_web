import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "components/admin/PageManagementForm.tsx"), "utf8");

for (const title of [
  "品牌與導覽",
  "首屏形象",
  "活動 DM",
  "接髮介紹",
  "其他服務",
  "作品影片",
  "分期資訊",
  "價目表",
  "環境介紹",
  "聯絡資訊",
]) {
  assert.match(source, new RegExp(title));
}
assert.match(source, /\/api\/designer-web/);
assert.match(source, /ImageUpload/);
