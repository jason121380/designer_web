"use client";

import { useEffect, useState } from "react";
import { DatabaseBackup, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

export default function EngineeringTools() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ scanned: number; added: number; updated: number } | null>(null);
  const [iconUrl, setIconUrl] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ scanned: number; migrated: number; failed: number } | null>(null);

  useEffect(() => {
    fetch("/api/site-icon").then((res) => (res.ok ? res.json() : { url: "" })).then((body) => setIconUrl(body.url || "")).catch(() => {});
  }, []);

  async function saveIcon(url: string) {
    setIconUrl(url);
    try {
      const res = await fetch("/api/site-icon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) throw new Error("儲存失敗");
      toast.success(url ? "已更新網站圖示" : "已清除網站圖示");
    } catch {
      toast.error("儲存失敗");
    }
  }

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

  async function migrateVideos() {
    setMigrating(true);
    try {
      const res = await fetch("/api/media/migrate-videos-to-stream", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "搬移失敗");
      const failedCount = Array.isArray(body.failed) ? body.failed.length : 0;
      setMigrateResult({ scanned: body.scanned ?? 0, migrated: body.migrated ?? 0, failed: failedCount });
      if (body.migrated > 0) {
        toast.success(`已搬移 ${body.migrated} 支影片到 Stream，Cloudflare 轉檔中，稍待即可播放`);
      } else if (body.scanned === 0) {
        toast.success("沒有需要搬移的舊影片（都已在 Stream 或無影片）");
      } else {
        toast.error("沒有影片搬移成功，請看下方失敗訊息");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "搬移失敗");
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工程模式</h1>
        <p className="mt-1 text-sm text-gray-400">僅管理員可用的維護工具。</p>
      </div>

      <div className="space-y-5">
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

        <div className="border border-gray-200 bg-white rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-brand/10 text-rose-brand"><Film size={20} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900">把舊影片搬到 Stream</h2>
              <p className="mt-1 text-sm text-gray-500">掃描所有頁面的首屏影片與作品影片，把還在 R2 的舊影片自動匯入 Cloudflare Stream（自動轉檔＋串流播放，載入更快），並把前台引用一次換成新網址。需先設定 Stream 環境變數。安全可重複執行，已在 Stream 的會自動略過。搬移後 Cloudflare 需短暫轉檔，稍待即可播放；舊 R2 檔案會保留不刪除。</p>
              <button type="button" onClick={migrateVideos} disabled={migrating} className="mt-4 inline-flex items-center gap-2 bg-rose-brand rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {migrating ? "搬移中…" : "開始搬移"}
              </button>
              {migrateResult && (
                <p className="mt-3 text-sm text-gray-600">掃描 {migrateResult.scanned} 支，成功搬移 {migrateResult.migrated} 支{migrateResult.failed > 0 ? `、失敗 ${migrateResult.failed} 支` : ""}。</p>
              )}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-brand/10 text-rose-brand"><ImageIcon size={20} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900">網站圖示（favicon / App icon）</h2>
              <p className="mt-1 text-sm text-gray-500">上傳一張圖示，同時作為瀏覽器分頁 favicon 與加到主畫面的 App icon。建議正方形 PNG（512×512 以上）。留空則使用預設圖示。</p>
              <div className="mt-4 max-w-[200px]">
                <ImageUpload label="" aspect="aspect-square" value={iconUrl} onChange={saveIcon} />
              </div>
              <p className="mt-2 text-xs text-gray-400">更新後瀏覽器的 favicon 可能因快取需要一段時間或強制重整才會更新。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
