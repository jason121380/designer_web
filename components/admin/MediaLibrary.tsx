"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

export interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
  originalName: string;
  size: number;
  createdAt: string;
}

const isVideo = (item: MediaItem) => item.mimeType.startsWith("video/");

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibrary({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const shown = useMemo(() => {
    if (filter === "image") return media.filter((m) => !isVideo(m));
    if (filter === "video") return media.filter(isVideo);
    return media;
  }, [media, filter]);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("已複製網址");
    } catch {
      toast.error("複製失敗");
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "刪除失敗");
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast.success("已刪除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  const tab = (key: typeof filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${filter === key ? "bg-rose-brand text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">媒體庫</h1>
        <p className="mt-1 text-sm text-gray-400">所有已上傳的圖片與影片；共 {media.length} 筆。可複製網址或刪除。</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tab("all", "全部")}
        {tab("image", "圖片")}
        {tab("video", "影片")}
      </div>

      {shown.length === 0 ? (
        <p className="border border-dashed border-gray-200 rounded-lg px-5 py-16 text-center text-sm text-gray-400">目前沒有媒體。從各區塊上傳圖片或影片後，會自動出現在這裡。</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <div key={item.id} className="group relative overflow-hidden border border-gray-200 bg-white rounded-lg">
              <div className="aspect-square bg-gray-100">
                {isVideo(item) ? (
                  <video src={item.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.originalName} loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-gray-600" title={item.originalName}>{item.originalName}</p>
                  <p className="text-[10px] text-gray-400">{isVideo(item) ? "影片" : "圖片"}{item.size ? ` · ${formatSize(item.size)}` : ""}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => copyUrl(item.url)} title="複製網址" className="p-1.5 text-gray-400 hover:text-gray-700"><Copy size={14} /></button>
                  <button type="button" onClick={() => setConfirmId(item.id)} title="刪除" className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>

              {confirmId === item.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-3 text-center">
                  <p className="text-xs text-white">確定刪除這個媒體？</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={deletingId === item.id} onClick={() => remove(item.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{deletingId === item.id ? "刪除中" : "刪除"}</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700">取消</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
