"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const PALETTE: { name: string; hex: string }[] = [
  { name: "香檳金", hex: "#D9BF77" },
  { name: "玫瑰粉", hex: "#C4837A" },
  { name: "奶茶棕", hex: "#C8A98A" },
  { name: "焦糖", hex: "#A9744F" },
  { name: "珊瑚橘", hex: "#E08E6D" },
  { name: "酒紅", hex: "#8E3B46" },
  { name: "薰衣草紫", hex: "#8E7CC3" },
  { name: "霧藍", hex: "#6C8EBF" },
  { name: "森林綠", hex: "#4A6350" },
  { name: "薄荷綠", hex: "#7FB5A6" },
  { name: "霧灰", hex: "#9AA0A6" },
  { name: "墨黑", hex: "#2B2B2B" },
];

function Swatch({ hex }: { hex: string }) {
  return <span className="h-5 w-5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: hex || "#ffffff" }} />;
}

/** 主色選單：色塊＋名稱下拉，另附自訂顏色。 */
export default function ColorSelect({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = PALETTE.find((c) => c.hex.toLowerCase() === (value || "").toLowerCase());
  const label = current?.name ?? (value ? "自訂顏色" : "選擇顏色");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Swatch hex={value} />
          <span className="truncate text-gray-800">{label}</span>
          {!!value && <span className="text-xs text-gray-400">{value.toUpperCase()}</span>}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => { onChange(c.hex); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Swatch hex={c.hex} />
              <span className="flex-1 text-left text-gray-800">{c.name}</span>
              <span className="text-xs text-gray-400">{c.hex}</span>
              {current?.hex === c.hex && <Check size={14} className="text-rose-brand" />}
            </button>
          ))}
          <label className="flex w-full cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm hover:bg-gray-50">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(event) => onChange(event.target.value)}
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="flex-1 text-left text-gray-800">自訂顏色…</span>
          </label>
        </div>
      )}
    </div>
  );
}
