"use client";

import { useState } from "react";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列（作品影片）；false＝首屏自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
}

/**
 * 前台影片播放器：載入或解碼失敗（例如部分裝置無法播放 .mov）時，
 * 改顯示可點開的連結，避免影片整塊憑空消失。
 */
export default function PublicVideo({ src, className = "", controls = false, autoPlay = false }: Props) {
  const [failed, setFailed] = useState(false);

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
      src={src}
      className={className}
      onError={() => setFailed(true)}
      controls={controls}
      playsInline
      preload="metadata"
      {...(autoPlay ? { autoPlay: true, muted: true, loop: true } : {})}
    />
  );
}
