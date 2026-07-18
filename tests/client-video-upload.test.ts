import assert from "node:assert/strict";
import { uploadClientVideo } from "../lib/client-video-upload";

const originalFetch = globalThis.fetch;
const originalXMLHttpRequest = globalThis.XMLHttpRequest;

class FakeXMLHttpRequest {
  static requests: { method: string; url: string; body: XMLHttpRequestBodyInit | null }[] = [];

  status = 200;
  upload = { onprogress: null as ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private method = "";
  private url = "";

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader() {}

  send(body: XMLHttpRequestBodyInit | null) {
    FakeXMLHttpRequest.requests.push({ method: this.method, url: this.url, body });
    this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 1 });
    this.onload?.();
  }
}

function response(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(responses: Response[]): string[] {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    const next = responses.shift();
    if (!next) throw new Error("測試缺少 mock response");
    return next;
  }) as typeof fetch;
  return calls;
}

void (async () => {
  globalThis.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
  const file = new File(["video"], "sample.mp4", { type: "video/mp4" });

  try {
    // Stream 成功時不碰 R2；complete 非 2xx 必須顯示登錄警告。
    FakeXMLHttpRequest.requests = [];
    let calls = mockFetch([
      response({ uid: "stream-uid", uploadURL: "https://upload.example/stream", iframeUrl: "https://iframe.videodelivery.net/stream-uid" }, 200),
      response({ error: "database failed" }, 500),
    ]);
    const streamResult = await uploadClientVideo(file);
    assert.equal(streamResult.url, "https://iframe.videodelivery.net/stream-uid");
    assert.match(streamResult.notice, /媒體庫登錄失敗/);
    assert.deepEqual(calls, ["/api/cloudflare/stream/direct-upload", "/api/cloudflare/stream/complete"]);
    assert.equal(FakeXMLHttpRequest.requests[0]?.method, "POST");

    // 只有 503 允許 fallback R2；media 非 2xx 同樣保留 URL 並回報警告。
    FakeXMLHttpRequest.requests = [];
    calls = mockFetch([
      response({ error: "Stream 未設定" }, 503),
      response({ uploadUrl: "https://upload.example/r2", publicUrl: "https://cdn.example/video.mp4" }, 200),
      response({ error: "database failed" }, 500),
    ]);
    const r2Result = await uploadClientVideo(file);
    assert.equal(r2Result.url, "https://cdn.example/video.mp4");
    assert.match(r2Result.notice, /媒體庫登錄失敗/);
    assert.deepEqual(calls, ["/api/cloudflare/stream/direct-upload", "/api/upload/video-url", "/api/media"]);
    assert.equal(FakeXMLHttpRequest.requests[0]?.method, "PUT");

    // Stream 的非 503 錯誤不得偷偷回退 R2。
    FakeXMLHttpRequest.requests = [];
    calls = mockFetch([response({ error: "Stream API error" }, 500)]);
    await assert.rejects(() => uploadClientVideo(file), /Stream API error/);
    assert.deepEqual(calls, ["/api/cloudflare/stream/direct-upload"]);
    assert.equal(FakeXMLHttpRequest.requests.length, 0);

    console.log("client-video-upload.test.ts passed");
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXMLHttpRequest;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
