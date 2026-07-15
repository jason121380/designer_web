import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testsDir, "..");
const pageSource = readFileSync(path.join(projectRoot, "app/(public)/page.tsx"), "utf8");

assert.match(pageSource, /id="pricing"/, "首頁必須提供價目表錨點區塊");
assert.match(pageSource, /id="ev"/, "首頁必須提供環境介紹錨點區塊");
for (const id of ["top", "services", "other-services", "pay", "contact"]) {
  assert.match(pageSource, new RegExp(`id="${id}"`), `首頁必須提供 ${id} 錨點區塊`);
}
