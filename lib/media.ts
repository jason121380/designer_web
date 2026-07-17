/** 依副檔名或路徑判斷網址是否為影片（上傳到 R2 的影片放在 uploads/videos/ 且帶影片副檔名）。 */
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return VIDEO_EXT.test(url) || url.includes("/uploads/videos/");
}
