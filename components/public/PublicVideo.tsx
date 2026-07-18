"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { streamHlsUrl, streamThumbnailUrl, streamUidFromUrl } from "@/lib/stream-url";

interface Props {
  src: string;
  className?: string;
  /** true＝顯示播放控制列（作品影片）；false＝自動播放靜音循環。 */
  controls?: boolean;
  autoPlay?: boolean;
  /** 首屏影片只提高縮圖與已啟用播放器的載入優先級，不會在 SSR 階段建立 video。 */
  priority?: boolean;
  /** 是否允許進入可視範圍時自動啟用；仍可由使用者手動點播。 */
  autoActivate?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const ACTIVE_VIDEO_EVENT = "designer-video-activate";

export function videoVisibilityAction({
  isIntersecting,
  intersectionRatio,
  manualPlayback,
  autoActivate = true,
}: {
  isIntersecting: boolean;
  intersectionRatio: number;
  manualPlayback: boolean;
  autoActivate?: boolean;
}): "activate" | "deactivate" | "keep" {
  if (!isIntersecting || intersectionRatio < 0.05) return "deactivate";
  if (autoActivate && !manualPlayback && intersectionRatio >= 0.15) return "activate";
  return "keep";
}

export type HlsFatalRecoveryAction = "reload-manifest" | "retry-network" | "recover-media" | "fail";

/** HLS fatal error 只恢復一次；持續失敗就交給備援 UI，避免無限重試。 */
export function hlsFatalRecoveryAction(
  type: string,
  recoveryCount: number,
  manifestError = false
): HlsFatalRecoveryAction {
  if (type === "networkError" && recoveryCount < 1) {
    return manifestError ? "reload-manifest" : "retry-network";
  }
  if (type === "mediaError" && recoveryCount < 1) return "recover-media";
  return "fail";
}

/** 自動播放真的開始前保留播放按鈕，讓被瀏覽器拒播的影片仍能手動重試。 */
export function playbackOverlayVisible({
  active,
  autoPlay,
  playing,
}: {
  active: boolean;
  autoPlay: boolean;
  playing: boolean;
}): boolean {
  return !active || (autoPlay && !playing);
}

/**
 * 前台影片播放器：
 * - 首次回應只輸出輕量縮圖，不建立播放器。
 * - Stream 以 HLS 播放並套用 object-cover，影片會裁切滿版而不產生黑邊。
 * - 影片進入視窗才掛載，離開即卸載；頁面同時間最多只啟用一支影片。
 * - 省流量或減少動態效果模式改成點擊播放，避免背景下載影片。
 */
export default function PublicVideo({
  src,
  className = "",
  controls = false,
  autoPlay = false,
  priority = false,
  autoActivate = true,
}: Props) {
  const streamUid = streamUidFromUrl(src);
  const playerId = useId();
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [manualOnly, setManualOnly] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activate = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ACTIVE_VIDEO_EVENT, { detail: { id: playerId } }));
    setActive(true);
  }, [playerId]);

  const requestPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!active || !video) {
      activate();
      return;
    }
    void video.play().catch(() => setPlaying(false));
  }, [active, activate]);

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
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const manualPlayback = saveData || reducedMotion;
    setManualOnly(manualPlayback);

    // 舊版 WebView 沒有 IntersectionObserver 時維持可播放；省流量模式仍等待使用者點擊。
    if (!("IntersectionObserver" in window)) {
      if (autoActivate && !manualPlayback) activate();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const action = videoVisibilityAction({
          isIntersecting: entry?.isIntersecting ?? false,
          intersectionRatio: entry?.intersectionRatio ?? 0,
          manualPlayback,
          autoActivate,
        });
        if (action === "deactivate") {
          setActive(false);
        } else if (action === "activate") {
          activate();
        }
      },
      { threshold: [0, 0.05, 0.15, 0.6] }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activate, autoActivate]);

  useEffect(() => {
    if (!autoActivate) setActive(false);
  }, [autoActivate]);

  useEffect(() => {
    if (!active) {
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [active]);

  useEffect(() => {
    if (!active || !streamUid) return;
    const video = videoRef.current;
    if (!video) return;

    const manifestUrl = streamHlsUrl(streamUid);
    let disposed = false;
    let hls: import("hls.js").default | null = null;
    let networkRecoveries = 0;
    let mediaRecoveries = 0;

    // Safari／iOS 原生支援 HLS，不下載額外播放器程式。
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = manifestUrl;
      video.load();
    } else {
      void import("hls.js")
        .then(({ default: Hls }) => {
          if (disposed) return;
          if (!Hls.isSupported()) {
            setFailed(true);
            return;
          }

          hls = new Hls({ enableWorker: true });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal || disposed) return;
            const recoveryCount = data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? networkRecoveries
              : mediaRecoveries;
            const manifestError = data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR
              || data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT
              || data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR;
            const action = hlsFatalRecoveryAction(data.type, recoveryCount, manifestError);
            if (action === "reload-manifest") {
              networkRecoveries += 1;
              hls?.loadSource(manifestUrl);
            } else if (action === "retry-network") {
              networkRecoveries += 1;
              hls?.startLoad();
            } else if (action === "recover-media") {
              mediaRecoveries += 1;
              hls?.recoverMediaError();
            } else {
              setFailed(true);
            }
          });
          hls.loadSource(manifestUrl);
          hls.attachMedia(video);
        })
        .catch(() => { if (!disposed) setFailed(true); });
    }

    return () => {
      disposed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [active, streamUid]);

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
          <video
            ref={videoRef}
            poster={thumbnail}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
            onLoadedData={() => { if (autoPlay) videoRef.current?.play().catch(() => {}); }}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            controls={controls}
            autoPlay={autoPlay}
            playsInline
            preload={priority ? "auto" : "metadata"}
            muted={autoPlay}
            loop={autoPlay}
          />
        )}
        {playbackOverlayVisible({ active, autoPlay, playing }) && (
          <button
            type="button"
            onClick={requestPlayback}
            className="absolute inset-0 flex items-center justify-center bg-black/20 text-sm font-semibold text-white"
            aria-label="播放影片"
          >
            <span className={`rounded-full bg-black/65 px-5 py-3 ${manualOnly ? "" : "opacity-80"}`}>播放影片</span>
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
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          controls={controls}
          autoPlay={autoPlay}
          playsInline
          preload={priority ? "auto" : "metadata"}
          muted={autoPlay || undefined}
          loop={autoPlay || undefined}
        />
      )}
      {playbackOverlayVisible({ active, autoPlay, playing }) && (
        <button
          type="button"
          onClick={requestPlayback}
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white"
          aria-label="播放影片"
        >
          <span className="rounded-full bg-white/15 px-5 py-3">播放影片</span>
        </button>
      )}
    </div>
  );
}
