# memory.md

Designer Web 的跨 session 專案記錄。最後更新：2026-07-16。新工作階段先讀 `README.md`、`STYLE.md`、`CLAUDE.md`，再以目前程式碼與 Git 狀態校正本檔。

## 目前狀態

- GitHub 目標倉庫：`jason121380/designer_web`。
- 分支：`main`。
- 最近完成的頁面管理重整 commit：`f80c45b`；2026-07 完成舊 CMS 程式碼全面清理與優化（見 Git log）。
- 本機前台：`http://localhost:3000/`。
- 本機後台：`http://localhost:3000/admin/page-management`。
- 前台目前是 KIMEKO HAIR 示範內容；正式素材與文字應由後台更新。
- 後台側欄只剩「頁面管理」；入口為頁面列表，支援多頁面（`/{slug}`），每頁獨立編輯。
- 多頁面已通過本機 PostgreSQL E2E：登入 → 建立/編輯/刪除頁面 → 前台獨立呈現與 404。
- 桌機 1280 x 720 與手機 390 x 844 已驗證無水平溢出。
- 前後台瀏覽器 console 已驗證無 error。
- 核心測試、TypeScript 與 `npm run build:verify` 已通過。

以上是 2026-07-16 本機與該 commit 的狀態，不代表 Zeabur 最新部署一定已更新；部署狀態需到 Zeabur 或正式網域重新確認。

## 已確定架構

### Next.js 服務

同一個 Next.js 服務同時提供：

- 一頁式公開前台。
- 登入頁與頁面管理後台。
- Auth、頁面設定、圖片與 Cloudflare Stream 輔助 API。

目前不需要拆成獨立前端與後端服務。資料庫與媒體儲存維持外部服務。

### PostgreSQL

- 使用 Zeabur PostgreSQL，連線由 `DATABASE_URL` 提供。
- 頁面設定存於 `site_settings`，支援多頁面：
  - 首頁（`/`）：key `designer_web_content`（沿用舊 key，向下相容）。
  - 子頁面（`/jason` 等）：key `designer_web_content:{slug}`。
- value：完整 `DesignerWebContent` JSON。
- slug 規則：小寫英數與連字號、1-50 字；保留字 `home`、`admin`、`api`、`uploads`。
- 前台子頁面不存在回 404；首頁 fallback 示範內容。
- `lib/designer-web-content.ts` 負責 Zod 驗證、清理、預設值與舊資料相容。
- 若 DB 不可用或 JSON 損壞，前台 fallback 到 KIMEKO 示範內容。

資料內容包括：

1. 品牌與導覽。
2. 首屏形象。
3. 活動 DM。
4. 接髮介紹。
5. 其他服務。
6. 作品影片。
7. 分期資訊。
8. 價目表。
9. 環境介紹。
10. 聯絡資訊。

### Cloudflare

- 圖片目標儲存：Cloudflare R2。
- 影片目標儲存：Cloudflare Stream。
- R2 未完整設定時，`/api/upload` 會 fallback 到 `public/uploads`。
- 目前後台圖片可直接上傳；影片欄位目前使用播放 URL，尚未接上完整的 direct-upload UI。
- 不在此檔記錄任何 Cloudflare ID、token 或 secret。

## 已完成決策

- 新專案不顯示舊品牌文字與 Logo。
- 前台是一頁式服務網站，不是文章首頁。
- 後台不提供多模組 CMS，只提供頁面管理。
- 可選區塊沒有內容時，前台與導覽都自動隱藏。
- 圖片從區塊內上傳，不顯示獨立媒體庫。
- 舊 `/admin/dashboard`、`/admin/designer-web`、文章、分類、標籤、媒體、分析、用戶與工具路徑由 middleware 導回 `/admin/page-management`。
- 正式建置驗證使用 `.next-verify`，避免破壞運行中的 `.next` 開發樣式。
- `tsconfig.tsbuildinfo` 已停止追蹤並加入 `.gitignore`。

## 相容性與技術債

- 2026-07 清理：舊 CMS 的 admin 頁面、公開文章/分類/搜尋頁、文章/分類/標籤/媒體/用戶/AI/追蹤/維護 API、對應 lib 與 components、TipTap/OpenAI/sanitize-html/slugify 等依賴已全部移除。
- Prisma schema 仍保留 Article、Category、Tag、ArticleTag、PageView 模型與資料表；程式碼已無任何引用，僅為避免破壞性 migration 造成資料遺失。確認不再需要舊資料後，以有 rollback 計畫的 migration 移除。
- `lib/auth.ts` 仍保留舊管理員 email alias（`admin` -> `admin@mifaso.com`），讓現有帳號可用 `admin` 登入；這是內部相容，不是品牌顯示。
- Cloudflare Stream direct-upload API 已存在，但頁面管理 UI 尚未串接，影片欄位仍手動填播放 URL。
- 首頁 SEO title/description 已改為由 `generateMetadata` 讀取品牌名稱、標語與主標題；社群分享圖尚未納入頁面設定。
- 聯絡資訊的連結欄位（地圖、Email、LINE、IG、FB）清空即隱藏，不再被 normalize 回填示範連結；地址與電話仍保留預設避免區塊空白。

## 下一步建議

1. 在 Zeabur 設定 R2 與 Stream 環境變數，確認圖片實際回傳 Cloudflare 公開 URL。
2. 從頁面管理上傳首屏、服務、DM 與環境素材，替換空白示範素材。
3. 串接 Cloudflare Stream direct-upload UI，避免手動貼影片 URL。
4. 將社群分享圖（og:image）納入頁面設定。
5. 確認舊文章資料不再需要後，以 migration 分階段移除 Article/Category/Tag/ArticleTag/PageView 資料表與模型。
6. 部署到 Zeabur 後重跑登入、儲存、R2 上傳、前台更新與手機版 smoke test。

## 工作守則

- 不把資料庫 URL、密碼、Auth secret、R2 secret 或 Stream token 寫進 repo。
- 修改內容合約時同步更新 default、normalize、API、表單、前台與測試。
- 後台新增功能前先確認是否違反「只要頁面管理」。
- 開發伺服器運行時使用 `npm run build:verify`，不要讓正式建置覆寫 `.next`。
- 推送前執行完整測試、`npx tsc --noEmit --incremental false`、`npm run build:verify` 與 `git diff --check`。
