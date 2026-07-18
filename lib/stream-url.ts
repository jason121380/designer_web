// Cloudflare Stream 網址工具（純字串處理，不 import 任何伺服器 SDK，可安全用於 client 元件）。
// Stream 影片以 iframe 播放（自動選畫質＋串流），網址型如 https://iframe.videodelivery.net/{uid}。

const STREAM_HOST_RE = /(?:^|\.)(videodelivery\.net|cloudflarestream\.com)$/i;
const STREAM_UID_RE = /^[0-9a-f]{20,40}$/i;

/** 從各種 Stream 網址取出影片 UID；非 Stream 網址（例如 R2 的 .mp4）回 null。 */
export function streamUidFromUrl(url: string): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!STREAM_HOST_RE.test(parsed.hostname)) return null;
  // iframe.videodelivery.net/{uid}、videodelivery.net/{uid}/...、customer-xxx.cloudflarestream.com/{uid}/iframe
  const uid = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  return STREAM_UID_RE.test(uid) ? uid : null;
}

/** 是否為 Cloudflare Stream 播放網址。 */
export function isStreamUrl(url: string): boolean {
  return streamUidFromUrl(url) !== null;
}

/** Stream 影片縮圖（第一幀），可直接當 <img> src。 */
export function streamThumbnailUrl(uid: string): string {
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
}

interface StreamIframeOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  /** false＝隱藏播放控制列（作品影片自動循環用）。 */
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  poster?: string;
}

/** 組出帶播放參數的 Stream iframe 網址。 */
export function streamIframeSrc(uid: string, options: StreamIframeOptions = {}): string {
  const params = new URLSearchParams();
  if (options.autoplay) params.set("autoplay", "true");
  if (options.loop) params.set("loop", "true");
  if (options.muted) params.set("muted", "true");
  if (options.controls === false) params.set("controls", "false");
  if (options.preload) params.set("preload", options.preload);
  if (options.poster) params.set("poster", options.poster);
  const query = params.toString();
  return `https://iframe.videodelivery.net/${uid}${query ? `?${query}` : ""}`;
}
