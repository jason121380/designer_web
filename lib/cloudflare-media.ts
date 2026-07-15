import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
