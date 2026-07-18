import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicVideo from "../components/public/PublicVideo";
import { hlsFatalRecoveryAction } from "../components/public/useStreamHls";

// tsx 保留本專案的 JSX 設定；測試環境補上 classic transform 所需的 React global。
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const read = (path: string) => readFileSync(path, "utf8");

const publicVideo = read("components/public/PublicVideo.tsx");
const useStreamHls = read("components/public/useStreamHls.ts");
const mediaView = read("components/public/MediaView.tsx");
const worksGallery = read("components/public/WorksGallery.tsx");
const onePage = read("components/public/OnePage.tsx");
const packageJson = JSON.parse(read("package.json")) as { dependencies?: Record<string, string> };

// 只有首屏用 priority（縮圖 eager＋高優先）；其餘維持預設，但一樣立即掛載播放。
assert.doesNotMatch(mediaView, /<PublicVideo[^>]*\bpriority\b/);
assert.doesNotMatch(worksGallery, /<PublicVideo[^>]*\bpriority\b/);
assert.match(onePage, /<PublicVideo[^>]*\bpriority\b/);

// SSR 只輸出 Stream 縮圖；hydration 後立即掛載播放器（不再等捲動、不再用 IntersectionObserver）。
assert.match(publicVideo, /streamThumbnailUrl/);
assert.match(publicVideo, /setMounted\(true\)/);
assert.doesNotMatch(publicVideo, /IntersectionObserver/);
assert.match(publicVideo, /loading=\{priority \? "eager" : "lazy"\}/);

// 所有影片自動播放、靜音循環、不顯示播放鈕、不做「同時只播一支」限制或省流量手動模式。
assert.match(publicVideo, /autoPlay,/);
assert.match(publicVideo, /loop: autoPlay/);
assert.doesNotMatch(publicVideo, /播放影片/);
assert.doesNotMatch(publicVideo, /designer-video-activate/);
assert.doesNotMatch(publicVideo, /prefers-reduced-motion/);
assert.doesNotMatch(publicVideo, /requestPlayback/);

// 縮圖 404（轉檔中）時隱藏，避免破圖閃爍。
assert.match(publicVideo, /onError=\{\(\) => setThumbBroken\(true\)\}/);

// Stream 改用可 object-cover 的 HLS video（無黑邊）；HLS 綁定集中在共用 hook，非 Safari 才動態載入 hls.js。
assert.doesNotMatch(publicVideo, /<iframe\b/);
assert.match(publicVideo, /absolute inset-0 h-full w-full object-cover/);
assert.match(useStreamHls, /streamHlsUrl/);
assert.match(useStreamHls, /import\("hls\.js"\)/);
assert.ok(packageJson.dependencies?.["hls.js"], "需安裝 hls.js 支援沒有原生 HLS 的瀏覽器");

// HLS 永久錯誤最多恢復一次，第二次就必須顯示失敗備援，不能卡在縮圖或無限重試。
assert.equal(hlsFatalRecoveryAction("networkError", 0), "retry-network");
assert.equal(hlsFatalRecoveryAction("networkError", 0, true), "reload-manifest");
assert.equal(hlsFatalRecoveryAction("networkError", 1), "fail");
assert.equal(hlsFatalRecoveryAction("mediaError", 0), "recover-media");
assert.equal(hlsFatalRecoveryAction("mediaError", 1), "fail");
assert.equal(hlsFatalRecoveryAction("otherError", 0), "fail");

// 作品輪播不再依可視卡片切換播放，也不再因 breakpoint 重掛播放器；全部一律自動播。
assert.doesNotMatch(worksGallery, /autoActivate/);
assert.doesNotMatch(worksGallery, /mobileCarousel/);
assert.doesNotMatch(worksGallery, /IntersectionObserver/);
assert.match(worksGallery, /<PublicVideo[^>]*autoPlay/);

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
