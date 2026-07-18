"use client";

import { useEffect, useRef } from "react";
import { streamHlsUrl } from "@/lib/stream-url";

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

/**
 * 把 Cloudflare Stream 的 HLS 綁到 <video>：
 * - Safari／iOS 原生支援 HLS，不下載額外播放器程式。
 * - 其他瀏覽器動態載入 hls.js（僅在啟用時才載，避免影響首屏）。
 * - fatal 錯誤最多恢復一次，之後呼叫 onFail 交給備援 UI。
 * 前台播放器與後台預覽共用同一套，確保行為一致、不重複維護。
 */
export function useStreamHls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  streamUid: string | null,
  enabled: boolean,
  onFail: () => void
) {
  // 用 ref 保存 onFail，避免其 identity 變動導致 effect 反覆重建。
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    if (!enabled || !streamUid) return;
    const video = videoRef.current;
    if (!video) return;

    const manifestUrl = streamHlsUrl(streamUid);
    let disposed = false;
    let hls: import("hls.js").default | null = null;
    let networkRecoveries = 0;
    let mediaRecoveries = 0;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = manifestUrl;
      video.load();
    } else {
      void import("hls.js")
        .then(({ default: Hls }) => {
          if (disposed) return;
          if (!Hls.isSupported()) {
            onFailRef.current();
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
              onFailRef.current();
            }
          });
          hls.loadSource(manifestUrl);
          hls.attachMedia(video);
        })
        .catch(() => { if (!disposed) onFailRef.current(); });
    }

    return () => {
      disposed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [enabled, streamUid, videoRef]);
}
