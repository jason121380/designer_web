"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface Props {
  title: string;
  themeColor: string;
  textColor: string;
  links: { href: string; label: string }[];
}

export default function Header({ title, themeColor, textColor, links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: themeColor, color: textColor }}>
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
        <div className="border-t border-black/10 md:hidden" style={{ backgroundColor: themeColor, color: textColor }}>
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
