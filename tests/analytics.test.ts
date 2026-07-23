import assert from "node:assert/strict";
import { sanitizeGtagId } from "../lib/analytics";

// 合法：GA4 / Google Ads / GTM / 舊版 UA（大小寫不拘、去頭尾空白）
assert.equal(sanitizeGtagId("G-ABCDE12345"), "G-ABCDE12345");
assert.equal(sanitizeGtagId("AW-123456789"), "AW-123456789");
assert.equal(sanitizeGtagId("GTM-ABC1234"), "GTM-ABC1234");
assert.equal(sanitizeGtagId("  G-XYZ98765  "), "G-XYZ98765");

// 不合法／空值 → null
assert.equal(sanitizeGtagId(""), null);
assert.equal(sanitizeGtagId(null), null);
assert.equal(sanitizeGtagId(undefined), null);
assert.equal(sanitizeGtagId("random"), null);

// 注入嘗試一律擋掉（不含引號、括號、標籤）
assert.equal(sanitizeGtagId("G-1');alert(1)//"), null);
assert.equal(sanitizeGtagId("G-<script>"), null);
assert.equal(sanitizeGtagId("'+document.cookie+'"), null);

console.log("analytics.test.ts passed");
