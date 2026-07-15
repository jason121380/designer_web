# Page Management Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the article CMS admin with one page-management screen that controls every section of the KIMEKO-style one-page frontend.

**Architecture:** Keep `site_settings.key = designer_web_content` as the single PostgreSQL source of truth. Expand its validated JSON contract to match every frontend section, then make the public header, page, and footer consume only that contract. Reduce the authenticated admin shell to one route and redirect every obsolete admin route to it without deleting legacy database tables.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod, Prisma/PostgreSQL, NextAuth, Tailwind CSS, Cloudflare R2/Stream upload APIs.

## Global Constraints

- The only admin navigation item is `頁面管理`.
- Login, `/admin`, and obsolete admin routes resolve to `/admin/page-management`.
- Page sections follow the exact public order: brand/navigation, hero, DM, extension services, other services, videos, installment, pricing, environment, contact.
- Images and videos use Cloudflare or existing upload API URLs; empty media sections are hidden publicly.
- Remove visible `mifaso`, `迷髮所`, and the old logo from the active admin experience.
- Preserve legacy PostgreSQL tables and existing user authentication data.

---

### Task 1: Define the complete page-content contract

**Files:**
- Modify: `lib/designer-web-content.ts`
- Modify: `lib/frontend-demo.ts`
- Modify: `tests/designer-web-content.test.ts`
- Modify: `tests/frontend-demo.test.ts`

**Interfaces:**
- Consumes: existing `designer_web_content` JSON, including the current partial schema.
- Produces: `DesignerWebContent`, `defaultDesignerWebContent`, `normalizeDesignerWebContent(input)`, and `parseDesignerWebContent(value)` with required normalized arrays.

- [ ] **Step 1: Write failing normalization tests**

Add assertions for this contract:

```ts
const normalized = normalizeDesignerWebContent({
  brand: { name: " KIMEKO HAIR ", themeColor: " #d9bf77 " },
  hero: { heading: " 首屏 ", mediaUrl: " https://cdn/hero.mp4 ", mediaType: "video" },
  promos: [{ id: "dm-1", image: " https://cdn/dm.jpg ", caption: " DM " }],
  services: [{ id: "s-1", title: " 接髮 ", description: " 說明 ", features: [" 輕盈 "], suitableFor: [" 細軟髮 "] }],
  otherServices: [],
  videos: [{ id: "v-1", video: " https://cdn/work.mp4 " }],
  installment: [" 三期零利率 "],
  environment: [{ image: " https://cdn/salon.jpg ", alt: " 店內 " }],
});
assert.equal(normalized.brand.name, "KIMEKO HAIR");
assert.equal(normalized.hero.mediaType, "video");
assert.equal(normalized.services[0].features[0], "輕盈");
assert.equal(normalized.videos[0].video, "https://cdn/work.mp4");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx tests/designer-web-content.test.ts`

Expected: FAIL because the current schema has no `themeColor`, `mediaUrl`, `mediaType`, `promos`, `otherServices`, `videos`, or `installment` contract.

- [ ] **Step 3: Implement schemas and defaults**

Define required normalized item shapes:

```ts
type PageService = {
  id: string;
  title: string;
  description: string;
  features: string[];
  suitableFor: string[];
  image: string;
};

type PageMedia = { id: string; url: string; caption: string };
```

Move the KIMEKO demo values into `defaultDesignerWebContent`. Keep legacy fields accepted during normalization so the current database row loads without throwing; absent new fields fall back to KIMEKO defaults, while intentionally empty media arrays remain empty.

- [ ] **Step 4: Run contract tests and verify GREEN**

Run: `npx tsx tests/designer-web-content.test.ts && npx tsx tests/frontend-demo.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the contract**

```bash
git add lib/designer-web-content.ts lib/frontend-demo.ts tests/designer-web-content.test.ts tests/frontend-demo.test.ts
git commit -m "feat: define one-page content contract"
```

### Task 2: Make the public page consume PostgreSQL settings only

**Files:**
- Modify: `app/(public)/page.tsx`
- Modify: `components/public/Header.tsx`
- Modify: `components/public/Footer.tsx`
- Modify: `tests/public-section-anchors.test.ts`
- Create: `tests/public-content-source.test.ts`

**Interfaces:**
- Consumes: `getDesignerWebContent(): Promise<DesignerWebContent>`.
- Produces: public section anchors and conditional navigation generated from the normalized content.

- [ ] **Step 1: Write failing source-of-truth tests**

```ts
assert.doesNotMatch(pageSource, /frontendDemo/);
assert.match(pageSource, /managedContent\.services/);
assert.match(pageSource, /managedContent\.otherServices/);
assert.match(pageSource, /managedContent\.videos/);
assert.match(pageSource, /managedContent\.installment/);
for (const id of ["top", "services", "other-services", "pay", "pricing", "contact"]) {
  assert.match(pageSource, new RegExp(`id="${id}"`));
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx tests/public-content-source.test.ts`

Expected: FAIL because most sections still read `frontendDemo`.

- [ ] **Step 3: Replace static demo reads**

Use one fetch per server component:

```ts
const content = await getDesignerWebContent();
const hasDm = content.promos.length > 0;
const hasVideos = content.videos.length > 0;
const hasEnvironment = content.environment.length > 0;
```

Render every section from `content`. Build Header links from the same presence checks. Footer displays `content.brand.name` and no legacy powered-by copy.

- [ ] **Step 4: Run public tests and verify GREEN**

Run: `npx tsx tests/public-section-anchors.test.ts && npx tsx tests/public-content-source.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit public integration**

```bash
git add 'app/(public)/page.tsx' components/public/Header.tsx components/public/Footer.tsx tests/public-section-anchors.test.ts tests/public-content-source.test.ts
git commit -m "feat: render frontend from page settings"
```

### Task 3: Build the section-based page editor

**Files:**
- Create: `app/admin/page-management/page.tsx`
- Create: `components/admin/PageManagementForm.tsx`
- Create: `components/admin/PageSectionPanel.tsx`
- Modify: `components/admin/ImageUpload.tsx`
- Modify: `app/api/designer-web/route.ts`
- Create: `tests/page-management-editor.test.ts`

**Interfaces:**
- Consumes: `initialContent: DesignerWebContent`, `PUT /api/designer-web`, `POST /api/upload`.
- Produces: a single form with section panels and save/preview actions.

- [ ] **Step 1: Write failing editor coverage test**

```ts
const source = readFileSync("components/admin/PageManagementForm.tsx", "utf8");
for (const title of ["品牌與導覽", "首屏形象", "活動 DM", "接髮介紹", "其他服務", "作品影片", "分期資訊", "價目表", "環境介紹", "聯絡資訊"]) {
  assert.match(source, new RegExp(title));
}
assert.match(source, /\/api\/designer-web/);
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx tsx tests/page-management-editor.test.ts`

Expected: FAIL because `PageManagementForm.tsx` does not exist.

- [ ] **Step 3: Implement focused editor components**

`PageSectionPanel` owns title, optional description, and collapsible body. `PageManagementForm` owns one `DesignerWebContent` state, immutable array helpers, save state, and the ten panels. Use `ImageUpload` for images and URL inputs for Cloudflare Stream playback URLs. Each repeated item has add/remove controls.

The route remains a normalized upsert:

```ts
const content = normalizeDesignerWebContent(await req.json());
await prisma.siteSettings.upsert({
  where: { key: DESIGNER_WEB_SETTINGS_KEY },
  create: { key: DESIGNER_WEB_SETTINGS_KEY, value: JSON.stringify(content) },
  update: { value: JSON.stringify(content) },
});
```

- [ ] **Step 4: Run editor test and type check**

Run: `npx tsx tests/page-management-editor.test.ts && npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the editor**

```bash
git add app/admin/page-management/page.tsx components/admin/PageManagementForm.tsx components/admin/PageSectionPanel.tsx components/admin/ImageUpload.tsx app/api/designer-web/route.ts tests/page-management-editor.test.ts
git commit -m "feat: add section-based page management"
```

### Task 4: Reduce admin navigation and redirect obsolete routes

**Files:**
- Modify: `components/admin/Sidebar.tsx`
- Modify: `components/admin/AdminHeader.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/login/page.tsx`
- Modify: `middleware.ts`
- Modify: `app/admin/layout.tsx`
- Create: `tests/admin-navigation.test.ts`

**Interfaces:**
- Consumes: authenticated NextAuth session.
- Produces: `PAGE_MANAGEMENT_PATH = "/admin/page-management"` as the sole active admin destination.

- [ ] **Step 1: Write failing navigation tests**

```ts
assert.match(sidebarSource, /頁面管理/);
for (const removed of ["總覽", "文章管理", "分類管理", "標籤管理", "媒體庫", "流量分析", "用戶管理", "工程工具"]) {
  assert.doesNotMatch(sidebarSource, new RegExp(removed));
}
assert.match(loginSource, /\/admin\/page-management/);
assert.doesNotMatch(loginSource, /mifaso|迷髮所/i);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx tests/admin-navigation.test.ts`

Expected: FAIL against the current article CMS navigation and branding.

- [ ] **Step 3: Implement the single-destination admin shell**

Sidebar contains only:

```ts
const navItems = [{ href: "/admin/page-management", label: "頁面管理", icon: PanelsTopLeft }];
```

Replace the logo image with a `Designer Web` wordmark. Set login fallback and `/admin` redirect to `/admin/page-management`. Middleware redirects authenticated requests under these prefixes to the page manager:

```ts
const obsolete = ["dashboard", "designer-web", "articles", "categories", "tags", "media", "analytics", "users", "tools"];
if (obsolete.some((part) => nextUrl.pathname === `/admin/${part}` || nextUrl.pathname.startsWith(`/admin/${part}/`))) {
  return NextResponse.redirect(new URL("/admin/page-management", req.url));
}
```

- [ ] **Step 4: Run navigation/auth tests**

Run: `npx tsx tests/admin-navigation.test.ts && npx tsx tests/auth-login.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the admin shell**

```bash
git add components/admin/Sidebar.tsx components/admin/AdminHeader.tsx app/admin/page.tsx app/admin/login/page.tsx middleware.ts app/admin/layout.tsx tests/admin-navigation.test.ts
git commit -m "refactor: reduce admin to page management"
```

### Task 5: Verify migration, browser behavior, and production build

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Test: `tests/*.test.ts`

**Interfaces:**
- Consumes: local PostgreSQL settings and authenticated local browser session.
- Produces: verified local frontend and sole admin page without corrupting the running dev server.

- [ ] **Step 1: Protect dev assets during build verification**

Add a separate verification script that does not overwrite the running `.next` directory:

```json
"build:verify": "NEXT_DIST_DIR=.next-verify prisma generate && NEXT_DIST_DIR=.next-verify next build"
```

Update `next.config.ts` to use `distDir: process.env.NEXT_DIST_DIR || ".next"` and add `.next-verify/` to `.gitignore`.

- [ ] **Step 2: Run all focused tests**

Run:

```bash
npx tsx tests/designer-web-content.test.ts
npx tsx tests/frontend-demo.test.ts
npx tsx tests/public-section-anchors.test.ts
npx tsx tests/public-content-source.test.ts
npx tsx tests/page-management-editor.test.ts
npx tsx tests/admin-navigation.test.ts
npx tsx tests/auth-login.test.ts
npx tsx tests/cloudflare-media.test.ts
npx tsc --noEmit
```

Expected: every command exits 0.

- [ ] **Step 3: Run isolated production build**

Run: `npm run build:verify`

Expected: exit 0; the existing `next dev` process continues serving CSS from `.next`.

- [ ] **Step 4: Verify in the local browser**

Verify:

1. `/admin/login` contains no old logo or `mifaso` text.
2. Login lands on `/admin/page-management`.
3. Sidebar contains exactly one navigation link named `頁面管理`.
4. All ten editor sections are present.
5. Saving a harmless text change updates the public page, then restore the original text.
6. `/admin/dashboard` redirects to `/admin/page-management`.
7. Desktop and 390px mobile screenshots show no overlap or missing styles.

- [ ] **Step 5: Commit verification safeguards**

```bash
git add .gitignore package.json next.config.ts
git commit -m "chore: isolate production build verification"
```
