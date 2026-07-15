import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const pageSource = read("app/(public)/page.tsx");
const headerSource = read("components/public/Header.tsx");
const footerSource = read("components/public/Footer.tsx");

assert.doesNotMatch(pageSource, /frontendDemo/);
assert.match(pageSource, /content\.services/);
assert.match(pageSource, /content\.otherServices/);
assert.match(pageSource, /content\.videos/);
assert.match(pageSource, /content\.installment/);
assert.match(headerSource, /getDesignerWebContent/);
assert.doesNotMatch(headerSource, /frontendDemo/);
assert.match(footerSource, /getDesignerWebContent/);
assert.doesNotMatch(footerSource, /frontendDemo|Powered by LURE/);
