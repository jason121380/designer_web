"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GripVertical, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SECTION_DEFS, type DesignerWebContent, type PageService } from "@/lib/designer-web-content";
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";
import MediaUpload from "./MediaUpload";
import ColorSelect from "./ColorSelect";

const inputClass = "w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";
const textareaClass = `${inputClass} min-h-24 resize-y`;
const rowClass = "space-y-4 border-b border-gray-100 py-5 first:pt-0 last:border-b-0 last:pb-0";

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span><input className={inputClass} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span><textarea className={textareaClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-rose-brand"><Plus size={15} />{label}</button>;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500"><Trash2 size={13} />移除</button>;
}

const updateAt = <T,>(items: T[], index: number, patch: Partial<T>) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
const removeAt = <T,>(items: T[], index: number) => items.filter((_, itemIndex) => itemIndex !== index);
const splitList = (value: string) => value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// 左側選單分組：基本設定與內容區塊（id 對應 panels 的 id）。
const MENU_GROUPS: { title: string; ids: string[] }[] = [
  { title: "基本設定", ids: ["brand", "hero", "sections", "seo"] },
  { title: "內容區塊", ids: ["promos", "services", "otherServices", "videos", "installment", "pricing", "environment", "contact"] },
];

function ServiceRows({ items, onChange }: { items: PageService[]; onChange: (items: PageService[]) => void }) {
  return <>{items.map((item, index) => <div key={item.id} className={rowClass}>
    <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">項目 {index + 1}</p><RemoveButton onClick={() => onChange(removeAt(items, index))} /></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="標題" value={item.title} onChange={(title) => onChange(updateAt(items, index, { title }))} />
      <Field label="價格（選填）" value={item.price} onChange={(price) => onChange(updateAt(items, index, { price }))} />
    </div>
    <TextArea label="介紹" value={item.description} onChange={(description) => onChange(updateAt(items, index, { description }))} />
    <div className="grid gap-4 md:grid-cols-2">
      <TextArea label="特色（逗號或換行分隔）" value={item.features.join("\n")} onChange={(value) => onChange(updateAt(items, index, { features: splitList(value) }))} />
      <TextArea label="適合對象（逗號或換行分隔）" value={item.suitableFor.join("\n")} onChange={(value) => onChange(updateAt(items, index, { suitableFor: splitList(value) }))} />
    </div>
    <MediaUpload label="項目圖片或影片" value={item.image} onChange={(image) => onChange(updateAt(items, index, { image }))} />
  </div>)}</>;
}

export default function PageManagementForm({ initialContent, slug }: { initialContent: DesignerWebContent; slug: string }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState("brand");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const apiPath = `/api/designer-web/${slug}`;
  const previewPath = `/${slug}`;

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(apiPath, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "儲存失敗");
      setContent(body);
      toast.success("頁面設定已儲存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function generateSeo() {
    setAiLoading(true);
    try {
      const response = await fetch("/api/seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI 產生失敗");
      setContent((prev) => ({ ...prev, seo: { ...prev.seo, title: body.title || prev.seo.title, description: body.description || prev.seo.description } }));
      toast.success("已用 AI 填入 SEO 標題與描述");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 產生失敗");
    } finally {
      setAiLoading(false);
    }
  }

  function reorderSection(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= content.sections.length || to >= content.sections.length) return;
    const next = [...content.sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setContent({ ...content, sections: next });
  }
  function updateSection(index: number, patch: Partial<DesignerWebContent["sections"][number]>) {
    setContent({ ...content, sections: content.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  const panels: { id: string; title: string; description?: string; body: ReactNode }[] = [
    {
      id: "brand",
      title: "網站基本設定",
      description: "品牌名稱、標語與主色",
      body: (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="網頁標題（瀏覽器分頁與 SEO 標題）" value={content.brand.name} onChange={(name) => setContent({ ...content, brand: { ...content.brand, name } })} />
          <Field label="標題設定（顯示於選單列左上）" value={content.brand.tagline} onChange={(tagline) => setContent({ ...content, brand: { ...content.brand, tagline } })} />
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">選單列底色（Header 底色）</span><ColorSelect value={content.brand.themeColor} onChange={(themeColor) => setContent({ ...content, brand: { ...content.brand, themeColor } })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">選單列文字顏色</span><ColorSelect value={content.brand.headerTextColor} onChange={(headerTextColor) => setContent({ ...content, brand: { ...content.brand, headerTextColor } })} /></label>
        </div>
      ),
    },
    {
      id: "hero",
      title: "Banner 橫幅設定",
      description: "首頁第一個畫面、主標題與形象媒體。可放最多兩個媒體（圖片或影片），手機上下、電腦左右排列",
      body: (
        <>
          <TextArea label="主標題（顯示於首屏，可自訂文字）" value={content.hero.heading} onChange={(heading) => setContent({ ...content, hero: { ...content.hero, heading } })} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">主標題文字顏色</span><ColorSelect value={content.hero.headingColor} onChange={(headingColor) => setContent({ ...content, hero: { ...content.hero, headingColor } })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">Banner 底色</span><ColorSelect value={content.hero.bgColor} onChange={(bgColor) => setContent({ ...content, hero: { ...content.hero, bgColor } })} /></label>
          </div>
          <div className="mt-6 space-y-5">
            <p className="text-xs text-gray-400">固定一張圖片、一支影片；前台電腦版左圖右影、手機版上下排列。留空的不會顯示。</p>
            <ImageUpload label="首屏圖片（左）" value={content.hero.image} onChange={(image) => setContent({ ...content, hero: { ...content.hero, image } })} />
            <VideoUpload label="首屏影片（右）" value={content.hero.video} onChange={(video) => setContent({ ...content, hero: { ...content.hero, video } })} />
          </div>
        </>
      ),
    },
    {
      id: "sections",
      title: "區塊設定",
      description: "調整前台區塊的排列順序，並自訂各區塊的中英文標題與底色",
      body: (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">拖曳最前方把手可調整順序；每列可改中文、英文標題與區塊底色。</p>
          <div className="hidden items-center gap-2 px-2 text-xs font-medium text-gray-400 md:flex">
            <span className="w-4 shrink-0" />
            <span className="min-w-[110px] flex-1">中文標題</span>
            <span className="min-w-[110px] flex-1">英文標題（選填）</span>
            <span className="min-w-[150px] flex-1">區塊底色</span>
          </div>
          {content.sections.map((sec, index) => {
            const def = SECTION_DEFS.find((d) => d.key === sec.key);
            return (
              <div
                key={sec.key}
                onDragOver={(event) => { event.preventDefault(); if (dragIndex !== null && dragIndex !== index) { reorderSection(dragIndex, index); setDragIndex(index); } }}
                className={`flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 ${dragIndex === index ? "opacity-40" : ""}`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => setDragIndex(null)}
                  aria-label={`拖曳排序：${def?.zh ?? sec.key}`}
                  className="shrink-0 cursor-grab px-0.5 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                >
                  <GripVertical size={16} />
                </button>
                <div className="min-w-[110px] flex-1"><input className={inputClass} value={sec.zh} placeholder="中文標題" onChange={(event) => updateSection(index, { zh: event.target.value })} /></div>
                <div className="min-w-[110px] flex-1"><input className={inputClass} value={sec.en} placeholder="英文（選填）" onChange={(event) => updateSection(index, { en: event.target.value })} /></div>
                <div className="min-w-[150px] flex-1"><ColorSelect value={sec.bg} onChange={(bg) => updateSection(index, { bg })} /></div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "promos",
      title: "活動 DM",
      description: "沒有圖片時前台自動隱藏",
      body: (
        <>
          {content.promos.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, promos: removeAt(content.promos, index) })} /></div><MediaUpload label={`DM 圖片或影片 ${index + 1}`} value={item.image} onChange={(image) => setContent({ ...content, promos: updateAt(content.promos, index, { image }) })} /><Field label="圖片說明" value={item.caption} onChange={(caption) => setContent({ ...content, promos: updateAt(content.promos, index, { caption }) })} /></div>)}
          <AddButton label="新增 DM" onClick={() => setContent({ ...content, promos: [...content.promos, { id: makeId("dm"), image: "", caption: "" }] })} />
        </>
      ),
    },
    {
      id: "services",
      title: "接髮介紹",
      body: (
        <>
          <ServiceRows items={content.services} onChange={(services) => setContent({ ...content, services })} />
          <AddButton label="新增接髮項目" onClick={() => setContent({ ...content, services: [...content.services, { id: makeId("service"), title: "", description: "", features: [], suitableFor: [], image: "", price: "" }] })} />
        </>
      ),
    },
    {
      id: "otherServices",
      title: "特色項目",
      body: (
        <>
          <ServiceRows items={content.otherServices} onChange={(otherServices) => setContent({ ...content, otherServices })} />
          <AddButton label="新增特色項目" onClick={() => setContent({ ...content, otherServices: [...content.otherServices, { id: makeId("other"), title: "", description: "", features: [], suitableFor: [], image: "", price: "" }] })} />
        </>
      ),
    },
    {
      id: "videos",
      title: "作品影片",
      description: "直接上傳影片（存 Cloudflare R2）或貼上播放網址；沒有影片時前台自動隱藏",
      body: (
        <>
          {content.videos.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, videos: removeAt(content.videos, index) })} /></div><VideoUpload label={`作品影片 ${index + 1}`} value={item.video} onChange={(video) => setContent({ ...content, videos: updateAt(content.videos, index, { video }) })} /><div className="grid gap-4 md:grid-cols-2"><Field label="影片說明" value={item.caption} onChange={(caption) => setContent({ ...content, videos: updateAt(content.videos, index, { caption }) })} /><Field label="分類（選填，同名歸為同一類，前台可切換）" value={item.category} onChange={(category) => setContent({ ...content, videos: updateAt(content.videos, index, { category }) })} /></div></div>)}
          <AddButton label="新增作品影片" onClick={() => setContent({ ...content, videos: [...content.videos, { id: makeId("video"), video: "", caption: "", category: "" }] })} />
        </>
      ),
    },
    {
      id: "installment",
      title: "分期資訊",
      body: (
        <>
          {content.installment.map((item, index) => <div key={index} className={`${rowClass} flex items-start gap-3`}><div className="flex-1"><TextArea label={`說明 ${index + 1}`} value={item} onChange={(value) => setContent({ ...content, installment: content.installment.map((current, itemIndex) => itemIndex === index ? value : current) })} /></div><div className="pt-7"><RemoveButton onClick={() => setContent({ ...content, installment: removeAt(content.installment, index) })} /></div></div>)}
          <AddButton label="新增分期說明" onClick={() => setContent({ ...content, installment: [...content.installment, ""] })} />
        </>
      ),
    },
    {
      id: "pricing",
      title: "價目表",
      body: (
        <>
          {content.pricing.map((item, index) => <div key={index} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, pricing: removeAt(content.pricing, index) })} /></div><div className="grid gap-4 md:grid-cols-2"><Field label="服務名稱" value={item.name} onChange={(name) => setContent({ ...content, pricing: updateAt(content.pricing, index, { name }) })} /><Field label="價格" value={item.price} onChange={(price) => setContent({ ...content, pricing: updateAt(content.pricing, index, { price }) })} /></div><TextArea label="說明" value={item.description} onChange={(description) => setContent({ ...content, pricing: updateAt(content.pricing, index, { description }) })} /><TextArea label="特色（逗號或換行分隔）" value={item.features.join("\n")} onChange={(value) => setContent({ ...content, pricing: updateAt(content.pricing, index, { features: splitList(value) }) })} /></div>)}
          <AddButton label="新增價目" onClick={() => setContent({ ...content, pricing: [...content.pricing, { name: "", price: "", description: "", features: [] }] })} />
        </>
      ),
    },
    {
      id: "environment",
      title: "環境介紹",
      description: "沒有照片時前台自動隱藏",
      body: (
        <>
          {content.environment.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, environment: removeAt(content.environment, index) })} /></div><MediaUpload label={`環境照片或影片 ${index + 1}`} value={item.image} onChange={(image) => setContent({ ...content, environment: updateAt(content.environment, index, { image }) })} /><Field label="圖片說明" value={item.alt} onChange={(alt) => setContent({ ...content, environment: updateAt(content.environment, index, { alt }) })} /></div>)}
          <AddButton label="新增環境照片" onClick={() => setContent({ ...content, environment: [...content.environment, { id: makeId("environment"), image: "", alt: "" }] })} />
        </>
      ),
    },
    {
      id: "contact",
      title: "聯絡資訊",
      body: (
        <div className="grid gap-4 md:grid-cols-2">
          {([['地址', 'address'], ['Google Maps 連結', 'mapUrl'], ['電話', 'phone'], ['Email', 'email'], ['LINE 連結', 'line'], ['Instagram 連結', 'instagram'], ['Facebook 連結', 'facebook'], ['Google Map 嵌入 URL', 'mapEmbedUrl']] as const).map(([label, key]) => <Field key={key} label={label} value={content.contact[key]} onChange={(value) => setContent({ ...content, contact: { ...content.contact, [key]: value } })} />)}
        </div>
      ),
    },
    {
      id: "seo",
      title: "SEO 設定",
      description: "此頁在搜尋結果與廣告到達頁的標題、描述與分享圖；未填時自動使用品牌與主標題",
      body: (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-brand/5 p-3">
            <p className="text-xs text-gray-500">依本頁內容用 AI 自動產生 SEO 標題與描述</p>
            <button type="button" onClick={generateSeo} disabled={aiLoading} className="inline-flex shrink-0 items-center gap-1.5 bg-rose-brand rounded-lg px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"><Sparkles size={14} />{aiLoading ? "AI 產生中…" : "AI 自動填寫"}</button>
          </div>
          <Field label="SEO 標題（搜尋結果與分頁標題）" value={content.seo.title} placeholder={content.brand.name} onChange={(title) => setContent({ ...content, seo: { ...content.seo, title } })} />
          <div className="mt-4">
            <TextArea label="SEO 描述（搜尋結果摘要，建議 80-150 字）" value={content.seo.description} onChange={(description) => setContent({ ...content, seo: { ...content.seo, description } })} />
          </div>
          <div className="mt-4">
            <ImageUpload label="社群分享圖（og:image，建議 1200x630）" value={content.seo.ogImage} onChange={(ogImage) => setContent({ ...content, seo: { ...content.seo, ogImage } })} />
          </div>
        </>
      ),
    },
  ];
  const current = panels.find((panel) => panel.id === active) ?? panels[0];

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <Link href="/admin/page-management" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"><ArrowLeft size={15} />回頁面列表</Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">編輯頁面：{previewPath}</h1><p className="mt-1 text-sm text-gray-400">左側選單切換區塊，右側編輯內容。</p></div>
        <div className="flex gap-2">
          <a href={previewPath} target="_blank" className="inline-flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600"><ExternalLink size={15} />預覽前台</a>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? "儲存中" : "儲存設定"}</button>
        </div>
      </div>

      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
        <nav className="mb-4 md:mb-0 md:sticky md:top-4 md:self-start">
          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mb-3 last:mb-0 md:mb-4">
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.title}</p>
              <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
                {group.ids.map((id) => {
                  const panel = panels.find((item) => item.id === id);
                  if (!panel) return null;
                  return (
                    <li key={panel.id} className="shrink-0">
                      <button type="button" onClick={() => setActive(panel.id)} className={`w-full whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition ${panel.id === active ? "bg-rose-brand text-white" : "text-gray-600 hover:bg-gray-100"}`}>{panel.title}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border border-gray-200 bg-white rounded-lg p-5 md:p-7">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">{current.title}</h2>
            {!!current.description && <p className="mt-1 text-sm text-gray-400">{current.description}</p>}
          </div>
          {current.body}
        </div>
      </div>
    </div>
  );
}
