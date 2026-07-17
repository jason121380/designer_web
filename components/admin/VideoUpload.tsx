"use client";

import { useRef, useState, DragEvent } from "react";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE = 200 * 1024 * 1024;

export default function VideoUpload({ value, onChange, label = "影片" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!ALLOWED.includes(file.type)) { setError("僅支援 mp4、webm、mov 影片"); return; }
    if (file.size > MAX_SIZE) { setError("影片大小不得超過 200MB"); return; }

    setError("");
    // .mov（QuickTime）在部分 Chrome/Android 可能無法播放，仍允許上傳但提醒改用 MP4。
    setNotice(file.type === "video/quicktime" ? ".mov 在部分 Chrome／Android 可能無法播放，若前台無法播放建議改上傳 MP4（H.264）" : "");
    setUploading(true);
    setProgress(0);
    try {
      // 1. 跟後端要 presigned 直傳網址
      const res = await fetch("/api/upload/video-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取得上傳連結失敗");

      // 2. 瀏覽器直接 PUT 到 R2（帶進度）
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("上傳到 R2 失敗")));
        xhr.onerror = () => reject(new Error("上傳到 R2 失敗（請確認 R2 CORS 設定）"));
        xhr.send(file);
      });

      onChange(data.publicUrl);
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
            <video src={value} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-rose-brand">更換影片</button>
            <button type="button" onClick={() => onChange("")} className="text-xs font-medium text-red-500">移除</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
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
              <p className="text-sm text-gray-500">點擊或拖拽上傳影片</p>
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
    </div>
  );
}
