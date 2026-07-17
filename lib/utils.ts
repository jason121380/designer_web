import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 將使用者填的外部連結補成絕對網址：
 * 沒有協定的（例如 `www.google.com`）補上 `https://`，避免被當成站內相對路徑。
 * 已有協定（http/https/mailto/tel…）或以 `/` 開頭的站內路徑則原樣保留。
 */
export function externalHref(url: string): string {
  const value = (url ?? "").trim();
  if (!value) return value;
  if (value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}
