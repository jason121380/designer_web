import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const sidebar = read("components/admin/Sidebar.tsx");
assert.match(sidebar, /href: "\/admin\/page-management", label: "頁面管理"/);
// 媒體庫為編輯與管理員入口（列出所有已上傳圖片/影片）
assert.match(sidebar, /href: "\/admin\/media", label: "媒體庫"/);
// 用戶管理為 ADMIN 專用入口（列表 + 改密碼）
assert.match(sidebar, /href: "\/admin\/users", label: "用戶管理"/);
// 工程模式為 ADMIN 專用維護工具入口
assert.match(sidebar, /href: "\/admin\/tools", label: "工程模式"/);
// 舊 CMS 模組入口不得復活
for (const removed of [
  "總覽",
  "前台內容",
  "文章管理",
  "分類管理",
  "標籤管理",
  "流量分析",
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

// 上傳元件可從媒體庫選取既有媒體（點擊先跳彈窗：本機上傳 / 媒體庫）
const imageUpload = read("components/admin/ImageUpload.tsx");
assert.match(imageUpload, /MediaPickerModal/);

const middleware = read("middleware.ts");
assert.match(middleware, /legacyAdminPrefixes/);
assert.match(middleware, /\/admin\/page-management/);
// /admin/users 是現行用戶管理頁，不可再被當成舊路徑導回頁面管理
assert.doesNotMatch(middleware, /"\/admin\/users"/, "用戶管理路徑不可列入 legacyAdminPrefixes");
// 媒體庫與工程模式為現行入口，不可再被當成舊路徑導回
assert.doesNotMatch(middleware, /"\/admin\/media"/, "媒體庫路徑不可列入 legacyAdminPrefixes");
assert.doesNotMatch(middleware, /"\/admin\/tools"/, "工程模式路徑不可列入 legacyAdminPrefixes");
// manifest 必須繞過登入保護，否則後台 PWA 無法安裝
assert.ok(middleware.includes("manifest\\\\.webmanifest"), "middleware matcher 必須排除 manifest");

// 側欄收合不可寫入 localStorage：曾造成誤觸收合後，之後每次進後台側欄都消失
const adminShell = read("components/admin/AdminShell.tsx");
assert.doesNotMatch(adminShell, /localStorage\.(getItem|setItem)/);

// PWA manifest 必須帶 icons，否則手機安裝失敗或沒有圖示
const adminManifest = read("app/admin/manifest.webmanifest/route.ts");
assert.match(adminManifest, /icons/);
assert.match(adminManifest, /192x192/);
assert.match(adminManifest, /512x512/);
const publicManifest = read("app/manifest.webmanifest/route.ts");
assert.match(publicManifest, /icons/);
assert.match(publicManifest, /192x192/);

// 後台需宣告 apple-touch-icon 與 PWA meta
const adminLayout = read("app/admin/layout.tsx");
assert.match(adminLayout, /appleWebApp/);
assert.match(adminLayout, /admin-apple-icon\.png/);
