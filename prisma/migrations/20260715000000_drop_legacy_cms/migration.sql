-- 移除舊 CMS 資料表（articles / article_tags / categories / tags / page_views）。
-- 這些資料表對應的程式碼已於 2026-07 全數移除，且現行程式與測試零引用。
-- 保留 users / media / site_settings（登入、上傳紀錄與頁面設定仍在使用）。
--
-- 先移除外鍵約束再 DROP TABLE，順序與相依關係無關、可安全重跑。

-- DropForeignKey
ALTER TABLE "article_tags" DROP CONSTRAINT IF EXISTS "article_tags_articleId_fkey";
ALTER TABLE "article_tags" DROP CONSTRAINT IF EXISTS "article_tags_tagId_fkey";
ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_authorId_fkey";
ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_categoryId_fkey";

-- DropTable
DROP TABLE IF EXISTS "article_tags";
DROP TABLE IF EXISTS "articles";
DROP TABLE IF EXISTS "categories";
DROP TABLE IF EXISTS "tags";
DROP TABLE IF EXISTS "page_views";

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK 計畫（Prisma 不會自動執行；如需還原，於資料庫手動執行以下 DDL，
-- 再從版控取回舊 schema 與 migration。注意：DROP 後原本的資料列無法復原，
-- 還原僅重建空的資料表結構。）
--
-- CREATE TABLE "categories" (
--     "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
--     "description" TEXT, "coverImage" TEXT, "color" TEXT DEFAULT '#C9A84C',
--     "sortOrder" INTEGER NOT NULL DEFAULT 0,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP(3) NOT NULL,
--     CONSTRAINT "categories_pkey" PRIMARY KEY ("id"));
-- CREATE TABLE "tags" (
--     "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT "tags_pkey" PRIMARY KEY ("id"));
-- CREATE TABLE "articles" (
--     "id" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL,
--     "excerpt" TEXT, "content" TEXT NOT NULL, "featuredImage" TEXT,
--     "featuredImageAlt" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT',
--     "featured" BOOLEAN NOT NULL DEFAULT false, "viewCount" INTEGER NOT NULL DEFAULT 0,
--     "publishedAt" TIMESTAMP(3), "metaTitle" TEXT, "metaDescription" TEXT,
--     "authorId" TEXT NOT NULL, "categoryId" TEXT,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP(3) NOT NULL,
--     CONSTRAINT "articles_pkey" PRIMARY KEY ("id"));
-- CREATE TABLE "article_tags" (
--     "articleId" TEXT NOT NULL, "tagId" TEXT NOT NULL,
--     CONSTRAINT "article_tags_pkey" PRIMARY KEY ("articleId","tagId"));
-- CREATE TABLE "page_views" (
--     "id" TEXT NOT NULL, "path" TEXT NOT NULL, "articleId" TEXT, "referrer" TEXT,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT "page_views_pkey" PRIMARY KEY ("id"));
-- CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
-- CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
-- CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
-- CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
-- CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
-- CREATE INDEX "articles_slug_idx" ON "articles"("slug");
-- CREATE INDEX "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt");
-- CREATE INDEX "articles_categoryId_idx" ON "articles"("categoryId");
-- CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");
-- CREATE INDEX "page_views_path_idx" ON "page_views"("path");
-- ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "articles" ADD CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
