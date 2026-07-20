import assert from "node:assert/strict";
import { normalizeDesignerWebContent } from "../lib/designer-web-content";

// 舊資料：接髮項目只有單張 image → 遷移成 images:[image]（向下相容）。
const legacy = normalizeDesignerWebContent({ services: [{ title: "A", image: "https://x/a.jpg" }] });
assert.deepEqual(legacy.services[0].images, ["https://x/a.jpg"]);
assert.equal(legacy.services[0].image, "https://x/a.jpg");

// 新資料：images 陣列去空白、去空值、保留順序。
const multi = normalizeDesignerWebContent({ services: [{ title: "B", images: [" https://x/1.jpg ", "", "https://x/2.mp4"] }] });
assert.deepEqual(multi.services[0].images, ["https://x/1.jpg", "https://x/2.mp4"]);

// images 有值時優先於單張 image。
const both = normalizeDesignerWebContent({ services: [{ title: "C", image: "https://x/old.jpg", images: ["https://x/new.jpg"] }] });
assert.deepEqual(both.services[0].images, ["https://x/new.jpg"]);

// 完全沒媒體 → 空陣列。
const none = normalizeDesignerWebContent({ services: [{ title: "D" }] });
assert.deepEqual(none.services[0].images, []);

console.log("services-media.test.ts passed");
