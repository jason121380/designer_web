"use client";

import { useRef, useState, DragEvent } from "react";
import { isVideoUrl } from "@/lib/media";
import { streamIframeSrc, streamUidFromUrl } from "@/lib/stream-url";
import MediaPickerModal from "./MediaPickerModal";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  /** 預覽/上傳區長寬比 Tailwind class，預設 16:9；可傳 "aspect-square" 呈現 1:1。 */
  aspect?: string;
}

const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 200 * 1024 * 1024;
const VIDEO_ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

/** 通用媒體上傳：圖片走 /api/upload（伺服器處理），影片走 presigned 直傳 R2（帶進度）。 */
export default function MediaUpload({ value, onChange, label = "圖片或影片", aspect = "aspect-video" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    if (file.size > IMAGE_MAX) { setError("圖片大小不得超過 10MB"); return; }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "上傳失敗");
    onChange(data.url);
  }

  async function uploadVideo(file: File) {
    if (!VIDEO_ALLOWED.includes(file.type)) { setError("僅支援 mp4、webm、mov 影片"); return; }
    if (file.size > VIDEO_MAX) { setError("影片大小不得超過 200MB"); return; }
    setNotice(file.type === "video/quicktime" ? ".mov 在部分 Chrome／Android 可能無法播放，若前台無法播放建議改上傳 MP4（H.264）" : "");
    const res = await fetch("/api/upload/video-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, size: file.size }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "取得上傳連結失敗");
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("上傳到 R2 失敗")));
      xhr.onerror = () => reject(new Error("上傳到 R2 失敗（請確認 R2 CORS 設定）"));
      xhr.send(file);
    });
    onChange(data.publicUrl);
    // 記錄到媒體庫（失敗不影響上傳結果）。
    fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: data.publicUrl, mimeType: file.type, size: file.size, originalName: file.name }) }).catch(() => {});
  }

  async function uploadFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { setError("請上傳圖片或影片檔案"); return; }

    setError("");
    setNotice("");
    setUploading(true);
    setProgress(0);
    try {
      if (isImage) await uploadImage(file);
      else await uploadVideo(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div>
      {label && <label className="mb-2 block text-xs font-medium text-gray-500">{label}</label>}

      {value ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-black">
            {streamUidFromUrl(value) ? (
              <iframe
                src={streamIframeSrc(streamUidFromUrl(value)!, { controls: true, preload: "metadata" })}
                className={`${aspect} w-full border-0`}
                allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                allowFullScreen
                title="影片預覽"
              />
            ) : isVideoUrl(value) ? (
              <video src={value} controls playsInline preload="metadata" className={`${aspect} w-full bg-black object-contain`} />
            ) : (
              <img src={value} alt="預覽" className={`${aspect} w-full bg-gray-100 object-contain`} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-rose-brand">更換</button>
            <button type="button" onClick={() => { onChange(""); setError(""); setNotice(""); }} className="text-xs font-medium text-red-500">移除</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && setPickerOpen(true)}
          className={`flex ${aspect} cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
            isDragging ? "border-rose-brand bg-rose-brand/5" : "border-gray-200 hover:border-rose-brand"
          }`}
        >
          {uploading ? (
            <div className="w-2/3 text-center">
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-rose-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400">上傳中…{progress ? ` ${progress}%` : ""}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">點擊選擇：本機上傳或媒體庫</p>
              <p className="text-xs text-gray-300">圖片最大 10MB；影片 mp4／webm／mov 最大 200MB</p>
            </>
          )}
        </div>
      )}

      {!!error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {!!notice && <p className="mt-2 text-xs text-amber-600">{notice}</p>}

      {!value && !uploading && (
        <div className="mt-3 flex items-center gap-2">
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light"
            value={manualUrl}
            placeholder="或貼上圖片／影片網址"
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && manualUrl.trim()) { onChange(manualUrl.trim()); setManualUrl(""); } }}
          />
          <button type="button" onClick={() => { if (manualUrl.trim()) { onChange(manualUrl.trim()); setManualUrl(""); } }} className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600">套用</button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
      />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept="both"
        onSelect={(url) => { onChange(url); setPickerOpen(false); }}
        onUploadClick={() => { setPickerOpen(false); inputRef.current?.click(); }}
      />
    </div>
  );
}
