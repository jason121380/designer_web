"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { streamIframeSrc, streamThumbnailUrl, streamUidFromUrl } from "@/lib/stream-url";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列（作品影片）；false＝自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
  /** 首屏影片只提高縮圖與已啟用播放器的載入優先級，不會在 SSR 階段建立 iframe。 */
  priority?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const ACTIVE_VIDEO_EVENT = "designer-video-activate";

/**
 * 前台影片播放器：
 * - 首次回應只輸出輕量縮圖，不建立昂貴的 Cloudflare Stream iframe。
 * - 影片進入視窗才掛載播放器，離開即卸載；頁面同時間最多只啟用一支影片。
 * - 省流量或減少動態效果模式改成點擊播放，避免背景下載影片。
 */
export default function PublicVideo({ src, className = "", controls = false, autoPlay = false, priority = false }: Props) {
  const streamUid = streamUidFromUrl(src);
  const playerId = useId();
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const [manualOnly, setManualOnly] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activate = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ACTIVE_VIDEO_EVENT, { detail: { id: playerId } }));
    setActive(true);
  }, [playerId]);

  useEffect(() => {
    const deactivateOtherPlayers = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== playerId) setActive(false);
    };
    window.addEventListener(ACTIVE_VIDEO_EVENT, deactivateOtherPlayers);
    return () => window.removeEventListener(ACTIVE_VIDEO_EVENT, deactivateOtherPlayers);
  }, [playerId]);

  useEffect(() => {
    const target = wrapRef.current;
    if (!target) return;

    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (saveData || reducedMotion) {
      setManualOnly(true);
      setActive(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.35) {
          activate();
        } else {
          setActive(false);
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activate]);

  useEffect(() => {
    if (!active) videoRef.current?.pause();
  }, [active]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-black p-4 text-center ${className}`}>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-white/80 underline">
          影片無法在此瀏覽器播放，點此開啟
        </a>
      </div>
    );
  }

  if (streamUid) {
    const thumbnail = streamThumbnailUrl(streamUid);
    return (
      <div ref={wrapRef} className={`relative overflow-hidden bg-black ${className}`}>
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
        {active && (
          <iframe
            src={streamIframeSrc(streamUid, {
              autoplay: autoPlay,
              loop: autoPlay,
              muted: autoPlay,
              controls,
              preload: priority ? "auto" : "metadata",
              poster: thumbnail,
            })}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            loading={priority ? "eager" : "lazy"}
            title="影片"
          />
        )}
        {manualOnly && !active && (
          <button
            type="button"
            onClick={activate}
            className="absolute inset-0 flex items-center justify-center bg-black/20 text-sm font-semibold text-white"
            aria-label="播放影片"
          >
            <span className="rounded-full bg-black/65 px-5 py-3">播放影片</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-black ${className}`}>
      {active && (
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          onLoadedData={() => { if (autoPlay) videoRef.current?.play().catch(() => {}); }}
          controls={controls}
          playsInline
          preload={priority ? "auto" : "metadata"}
          muted={autoPlay || undefined}
          loop={autoPlay || undefined}
        />
      )}
      {!active && (
        <button
          type="button"
          onClick={activate}
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white"
          aria-label="播放影片"
        >
          <span className="rounded-full bg-white/15 px-5 py-3">播放影片</span>
        </button>
      )}
    </div>
  );
}
