"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DesignerWebContent, PageService } from "@/lib/designer-web-content";
import ImageUpload from "./ImageUpload";
import PageSectionPanel from "./PageSectionPanel";

const inputClass = "w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";
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
    <ImageUpload label="項目圖片" value={item.image} onChange={(image) => onChange(updateAt(items, index, { image }))} />
  </div>)}</>;
}

export default function PageManagementForm({ initialContent, slug }: { initialContent: DesignerWebContent; slug?: string }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  // slug 省略時編輯首頁（既有 /api/designer-web 與 / 路徑）
  const apiPath = slug ? `/api/designer-web/${slug}` : "/api/designer-web";
  const previewPath = slug ? `/${slug}` : "/";

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

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <Link href="/admin/page-management" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"><ArrowLeft size={15} />回頁面列表</Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">編輯頁面：{previewPath}</h1><p className="mt-1 text-sm text-gray-400">依照前台順序編輯各區塊內容。</p></div>
        <div className="flex gap-2">
          <a href={previewPath} target="_blank" className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600"><ExternalLink size={15} />預覽前台</a>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-rose-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? "儲存中" : "儲存設定"}</button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <PageSectionPanel title="品牌與導覽" description="品牌名稱、標語與主色" defaultOpen>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="品牌名稱" value={content.brand.name} onChange={(name) => setContent({ ...content, brand: { ...content.brand, name } })} />
            <Field label="品牌標語" value={content.brand.tagline} onChange={(tagline) => setContent({ ...content, brand: { ...content.brand, tagline } })} />
            <Field label="主色" type="color" value={content.brand.themeColor} onChange={(themeColor) => setContent({ ...content, brand: { ...content.brand, themeColor } })} />
          </div>
        </PageSectionPanel>

        <PageSectionPanel title="首屏形象" description="首頁第一個畫面、主標題與形象媒體">
          <TextArea label="主標題" value={content.hero.heading} onChange={(heading) => setContent({ ...content, hero: { ...content.hero, heading } })} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">媒體類型</span><select className={inputClass} value={content.hero.mediaType} onChange={(event) => setContent({ ...content, hero: { ...content.hero, mediaType: event.target.value as "image" | "video" } })}><option value="image">圖片</option><option value="video">影片</option></select></label>
            {content.hero.mediaType === "video" && <Field label="Cloudflare Stream 播放 URL" value={content.hero.mediaUrl} onChange={(mediaUrl) => setContent({ ...content, hero: { ...content.hero, mediaUrl } })} />}
          </div>
          {content.hero.mediaType === "image" && <div className="mt-4"><ImageUpload label="首屏圖片" value={content.hero.mediaUrl} onChange={(mediaUrl) => setContent({ ...content, hero: { ...content.hero, mediaUrl } })} /></div>}
        </PageSectionPanel>

        <PageSectionPanel title="活動 DM" description="沒有圖片時前台自動隱藏">
          {content.promos.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, promos: removeAt(content.promos, index) })} /></div><ImageUpload label={`DM 圖片 ${index + 1}`} value={item.image} onChange={(image) => setContent({ ...content, promos: updateAt(content.promos, index, { image }) })} /><Field label="圖片說明" value={item.caption} onChange={(caption) => setContent({ ...content, promos: updateAt(content.promos, index, { caption }) })} /></div>)}
          <AddButton label="新增 DM" onClick={() => setContent({ ...content, promos: [...content.promos, { id: makeId("dm"), image: "", caption: "" }] })} />
        </PageSectionPanel>

        <PageSectionPanel title="接髮介紹"><ServiceRows items={content.services} onChange={(services) => setContent({ ...content, services })} /><AddButton label="新增接髮項目" onClick={() => setContent({ ...content, services: [...content.services, { id: makeId("service"), title: "", description: "", features: [], suitableFor: [], image: "", price: "" }] })} /></PageSectionPanel>
        <PageSectionPanel title="其他服務"><ServiceRows items={content.otherServices} onChange={(otherServices) => setContent({ ...content, otherServices })} /><AddButton label="新增其他服務" onClick={() => setContent({ ...content, otherServices: [...content.otherServices, { id: makeId("other"), title: "", description: "", features: [], suitableFor: [], image: "", price: "" }] })} /></PageSectionPanel>

        <PageSectionPanel title="作品影片" description="使用 Cloudflare Stream 播放 URL；沒有影片時前台自動隱藏">
          {content.videos.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, videos: removeAt(content.videos, index) })} /></div><Field label="影片 URL" value={item.video} onChange={(video) => setContent({ ...content, videos: updateAt(content.videos, index, { video }) })} /><Field label="影片說明" value={item.caption} onChange={(caption) => setContent({ ...content, videos: updateAt(content.videos, index, { caption }) })} /></div>)}
          <AddButton label="新增作品影片" onClick={() => setContent({ ...content, videos: [...content.videos, { id: makeId("video"), video: "", caption: "" }] })} />
        </PageSectionPanel>

        <PageSectionPanel title="分期資訊">
          {content.installment.map((item, index) => <div key={index} className={`${rowClass} flex items-start gap-3`}><div className="flex-1"><TextArea label={`說明 ${index + 1}`} value={item} onChange={(value) => setContent({ ...content, installment: content.installment.map((current, itemIndex) => itemIndex === index ? value : current) })} /></div><div className="pt-7"><RemoveButton onClick={() => setContent({ ...content, installment: removeAt(content.installment, index) })} /></div></div>)}
          <AddButton label="新增分期說明" onClick={() => setContent({ ...content, installment: [...content.installment, ""] })} />
        </PageSectionPanel>

        <PageSectionPanel title="價目表">
          {content.pricing.map((item, index) => <div key={index} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, pricing: removeAt(content.pricing, index) })} /></div><div className="grid gap-4 md:grid-cols-2"><Field label="服務名稱" value={item.name} onChange={(name) => setContent({ ...content, pricing: updateAt(content.pricing, index, { name }) })} /><Field label="價格" value={item.price} onChange={(price) => setContent({ ...content, pricing: updateAt(content.pricing, index, { price }) })} /></div><TextArea label="說明" value={item.description} onChange={(description) => setContent({ ...content, pricing: updateAt(content.pricing, index, { description }) })} /><TextArea label="特色（逗號或換行分隔）" value={item.features.join("\n")} onChange={(value) => setContent({ ...content, pricing: updateAt(content.pricing, index, { features: splitList(value) }) })} /></div>)}
          <AddButton label="新增價目" onClick={() => setContent({ ...content, pricing: [...content.pricing, { name: "", price: "", description: "", features: [] }] })} />
        </PageSectionPanel>

        <PageSectionPanel title="環境介紹" description="沒有照片時前台自動隱藏">
          {content.environment.map((item, index) => <div key={item.id} className={rowClass}><div className="flex justify-end"><RemoveButton onClick={() => setContent({ ...content, environment: removeAt(content.environment, index) })} /></div><ImageUpload label={`環境照片 ${index + 1}`} value={item.image} onChange={(image) => setContent({ ...content, environment: updateAt(content.environment, index, { image }) })} /><Field label="圖片說明" value={item.alt} onChange={(alt) => setContent({ ...content, environment: updateAt(content.environment, index, { alt }) })} /></div>)}
          <AddButton label="新增環境照片" onClick={() => setContent({ ...content, environment: [...content.environment, { id: makeId("environment"), image: "", alt: "" }] })} />
        </PageSectionPanel>

        <PageSectionPanel title="聯絡資訊">
          <div className="grid gap-4 md:grid-cols-2">
            {([['地址', 'address'], ['Google Maps 連結', 'mapUrl'], ['電話', 'phone'], ['Email', 'email'], ['LINE 連結', 'line'], ['Instagram 連結', 'instagram'], ['Facebook 連結', 'facebook'], ['Google Map 嵌入 URL', 'mapEmbedUrl']] as const).map(([label, key]) => <Field key={key} label={label} value={content.contact[key]} onChange={(value) => setContent({ ...content, contact: { ...content.contact, [key]: value } })} />)}
          </div>
        </PageSectionPanel>
      </div>
    </div>
  );
}
