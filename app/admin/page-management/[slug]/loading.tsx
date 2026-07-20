/**
 * 編輯器載入骨架：點「一頁式網站／個人連結」後立即顯示，
 * 讓伺服器讀取該頁內容（查 DB）與載入大型表單的期間有即時回饋，不再像卡住。
 */
export default function EditorLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse pb-20" aria-hidden>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-gray-200" />
        <div className="h-9 w-24 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-gray-100" />
          ))}
        </div>
        <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-5">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-32 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-2/3 rounded-lg bg-gray-100" />
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-gray-400">載入編輯器…</p>
    </div>
  );
}
