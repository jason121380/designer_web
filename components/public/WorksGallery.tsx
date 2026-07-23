"use client";

import { useMemo, useState } from "react";
import PublicVideo from "@/components/public/PublicVideo";

type Video = { id: string; video: string; caption: string; category: string };

/**
 * 作品影片區塊：依分類標籤切換；桌機為格狀、手機為可左右滑動（scroll-snap）的橫向輪播。
 * 分類由各影片的 category 依出現順序去重而來；沒有任何分類時不顯示標籤列。
 * 所有影片一進頁面即自動播放（靜音循環），不等捲動、不顯示播放鈕。
 */
export default function WorksGallery({ videos, categoryOrder = [], categoryEvent }: { videos: Video[]; categoryOrder?: string[]; categoryEvent?: string }) {
  const categories = useMemo(() => {
    const used = new Set(videos.map((item) => item.category.trim()).filter(Boolean));
    // 先依後台管理的分類順序，再補上影片有用到但不在清單內的分類。
    const ordered = categoryOrder.filter((category) => used.has(category));
    for (const item of videos) {
      const category = item.category.trim();
      if (category && !ordered.includes(category)) ordered.push(category);
    }
    return ordered;
  }, [videos, categoryOrder]);

  const [active, setActive] = useState<string | null>(null);
  // 切分類時不重新過濾清單（會卸載/重掛播放器造成卡頓），改成全部保持掛載、以 CSS 顯示/隱藏。
  const matches = (item: Video) => !active || item.category.trim() === active;

  const tabClass = (isActive: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
      isActive ? "text-white" : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"
    }`;

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setActive(null)} data-ga-event={categoryEvent} data-ga-label="全部" className={tabClass(active === null)} style={active === null ? { backgroundColor: "var(--brand)" } : undefined}>全部</button>
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActive(category)} data-ga-event={categoryEvent} data-ga-label={category} className={tabClass(active === category)} style={active === category ? { backgroundColor: "var(--brand)" } : undefined}>{category}</button>
          ))}
        </div>
      )}

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-3">
        {videos.map((item) => (
          <figure key={item.id} className={`w-[78%] shrink-0 snap-center overflow-hidden bg-white rounded-lg sm:w-[46%] md:w-auto ${matches(item) ? "" : "hidden"}`}>
            <PublicVideo src={item.video} autoPlay className="aspect-[9/16] w-full bg-black object-cover" />
            {!!item.caption && <figcaption className="p-4 text-sm text-neutral-600">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
