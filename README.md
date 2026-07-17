# Designer Web

以 Next.js 製作的一頁式設計師品牌網站。前台依 PostgreSQL 中的頁面設定呈現，後台有「頁面管理」「媒體庫」「用戶管理」（ADMIN）與「工程模式」（ADMIN）四個入口，圖片與影片一律上傳 Cloudflare R2。

## 目前功能

- 根網址 `/` 固定為維護頁（noindex、不對外呈現內容）；公開內容一律放在子頁面。
- 多頁面：可建立任意數量的設計師頁面（`/jason`、`/kimiko`…），每頁有自己的品牌、內容、主色與 SEO。
- 每個設計師頁面有兩個對外頁：`/{slug}/web`（一頁式網站）與 `/{slug}/links`（linktree 風格個人連結頁）；根網址 `/{slug}` 自動導向 `/{slug}/web`。後台兩頁都能編輯。
- 新增頁面採右上角按鈕 + 彈窗（設計師名稱 + 網址後綴）；列表每列有「一頁式網站」「個人連結」兩組編輯＋預覽按鈕，其餘（編輯後綴/複製/停用）收在「更多」下拉。
- 改頁面後綴會自動 **308 永久轉址**舊網址到新後綴（保住 Google Ads 到達頁與 SEO 權重）。
- 子頁面以「停用／啟用」切換取代刪除：停用後前台該網址回 404、不進 sitemap。
- 每頁獨立 SEO：標題、描述與社群分享圖（og:image），未填時自動用品牌與主標題；另有 **AI 自動填寫**（Google Gemini）。
- 頁面編輯器為左選單＋右畫面雙欄版面，分「基本設定」與「內容區塊」兩組。
- 首屏 Banner：固定一張圖片＋一支影片（前台電腦左右、手機上下、皆 1:1、左右滿版），可自訂主標題文字、文字顏色與底色。
- 選單列（Header）：可設底色與文字顏色、左上標題文字，手機有漢堡選單；各內容區塊可自訂排序（拖曳）、中英標題與底色。
- 內容區塊：活動 DM、接髮介紹、特色項目、作品影片、分期資訊、價目表、環境介紹、聯絡資訊；DM／特色項目／環境／作品影片皆為卡片式（1:1／9:16），項目可上下排序。
- 作品影片可分類：後台「管理分類」彈窗（新增/改名/刪除，已套用不可刪），前台以分類標籤切換、手機可左右滑動。
- 聯絡資訊：前台聯絡列置中橫排；可設定右下角**懸浮泡泡**（勾選 LINE／Facebook／Instagram／Google 地圖）。
- 連結頁（linktree 風格）：頭像可放圖片或影片、簡介、連結按鈕、QR 按鈕；社群與一頁式「聯絡資訊」各自獨立設定。
- 媒體：圖片與影片一律上傳 Cloudflare R2；上傳區點擊先跳彈窗（本機上傳／從媒體庫選取），拖拽可直接上傳。圖片自動轉 WebP、限寬 1600px；影片 presigned 直傳、前台自動播放靜音、進場才載入、播放失敗顯示連結。
- 媒體庫（`/admin/media`）：列出所有已上傳圖片/影片、複製網址、刪除（連 R2 檔案）、顯示已使用空間與每筆被引用位置；影片縮圖滑到才載入、分批顯示。
- 用戶管理（`/admin/users`，僅 ADMIN）：列出登入帳號、新增帳號、編輯（帳號/名稱/密碼）。
- 工程模式（`/admin/tools`，僅 ADMIN）：回填媒體庫（補舊影片與檔案大小）、上傳網站圖示（favicon + App icon 共用一張）。
- Auth.js Credentials + JWT 保護後台與寫入 API。
- 舊 CMS 程式碼已於 2026-07 移除；舊資料表（articles、article_tags、categories、tags、page_views）已由 migration `20260715000000_drop_legacy_cms` 移除，資料庫僅保留 `users`、`media`、`site_settings`。

## 架構

```mermaid
flowchart LR
  Visitor[前台訪客] --> Next[Next.js 前台]
  Admin[管理員] --> AdminUI[頁面管理後台]
  AdminUI --> API[/api/designer-web]
  Next --> Settings[頁面設定讀取層]
  API --> DB[(Zeabur PostgreSQL)]
  Settings --> DB
  AdminUI --> Upload[/api/upload]
  Upload --> R2[Cloudflare R2]
  AdminUI --> Stream[Cloudflare Stream URL]
  R2 --> Next
  Stream --> Next
```

頁面內容儲存在 `site_settings` 資料表，key 為 `designer_web_content`，value 是經 Zod 正規化後的 JSON。若資料庫未設定、查詢失敗或內容損壞，前台會使用 `lib/designer-web-content.ts` 的示範內容。

## 技術

- Next.js 15 App Router、React 19、TypeScript
- Tailwind CSS 3、Lucide Icons、Sonner
- Prisma 5、PostgreSQL
- Auth.js / NextAuth v5
- Cloudflare R2（圖片與影片；影片 presigned 直傳），Cloudflare Stream 為可選方案
- Sharp（圖片縮放與 WebP 轉換）
- Google Gemini（選填，SEO AI 自動填寫）

## 本機開發

需求：Node.js 20 以上、npm、可連線的 PostgreSQL。

```bash
npm install
cp .env.example .env.local
npx prisma generate
npm run db:push
npm run db:seed   # 建立管理員帳號（預設 admin / admin123456，可用 SEED_ADMIN_* 覆寫）
npm run dev
```

- 前台：<http://localhost:3000>
- 後台：<http://localhost:3000/admin/page-management>
- 登入頁：<http://localhost:3000/admin/login>

不要把實際密碼、資料庫連線字串或 Cloudflare 金鑰提交到 Git。

## 必要環境變數

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"
```

Cloudflare R2 圖片儲存：

```dotenv
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET=""
CLOUDFLARE_R2_PUBLIC_URL="https://media.example.com"
```

Cloudflare Stream（可選）：

```dotenv
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_STREAM_API_TOKEN=""
```

SEO AI 自動填寫（選填，未設定時該 API 回 503）：

```dotenv
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.1-flash-lite"
```

R2 必須五個變數全部存在才會啟用（圖片與影片都走 R2）。正式環境的 `NEXTAUTH_URL` 與 `SITE_URL` 應改成同一個 HTTPS 網域。

## 常用指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | Prisma generate 後正式建置 |
| `npm run build:verify` | 使用 `.next-verify` 隔離建置，不覆寫開發中的 `.next` |
| `npm run start` | 啟動正式建置 |
| `npm run db:push` | 將 Prisma schema 同步到資料庫 |
| `npm run db:migrate` | 套用正式 migration |
| `npm run db:seed` | 建立（或保留）管理員帳號 |
| `npm run db:studio` | 開啟 Prisma Studio |

專案目前以獨立 TypeScript 測試檔驗證核心合約：

```bash
for test in tests/*.test.ts; do npx tsx "$test" || exit 1; done
npx tsc --noEmit --incremental false
npm run build:verify
```

## 主要檔案

| 路徑 | 責任 |
|---|---|
| `components/public/OnePage.tsx` | 一頁式前台輸出（`/{slug}/web`） |
| `components/public/LinksPage.tsx` | linktree 風格連結頁（`/{slug}/links`） |
| `components/public/WorksGallery.tsx` | 作品影片分類標籤＋手機左右滑動 |
| `components/public/PublicVideo.tsx` | 前台影片（進場才播、失敗顯示連結） |
| `components/public/MediaView.tsx` | 依網址渲染圖片或影片 |
| `components/public/FloatingBubble.tsx` | 前台右下角聯絡懸浮泡泡 |
| `components/admin/LinksManagementForm.tsx` | 連結頁編輯器（頭像/簡介/連結/社群） |
| `app/(public)/page.tsx` | 首頁（`/`），固定渲染維護頁 |
| `app/(public)/[slug]/{page,web,links}.tsx` | 子頁面根導向、一頁式、連結頁（含 308 轉址） |
| `app/admin/page-management/page.tsx` | 後台頁面列表 |
| `components/admin/PageList.tsx` | 頁面列表 UI、新增/複製/後綴彈窗、更多下拉 |
| `components/admin/PageManagementForm.tsx` | 一頁式雙欄編輯器 |
| `components/admin/VideoCategoryModal.tsx` | 作品影片分類管理彈窗 |
| `components/admin/{ImageUpload,VideoUpload,MediaUpload}.tsx` | 上傳元件（點擊跳媒體庫/本機彈窗） |
| `components/admin/MediaPickerModal.tsx` | 從媒體庫選取彈窗 |
| `components/admin/ColorSelect.tsx` | 顏色下拉選擇器 |
| `app/admin/media/page.tsx` · `components/admin/MediaLibrary.tsx` | 媒體庫（列出/複製/刪除/空間/引用） |
| `app/admin/tools/page.tsx` · `components/admin/EngineeringTools.tsx` | 工程模式（回填、網站圖示） |
| `app/admin/users/page.tsx` · `components/admin/UserList.tsx` | 用戶管理（僅 ADMIN） |
| `lib/designer-web-content.ts` | 資料合約、預設內容、正規化與 slug 驗證 |
| `lib/designer-web-settings.ts` | PostgreSQL 設定讀取、頁面列表與 fallback |
| `lib/slug-redirects.ts` | 改後綴的舊→新網址轉址對照 |
| `lib/media.ts` · `lib/media-usage.ts` · `lib/site-icon.ts` | 影片網址判斷、媒體引用收集、網站圖示 |
| `app/api/designer-web/[slug]/route.ts` | 子頁面 API（GET/POST/PUT/PATCH/DELETE） |
| `app/api/upload/route.ts` · `app/api/upload/video-url/route.ts` | 圖片處理上傳、影片 presigned |
| `app/api/media/*` · `app/api/seo/generate` · `app/api/site-icon` | 媒體庫/回填、SEO AI、網站圖示 API |
| `lib/cloudflare-media.ts` | R2 與 Stream API helper（含刪除） |
| `middleware.ts` | 後台登入保護與舊路由導向 |

## 文件

- `STYLE.md`：目前前後台的視覺與元件規範。
- `CLAUDE.md`：給程式代理與維護者的操作限制、測試流程和來源真相。
- `memory.md`：目前狀態、架構決策、已知限制與後續工作。
- `docs/superpowers/specs/2026-07-16-page-management-admin-design.md`：本次後台重整設計規格。
- `docs/superpowers/plans/2026-07-16-page-management-admin.md`：實作計畫與驗證範圍。
