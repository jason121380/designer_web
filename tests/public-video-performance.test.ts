import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicVideo from "../components/public/PublicVideo";

// tsx 保留本專案的 JSX 設定；測試環境補上 classic transform 所需的 React global。
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const read = (path: string) => readFileSync(path, "utf8");

const publicVideo = read("components/public/PublicVideo.tsx");
const mediaView = read("components/public/MediaView.tsx");
const worksGallery = read("components/public/WorksGallery.tsx");
const onePage = read("components/public/OnePage.tsx");

// 只有首屏能使用 priority；所有內容區塊與作品影片都必須維持 viewport lazy load。
assert.doesNotMatch(mediaView, /<PublicVideo[^>]*\bpriority\b/);
assert.doesNotMatch(worksGallery, /<PublicVideo[^>]*\bpriority\b/);
assert.match(onePage, /<PublicVideo[^>]*\bpriority\b/);

// SSR 先輸出 Stream 縮圖；hydration 後進入可視區才建立播放器。
assert.match(publicVideo, /streamThumbnailUrl/);
assert.match(publicVideo, /IntersectionObserver/);
assert.match(publicVideo, /setActive\(false\)/);
assert.match(publicVideo, /loading=\{priority \? "eager" : "lazy"\}/);

// 全頁同時只保留一個播放器，並尊重省流量與減少動態效果偏好。
assert.match(publicVideo, /designer-video-activate/);
assert.match(publicVideo, /saveData/);
assert.match(publicVideo, /prefers-reduced-motion/);

// 真正的 server render 不得輸出 iframe/video，只留下 Stream 縮圖占位。
const serverMarkup = renderToStaticMarkup(React.createElement(PublicVideo, {
  src: "https://iframe.videodelivery.net/0123456789abcdef0123456789abcdef",
  autoPlay: true,
  priority: true,
  className: "aspect-square",
}));
assert.doesNotMatch(serverMarkup, /<iframe\b|<video\b/);
assert.match(serverMarkup, /videodelivery\.net\/0123456789abcdef0123456789abcdef\/thumbnails\/thumbnail\.jpg/);
assert.match(serverMarkup, /fetchPriority="high"/);

console.log("public-video-performance.test.ts passed");
