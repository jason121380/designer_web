import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 bg-white">
      <p className="text-rose-brand text-xs uppercase tracking-[0.3em] mb-4">404</p>
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
        找不到這個頁面
      </h1>
      <p className="text-gray-500 text-sm md:text-base max-w-md mb-10 leading-relaxed">
        這個頁面可能已被移除、改名，或從未存在。
      </p>
      <Link
        href="/"
        className="px-7 py-3 text-sm rounded-lg bg-gray-900 text-white hover:bg-rose-brand transition-colors"
      >
        回首頁
      </Link>
    </main>
  );
}
