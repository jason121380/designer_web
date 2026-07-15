"use client";

import { frontendDemo } from "@/lib/frontend-demo";

const links = [
  { href: "#dm", label: "活動DM" },
  { href: "#services", label: "接髮介紹" },
  { href: "#other-services", label: "其他服務" },
  { href: "#pricing", label: "價目表" },
  { href: "#ev", label: "環境介紹" },
  { href: "#contact", label: "聯絡我們" },
];

export default function Header() {
  return (
    <nav className="sticky top-0 z-50 bg-neutral-900/95 text-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="font-semibold tracking-wide">
          {frontendDemo.brandName}
        </a>
        <ul className="hidden items-center gap-6 text-sm text-neutral-200 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
