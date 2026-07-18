"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PublicVideo from "@/components/public/PublicVideo";

type Video = { id: string; video: string; caption: string; category: string };

/** 選出主要可見的卡片；比例相同時保留較左邊者，避免 callback 順序造成搶播。 */
export function galleryActiveIndex(visibleRatios: number[], minimumRatio = 0.7): number | null {
  let selected: number | null = null;
  let selectedRatio = minimumRatio;
  visibleRatios.forEach((ratio, index) => {
    if (ratio < minimumRatio) return;
    if (selected === null || ratio > selectedRatio) {
      selected = index;
      selectedRatio = ratio;
    }
  });
  return selected;
}

/**
 * 作品影片區塊：依分類標籤切換；桌機為格狀、手機為可左右滑動（scroll-snap）的橫向輪播。
 * 分類由各影片的 category 依出現順序去重而來；沒有任何分類時不顯示標籤列。
 */
export default function WorksGallery({ videos, categoryOrder = [] }: { videos: Video[]; categoryOrder?: string[] }) {
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileCarousel, setMobileCarousel] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const shown = active ? videos.filter((item) => item.category.trim() === active) : videos;

  useEffect(() => {
    setActiveIndex(0);
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
  }, [active]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobileCarousel(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const updateActiveVideo = () => {
    const container = carouselRef.current;
    if (!container || !mobileCarousel) return;
    const viewport = container.getBoundingClientRect();
    const ratios = Array.from(container.children).map((card) => {
      const rect = card.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left));
      return rect.width > 0 ? visibleWidth / rect.width : 0;
    });
    const nextIndex = galleryActiveIndex(ratios);
    if (nextIndex !== null) setActiveIndex(nextIndex);
  };

  const tabClass = (isActive: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
      isActive ? "text-white" : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"
    }`;

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setActive(null)} className={tabClass(active === null)} style={active === null ? { backgroundColor: "var(--brand)" } : undefined}>全部</button>
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActive(category)} className={tabClass(active === category)} style={active === category ? { backgroundColor: "var(--brand)" } : undefined}>{category}</button>
          ))}
        </div>
      )}

      <div ref={carouselRef} onScroll={updateActiveVideo} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-3">
        {shown.map((item, index) => (
          <figure key={item.id} data-work-video-card className="w-[78%] shrink-0 snap-center overflow-hidden bg-white rounded-lg sm:w-[46%] md:w-auto">
            <PublicVideo key={mobileCarousel ? "mobile" : "desktop"} src={item.video} autoPlay autoActivate={!mobileCarousel || index === activeIndex} className="aspect-[9/16] w-full bg-black object-cover" />
            {!!item.caption && <figcaption className="p-4 text-sm text-neutral-600">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
