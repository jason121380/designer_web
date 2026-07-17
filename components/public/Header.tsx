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
  const links = content.sections
    .filter((sec) => isVisible(sec.key, content))
    .map((sec) => ({ href: `#${SECTION_ANCHOR[sec.key]}`, label: sec.zh }));

  return (
    <nav className="sticky top-0 z-50 bg-neutral-900/95 text-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="font-semibold tracking-wide">{content.brand.name}</a>
        <ul className="hidden items-center gap-6 text-sm text-neutral-200 md:flex">
          {links.map((link) => (
            <li key={link.href}><a href={link.href} className="transition-colors hover:text-white">{link.label}</a></li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
