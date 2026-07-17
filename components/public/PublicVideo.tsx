"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列（作品影片）；false＝首屏自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
}

/**
 * 前台影片播放器：
 * - 進到視窗附近才載入並播放，離開視窗暫停（省頻寬、加快首屏）。
 * - 載入或解碼失敗（例如部分裝置無法播放 .mov）時，改顯示可點開的連結，避免影片整塊消失。
 */
export default function PublicVideo({ src, className = "", controls = false, autoPlay = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            if (autoPlay) element.play().catch(() => {});
          } else {
            element.pause();
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [autoPlay]);

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
      preload={active ? "metadata" : "none"}
      muted={autoPlay || undefined}
      loop={autoPlay || undefined}
    />
  );
}
