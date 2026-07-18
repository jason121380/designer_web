import assert from "node:assert/strict";
import { externalHref } from "../lib/utils";

// 安全協定原樣保留
assert.equal(externalHref("https://example.com"), "https://example.com");
assert.equal(externalHref("http://example.com"), "http://example.com");
assert.equal(externalHref("mailto:a@b.com"), "mailto:a@b.com");
assert.equal(externalHref("tel:0900000000"), "tel:0900000000");

// 站內相對路徑保留
assert.equal(externalHref("/jason/links"), "/jason/links");

// 無協定補 https
assert.equal(externalHref("www.google.com"), "https://www.google.com");
assert.equal(externalHref("  instagram.com/x  "), "https://instagram.com/x");

// 危險協定一律擋掉（回空字串），避免儲存型 XSS
assert.equal(externalHref("javascript:alert(1)"), "");
assert.equal(externalHref("JavaScript:alert(1)"), "");
assert.equal(externalHref("data:text/html,<script>alert(1)</script>"), "");
assert.equal(externalHref("vbscript:msgbox(1)"), "");

// 空值
assert.equal(externalHref(""), "");

console.log("utils.test.ts passed");
