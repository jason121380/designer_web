"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import MediaUpload from "./MediaUpload";

/**
 * 多媒體上傳：管理一組圖片/影片網址。
 * - 每個已加入的媒體用 MediaUpload 呈現（可更換／移除，移除即從陣列刪除）。
 * - 最後一格為空的 MediaUpload 作為「新增」入口，上傳或選取後附加到陣列。
 * - 提供左右箭頭調整順序（順序即前台呈現順序）。
 */
export default function MultiMediaUpload({
  label,
  values,
  onChange,
}: {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const replaceAt = (index: number, url: string) => {
    const next = [...values];
    if (url) next[index] = url;
    else next.splice(index, 1); // 移除（MediaUpload 的「移除」回傳空字串）
    onChange(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      {label && <label className="mb-2 block text-xs font-medium text-gray-500">{label}</label>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {values.map((value, index) => (
          <div key={index} className="space-y-1">
            <MediaUpload aspect="aspect-square" value={value} onChange={(url) => replaceAt(index, url)} />
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="往前" className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowLeft size={14} /></button>
              <span className="text-[11px] text-gray-400">{index + 1}</span>
              <button type="button" onClick={() => move(index, 1)} disabled={index === values.length - 1} aria-label="往後" className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowRight size={14} /></button>
            </div>
          </div>
        ))}
        {/* 新增入口：空的上傳格，上傳/選取後附加 */}
        <MediaUpload aspect="aspect-square" value="" onChange={(url) => { if (url) onChange([...values, url]); }} />
      </div>
    </div>
  );
}
