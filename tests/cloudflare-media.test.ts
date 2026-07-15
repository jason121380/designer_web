import assert from "node:assert/strict";
import {
  buildR2PublicUrl,
  buildStreamIframeUrl,
  buildStreamThumbnailUrl,
  isR2Configured,
  isStreamConfigured,
} from "../lib/cloudflare-media";

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
