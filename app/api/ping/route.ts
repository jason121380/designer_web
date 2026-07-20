// 保溫用的超輕量公開端點：不查 DB、不需登入，僅回 200。
// 讓外部監控（如 UptimeRobot）每幾分鐘打一次，避免 Zeabur 容器閒置休眠、下一個訪客遇到冷啟動。
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}
