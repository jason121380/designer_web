import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { normalizeDesignerWebContent } from "@/lib/designer-web-content";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

async function requireEditor() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) return null;
  return { id: user.id };
}

/** 從頁面內容擷取關鍵資訊，做為 AI 產生 SEO 的依據。 */
function buildSummary(content: ReturnType<typeof normalizeDesignerWebContent>): string {
  const parts: string[] = [`品牌名稱：${content.brand.name}`];
  if (content.brand.tagline) parts.push(`標語：${content.brand.tagline}`);
  if (content.hero.heading) parts.push(`主標題：${content.hero.heading.replace(/\s*\n\s*/g, "、")}`);
  const services = [...content.services, ...content.otherServices].map((s) => s.title).filter(Boolean);
  if (services.length) parts.push(`服務項目：${services.join("、")}`);
  const pricing = content.pricing.map((p) => p.name).filter(Boolean);
  if (pricing.length) parts.push(`價目：${pricing.join("、")}`);
  if (content.contact.address) parts.push(`地址：${content.contact.address}`);
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  const user = await requireEditor();
  if (!user) return NextResponse.json({ error: "需要管理員或編輯身分" }, { status: 403 });

  const rl = rateLimit(`seo-generate:${user.id}`, { limit: 20, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter, "AI 產生太頻繁，請稍後再試");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "尚未設定 GEMINI_API_KEY，請先在環境變數加入金鑰" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請提供頁面內容" }, { status: 400 });
  }

  const content = normalizeDesignerWebContent(body);
  const summary = buildSummary(content);

  const prompt = [
    "你是一位專精繁體中文的 SEO 文案專家。根據以下一頁式網站內容，產生用於 Google 搜尋結果與 Google Ads 到達頁的 SEO 標題與描述。",
    "要求：",
    "- title：15 到 30 字，包含品牌、核心服務與地區關鍵字，能吸引點擊，不要加引號。",
    "- description：60 到 100 字，自然帶入關鍵字，說明服務特色並帶一句行動呼籲。",
    "- 全部使用繁體中文，語氣自然，不要出現 Markdown 或多餘符號。",
    "",
    "網站內容：",
    summary,
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { title: { type: "STRING" }, description: { type: "STRING" } },
            required: ["title", "description"],
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Gemini SEO 產生失敗", res.status, detail.slice(0, 500));
      return NextResponse.json({ error: `AI 產生失敗（${res.status}）` }, { status: 502 });
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ error: "AI 沒有回傳內容，請再試一次" }, { status: 502 });

    let parsed: { title?: string; description?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI 回傳格式異常，請再試一次" }, { status: 502 });
    }

    const title = (parsed.title ?? "").trim();
    const description = (parsed.description ?? "").trim();
    if (!title && !description) return NextResponse.json({ error: "AI 產生的內容為空，請再試一次" }, { status: 502 });

    return NextResponse.json({ title, description });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({ error: aborted ? "AI 產生逾時，請再試一次" : "AI 產生失敗，請再試一次" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
