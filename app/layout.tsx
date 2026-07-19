import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import { getSiteIconUrl } from "@/lib/site-icon";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover：讓 PWA 全螢幕時 safe-area inset 生效（側欄底部已使用）
  viewportFit: "cover",
  themeColor: "#171717",
};

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const icon = await getSiteIconUrl();
  return {
    ...baseMetadata,
    icons: icon
      ? { icon: [{ url: icon }], shortcut: [{ url: icon }], apple: [{ url: icon }] }
      : baseMetadata.icons,
  };
}

const baseMetadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  // 預設圖示改由 metadata 統一指定（指向 public 靜態檔），不再放在 app/ 自動注入；
  // 這樣後台上傳的自訂圖示才能可靠蓋過預設，不會與自動注入的 <link> 衝突。
  icons: {
    icon: [{ url: "/icon.png" }],
    shortcut: [{ url: "/icon.png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  title: {
    default: "designer_web｜設計師一頁式品牌網站",
    template: "%s｜designer_web",
  },
  description: "designer_web 提供一頁式品牌網站、內容後台、作品集展示與預約轉換設計。",
  keywords: ["designer_web", "一頁式網站", "品牌網站", "作品集", "內容管理後台", "網頁設計"],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "designer_web",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: "Designer Web",
    statusBarStyle: "black-translucent",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={notoSansTC.variable}>
      <body>{children}</body>
    </html>
  );
}
