"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { DesignerWebContent } from "@/lib/designer-web-content";
import { SECTION_ANCHOR } from "@/lib/designer-web-content";

/** 可選區塊沒有內容時不進導覽（跟前台顯示規則一致）。 */
function isVisible(key: string, content: DesignerWebContent): boolean {
  if (key === "dm") return content.promos.length > 0;
  if (key === "videos") return content.videos.length > 0;
  if (key === "environment") return content.environment.length > 0;
  return true;
}

export default function Header({ content }: { content: DesignerWebContent }) {
  const [open, setOpen] = useState(false);
  const title = content.brand.tagline || content.brand.name;
  const links = content.sections
    .filter((sec) => isVisible(sec.key, content))
    .map((sec) => ({ href: `#${SECTION_ANCHOR[sec.key]}`, label: sec.zh }));

  return (
    <nav className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: content.brand.themeColor, color: content.brand.headerTextColor }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="font-semibold tracking-wide" onClick={() => setOpen(false)}>{title}</a>
        <ul className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <li key={link.href}><a href={link.href} className="transition-opacity hover:opacity-100 opacity-90">{link.label}</a></li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/10 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/10 md:hidden" style={{ backgroundColor: content.brand.themeColor, color: content.brand.headerTextColor }}>
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-sm transition-colors hover:bg-black/10">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
