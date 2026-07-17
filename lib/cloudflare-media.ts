import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type EnvLike = Record<string, string | undefined>;

export function isR2Configured(env: EnvLike = process.env) {
  return Boolean(
    env.CLOUDFLARE_R2_ACCOUNT_ID &&
      env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      env.CLOUDFLARE_R2_BUCKET &&
      env.CLOUDFLARE_R2_PUBLIC_URL
  );
}

export function isStreamConfigured(env: EnvLike = process.env) {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_STREAM_API_TOKEN);
}

export function buildR2PublicUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

export function buildStreamIframeUrl(uid: string) {
  return `https://iframe.videodelivery.net/${uid}`;
}

export function buildStreamThumbnailUrl(uid: string) {
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
}

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000, immutable",
}: {
  key: string;
  body: Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  if (!isR2Configured()) throw new Error("Cloudflare R2 尚未設定");

  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return buildR2PublicUrl(process.env.CLOUDFLARE_R2_PUBLIC_URL!, key);
}

/**
 * 產生 R2 直傳用的 presigned PUT URL（瀏覽器直接上傳，不經伺服器，適合大檔如影片）。
 * 回傳簽名後的上傳 URL 與上傳完成後的公開播放 URL。
 * 注意：簽名包含 ContentType，前端 PUT 時必須帶相同的 `Content-Type` 標頭。
 */
export async function getR2PresignedUploadUrl({
  key,
  contentType,
  expiresIn = 600,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  if (!isR2Configured()) throw new Error("Cloudflare R2 尚未設定");

  const uploadUrl = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );

  return {
    uploadUrl,
    publicUrl: buildR2PublicUrl(process.env.CLOUDFLARE_R2_PUBLIC_URL!, key),
  };
}

/** 從公開網址反推 R2 物件 key；非本站 R2 網址（例如外部貼上的網址）回 null。 */
export function r2KeyFromPublicUrl(url: string, env: EnvLike = process.env): string | null {
  const base = env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!base || !url) return null;
  const prefix = `${base.replace(/\/+$/, "")}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

/** 從 R2 刪除物件（媒體庫刪除時使用）。 */
export async function deleteFromR2(key: string) {
  if (!isR2Configured()) throw new Error("Cloudflare R2 尚未設定");
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET!, Key: key })
  );
}

export async function createStreamDirectUpload(maxDurationSeconds: number) {
  if (!isStreamConfigured()) throw new Error("Cloudflare Stream 尚未設定");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds }),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message ?? "建立 Cloudflare Stream 上傳 URL 失敗");
  }
  return data.result as { uploadURL: string; uid: string };
}
