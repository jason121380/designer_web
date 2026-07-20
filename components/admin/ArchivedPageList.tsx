"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Pencil } from "lucide-react";
import { toast } from "sonner";

export interface ArchivedItem {
  slug: string;
  brandName: string;
  active: boolean;
}

export default function ArchivedPageList({ pages }: { pages: ArchivedItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function restore(slug: string) {
    setBusy(slug);
    try {
      const response = await fetch(`/api/designer-web/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "還原失敗");
      toast.success(`已還原 /${slug}，回到頁面管理列表`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "還原失敗");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">封存</h1>
        <p className="mt-1 text-sm text-gray-400">已封存的頁面不會出現在頁面管理列表，前台網址也會顯示 404（內容仍保留）。僅管理員可見，可隨時還原。</p>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg">
        {pages.map((page) => (
          <div key={page.slug} className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{page.brandName}</p>
              <p className="text-xs text-gray-400">/{page.slug}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Link href={`/admin/page-management/${page.slug}`} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"><Pencil size={13} />編輯</Link>
              <button type="button" disabled={busy === page.slug} onClick={() => restore(page.slug)} className="inline-flex items-center gap-1.5 bg-rose-brand rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><ArchiveRestore size={13} />{busy === page.slug ? "還原中" : "還原"}</button>
            </div>
          </div>
        ))}

        {!pages.length && (
          <p className="px-5 py-10 text-center text-sm text-gray-400">目前沒有封存的頁面。在頁面管理列表某頁的「更多 → 封存」即可封存。</p>
        )}
      </div>
    </div>
  );
}
