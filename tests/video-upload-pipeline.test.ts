import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const videoUpload = read("components/admin/VideoUpload.tsx");
const mediaUpload = read("components/admin/MediaUpload.tsx");

// 所有影片欄位共用同一條 Stream-first 上傳管線，避免通用媒體欄位退回 R2-only。
assert.match(videoUpload, /import \{ uploadClientVideo \} from "@\/lib\/client-video-upload"/);
assert.match(mediaUpload, /import \{ uploadClientVideo \} from "@\/lib\/client-video-upload"/);
assert.match(videoUpload, /await uploadClientVideo\(/);
assert.match(mediaUpload, /await uploadClientVideo\(/);

// XHR、Stream direct upload 與 R2 fallback 只能存在共用 helper，不再散落兩份。
assert.doesNotMatch(videoUpload, /new XMLHttpRequest/);
assert.doesNotMatch(mediaUpload, /new XMLHttpRequest/);
assert.doesNotMatch(mediaUpload, /\/api\/upload\/video-url/);

console.log("video-upload-pipeline.test.ts passed");
