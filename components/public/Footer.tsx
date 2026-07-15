import { getDesignerWebContent } from "@/lib/designer-web-settings";

export default async function Footer() {
  const content = await getDesignerWebContent();
  return (
    <footer className="py-6 text-center text-sm text-white" style={{ backgroundColor: content.brand.themeColor }}>
      <p>Copyright © {new Date().getFullYear()} {content.brand.name}</p>
    </footer>
  );
}
