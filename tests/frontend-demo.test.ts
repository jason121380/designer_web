import assert from "node:assert/strict";
import { frontendDemo } from "../lib/frontend-demo";

assert.equal(frontendDemo.brandName, "KIMEKO HAIR（示範）");
assert.equal(frontendDemo.themeColor, "#d9bf77");
assert.equal(frontendDemo.hero.mediaType, "image");
assert.equal(frontendDemo.services.length, 1);
assert.equal(frontendDemo.otherServices.length, 2);
assert.equal(frontendDemo.promos.length, 0);
assert.equal(frontendDemo.videos.length, 0);
assert.equal(frontendDemo.installment.length, 3);
assert.equal(frontendDemo.contact.phone, "0938-323-506");
