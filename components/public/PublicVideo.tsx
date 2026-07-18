"use client";

import { useEffect, useRef, useState } from "react";
import { streamThumbnailUrl, streamUidFromUrl } from "@/lib/stream-url";
import { useStreamHls } from "@/components/public/useStreamHls";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列；false＝自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
  /** 首屏影片：縮圖 eager＋高優先，播放器 preload=auto。 */
  priority?: boolean;
}

/**
 * 前台影片播放器：
 * - SSR 只輸出 Stream 縮圖占位；hydration 後立即掛載播放器並自動播放（不等捲動、不顯示播放鈕）。
 * - Stream 以 HLS 播放並套用 object-cover，影片裁切滿版、無黑邊；Safari 原生、其餘用 hls.js。
 * - 載入或解碼失敗時改顯示可點開的連結，避免整塊消失。
 */
export default function PublicVideo({ src, className = "", controls = false, autoPlay = false, priority = false }: Props) {
  const streamUid = streamUidFromUrl(src);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // hydration 後立即掛載播放器（播放器只在 client 建立，SSR 維持輕量縮圖）。
  useEffect(() => setMounted(true), []);

  // Stream 影片以 HLS 播放（Safari 原生 / hls.js）；非 Stream 走原生 <video src>。
  const [onFail] = useState(() => () => setFailed(true));
  useStreamHls(videoRef, streamUid, mounted && !failed, onFail);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-black p-4 text-center ${className}`}>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-white/80 underline">
          影片無法在此瀏覽器播放，點此開啟
        </a>
      </div>
    );
  }

  const videoProps = {
    ref: videoRef,
    className: "absolute inset-0 h-full w-full object-cover",
    onError: () => setFailed(true),
    onLoadedData: () => { if (autoPlay) videoRef.current?.play().catch(() => {}); },
    controls,
    autoPlay,
    playsInline: true,
    preload: priority ? "auto" : "metadata",
    muted: autoPlay || undefined,
    loop: autoPlay || undefined,
  } as const;

  if (streamUid) {
    const thumbnail = streamThumbnailUrl(streamUid);
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        {!thumbBroken && (
          <img
            src={thumbnail}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onError={() => setThumbBroken(true)}
          />
        )}
        {/* Stream 走 HLS，src 由 useStreamHls 綁定，這裡不設 src。 */}
        {mounted && <video {...videoProps} />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {mounted && <video {...videoProps} src={src} />}
    </div>
  );
}
