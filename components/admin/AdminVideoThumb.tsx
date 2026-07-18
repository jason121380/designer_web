"use client";

import { useEffect, useRef, useState } from "react";
import { streamThumbnailUrl, streamUidFromUrl } from "@/lib/stream-url";

/**
 * 後台影片縮圖：
 * - Cloudflare Stream 影片直接用官方縮圖圖片（第一幀），最省流量、不需下載影片。
 * - 其餘（R2 等）影片進到視窗附近才載入中繼資料（preload none→metadata），
 *   避免媒體庫/選取器一次對數百支影片發出請求，強制重整也不會卡。
 */
export default function AdminVideoThumb({ src, className = "" }: { src: string; className?: string }) {
  const streamUid = streamUidFromUrl(src);
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (streamUid) return;
    const element = ref.current;
    if (!element || load) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setLoad(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "150px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [load, streamUid]);

  if (streamUid) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={streamThumbnailUrl(streamUid)} alt="影片縮圖" loading="lazy" className={className} />;
  }

  return (
    <video
      ref={ref}
      src={load ? src : undefined}
      preload={load ? "metadata" : "none"}
      muted
      playsInline
      className={className}
    />
  );
}
