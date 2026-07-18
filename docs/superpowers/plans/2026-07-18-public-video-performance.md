# Public Video Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將前台初始 Stream 播放器由 12 個降為 0，並在可視區內最多啟動一個播放器，同時統一所有影片的 Stream-first 上傳流程。

**Architecture:** `PublicVideo` 以縮圖作 SSR 占位，client hydration 後再由 IntersectionObserver 掛載 iframe；頁面級事件協調單一 active player。`VideoUpload` 與 `MediaUpload` 共用單一 browser upload helper，公開頁的 Header 與 MediaView 則縮小 Client Component 邊界。

**Tech Stack:** Next.js 15 App Router、React 19、TypeScript、Cloudflare Stream、Cloudflare R2、Node assert 測試。

## Global Constraints

- 不新增播放器或測試框架依賴。
- 不改 `DesignerWebContent` 資料格式。
- 首屏影片仍可自動播放，但必須在可視後才建立播放器。
- 非首屏及通用媒體不得使用 `priority`。
- Stream 未設定（HTTP 503）時才回退 R2。

---

### Task 1: 播放器載入生命週期

**Files:**
- Modify: `components/public/PublicVideo.tsx`
- Modify: `components/public/MediaView.tsx`
- Modify: `components/public/WorksGallery.tsx`
- Test: `tests/public-video-performance.test.ts`

**Interfaces:**
- Consumes: `streamUidFromUrl()`、`streamThumbnailUrl()`、`streamIframeSrc()`。
- Produces: `PublicVideo({ src, className, controls, autoPlay, priority })`，SSR 只顯示縮圖且 client 同時間最多一個 active player。

- [ ] **Step 1: Write the failing test**

建立來源合約測試，要求非首屏沒有 `priority`、播放器包含縮圖、IntersectionObserver、停止邏輯、Save-Data 與 reduced-motion。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/public-video-performance.test.ts`

Expected: FAIL，指出 `MediaView` 或 `WorksGallery` 仍包含 `priority`。

- [ ] **Step 3: Write minimal implementation**

讓 `PublicVideo` 初始 inactive，加入縮圖、可視比例 observer、頁面級 active event 與手動播放 fallback；從兩個非首屏呼叫端移除 `priority`。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx tests/public-video-performance.test.ts`

Expected: PASS。

### Task 2: 統一 Stream-first 上傳

**Files:**
- Create: `lib/client-video-upload.ts`
- Modify: `components/admin/VideoUpload.tsx`
- Modify: `components/admin/MediaUpload.tsx`
- Modify: `tests/cloudflare-media.test.ts`
- Test: `tests/video-upload-pipeline.test.ts`

**Interfaces:**
- Produces: `uploadClientVideo(file, { onProgress }): Promise<{ url: string; notice: string }>`。
- Consumers: `VideoUpload.uploadFile()`、`MediaUpload.uploadVideo()`。

- [ ] **Step 1: Write the failing test**

要求兩個元件都匯入同一 helper，且 `MediaUpload` 不再直接維護 R2-only 流程。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/video-upload-pipeline.test.ts`

Expected: FAIL，指出尚未共用 `uploadClientVideo`。

- [ ] **Step 3: Write minimal implementation**

搬移既有 Stream direct upload、complete 回報、R2 fallback 及 XHR progress 到共用 helper，兩元件只處理 UI state。

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx tests/video-upload-pipeline.test.ts && node --import tsx tests/cloudflare-media.test.ts`

Expected: PASS。

### Task 3: 縮小公開頁 Client 邊界

**Files:**
- Modify: `components/public/Header.tsx`
- Modify: `components/public/MediaView.tsx`
- Modify: `components/public/OnePage.tsx`
- Test: `tests/public-client-boundaries.test.ts`

**Interfaces:**
- Produces: `Header({ title, themeColor, textColor, links })`。
- OnePage 在 server 端產生 `links: { href: string; label: string }[]`。

- [ ] **Step 1: Write the failing test**

要求 `MediaView` 不再是 Client Component，`Header` 不再匯入或接收完整 `DesignerWebContent`。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx tests/public-client-boundaries.test.ts`

Expected: FAIL，指出現有 client 邊界過大。

- [ ] **Step 3: Write minimal implementation**

移除 `MediaView` 的 client directive，調整 Header props，並在 OnePage server 端計算導覽。

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx tests/public-client-boundaries.test.ts && node --import tsx tests/public-section-anchors.test.ts`

Expected: PASS。

### Task 4: 完整驗證

**Files:**
- Modify if required: `README.md`、`CLAUDE.md`、`memory.md`

- [ ] **Step 1: Run all tests**

Run: `for test in tests/*.test.ts; do node --import tsx "$test" || exit 1; done`

- [ ] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit --incremental false`

- [ ] **Step 3: Run production build**

Run: `npm run build:verify`

- [ ] **Step 4: Inspect output and diff**

Run: `git diff --check && git status --short && git diff --stat`

Expected: 無 whitespace error、所有修改均在本計畫範圍內。
