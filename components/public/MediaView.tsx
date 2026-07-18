import PublicVideo from "@/components/public/PublicVideo";
import { isVideoUrl } from "@/lib/media";

/**
 * 前台通用媒體呈現：網址是影片就用 PublicVideo（自動播放、靜音循環、失敗顯示連結），
 * 否則用 <img>。同一個 className 兩者共用，維持版位與比例一致。
 */
export default function MediaView({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  if (isVideoUrl(src)) {
    return <PublicVideo src={src} autoPlay className={className} />;
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
