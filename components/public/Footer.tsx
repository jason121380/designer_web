import type { DesignerWebContent } from "@/lib/designer-web-content";

export default function Footer({ content }: { content: DesignerWebContent }) {
  return (
    <footer className="py-6 text-center text-sm text-white" style={{ backgroundColor: content.brand.themeColor }}>
      <p>Copyright © {new Date().getFullYear()} {content.brand.name}</p>
    </footer>
  );
}
