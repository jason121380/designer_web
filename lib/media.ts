import { streamUidFromUrl } from "@/lib/stream-url";

/**
 * 依副檔名、路徑或 Cloudflare Stream 網址判斷是否為影片。
 * - R2 影片放在 uploads/videos/ 且帶影片副檔名。
 * - Cloudflare Stream 網址（iframe.videodelivery.net 等）沒有副檔名，需另外辨識。
 */
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return VIDEO_EXT.test(url) || url.includes("/uploads/videos/") || streamUidFromUrl(url) !== null;
}
