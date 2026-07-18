# 前台影片效能優化設計

日期：2026-07-18

## 背景與根因

正式頁面 `/monica/web` 目前在初始 HTML 中建立 12 個 Cloudflare Stream iframe（11 支不同影片），每個播放器均使用 `autoplay=true` 與 `preload=auto`。最低畫質的理論合計頻寬仍約 6.46 Mbps，且每個 iframe 都要建立獨立播放器執行環境。根因是 `MediaView` 與 `WorksGallery` 將所有影片都標記為 `priority`，繞過既有的 IntersectionObserver 懶載入。

先前懶載入版本的使用者體驗問題不是懶載入本身，而是播放器尚未掛載時只顯示黑色區塊。修正應保留懶載入並加入縮圖占位，而不是同時啟動全部播放器。

## 目標

- 初始 HTML 不建立任何 Stream iframe，只先顯示可快取的 Stream 縮圖。
- 首屏影片在進入可視區後優先載入，非首屏影片只有在實際進入可視區時才載入。
- 全頁同時間最多只有一個自動播放播放器。
- Stream 影片離開可視區後卸載，停止背景播放、下載與解碼。
- Save-Data 或 `prefers-reduced-motion` 啟用時改為點擊播放。
- 所有後台影片欄位都優先上傳 Cloudflare Stream，只有 Stream 未設定時回退 R2。
- 移除公開頁不必要的 Client Component 與 Zod bundle。

## 方案比較

### A. 只移除非首屏 `priority`

改動最小，但影片載入前仍是黑畫面，且 Stream iframe 一旦載入後不會在離開視窗時停止。

### B. 縮圖占位、可視區掛載、全頁單一播放器（採用）

先輸出縮圖，瀏覽器完成 hydration 後以 IntersectionObserver 啟動可視影片。播放器啟動時透過頁面級事件通知其他播放器卸載。兼顧首屏感受、滑動作品體驗及行動網路負載。

### C. 自建 HLS Player

可以共享單一 HLS runtime，但需要額外處理 Safari、Chrome、錯誤恢復、畫質選擇與播放器 UI。現階段官方 Stream iframe 在限制為單一播放器後已足夠，不採用。

## 元件設計

### `PublicVideo`

- 初始 `active=false`，Stream 影片先渲染 `streamThumbnailUrl(uid)`。
- `priority` 只控制縮圖 eager/high priority，以及播放器啟動後使用 `preload=auto`；不再讓 iframe 出現在 SSR HTML。
- IntersectionObserver 使用可視比例門檻，影片達門檻時啟動，離開時設為 inactive 並卸載 iframe。
- 啟動時發布頁面級 `designer-video-activate` 事件；其他 `PublicVideo` 收到不同 ID 後停止。
- Save-Data 或 reduced motion 時不自動啟動，縮圖上提供播放按鈕。
- 原生 R2 `<video>` 沿用相同生命週期，inactive 時不設定 `src`。

### 呼叫端

- `OnePage` 首屏保留 `priority`。
- `MediaView` 與 `WorksGallery` 不傳 `priority`。
- `MediaView` 改為 Server Component，僅影片分支嵌入 Client Component `PublicVideo`。
- `Header` 改接收最小 props；導覽可見性及 anchor 在 `OnePage` Server Component 中計算。

### 上傳管線

- 新增瀏覽器端共用 helper，封裝 Stream direct upload、進度、complete 回報與 R2 fallback。
- `VideoUpload` 與 `MediaUpload` 共用同一 helper，避免服務／DM／環境影片回到 R2。
- 保留既有檔案格式、200 MB 上限及錯誤訊息。

## 錯誤與相容性

- Stream direct-upload 回 503 才回退 R2；其他錯誤直接顯示，不靜默降級。
- Stream 或原生影片播放失敗時保留外部開啟連結。
- 不新增播放器套件，不變更資料庫內容格式，既有 iframe URL 完全相容。
- 不改後台資料合約、SEO、308 轉址與 ISR 策略。

## 驗證標準

- `MediaView`、`WorksGallery` 不得傳入 `priority`。
- 伺服器輸出的 Stream 影片只有縮圖，iframe 在 client 可視後才出現。
- 全頁同時最多一個 active player。
- 離開視窗後 iframe 消失。
- Save-Data／reduced motion 顯示手動播放按鈕。
- `MediaUpload` 和 `VideoUpload` 都走共用 Stream-first helper。
- 完整 TypeScript 測試、`tsc`、production build 與 `git diff --check` 通過。

