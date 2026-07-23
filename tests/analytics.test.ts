import assert from "node:assert/strict";
import { sanitizeGtagId, sanitizeEventName, normalizeAnalyticsEvents, defaultAnalyticsEvents } from "../lib/analytics";

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

// 事件名稱：合法保留、不合法退回預設
assert.equal(sanitizeEventName("click_line", "def"), "click_line");
assert.equal(sanitizeEventName("  Book_Now  ", "def"), "Book_Now");
assert.equal(sanitizeEventName("", "def"), "def");
assert.equal(sanitizeEventName("1abc", "def"), "def"); // 不可數字開頭
assert.equal(sanitizeEventName("click line", "def"), "def"); // 不可空白
assert.equal(sanitizeEventName("按LINE", "def"), "def"); // 不可中文
assert.equal(sanitizeEventName("a".repeat(41), "def"), "def"); // 超過 40 字

// 對照表：補齊所有 key、不合法退回預設
const defaults = defaultAnalyticsEvents();
assert.equal(defaults.line, "click_line");
assert.equal(defaults.moreWorks, "click_more_works");
const normalized = normalizeAnalyticsEvents({ line: "line_tap", facebook: "壞名字", extra: "ignore" });
assert.equal(normalized.line, "line_tap"); // 自訂保留
assert.equal(normalized.facebook, "click_facebook"); // 不合法退回預設
assert.equal(normalized.map, "click_map"); // 缺的補預設
assert.equal("extra" in normalized, false); // 只保留已知 key

console.log("analytics.test.ts passed");
