import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicVideo, {
  hlsFatalRecoveryAction,
  playbackOverlayVisible,
  videoVisibilityAction,
} from "../components/public/PublicVideo";
import { galleryActiveIndex } from "../components/public/WorksGallery";

// tsx 保留本專案的 JSX 設定；測試環境補上 classic transform 所需的 React global。
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const read = (path: string) => readFileSync(path, "utf8");

const publicVideo = read("components/public/PublicVideo.tsx");
const mediaView = read("components/public/MediaView.tsx");
const worksGallery = read("components/public/WorksGallery.tsx");
const onePage = read("components/public/OnePage.tsx");
const packageJson = JSON.parse(read("package.json")) as { dependencies?: Record<string, string> };

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
assert.match(publicVideo, /manualPlayback/);

// Stream 改用可 object-cover 的 HLS video；非 Safari 才動態載入 hls.js，避免 iframe 內建黑邊。
assert.match(publicVideo, /streamHlsUrl/);
assert.match(publicVideo, /import\("hls\.js"\)/);
assert.doesNotMatch(publicVideo, /<iframe\b/);
assert.match(publicVideo, /absolute inset-0 h-full w-full object-cover/);
assert.ok(packageJson.dependencies?.["hls.js"], "需安裝 hls.js 支援沒有原生 HLS 的瀏覽器");

// HLS 永久錯誤最多恢復一次，第二次就必須顯示失敗備援，不能卡在縮圖或無限重試。
assert.equal(hlsFatalRecoveryAction("networkError", 0), "retry-network");
assert.equal(hlsFatalRecoveryAction("networkError", 0, true), "reload-manifest");
assert.equal(hlsFatalRecoveryAction("networkError", 1), "fail");
assert.equal(hlsFatalRecoveryAction("mediaError", 0), "recover-media");
assert.equal(hlsFatalRecoveryAction("mediaError", 1), "fail");
assert.equal(hlsFatalRecoveryAction("otherError", 0), "fail");

// 自動播放真正成功前都保留可點擊按鈕；Safari 低耗電模式拒播時仍可手動重試。
assert.equal(playbackOverlayVisible({ active: false, autoPlay: true, playing: false }), true);
assert.equal(playbackOverlayVisible({ active: true, autoPlay: true, playing: false }), true);
assert.equal(playbackOverlayVisible({ active: true, autoPlay: true, playing: true }), false);
assert.equal(playbackOverlayVisible({ active: true, autoPlay: false, playing: false }), false);
assert.match(publicVideo, /onPlaying=\{\(\) => setPlaying\(true\)\}/);
assert.match(publicVideo, /requestPlayback/);

// 可視生命週期的決策直接做行為驗證。
assert.equal(videoVisibilityAction({ isIntersecting: true, intersectionRatio: 0.15, manualPlayback: false }), "activate");
assert.equal(videoVisibilityAction({ isIntersecting: true, intersectionRatio: 0.8, manualPlayback: true }), "keep");
assert.equal(videoVisibilityAction({ isIntersecting: true, intersectionRatio: 0.04, manualPlayback: true }), "deactivate");
assert.equal(videoVisibilityAction({ isIntersecting: false, intersectionRatio: 0, manualPlayback: false }), "deactivate");

// 手機作品輪播只讓外層選中的卡片自動啟用；其他卡片仍可手動點播。
assert.equal(videoVisibilityAction({
  isIntersecting: true,
  intersectionRatio: 1,
  manualPlayback: false,
  autoActivate: false,
}), "keep");

// 取可視比例最高者；同分時固定選較左邊的索引，避免兩張完整顯示時由 callback 順序決定。
assert.equal(galleryActiveIndex([1, 0.2]), 0);
assert.equal(galleryActiveIndex([1, 1, 0.2]), 0);
assert.equal(galleryActiveIndex([0.15, 1, 1]), 1);
assert.equal(galleryActiveIndex([0.6, 0.4]), null);
assert.match(worksGallery, /max-width: 767px/);
assert.match(worksGallery, /autoActivate=\{!mobileCarousel \|\| index === activeIndex\}/);
assert.match(worksGallery, /key=\{mobileCarousel \? "mobile" : "desktop"\}/);
assert.match(worksGallery, /scrollLeft\s*=\s*0/);

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
