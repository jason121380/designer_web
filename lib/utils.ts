import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 允許輸出的安全協定；其餘（javascript:、data:、vbscript:…）一律擋掉，避免儲存型 XSS。
const SAFE_URL_SCHEMES = ["http", "https", "mailto", "tel"];

/**
 * 將使用者填的外部連結補成安全的絕對網址：
 * 沒有協定的（例如 `www.google.com`）補上 `https://`；以 `/` 開頭視為站內路徑。
 * 已有協定者只允許 http/https/mailto/tel，其餘（例如 `javascript:`）回空字串。
 */
export function externalHref(url: string): string {
  const value = (url ?? "").trim();
  if (!value) return value;
  if (value.startsWith("/")) return value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (scheme) {
    return SAFE_URL_SCHEMES.includes(scheme[1].toLowerCase()) ? value : "";
  }
  return `https://${value}`;
}
