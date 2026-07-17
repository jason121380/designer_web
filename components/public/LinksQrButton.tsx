"use client";

import { useEffect, useState } from "react";
import { QrCode, X } from "lucide-react";

/** 連結頁右上角的 QR Code 按鈕：點擊彈窗放大顯示 QR 圖。 */
export default function LinksQrButton({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="顯示 QR Code"
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:text-[color:var(--brand)]"
      >
        <QrCode size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setOpen(false)}>
          <div className="relative" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="QR Code" className="w-72 max-w-[80vw] rounded-lg bg-white p-3" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="關閉"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
