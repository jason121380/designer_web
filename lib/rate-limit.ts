/**
 * 輕量 in-memory rate-limit(單實例 Zeabur 用足夠)。
 * 不依賴 Redis,避免增加部署複雜度;搭配 Cloudflare Rate Limiting 為主防線。
 */

type Bucket = { count: number; reset: number };
const store = new Map<string, Bucket>();
const MAX_KEYS = 5000;

function prune(now: number) {
  if (store.size <= MAX_KEYS) return;
  // 先清掉過期 bucket
  for (const [k, v] of store) if (v.reset < now) store.delete(k);
  if (store.size <= MAX_KEYS) return;
  // 還是太多就砍掉最先插入的 500 筆(Map 保留插入順序)
  const it = store.keys();
  for (let i = 0; i < 500; i++) {
    const r = it.next();
    if (r.done || !r.value) break;
    store.delete(r.value);
  }
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  let b = store.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + opts.windowMs };
    store.set(key, b);
    prune(now);
  }
  b.count++;
  const remaining = Math.max(0, opts.limit - b.count);
  return {
    ok: b.count <= opts.limit,
    remaining,
    retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)),
  };
}

export function tooMany(retryAfter: number, msg = "Too many requests") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
    },
  });
}
