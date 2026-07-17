"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 後台影片縮圖：進到視窗附近才載入中繼資料（preload none→metadata），
 * 避免媒體庫/選取器一次對數百支影片發出請求，強制重整也不會卡。
 */
export default function AdminVideoThumb({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
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
  }, [load]);

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
