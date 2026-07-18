"use client";

import { useRef, useState, DragEvent } from "react";
import MediaPickerModal from "./MediaPickerModal";
import { streamUidFromUrl } from "@/lib/stream-url";
import { uploadClientVideo } from "@/lib/client-video-upload";
import StreamVideoPreview from "./StreamVideoPreview";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  /** 預覽/上傳區的長寬比 Tailwind class，預設 16:9；作品影片可傳 "aspect-[9/16]" 呈現直式卡片。 */
  aspect?: string;
}

export default function VideoUpload({ value, onChange, label = "影片", aspect = "aspect-video" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError("");
    setNotice("");
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadClientVideo(file, { onProgress: setProgress });
      onChange(result.url);
      setNotice(result.notice);
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
              <StreamVideoPreview uid={streamUidFromUrl(value)!} className={`${aspect} w-full`} />
            ) : (
              <video src={value} controls playsInline preload="metadata" className={`${aspect} w-full bg-black object-contain`} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-rose-brand">更換影片</button>
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
              <p className="text-xs text-gray-400">上傳中… {progress}%</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">點擊選擇：本機上傳或媒體庫</p>
              <p className="text-xs text-gray-300">mp4、webm、mov，最大 200MB</p>
            </>
          )}
        </div>
      )}

      {!!error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {!!notice && <p className="mt-2 text-xs text-amber-600">{notice}</p>}

      {/* 也可直接貼影片播放網址（例如 Cloudflare Stream） */}
      {!value && !uploading && (
        <div className="mt-3 flex items-center gap-2">
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light"
            value={manualUrl}
            placeholder="或貼上影片網址"
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && manualUrl.trim()) { onChange(manualUrl.trim()); setManualUrl(""); } }}
          />
          <button type="button" onClick={() => { if (manualUrl.trim()) { onChange(manualUrl.trim()); setManualUrl(""); } }} className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600">套用</button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
      />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept="video"
        onSelect={(url) => { onChange(url); setPickerOpen(false); }}
        onUploadClick={() => { setPickerOpen(false); inputRef.current?.click(); }}
      />
    </div>
  );
}
