import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  DESIGNER_WEB_SETTINGS_KEY,
  HOME_PAGE_SLUG,
  isValidPageSlug,
  pageContentKey,
} from "../lib/designer-web-content";

// slug 驗證
assert.equal(isValidPageSlug("jason"), true);
assert.equal(isValidPageSlug("kimiko"), true);
assert.equal(isValidPageSlug("a-b-1"), true);
assert.equal(isValidPageSlug("a"), true);
assert.equal(isValidPageSlug(""), false);
assert.equal(isValidPageSlug("Jason"), false, "大寫不允許");
assert.equal(isValidPageSlug("-jason"), false, "開頭連字號不允許");
assert.equal(isValidPageSlug("jason-"), false, "結尾連字號不允許");
assert.equal(isValidPageSlug("ja son"), false, "空白不允許");
assert.equal(isValidPageSlug("a.b"), false, "點不允許");
assert.equal(isValidPageSlug("x".repeat(51)), false, "超過 50 字不允許");
for (const reserved of [HOME_PAGE_SLUG, "admin", "api", "uploads"]) {
  assert.equal(isValidPageSlug(reserved), false, `保留字 ${reserved} 不可作為頁面後綴`);
}

// 內容 key：首頁維持既有 key，子頁面帶前綴
assert.equal(pageContentKey(), DESIGNER_WEB_SETTINGS_KEY);
assert.equal(pageContentKey(null), DESIGNER_WEB_SETTINGS_KEY);
assert.equal(pageContentKey("jason"), "designer_web_content:jason");

// 路由與 UI 檔案存在且接上多頁面
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const apiSource = read("app/api/designer-web/[slug]/route.ts");
for (const method of ["GET", "POST", "PUT", "DELETE"]) {
  assert.match(apiSource, new RegExp(`export async function ${method}`), `子頁面 API 需支援 ${method}`);
}
assert.match(apiSource, /isValidPageSlug/);
assert.match(apiSource, /需要管理員或編輯身分/);

const listSource = read("components/admin/PageList.tsx");
assert.match(listSource, /新增頁面/);
assert.match(listSource, /首頁/);
// 子頁面以「停用/啟用」切換取代刪除；停用後前台回 404
assert.match(listSource, /停用/, "子頁面需提供停用切換");
assert.match(listSource, /啟用/, "停用後可重新啟用");
assert.doesNotMatch(listSource, /window\.confirm|window\.alert/);
// 「更多」在手機換行後靠左，選單需向右展開；桌機才改回靠右對齊，避免超出 viewport。
assert.match(listSource, /absolute left-0 right-auto[^\"]*sm:left-auto sm:right-0/);

const adminListPage = read("app/admin/page-management/page.tsx");
assert.match(adminListPage, /PageList/);
assert.match(adminListPage, /listDesignerWebPages/);

const editorSource = read("app/admin/page-management/[slug]/page.tsx");
assert.match(editorSource, /PageManagementForm/);
assert.match(editorSource, /notFound\(\)/);

const formSource = read("components/admin/PageManagementForm.tsx");
assert.match(formSource, /`\/api\/designer-web\/\$\{slug\}`/, "表單依 slug 寫入子頁面 API");
