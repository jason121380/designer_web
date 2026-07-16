/** 首頁尚未設定內容時顯示的維護頁（不顯示內建示範內容）。 */
export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-20 text-center">
      <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">Coming soon</p>
      <h1 className="mb-3 text-2xl font-semibold text-gray-900 md:text-3xl">網站建置中</h1>
      <p className="max-w-md text-sm leading-relaxed text-gray-500">內容準備中，敬請期待。</p>
    </main>
  );
}
