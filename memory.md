# memory.md

跨 session 的工作記憶:目前狀態與待辦。新 session 先讀這份 + `CLAUDE.md`。

## 目前狀態（2026-06，搬伺服器後）

- 已**搬到新的 Zeabur 服務**(新 = `mifaso`,舊 = `mifaso1.zeabur.app` 暫時保留當備份)。
  新服務的 Volume(id `data`)已掛在 `/src/public/uploads`(正確);`zeabur.yaml` 也已修正
  (原本誤掛 `/app/...`)。
- 資料庫:Zeabur PostgreSQL,88 篇文章 + 分類 + 標籤;`page_views` 流量表。
- 圖片:搬家後新 Volume 是空的 → 用 `/api/copy-uploads` 從舊站 `mifaso1` 救回 **405 張**;
  再用 `/api/optimize-images` 全部縮 1600px + 轉 webp(**403 張**),DB 已改指向新 `.webp`,
  原 jpg/png 仍保留在 Volume 可回退。由 `app/uploads/[...path]/route.ts` 串流服務。
- 新上傳的圖片會在 `/api/upload` 自動縮 1600px + 轉 webp(jpeg/png;gif/avif/webp 原樣)。
- 後台 NextAuth 可登入;`NEXTAUTH_URL`/`SITE_URL` = `https://mifaso.co`。
- 本輪(搬家修復 + 全站效能)所有修正**已合併進 `main`**並部署。`MAINT_TOOLS` 已移除。

## 進行中 / 待辦

1. **(可選)Cloudflare 快取**:加 Cache Rule `URI Path starts with /uploads/` → Eligible for cache、
   Edge TTL Respect origin(圖片回應已帶 `immutable max-age=30天`)。讓 `/uploads` 暖起來後全球都快。
2. **舊站下線**:圖片確認 OK 後 `mifaso1` 可下線;建議先留幾天當備份再砍。
3. **(可選)清原圖**:webp 轉好後 Volume 上的原 jpg/png 仍佔空間,確定都正常後可清掉省空間。
4. **rotate DB 密碼**:Zeabur PostgreSQL 密碼曾外流。步驟見 `DEPLOY.md`「資料庫密碼輪替」。
5. **(選用)Search Console**:設 `GOOGLE_SITE_VERIFICATION` 後重新部署,送出 sitemap。
6. **已知無解破圖**:`/uploads/2024/11/首頁精選圖-2.jpg`、`/uploads/2025/03/截圖-2025-03-06-下午3.04.52.jpg`
   舊站本來就 404(搬家前就壞);另 1 張內文圖 hotlink 自 `www.mlgroup.io`(已刪)。皆可接受。

## 已完成的關鍵修正（歷史,避免重蹈覆轍）

- 首頁 500 根因:缺 `migration_lock.toml` + `binaryTargets` 為 musl + Zeabur 沒設
  `DATABASE_URL`(`Digest 2606544078` 即此)。皆已修。
- OOM 502:`images.unoptimized: true`。
- 後台側欄消失:NextAuth 需 `trustHost: true` + 一致網域登入。
- 圖片 404 根因:cwd=`/src` 非 `/app`、Volume 掛錯路徑、且 Next 不服務 runtime
  寫入的 public 檔 → 新增 `app/uploads/[...path]/route.ts` 串流路由 + Volume
  改掛 `/src/public/uploads`。
- 編輯器:新增 `components/admin/tiptap-nodes.ts`(InstagramEmbed / TableOfContents
  正規節點)、`components/public/InstagramEmbed.tsx`(載入後 + 換頁重跑 IG embed)、
  `lib/article-html.ts`(前台自動產生目錄 + 標題錨點)。上線後需於正式站抽驗。

### 本輪（資安 / debug / SEO / 流量分析 / UI）

- **資安**:`sanitize-html` 消毒文章(防 stored-XSS)、`/api/ai` 加登入驗證、
  `next.config.ts` 安全標頭、維運路由改 `MAINT_TOOLS` gate、登入 `callbackUrl`
  防 open-redirect、JSON-LD 跳脫、`metadataBase` https。移除未用 `@anthropic-ai/sdk`。
- **debug**:登入後側欄需重整才出現 → 改全頁導向修正;自訂響應式 404;前台 `.prose`
  手機 RWD(表格/圖/WP 對齊/目錄);media PATCH 限 ADMIN/EDITOR。
- **SEO**:`lib/seo.ts`(JSON-LD/canonical)、Org+WebSite+Article+Breadcrumb、
  RSS `/feed.xml`、sitemap/robots 用 https `SITE_URL`、分類標題重複後綴 bug 修正。
- **流量分析**:`PageView` + migration `20260517000000_page_views` + `/api/track`
  + `Tracker` + `/admin/analytics` + 側欄。
- **UI**:header 搜尋移右、去上方細條、配色對齊 footer(rose-brand)、logo 全黑、
  黑 favicon/app icon、手機 hero 4:5、後台主題色、側欄 active 白 icon、媒體庫
  載入更多、精選排序最前、後台日期改 publishedAt、footer 移除「編輯後台」。

### 2026-06（本次:搬伺服器修復 + 全站效能）

- **搬家破圖根因**:新 Zeabur 服務 = 全新空 Volume,舊站圖檔沒跟過來(DB 路徑已在地化成
  本地 `/uploads/...`,`localize-images` 無外部 URL 可抓 → 救不了)。新增 `/api/copy-uploads`
  從舊站 `mifaso1` 公開的 `/uploads` 串流路由把 405 張抓回新 Volume。
- **首載慢根因**:`images.unoptimized:true`(小機器 sharp 即時壓會 OOM)→ 吐 2560px 原圖。
  新增 `/api/optimize-images`(離線批次、循序、不 OOM)把舊圖縮 1600 + 轉 webp(403 張);
  `/api/upload` 也改成上傳即縮+轉 webp。
- **後台/前台慢根因**:列表/格狀查詢用 `include` 連整篇 `content`(數十 KB)+ tags 都撈。
  新增 `lib/article-select.ts` 共用精簡 select,套用到 `/api/articles`、首頁、分類、搜尋、
  相關文章、後台總覽。分析頁 14 條 COUNT 併成 1 條 GROUP BY;`/api/admin/stats` 目錄掃描加 60s 快取。
- `zeabur.yaml` Volume 由誤掛 `/app/public/uploads` 改回 `/src/public/uploads`。

## 帳號

- 正式:`admin`(M編,ADMIN)、`jason`(AUTHOR)— 密碼為原站匯出值。
- demo seed:`admin@mifaso.com` / `admin123456`(僅 `npm run db:seed:demo`)。

> 不要把任何密碼、`AUTH_SECRET`、`DATABASE_URL` 值寫進此檔或任何 commit。
