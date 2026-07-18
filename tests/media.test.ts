import assert from "node:assert/strict";
import { isVideoUrl } from "../lib/media";

const STREAM = "https://iframe.videodelivery.net/31c9291ab41fac05471db4e73aa11717";

// R2 影片：副檔名或 uploads/videos 路徑
assert.equal(isVideoUrl("https://media.example.com/uploads/videos/2026/07/x.mp4"), true);
assert.equal(isVideoUrl("https://media.example.com/a.mov"), true);
assert.equal(isVideoUrl("https://media.example.com/a.webm"), true);

// Cloudflare Stream 網址（沒有副檔名，需被辨識為影片，否則前台/後台會誤當圖片破圖）
assert.equal(isVideoUrl(STREAM), true);
assert.equal(isVideoUrl(`${STREAM}?autoplay=true`), true);

// 圖片與空值
assert.equal(isVideoUrl("https://media.example.com/uploads/2026/07/a.webp"), false);
assert.equal(isVideoUrl("https://media.example.com/a.jpg"), false);
assert.equal(isVideoUrl(""), false);
assert.equal(isVideoUrl(null), false);

console.log("media.test.ts passed");
