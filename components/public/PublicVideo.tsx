"use client";

import { useEffect, useRef, useState } from "react";
import { streamIframeSrc, streamThumbnailUrl, streamUidFromUrl } from "@/lib/stream-url";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列（作品影片）；false＝首屏自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
  /** 首屏影片：略過「捲到才載入」，一進頁面就立即掛載播放器（避免等 2 秒才出現）。 */
  priority?: boolean;
}

/**
 * 前台影片播放器：
 * - Cloudflare Stream 網址以 iframe 播放（自動選畫質＋串流，最省流量）；其餘網址用原生 <video>。
 * - 預設進到視窗附近才載入並播放（省頻寬）；priority＝首屏，立即載入不等捲動。
 * - <video> 載入或解碼失敗（例如部分裝置無法播放 .mov）時，改顯示可點開的連結，避免整塊消失。
 */
export default function PublicVideo({ src, className = "", controls = false, autoPlay = false, priority = false }: Props) {
  const streamUid = streamUidFromUrl(src);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(priority);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      // 首屏：立即嘗試播放，不等 IntersectionObserver。
      if (!streamUid && autoPlay) videoRef.current?.play().catch(() => {});
      return;
    }
    const target = streamUid ? wrapRef.current : videoRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            if (!streamUid && autoPlay) videoRef.current?.play().catch(() => {});
          } else if (!streamUid) {
            videoRef.current?.pause();
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [autoPlay, streamUid, priority]);

  // Cloudflare Stream：iframe 播放。首屏立即掛載並 eager 載入，其餘進到視窗附近才掛載。
  if (streamUid) {
    return (
      <div ref={wrapRef} className={`relative overflow-hidden bg-black ${className}`}>
        {active && (
          <iframe
            src={streamIframeSrc(streamUid, {
              autoplay: autoPlay,
              loop: autoPlay,
              muted: autoPlay,
              controls,
              preload: priority ? "auto" : "metadata",
              poster: streamThumbnailUrl(streamUid),
            })}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            loading={priority ? "eager" : "lazy"}
            title="影片"
          />
        )}
      </div>
    );
  }

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-black p-4 text-center ${className}`}>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-white/80 underline">
          影片無法在此瀏覽器播放，點此開啟
        </a>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={active ? src : undefined}
      className={className}
      onError={() => { if (active) setFailed(true); }}
      onLoadedData={() => { if (autoPlay) videoRef.current?.play().catch(() => {}); }}
      controls={controls}
      playsInline
      preload={priority ? "auto" : active ? "metadata" : "none"}
      muted={autoPlay || undefined}
      loop={autoPlay || undefined}
    />
  );
}
