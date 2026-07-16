# Designer Web — Zeabur 部署指南

## 環境需求

- Node.js 20+
- PostgreSQL（由 Zeabur 提供）

---

## 本機開發

```bash
# 1. 複製範例環境變數
cp .env.example .env.local

# 2. 編輯 .env.local，填入 DATABASE_URL 與 AUTH_SECRET
# AUTH_SECRET 產生方式：openssl rand -base64 32

# 3. 安裝依賴
npm install
npx prisma generate

# 4. 建立資料表
npm run db:push

# 5. 建立管理員帳號
npm run db:seed

# 6. 啟動開發伺服器
npm run dev
```

- 前台：<http://localhost:3000>
- 後台：<http://localhost:3000/admin/page-management>

**登入帳號：**`db:seed` 預設建立 `admin`（密碼 `admin123456`，對應 email `admin@mifaso.com`）。
正式環境請先設定 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` 再執行 seed；或登入後於後台「用戶管理」（側欄，僅 ADMIN）重設密碼。

---

## Zeabur 部署

1. 建立 PostgreSQL 服務，`DATABASE_URL` 由 Zeabur 注入（見 `zeabur.yaml`）。
2. 設定環境變數：
   - 必要：`AUTH_SECRET`、`NEXTAUTH_URL`、`SITE_URL`（後兩者使用同一個正式 HTTPS 網域）。
   - 圖片走 Cloudflare R2 時：`CLOUDFLARE_R2_ACCOUNT_ID`、`CLOUDFLARE_R2_ACCESS_KEY_ID`、`CLOUDFLARE_R2_SECRET_ACCESS_KEY`、`CLOUDFLARE_R2_BUCKET`、`CLOUDFLARE_R2_PUBLIC_URL`（五個都要設定才會啟用）。
   - 影片 direct upload API 需要：`CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_STREAM_API_TOKEN`。
3. 未設定 R2 時圖片寫入 Volume（掛載於 `/src/public/uploads`，見 `zeabur.yaml` 註解）。
4. 建置流程：`npm install` → `npx prisma generate` → `npx prisma migrate deploy` → `npm run build`。
5. 部署後 smoke test：登入、儲存頁面設定、圖片上傳、前台更新與 390px 手機版。

不要把真實密碼、連線字串或 Cloudflare 金鑰提交到 Git。
