import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 這台機器記憶體很小，next/image 的 sharp 即時壓縮是主要 OOM 來源。
    // 關閉伺服器端最佳化，圖片直接輸出，記憶體大幅下降。
    // 之後若升級機器規格可考慮改回 false。
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/logo.png" },
    ],
    minimumCacheTTL: 2592000,
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
