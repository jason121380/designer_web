# Designer Web

以 Next.js 製作的一頁式設計師品牌網站。前台依 PostgreSQL 中的頁面設定呈現，後台以「頁面管理」為主、另有僅 ADMIN 可用的「用戶管理」，圖片可直接上傳到 Cloudflare R2，影片使用 Cloudflare Stream 播放網址。

## 目前功能

- 根網址 `/` 固定為維護頁（noindex、不對外呈現內容）；公開內容一律放在子頁面。
- 多頁面：首頁（`/`）之外可建立任意數量的獨立頁面（`/jason`、`/kimiko`…），每頁有自己的品牌、內容、主色與 SEO。
- 新增頁面採右上角按鈕 + 彈窗，輸入「設計師名稱」與「網址後綴」即建立。
- 子頁面以「停用／啟用」切換取代刪除：停用後前台該網址回 404、不進 sitemap，內容保留可隨時再啟用。
- 每頁獨立 SEO 設定：標題、描述與社群分享圖（og:image），未填時自動使用品牌與主標題；適合對各分頁投放 Google Ads。
- 後台入口：「頁面管理」`/admin/page-management`（頁面列表 → 各頁獨立編輯器）與「用戶管理」`/admin/users`（僅 ADMIN，列出登入帳號並可重設密碼）。
- 可編輯品牌、首屏、活動 DM、接髮介紹、其他服務、作品影片、分期、價目表、環境與聯絡資訊。
- 圖片上傳時驗證格式與大小；JPEG/PNG 會縮至最多 1600px 並轉為 WebP。
- 設定 Cloudflare R2 後圖片存入 R2；未設定時才退回本機 `public/uploads`。
- PostgreSQL 儲存登入使用者、媒體資料與完整頁面 JSON。
- Auth.js Credentials + JWT 保護後台與寫入 API。
- 首頁 SEO 標題與描述跟隨後台的品牌名稱、標語與主標題設定。
- 舊 CMS 程式碼（文章、分類、標籤、媒體庫、流量分析、用戶、工程工具與 AI 產文）已移除；舊後台網址仍會導向頁面管理。舊資料表（articles、article_tags、categories、tags、page_views）已由 migration `20260715000000_drop_legacy_cms` 移除，資料庫僅保留 `users`、`media`、`site_settings`。

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
- Cloudflare R2（圖片）、Cloudflare Stream（影片）
- Sharp（圖片縮放與 WebP 轉換）

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

Cloudflare Stream：

```dotenv
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_STREAM_API_TOKEN=""
```

R2 必須五個變數全部存在才會啟用。正式環境的 `NEXTAUTH_URL` 與 `SITE_URL` 應改成同一個 HTTPS 網域。

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
| `components/public/OnePage.tsx` | 一頁式前台輸出（首頁與子頁面共用） |
| `components/public/MaintenancePage.tsx` | 根網址 `/` 的固定維護頁 |
| `app/(public)/page.tsx` | 首頁（`/`），固定渲染維護頁 |
| `app/(public)/[slug]/page.tsx` | 子頁面（`/jason` 等） |
| `app/admin/page-management/page.tsx` | 後台頁面列表 |
| `app/admin/page-management/[slug]/page.tsx` | 各頁面獨立編輯器（首頁為 `home`） |
| `components/admin/PageList.tsx` | 頁面列表 UI 與新增頁面彈窗 |
| `components/admin/PageManagementForm.tsx` | 完整頁面設定表單 |
| `app/admin/users/page.tsx` | 用戶管理頁（僅 ADMIN） |
| `components/admin/UserList.tsx` | 帳號表格與變更密碼彈窗 |
| `app/api/users/[id]/route.ts` | 重設密碼 API（僅 ADMIN，PATCH） |
| `lib/designer-web-content.ts` | 資料合約、預設內容、正規化與 slug 驗證 |
| `lib/designer-web-settings.ts` | PostgreSQL 設定讀取、頁面列表、首頁維護頁判斷與 fallback |
| `app/api/designer-web/route.ts` | 首頁設定 GET/PUT/PATCH API |
| `app/api/designer-web/[slug]/route.ts` | 子頁面 GET/POST/PUT/DELETE API |
| `app/api/upload/route.ts` | 圖片處理、R2/本機儲存與媒體紀錄 |
| `lib/cloudflare-media.ts` | R2 與 Stream API helper |
| `middleware.ts` | 後台登入保護與舊路由導向 |

## 文件

- `STYLE.md`：目前前後台的視覺與元件規範。
- `CLAUDE.md`：給程式代理與維護者的操作限制、測試流程和來源真相。
- `memory.md`：目前狀態、架構決策、已知限制與後續工作。
- `docs/superpowers/specs/2026-07-16-page-management-admin-design.md`：本次後台重整設計規格。
- `docs/superpowers/plans/2026-07-16-page-management-admin.md`：實作計畫與驗證範圍。
