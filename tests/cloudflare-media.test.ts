import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  buildR2PublicUrl,
  buildStreamIframeUrl,
  buildStreamThumbnailUrl,
  getR2PresignedUploadUrl,
  isR2Configured,
  isStreamConfigured,
} from "../lib/cloudflare-media";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

assert.equal(isR2Configured({}), false);
assert.equal(
  isR2Configured({
    CLOUDFLARE_R2_ACCOUNT_ID: "acc",
    CLOUDFLARE_R2_ACCESS_KEY_ID: "key",
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: "secret",
    CLOUDFLARE_R2_BUCKET: "bucket",
    CLOUDFLARE_R2_PUBLIC_URL: "https://cdn.example.com/",
  }),
  true
);
assert.equal(buildR2PublicUrl("https://cdn.example.com/", "uploads/2026/test.webp"), "https://cdn.example.com/uploads/2026/test.webp");
assert.equal(isStreamConfigured({}), false);
assert.equal(isStreamConfigured({ CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_STREAM_API_TOKEN: "token" }), true);
assert.equal(buildStreamIframeUrl("abc123"), "https://iframe.videodelivery.net/abc123");
assert.equal(buildStreamThumbnailUrl("abc123"), "https://videodelivery.net/abc123/thumbnails/thumbnail.jpg");

// 影片直傳：R2 未設定時 presigned helper 直接丟錯，不會產生上傳連結
void (async () => {
  await assert.rejects(
    () => getR2PresignedUploadUrl({ key: "uploads/videos/x.mp4", contentType: "video/mp4" }),
    /R2 尚未設定/
  );
})().catch((error) => { console.error(error); process.exitCode = 1; });

// 影片直傳 API 驗證格式與大小上限
const videoRoute = read("app/api/upload/video-url/route.ts");
assert.match(videoRoute, /video\/mp4/);
assert.match(videoRoute, /getR2PresignedUploadUrl/);
assert.match(videoRoute, /200 \* 1024 \* 1024/, "影片上限 200MB");

// 後台表單以 VideoUpload 取代手貼影片 URL（首屏影片與作品影片）
const form = read("components/admin/PageManagementForm.tsx");
assert.match(form, /VideoUpload/);
const videoUpload = read("components/admin/VideoUpload.tsx");
assert.match(videoUpload, /\/api\/upload\/video-url/);
assert.match(videoUpload, /xhr\.send\(file\)/, "以 XHR 直傳 R2（帶進度）");
