import assert from "node:assert/strict";
import { isStreamUrl, streamIframeSrc, streamThumbnailUrl, streamUidFromUrl } from "../lib/stream-url";

const UID = "31c9291ab41fac05471db4e73aa11717";

// 各種 Stream 網址都能取出 UID
assert.equal(streamUidFromUrl(`https://iframe.videodelivery.net/${UID}`), UID);
assert.equal(streamUidFromUrl(`https://iframe.videodelivery.net/${UID}?autoplay=true`), UID);
assert.equal(streamUidFromUrl(`https://videodelivery.net/${UID}/thumbnails/thumbnail.jpg`), UID);
assert.equal(streamUidFromUrl(`https://customer-abc123.cloudflarestream.com/${UID}/iframe`), UID);

// 非 Stream 網址回 null（R2 的 .mp4、相對路徑、空字串、亂填）
assert.equal(streamUidFromUrl("https://media.example.com/uploads/videos/2026/07/x.mp4"), null);
assert.equal(streamUidFromUrl("/jason/web"), null);
assert.equal(streamUidFromUrl(""), null);
assert.equal(streamUidFromUrl("https://iframe.videodelivery.net/not-a-uid"), null);
// 相似但非官方網域不可誤判（避免被偽造網域騙過）
assert.equal(streamUidFromUrl(`https://videodelivery.net.evil.com/${UID}`), null);

// isStreamUrl 布林包裝
assert.equal(isStreamUrl(`https://iframe.videodelivery.net/${UID}`), true);
assert.equal(isStreamUrl("https://media.example.com/x.mp4"), false);

// 縮圖網址
assert.equal(streamThumbnailUrl(UID), `https://videodelivery.net/${UID}/thumbnails/thumbnail.jpg`);

// iframe 網址帶播放參數（作品影片：自動播放、循環、靜音、無控制列）
const autoSrc = streamIframeSrc(UID, { autoplay: true, loop: true, muted: true, controls: false });
assert.ok(autoSrc.startsWith(`https://iframe.videodelivery.net/${UID}?`));
assert.ok(autoSrc.includes("autoplay=true"));
assert.ok(autoSrc.includes("loop=true"));
assert.ok(autoSrc.includes("muted=true"));
assert.ok(autoSrc.includes("controls=false"));

// 無參數時不帶問號
assert.equal(streamIframeSrc(UID), `https://iframe.videodelivery.net/${UID}`);

// controls 預設不加參數（只有明確 false 才關閉控制列）
assert.ok(!streamIframeSrc(UID, { autoplay: true }).includes("controls"));

console.log("stream-url.test.ts passed");
