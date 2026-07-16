"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Home, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { HOME_PAGE_SLUG, isValidPageSlug } from "@/lib/designer-web-content";

export interface PageListItem {
  slug: string;
  brandName: string;
}

const inputClass = "w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";

export default function PageList({
  homeBrandName,
  pages,
  homeDisplaySlug,
}: {
  homeBrandName: string;
  pages: PageListItem[];
  homeDisplaySlug: string | null;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingHomeDisplay, setSavingHomeDisplay] = useState(false);

  // 彈窗開啟時：Esc 關閉、鎖住背景捲動
  useEffect(() => {
    if (!showCreate) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeCreate(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showCreate]);

  function openCreate() {
    setNewName("");
    setNewSlug("");
    setShowCreate(true);
  }

  function closeCreate() {
    if (creating) return;
    setShowCreate(false);
  }

  async function changeHomeDisplay(slug: string) {
    setSavingHomeDisplay(true);
    try {
      const response = await fetch("/api/designer-web", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homePageSlug: slug || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "設定失敗");
      toast.success(slug ? `首頁改為顯示 /${slug}` : "首頁改回自己的內容");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "設定失敗");
    } finally {
      setSavingHomeDisplay(false);
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

  async function deletePage(slug: string) {
    setDeleting(true);
    try {
      const response = await fetch(`/api/designer-web/${slug}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "刪除失敗");
      toast.success(`已刪除頁面 /${slug}`);
      setConfirmingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  const rowClass = "flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between";

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">頁面管理</h1>
          <p className="mt-1 text-sm text-gray-400">每個頁面有獨立網址與內容，點「編輯」進入該頁的區塊設定。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-rose-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={15} />新增頁面
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        {/* 首頁固定第一列，不可刪除 */}
        <div className={rowClass}>
          <div className="flex min-w-0 items-center gap-3">
            <Home size={16} className="flex-shrink-0 text-gray-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {homeDisplaySlug ? `顯示 /${homeDisplaySlug} 的內容` : homeBrandName}
              </p>
              <p className="text-xs text-gray-400">/（首頁）</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              首頁顯示
              <select
                className="border border-gray-200 bg-white px-2 py-2 text-xs outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light"
                value={homeDisplaySlug ?? ""}
                disabled={savingHomeDisplay}
                onChange={(event) => changeHomeDisplay(event.target.value)}
              >
                <option value="">首頁自己的內容</option>
                {pages.map((page) => (
                  <option key={page.slug} value={page.slug}>/{page.slug}</option>
                ))}
              </select>
            </label>
            <a href="/" target="_blank" className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600" title="預覽前台"><ExternalLink size={13} />預覽</a>
            <Link href={`/admin/page-management/${HOME_PAGE_SLUG}`} className="inline-flex items-center gap-1.5 bg-rose-brand px-4 py-2 text-xs font-semibold text-white"><Pencil size={13} />編輯</Link>
          </div>
        </div>

        {pages.map((page) => (
          <div key={page.slug} className={rowClass}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{page.brandName}</p>
              <p className="text-xs text-gray-400">/{page.slug}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <a href={`/${page.slug}`} target="_blank" className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600" title="預覽前台"><ExternalLink size={13} />預覽</a>
              <Link href={`/admin/page-management/${page.slug}`} className="inline-flex items-center gap-1.5 bg-rose-brand px-4 py-2 text-xs font-semibold text-white"><Pencil size={13} />編輯</Link>
              {confirmingDelete === page.slug ? (
                <>
                  <button type="button" disabled={deleting} onClick={() => deletePage(page.slug)} className="inline-flex items-center gap-1.5 bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Trash2 size={13} />{deleting ? "刪除中" : "確認刪除"}</button>
                  <button type="button" onClick={() => setConfirmingDelete(null)} className="px-2 py-2 text-xs font-medium text-gray-500">取消</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmingDelete(page.slug)} aria-label={`刪除 /${page.slug}`} className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-red-500"><Trash2 size={13} />刪除</button>
              )}
            </div>
          </div>
        ))}

        {!pages.length && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">目前只有首頁。點右上角「新增頁面」建立設計師子頁。</p>
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
            className="w-full max-w-md border border-gray-200 bg-white p-6"
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
              <button type="button" onClick={closeCreate} disabled={creating} className="border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50">取消</button>
              <button type="button" onClick={createPage} disabled={creating} className="inline-flex items-center justify-center gap-2 bg-rose-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Plus size={15} />{creating ? "建立中" : "建立頁面"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
