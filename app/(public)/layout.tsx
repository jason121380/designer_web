import { jsonLdGraph, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

// 前台採 ISR 快取：頁面產生一次後就被快取、直接吐出 HTML（不必每次查 DB＋重渲染），
// 大幅加快開啟速度。內容編輯時由寫入 API 以 revalidatePath 立即刷新，兼顧即時性；
// 這裡的 3600 秒僅為保險用的背景重生上限。
export const revalidate = 3600;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(organizationJsonLd(), websiteJsonLd()),
        }}
      />
      {children}
    </>
  );
}
