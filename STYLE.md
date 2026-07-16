# STYLE.md

Designer Web 前台與後台的現行設計規範。修改 UI 前先比對實際元件、`tailwind.config.ts` 與 `app/globals.css`；本檔描述目前應維持的視覺語言，不再沿用舊內容媒體網站版型。

## 設計方向

- 前台：服務品牌的一頁式展示，安靜、清楚、以內容與素材為主。
- 後台：工作導向的單頁內容編輯器，資訊密度適中，優先考慮掃描與重複操作。
- 品牌名稱使用純文字，不依賴舊 Logo。
- 桌機與手機不可產生水平溢出、文字重疊或固定尺寸破版。
- 不增加裝飾性漸層、光球、巢狀卡片或行銷式功能說明。

## Token

### 動態前台品牌色

前台由 PostgreSQL 的 `brand.themeColor` 寫入 CSS 變數 `--brand`。目前示範值為 `#d9bf77`，用於：

- Footer 背景。
- 分期區標題背景。
- 聯絡資訊 icon。
- 英文區塊副標題。

新增前台品牌色用途時使用 `var(--brand)`，不要把示範色硬編碼到元件。

### 固定介面色

| Token | 值 | 用途 |
|---|---|---|
| `rose-brand` | `#C4837A` | 後台主要按鈕、選單 active、focus |
| `rose-light` | `#EDD5D2` | 後台 focus ring |
| `rose-dark` | `#A3635B` | 後台主要按鈕 hover |
| `--cream-1` | `#fdf7f0` | 作品與分期區背景 |
| `--cream-2` | `#fff8e8` | DM、價目與聯絡區背景 |
| `--cream-3` | `#f9f7f3` | 服務與環境區背景 |
| `neutral-*` / `gray-*` | Tailwind 預設 | 文字、邊框、工作介面底色 |

## 字體

- 全站使用 `Noto Sans TC`，由 `app/layout.tsx` 的 `next/font` 注入 `--font-sans`。
- `body` 使用 `font-sans`，字距維持預設值。
- 區塊內標題保持緊湊：前台 H2 為 `text-2xl md:text-3xl`，後台頁標題為 `text-2xl`。
- 不使用隨 viewport 寬度連續縮放的字級。
- 英文小標可使用 `.subheading`，但不要在按鈕或表單標籤全面套用大字距。

## 前台

### 頁面順序

1. Sticky Header
2. 首屏形象 `#top`
3. 活動 DM `#dm`，沒有素材時隱藏
4. 接髮介紹 `#services`
5. 其他服務 `#other-services`
6. 作品影片 `#hair-video`，沒有素材時隱藏
7. 分期資訊 `#pay`
8. 價目表 `#pricing`
9. 環境介紹 `#ev`，沒有素材時隱藏
10. 聯絡資訊 `#contact`
11. Footer

導覽連結必須跟隨實際可見區塊；可選區塊沒有資料時，不顯示對應導覽。

### Header

- `sticky top-0 z-50`，高 `h-14`。
- 深色半透明背景 `bg-neutral-900/95`，搭配輕微 backdrop blur。
- 左側是資料庫中的品牌名稱；桌機右側顯示錨點導覽。
- 手機目前只顯示品牌名稱，不把桌機選單硬塞進小寬度。

### 首屏

- 深色背景，素材最大寬度 `max-w-6xl`。
- 圖片或影片固定 `aspect-video`、`object-cover`。
- 沒有素材時直接顯示主標題，不保留空白媒體框。
- 主標題支援換行，使用 `whitespace-pre-line`。

### 內容區塊

- 外層垂直間距 `py-14 md:py-20`。
- 內容容器依區塊使用 `max-w-3xl`、`max-w-5xl` 或 `max-w-6xl`，水平 padding 為 `px-4`。
- 卡片使用白底與清楚的邊線分隔，**不使用陰影**（全站已移除 shadow）。
- 全站卡片、按鈕、輸入框、彈窗與表格容器統一使用小圓角 `rounded-lg`（對齊側欄選單），不使用大型圓角。
- 服務圖片使用穩定比例或最小高度，沒有圖片時文字欄自然吃滿。
- 圖片 `alt` 優先使用後台圖片說明，其次使用服務名稱或合理 fallback。
- 影片作品維持 `aspect-[9/16]`，原生 controls、`playsInline`、`preload="metadata"`。

### 響應式

- 主要 breakpoint 沿用 Tailwind `sm`、`md`、`lg`。
- 390px 寬度必須滿足 `scrollWidth === clientWidth`。
- Grid 在手機為單欄，服務、價目與聯絡內容只在足夠寬度後展開多欄。
- 長主標題與 URL 欄位不能撐破容器。

## 後台

### 外殼

- `AdminShell` 使用 `bg-gray-50`。
- Sidebar 固定寬 `w-64`，桌機可收合，手機預設移出畫面。
- Header 高 `h-14`、白底、底線，sticky 於頂部。
- 內容區 `p-4 md:p-8`，主要表單最大寬 `max-w-5xl`。

### 導覽

- 側欄只允許兩個入口：「頁面管理」與「用戶管理」（用戶管理僅 ADMIN 顯示）。
- Active 使用 `bg-rose-brand text-white`。
- 側欄頂端顯示「MLG 設計師一頁式網站後台」純文字，只保留手機關閉 icon（不放外連預覽 icon）。
- 不重新加入總覽、文章、分類、標籤、媒體庫、流量分析或工程工具；用戶管理僅限「列出帳號＋改密碼」，不擴充成新增/刪除或角色管理。

### 頁面管理

- 入口 `/admin/page-management` 是頁面列表：首頁固定第一列不可刪除，子頁面可刪除（兩段式確認按鈕，不用原生 confirm）。
- 新增頁面採右上角按鈕 + 彈窗（modal）：輸入「設計師名稱」與「網址後綴」，Esc／點背景／取消可關閉，開啟時鎖背景捲動；不用原生 `prompt`。
- 用戶管理 `/admin/users`（僅 ADMIN）：以 `<table>` 呈現帳號（登入帳號／名稱／角色），每列「變更密碼」開彈窗，輸入並確認新密碼後送出。
- 每個頁面在 `/admin/page-management/{slug}` 有獨立編輯器（首頁為 `home`），編輯器規範如下。
- 區塊順序必須與前台一致。
- 使用原生 `<details>` 折疊區塊；第一個區塊預設展開。
- 整體是一個連續工作表面，以細邊線分隔，不在卡片內再放卡片。
- 頁首保留「預覽前台」與「儲存設定」兩個明確命令。
- 重複資料提供 Lucide `Plus` / `Trash2`；儲存與預覽使用 `Save` / `ExternalLink`。
- 刪除是立即從尚未儲存的表單狀態移除，按「儲存設定」後才寫入資料庫。

### 表單控制

```txt
輸入框   border-gray-200 bg-white px-3 py-2.5 text-sm
Focus    border-rose-brand ring-2 ring-rose-light
文字區   min-h-24 resize-y
主按鈕   bg-rose-brand text-white px-5 py-2.5 text-sm font-semibold
次按鈕   border-gray-200 bg-white text-gray-600
刪除     text-red-500，搭配 Trash2
區塊標題 text-base font-semibold text-gray-900
說明     text-sm text-gray-400
```

- 使用適合資料型態的控制：主色使用 color input、媒體類型使用 select。
- 圖片從區塊內直接點擊或拖放上傳，不顯示獨立媒體庫選取器。
- 影片目前填入 Cloudflare Stream 播放 URL，不假裝已有整合完成的影片上傳 UI。
- 成功與錯誤狀態使用 Sonner toast，不使用 `window.alert`。

## 圖示與可用性

- 優先使用現有 `lucide-react`，不要手畫 SVG。
- 純 icon 按鈕必須有 `aria-label` 或 `title`。
- 可點擊區域要有 hover/focus 狀態。
- 所有圖片、影片、表單與按鈕都要在桌機和手機檢查。

## UI 驗證

任何前後台視覺修改完成後至少驗證：

1. `http://localhost:3000/` 桌機版。
2. `http://localhost:3000/admin/page-management` 桌機版。
3. 390 x 844 手機 viewport 的前後台。
4. CSS 請求回應 200。
5. 瀏覽器 console 無 error。
6. 前台錨點只指向存在的區塊。
