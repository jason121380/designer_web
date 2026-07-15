import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const sidebar = read("components/admin/Sidebar.tsx");
assert.match(sidebar, /href: "\/admin\/page-management", label: "頁面管理"/);
for (const removed of [
  "總覽",
  "前台內容",
  "文章管理",
  "分類管理",
  "標籤管理",
  "媒體庫",
  "流量分析",
  "用戶管理",
  "工程工具",
]) {
  assert.doesNotMatch(sidebar, new RegExp(removed));
}

const adminRoot = read("app/admin/page.tsx");
assert.match(adminRoot, /redirect\("\/admin\/page-management"\)/);

const login = read("app/admin/login/page.tsx");
assert.match(login, /Designer Web/);
assert.doesNotMatch(login, /mifaso|迷髮所/i);
assert.match(login, /"\/admin\/page-management"/);

const layout = read("app/admin/layout.tsx");
assert.doesNotMatch(layout, /mifaso|迷髮所/i);

const imageUpload = read("components/admin/ImageUpload.tsx");
assert.doesNotMatch(imageUpload, /MediaPicker|媒體庫/);

const middleware = read("middleware.ts");
assert.match(middleware, /legacyAdminPrefixes/);
assert.match(middleware, /\/admin\/page-management/);
