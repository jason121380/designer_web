"use client";

import { useState, type ReactNode } from "react";
import { MapPin, MessageCircle, X } from "lucide-react";
import type { DesignerWebContent } from "@/lib/designer-web-content";
import { externalHref } from "@/lib/utils";

/**
 * 前台右下角懸浮泡泡：點擊展開，顯示後台勾選且有填網址的聯絡管道（LINE／Facebook／Instagram／Google 地圖）。
 * 都沒有時不顯示。
 */
export default function FloatingBubble({ contact }: { contact: DesignerWebContent["contact"] }) {
  const [open, setOpen] = useState(false);

  const items = [
    contact.bubble.line && contact.line && { key: "line", event: "click_line", href: externalHref(contact.line), label: "LINE", node: <MessageCircle size={20} /> },
    contact.bubble.facebook && contact.facebook && { key: "fb", event: "click_facebook", href: externalHref(contact.facebook), label: "Facebook", node: <span className="text-lg font-bold">f</span> },
    contact.bubble.instagram && contact.instagram && { key: "ig", event: "click_instagram", href: externalHref(contact.instagram), label: "Instagram", node: <span className="text-sm font-bold">IG</span> },
    contact.bubble.map && contact.mapUrl && { key: "map", event: "click_map", href: externalHref(contact.mapUrl), label: "Google 地圖", node: <MapPin size={20} /> },
  ].filter(Boolean) as { key: string; event: string; href: string; label: string; node: ReactNode }[];

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open &&
        items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            data-ga-event={item.event}
            data-ga-label={`懸浮泡泡_${item.label}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105"
            style={{ color: "var(--brand)" }}
          >
            {item.node}
          </a>
        ))}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "關閉聯絡選單" : "聯絡我們"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
