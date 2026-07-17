import type { DesignerWebContent } from "@/lib/designer-web-content";

export default function Footer({ content }: { content: DesignerWebContent }) {
  return (
    <footer className="py-6 text-center text-sm" style={{ backgroundColor: content.brand.themeColor, color: content.brand.headerTextColor }}>
      <p className="mx-auto max-w-4xl px-6">Copyright © {new Date().getFullYear()} {content.brand.name}</p>
    </footer>
  );
}
