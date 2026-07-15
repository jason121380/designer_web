import { frontendDemo } from "@/lib/frontend-demo";

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-white" style={{ backgroundColor: frontendDemo.themeColor }}>
      <p>
        Copyright © {new Date().getFullYear()} {frontendDemo.brandName} ｜ Powered by LURE
      </p>
    </footer>
  );
}
