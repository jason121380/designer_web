"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface Props {
  title: string;
  themeColor: string;
  textColor: string;
  links: { href: string; label: string }[];
  /** 導覽連結點擊的 GA 事件名稱（空＝不追蹤）。 */
  navEvent?: string;
}

export default function Header({ title, themeColor, textColor, links, navEvent }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
    <nav className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: themeColor, color: textColor }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="font-semibold tracking-wide" onClick={() => setOpen(false)}>{title}</a>
        <ul className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <li key={link.href}><a href={link.href} data-ga-event={navEvent} data-ga-label={link.label} className="transition-opacity hover:opacity-100 opacity-90">{link.label}</a></li>
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
        <div className="relative z-50 border-t border-black/10 md:hidden" style={{ backgroundColor: themeColor, color: textColor }}>
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} data-ga-event={navEvent} data-ga-label={link.label} className="block rounded-lg px-2 py-3 text-sm transition-colors hover:bg-black/10">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>

      {/* 遮罩放在 nav 外面：nav 的 backdrop-blur 會讓內部 fixed 相對於 nav 而非整個畫面，
          移出後才能真正蓋滿標題列以下的整頁，點擊即關閉選單。 */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-40 bg-black/20 md:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
