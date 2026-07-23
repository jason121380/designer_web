import Script from "next/script";
import { sanitizeGtagId } from "@/lib/analytics";

/**
 * 此頁專屬的 Google 代碼（GA4 / Google Ads）。每個一頁式各自獨立，
 * ID 存在該 slug 內容的 seo.gaId。ID 經 sanitizeGtagId 驗證後才注入。
 */
export default function Analytics({ id }: { id: string }) {
  const gaId = sanitizeGtagId(id);
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
