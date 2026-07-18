const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

interface UploadOptions {
  onProgress?: (percent: number) => void;
}

interface UploadResult {
  url: string;
  notice: string;
}

interface StreamUploadResponse {
  uid: string;
  uploadURL: string;
  iframeUrl: string;
}

interface R2UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  error?: string;
}

async function responseJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

async function registerUploadedMedia(url: string, init: RequestInit): Promise<string> {
  try {
    const response = await fetch(url, init);
    return response.ok ? "" : "影片已上傳，但媒體庫登錄失敗；目前欄位仍可正常使用此影片網址";
  } catch {
    return "影片已上傳，但媒體庫登錄失敗；目前欄位仍可正常使用此影片網址";
  }
}

function notices(...messages: string[]): string {
  return messages.filter(Boolean).join("；");
}

function xhrUpload({
  url,
  method,
  body,
  contentType,
  onProgress,
  errorMessage,
}: {
  url: string;
  method: "POST" | "PUT";
  body: XMLHttpRequestBodyInit;
  contentType?: string;
  onProgress?: (percent: number) => void;
  errorMessage: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(errorMessage));
      }
    };
    xhr.onerror = () => reject(new Error(errorMessage));
    xhr.send(body);
  });
}

/**
 * 後台影片共用上傳管線：優先上傳 Cloudflare Stream 取得轉碼串流，
 * 僅在 Stream 尚未設定（API 回 503）時回退 R2 原檔直傳。
 */
export async function uploadClientVideo(file: File, { onProgress }: UploadOptions = {}): Promise<UploadResult> {
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) throw new Error("僅支援 mp4、webm、mov 影片");
  if (file.size > MAX_VIDEO_SIZE) throw new Error("影片大小不得超過 200MB");

  const streamResponse = await fetch("/api/cloudflare/stream/direct-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxDurationSeconds: 21600 }),
  });

  if (streamResponse.ok) {
    const stream = await responseJson<StreamUploadResponse>(streamResponse);
    if (!stream.uid || !stream.uploadURL || !stream.iframeUrl) throw new Error("Cloudflare Stream 回傳資料不完整");

    const form = new FormData();
    form.append("file", file);
    await xhrUpload({
      url: stream.uploadURL,
      method: "POST",
      body: form,
      onProgress,
      errorMessage: "上傳到 Cloudflare Stream 失敗",
    });

    const registrationNotice = await registerUploadedMedia("/api/cloudflare/stream/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: stream.uid,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      }),
    });

    return {
      url: stream.iframeUrl,
      notice: notices("影片已上傳，Cloudflare 正在轉檔，稍待片刻即可正常播放", registrationNotice),
    };
  }

  if (streamResponse.status !== 503) {
    const info = await responseJson<{ error?: string }>(streamResponse);
    throw new Error(info.error ?? "取得 Cloudflare Stream 上傳連結失敗");
  }

  const r2Response = await fetch("/api/upload/video-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const r2 = await responseJson<R2UploadResponse>(r2Response);
  if (!r2Response.ok || !r2.uploadUrl || !r2.publicUrl) throw new Error(r2.error ?? "取得 R2 上傳連結失敗");

  await xhrUpload({
    url: r2.uploadUrl,
    method: "PUT",
    body: file,
    contentType: file.type,
    onProgress,
    errorMessage: "上傳到 R2 失敗（請確認 R2 CORS 設定）",
  });

  const registrationNotice = await registerUploadedMedia("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: r2.publicUrl,
      mimeType: file.type,
      size: file.size,
      originalName: file.name,
    }),
  });

  return {
    url: r2.publicUrl,
    notice: notices(
      file.type === "video/quicktime"
        ? ".mov 在部分 Chrome／Android 可能無法播放，若前台無法播放建議改上傳 MP4（H.264）"
        : "",
      registrationNotice
    ),
  };
}
