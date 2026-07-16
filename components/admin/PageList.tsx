"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Link2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { isValidPageSlug } from "@/lib/designer-web-content";

export interface PageListItem {
  slug: string;
  brandName: string;
  active: boolean;
}

const inputClass = "w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";

export default function PageList({ pages }: { pages: PageListItem[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<PageListItem | null>(null);
  const [renameSlug, setRenameSlug] = useState("");
  const [renaming, setRenaming] = useState(false);

  const anyModalOpen = showCreate || !!renameTarget;

  // 彈窗開啟時：Esc 關閉、鎖住背景捲動
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { closeCreate(); closeRename(); } };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

  function openCreate() {
    setNewName("");
    setNewSlug("");
    setShowCreate(true);
  }

  function closeCreate() {
    if (creating) return;
    setShowCreate(false);
  }

  function openRename(page: PageListItem) {
    setRenameSlug(page.slug);
    setRenameTarget(page);
  }

  function closeRename() {
    if (renaming) return;
    setRenameTarget(null);
  }

  async function renamePage() {
    if (!renameTarget) return;
    const next = renameSlug.trim().toLowerCase();
    if (!isValidPageSlug(next)) {
      toast.error("後綴限小寫英數與連字號（1-50 字），且不可使用 home、admin 等保留字");
      return;
    }
    if (next === renameTarget.slug) { setRenameTarget(null); return; }
    setRenaming(true);
    try {
      const response = await fetch(`/api/designer-web/${renameTarget.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: next }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "變更失敗");
      toast.success(`後綴已改為 /${next}`);
      setRenameTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "變更失敗");
    } finally {
      setRenaming(false);
    }
  }

  async function createPage() {
    const slug = newSlug.trim().toLowerCase();
    if (!isValidPageSlug(slug)) {
      toast.error("後綴限小寫英數與連字號（1-50 字），且不可使用 home、admin 等保留字");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch(`/api/designer-web/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "建立失敗");
      toast.success(`已建立頁面 /${slug}`);
      setShowCreate(false);
      router.push(`/admin/page-management/${slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "建立失敗");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(slug: string, active: boolean) {
    setTogglingSlug(slug);
    try {
      const response = await fetch(`/api/designer-web/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "操作失敗");
      toast.success(active ? `已啟用 /${slug}` : `已停用 /${slug}（前台將顯示 404）`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失敗");
    } finally {
      setTogglingSlug(null);
    }
  }

  const rowClass = "flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between";

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">頁面管理</h1>
          <p className="mt-1 text-sm text-gray-400">每個設計師頁面有獨立網址與內容，點「編輯」進入該頁的區塊設定。首頁（/）固定為維護頁。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={15} />新增頁面
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white rounded-lg">
        {pages.map((page) => (
          <div key={page.slug} className={rowClass}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900">{page.brandName}</p>
                {!page.active && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">已停用</span>}
              </div>
              <p className="text-xs text-gray-400">/{page.slug}</p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <a href={`/${page.slug}`} target="_blank" className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs font-medium text-gray-600" title="預覽前台"><ExternalLink size={13} />預覽</a>
              <Link href={`/admin/page-management/${page.slug}`} className="inline-flex items-center gap-1.5 bg-rose-brand rounded-lg px-4 py-2 text-xs font-semibold text-white"><Pencil size={13} />編輯頁面</Link>
              <button type="button" onClick={() => openRename(page)} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs font-medium text-gray-600" title="變更網址後綴"><Link2 size={13} />編輯後綴</button>
              {page.active ? (
                <button type="button" disabled={togglingSlug === page.slug} onClick={() => toggleActive(page.slug, false)} aria-label={`停用 /${page.slug}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-red-500 disabled:opacity-50"><EyeOff size={13} />{togglingSlug === page.slug ? "處理中" : "停用"}</button>
              ) : (
                <button type="button" disabled={togglingSlug === page.slug} onClick={() => toggleActive(page.slug, true)} aria-label={`啟用 /${page.slug}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-emerald-600 disabled:opacity-50"><Eye size={13} />{togglingSlug === page.slug ? "處理中" : "啟用"}</button>
              )}
            </div>
          </div>
        ))}

        {!pages.length && (
          <p className="px-5 py-10 text-center text-sm text-gray-400">還沒有任何頁面。點右上角「新增頁面」建立第一個設計師頁面。</p>
        )}
      </div>

      {/* 新增頁面彈窗 */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeCreate}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="新增頁面"
            className="w-full max-w-md border border-gray-200 bg-white rounded-lg p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">新增頁面</h2>
                <p className="mt-1 text-sm text-gray-400">建立一個獨立網址的設計師頁面，以示範內容起始。</p>
              </div>
              <button type="button" onClick={closeCreate} aria-label="關閉" className="shrink-0 text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">設計師名稱</span>
                <input
                  className={inputClass}
                  value={newName}
                  placeholder="例如 Jason、Kimiko"
                  autoFocus
                  onChange={(event) => setNewName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">網址後綴</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/</span>
                  <input
                    className={inputClass}
                    value={newSlug}
                    placeholder="例如 jason、kimiko"
                    onChange={(event) => setNewSlug(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") createPage(); }}
                  />
                </div>
                <span className="mt-1.5 block text-xs text-gray-400">小寫英數與連字號，1-50 字；建立後可在編輯器再調整內容。</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeCreate} disabled={creating} className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50">取消</button>
              <button type="button" onClick={createPage} disabled={creating} className="inline-flex items-center justify-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Plus size={15} />{creating ? "建立中" : "建立頁面"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯後綴彈窗 */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeRename}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="編輯後綴"
            className="w-full max-w-md border border-gray-200 bg-white rounded-lg p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">編輯後綴</h2>
                <p className="mt-1 text-sm text-gray-400">變更此頁的網址後綴，內容不會變動。舊網址將失效（改為新網址）。</p>
              </div>
              <button type="button" onClick={closeRename} aria-label="關閉" className="shrink-0 text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">網址後綴</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/</span>
                <input
                  className={inputClass}
                  value={renameSlug}
                  autoFocus
                  placeholder="例如 jason、kimiko"
                  onChange={(event) => setRenameSlug(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") renamePage(); }}
                />
              </div>
              <span className="mt-1.5 block text-xs text-gray-400">小寫英數與連字號，1-50 字。</span>
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeRename} disabled={renaming} className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50">取消</button>
              <button type="button" onClick={renamePage} disabled={renaming} className="inline-flex items-center justify-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Link2 size={15} />{renaming ? "變更中" : "儲存後綴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
