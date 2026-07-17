"use client";

import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import AdminVideoThumb from "./AdminVideoThumb";

interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
  originalName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 可選媒體類型：image=僅圖片、video=僅影片、both=皆可。 */
  accept: "image" | "video" | "both";
  onSelect: (url: string) => void;
  /** 點「本機上傳」時觸發（通常用來開啟元件自己的檔案選擇）。 */
  onUploadClick: () => void;
}

const isVideo = (item: MediaItem) => item.mimeType.startsWith("video/");

export default function MediaPickerModal({ open, onClose, accept, onSelect, onUploadClick }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    fetch("/api/media")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MediaItem[]) => { if (alive) setMedia(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setMedia([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open]);

  if (!open) return null;

  const shown = media.filter((item) => (accept === "both" ? true : accept === "video" ? isVideo(item) : !isVideo(item)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col bg-white rounded-2xl shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">選擇媒體</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onUploadClick} className="inline-flex items-center gap-1.5 bg-rose-brand rounded-lg px-3.5 py-2 text-xs font-semibold text-white"><Upload size={14} />本機上傳</button>
            <button type="button" onClick={onClose} aria-label="關閉" className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-16 text-center text-sm text-gray-400">載入中…</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">媒體庫還沒有{accept === "video" ? "影片" : accept === "image" ? "圖片" : "媒體"}。點右上角「本機上傳」新增。</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {shown.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.url); onClose(); }}
                  className="group overflow-hidden border border-gray-200 bg-white rounded-lg text-left transition hover:border-rose-brand hover:ring-2 hover:ring-rose-light"
                >
                  <div className="aspect-square bg-gray-100">
                    {isVideo(item) ? (
                      <AdminVideoThumb src={item.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={item.url} alt={item.originalName} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-[11px] text-gray-500" title={item.originalName}>{item.originalName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
