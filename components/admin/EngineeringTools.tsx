"use client";

import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { toast } from "sonner";

export default function EngineeringTools() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ scanned: number; added: number; updated: number } | null>(null);

  async function backfill() {
    setRunning(true);
    try {
      const res = await fetch("/api/media/backfill", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "回填失敗");
      setResult({ scanned: body.scanned ?? 0, added: body.added ?? 0, updated: body.updated ?? 0 });
      toast.success(`回填完成：新增 ${body.added ?? 0} 筆、補大小 ${body.updated ?? 0} 筆`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "回填失敗");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工程模式</h1>
        <p className="mt-1 text-sm text-gray-400">僅管理員可用的維護工具。</p>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-brand/10 text-rose-brand"><DatabaseBackup size={20} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900">回填媒體庫</h2>
            <p className="mt-1 text-sm text-gray-500">掃描所有頁面內容，把尚未列在媒體庫的媒體網址補進來，並回補缺少的檔案大小（主要用於這次改版前上傳、沒有紀錄的舊影片）。安全可重複執行，已存在的不會重複新增。</p>
            <button type="button" onClick={backfill} disabled={running} className="mt-4 inline-flex items-center gap-2 bg-rose-brand rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {running ? "回填中…" : "開始回填"}
            </button>
            {result && (
              <p className="mt-3 text-sm text-gray-600">掃描 {result.scanned} 個網址，新增 {result.added} 筆、補上大小 {result.updated} 筆。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
