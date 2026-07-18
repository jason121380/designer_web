"use client";

import { useRef, useState } from "react";
import { streamThumbnailUrl } from "@/lib/stream-url";
import { useStreamHls } from "@/components/public/useStreamHls";

/**
 * 後台 Stream 影片預覽：與前台共用同一套 HLS 播放（Safari 原生 / hls.js），
 * 取代較重的 Cloudflare iframe 播放器，行為一致又更輕量。帶控制列供編輯時檢視。
 */
export default function StreamVideoPreview({ uid, className = "" }: { uid: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [onFail] = useState(() => () => setFailed(true));
  useStreamHls(videoRef, uid, !failed, onFail);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-black text-xs text-white/70 ${className}`}>
        預覽載入失敗
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={streamThumbnailUrl(uid)}
      controls
      playsInline
      preload="metadata"
      className={`${className} bg-black object-contain`}
    />
  );
}
