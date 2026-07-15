# CLAUDE.md

本檔供 Claude、Codex 與維護者在修改 Designer Web 前快速取得正確上下文。開始工作前依序讀取 `README.md`、`STYLE.md`、`memory.md`，再檢查實際程式碼與 Git 狀態；文件可能落後，程式碼才是最終來源。

## 專案目標

Designer Web 是設計師品牌的一頁式網站，不是文章 CMS。

- 前台：`app/(public)/page.tsx`。
- 後台唯一主要功能：`/admin/page-management`。
- 資料：Zeabur PostgreSQL + Prisma。
- 圖片：Cloudflare R2；未設定 R2 時才使用本機/Zeabur Volume fallback。
- 影片：Cloudflare Stream URL。
- 部署目標：前端與後端由同一個 Next.js 服務提供，PostgreSQL 與 Cloudflare 為外部服務。

## 不可破壞的產品決策

1. 後台側欄只保留「頁面管理」。不要重新加入總覽、文章、分類、標籤、媒體庫、流量分析、用戶或工程工具。
2. 頁面管理區塊順序必須跟前台一致。
3. 所有可編輯前台內容都應進入 `DesignerWebContent` 合約並存入 PostgreSQL，不要另建散落的常數或第二份設定來源。
4. 圖片從各區塊內直接上傳，不顯示獨立媒體庫功能。
5. 不顯示或重新引用舊專案品牌與 Logo。
6. 舊 CMS 程式碼已於 2026-07 全數移除；資料庫中的舊資料表（articles、categories、tags、article_tags、media 以外的 page_views 等）仍保留在 Prisma schema 與 DB，等待確認後再以有 rollback 計畫的 migration 分階段移除，不要重新引用或重建舊 UI。

## 內容資料流

支援多頁面：首頁（`/`）沿用既有 key，子頁面（`/jason`、`/kimiko` 等）各自獨立一份內容。

```txt
PageManagementForm
  -> PUT /api/designer-web（首頁）或 /api/designer-web/{slug}（子頁面）
  -> normalizeDesignerWebContent()
  -> site_settings(key = designer_web_content 或 designer_web_content:{slug})

前台 /（首頁）與 /{slug}（子頁面）
  -> getDesignerWebContent() / getDesignerWebPageContent(slug)
  -> site_settings
  -> parseDesignerWebContent()
  -> OnePage（Header + 十區塊 + Footer，props 驅動）
  -> 首頁 fallback 示範內容；子頁面不存在則 404
```

來源真相：

- 合約、預設內容與 slug 驗證：`lib/designer-web-content.ts`
- DB 讀取、頁面列表與 fallback：`lib/designer-web-settings.ts`
- 寫入 API：`app/api/designer-web/route.ts`（首頁）、`app/api/designer-web/[slug]/route.ts`（子頁面 CRUD）
- 後台列表：`components/admin/PageList.tsx`；編輯器：`components/admin/PageManagementForm.tsx`
- 前台輸出：`components/public/OnePage.tsx`（`app/(public)/page.tsx` 與 `app/(public)/[slug]/page.tsx` 共用）

頁面後綴規則：小寫英數與連字號、1-50 字、頭尾不可為連字號；`home`、`admin`、`api`、`uploads` 為保留字。後台的首頁編輯路徑是 `/admin/page-management/home`。

修改資料結構時必須同步更新 schema、TypeScript interface、default、normalize、表單、前台與測試。對舊 DB JSON 保持容錯，不要讓缺少新欄位造成整頁 500。

## 驗證與授權

- Auth.js 使用 Credentials provider 與 JWT session。
- `/admin/*` 由 `middleware.ts` 保護，`/admin/login` 除外。
- `PUT /api/designer-web` 只允許 `ADMIN` 與 `EDITOR`。
- `POST /api/upload` 要求登入使用者，並有每位使用者上傳限速。
- 登入後使用全頁導向，確保 server-rendered admin layout 取得新 session。
- `callbackUrl` 只能使用站內絕對路徑，避免 open redirect。

## Cloudflare 媒體

### 圖片

`app/api/upload/route.ts` 接受 JPEG、PNG、WebP、GIF、AVIF，最大 10MB。

- JPEG/PNG：自動修正 EXIF 方向、最大寬度 1600px、轉 WebP quality 80。
- WebP/GIF/AVIF：保持原檔，避免破壞動畫或重複壓縮。
- R2 五個變數完整時上傳至 R2。
- R2 未設定時寫入 `public/uploads/YYYY/MM`。
- 每次成功上傳仍會建立 `media` DB 紀錄，但後台不提供獨立媒體庫入口。

### 影片

`lib/cloudflare-media.ts` 與 `/api/cloudflare/stream/*` 已有建立 direct upload 的 helper/API。現行 `PageManagementForm` 尚未接上檔案上傳流程，作品影片與 hero 影片欄位目前填入可播放 URL。不要在文件或 UI 宣稱已有完整影片上傳，除非實作並驗證完成。

## 環境變數

禁止把真實值寫進 Git、issue、日誌或文件。

必要：

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `SITE_URL`

R2：

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL`

Stream：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`

Zeabur 正式環境需讓 `NEXTAUTH_URL` 與 `SITE_URL` 使用同一個正式 HTTPS 網域。`lib/auth.config.ts` 的 `trustHost: true` 是反向代理環境必要設定。

## 開發與建置

```bash
npm install
npx prisma generate
npm run dev
```

開發伺服器運行時，不要執行會寫入同一個 `.next` 的普通 `npm run build`。曾發生建置覆寫 dev 產物而讓前後台 CSS 暫時失效。驗證正式建置請使用：

```bash
npm run build:verify
```

該指令透過 `NEXT_DIST_DIR=.next-verify` 隔離輸出；`.next-verify/` 與 `tsconfig.tsbuildinfo` 不進版控。

## 測試

核心測試目前是可直接執行的 TypeScript 檔：

```bash
for test in tests/*.test.ts; do npx tsx "$test" || exit 1; done
npx tsc --noEmit --incremental false
npm run build:verify
```

重要測試責任：

- `designer-web-content.test.ts`：資料正規化與 fallback。
- `public-content-source.test.ts`：前台只使用 DB 設定讀取層。
- `public-section-anchors.test.ts`：前台 section id 與導覽。
- `page-management-editor.test.ts`：十個頁面管理區塊。
- `multi-page.test.ts`：slug 驗證、內容 key、多頁面 API 與後台列表/編輯器。
- `admin-navigation.test.ts`：單一後台入口、品牌與媒體庫移除。
- `auth-login.test.ts`：登入帳號相容處理。
- `cloudflare-media.test.ts`：R2/Stream helper。

功能或 bugfix 應先加入能失敗的測試，再實作修正。完成前執行完整測試、TypeScript、隔離建置與瀏覽器驗證。

## UI 修改規則

- 遵循 `STYLE.md`。
- 使用現有 Tailwind、Lucide 和 Sonner，不新增第二套設計系統。
- 不手畫已有對應的 icon。
- 不使用原生 `alert`、`confirm`、`prompt`。
- 不建立卡片內卡片。
- 修改後檢查桌機與 390 x 844 手機 viewport、水平溢出、CSS 回應和 console error。

## Git 與部署

- 目標遠端：`designer` -> `jason121380/designer_web`。
- 預設分支：`main`。
- 不要推送到舊專案的 `origin`，除非使用者明確要求。
- 提交前執行 `git diff --check` 與完整驗證。
- 不提交 `.env*`、資料庫備份、上傳素材、`.next*` 或 TypeScript build info。
- 正式部署前確認 Zeabur 環境變數、資料庫 migration、R2 CORS/公開網域與 Stream token。
