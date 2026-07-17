import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { DesignerWebContent } from "@/lib/designer-web-content";
import { externalHref } from "@/lib/utils";
import LinksQrButton from "@/components/public/LinksQrButton";
import MediaView from "@/components/public/MediaView";

/** 個人連結頁（linktree 風格）：頭像、名稱、簡介、連結按鈕與社群 icon。 */
export default function LinksPage({ content }: { content: DesignerWebContent }) {
  const { brand, links, contact } = content;
  const initial = brand.name.trim()[0]?.toUpperCase() ?? "•";

  const socials: { key: string; href: string; label: string; node: React.ReactNode }[] = [
    contact.instagram && { key: "ig", href: externalHref(contact.instagram), label: "Instagram", node: <span className="text-xs font-bold">IG</span> },
    contact.facebook && { key: "fb", href: externalHref(contact.facebook), label: "Facebook", node: <span className="text-sm font-bold">f</span> },
    contact.line && { key: "line", href: externalHref(contact.line), label: "LINE", node: <MessageCircle size={18} /> },
    contact.email && { key: "mail", href: `mailto:${contact.email}`, label: "Email", node: <Mail size={18} /> },
    contact.phone && { key: "tel", href: `tel:${contact.phone}`, label: "電話", node: <Phone size={18} /> },
    contact.mapUrl && { key: "map", href: externalHref(contact.mapUrl), label: "地圖", node: <MapPin size={18} /> },
  ].filter(Boolean) as { key: string; href: string; label: string; node: React.ReactNode }[];

  return (
    <div style={{ ["--brand" as string]: brand.themeColor }} className="min-h-screen bg-neutral-50">
      {!!links.qr && <LinksQrButton src={links.qr} />}
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 py-14">
        {links.avatar ? (
          <div className="h-24 w-24 overflow-hidden rounded-full">
            <MediaView src={links.avatar} alt={brand.name} className="h-24 w-24 rounded-full object-cover" />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>
            {initial}
          </div>
        )}

        <h1 className="mt-4 text-xl font-bold text-neutral-900">{brand.name}</h1>
        {!!links.bio && <p className="mt-2 whitespace-pre-line text-center text-sm leading-relaxed text-neutral-500">{links.bio}</p>}

        {!!links.items.length && (
          <div className="mt-8 w-full space-y-3">
            {links.items.map((item) => (
              <a
                key={item.id}
                href={externalHref(item.url)}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-full border border-neutral-200 bg-white px-5 py-3.5 text-center text-sm font-medium text-neutral-800 transition hover:-translate-y-0.5 hover:border-[color:var(--brand)]"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        {!!socials.length && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
              >
                {s.node}
              </a>
            ))}
          </div>
        )}

        <p className="mt-auto pt-12 text-center text-xs text-neutral-400">© {new Date().getFullYear()} {brand.name}</p>
      </main>
    </div>
  );
}
