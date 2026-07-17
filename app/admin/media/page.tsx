import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MediaLibrary, { type MediaItem } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  // 媒體庫供編輯與管理員使用；未登入或角色不符導回頁面管理。
  if (user?.role !== "ADMIN" && user?.role !== "EDITOR") redirect("/admin/page-management");

  const rows = await prisma.media.findMany({
    select: { id: true, url: true, mimeType: true, originalName: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const media: MediaItem[] = rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));

  return <MediaLibrary initialMedia={media} />;
}
