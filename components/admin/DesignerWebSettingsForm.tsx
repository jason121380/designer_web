"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DesignerWebContent } from "@/lib/designer-web-content";

type ServiceItem = NonNullable<DesignerWebContent["services"]>[number];
type PortfolioItem = NonNullable<DesignerWebContent["portfolio"]>[number];
type PricingItem = NonNullable<DesignerWebContent["pricing"]>[number];
type ProcessItem = NonNullable<DesignerWebContent["process"]>[number];

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-rose-brand focus:ring-2 focus:ring-rose-light";
const textareaClass =
  "w-full min-h-24 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-rose-brand focus:ring-2 focus:ring-rose-light";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span>
      <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span>
      <textarea className={textareaClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export default function DesignerWebSettingsForm({ initialContent }: { initialContent: DesignerWebContent }) {
  const [content, setContent] = useState<DesignerWebContent>(initialContent);
  const [saving, setSaving] = useState(false);

  const services = content.services ?? [];
  const portfolio = content.portfolio ?? [];
  const pricing = content.pricing ?? [];
  const process = content.process ?? [];

  async function save() {
    setSaving(true);
    const res = await fetch("/api/designer-web", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error("儲存失敗，請確認登入身分");
      return;
    }

    setContent(await res.json());
    toast.success("前台內容已更新");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">前台內容</h1>
          <p className="mt-1 text-sm text-gray-400">管理 designer_web 一頁式首頁顯示的內容。</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
          >
            預覽前台
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-rose-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-dark disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存內容"}
          </button>
        </div>
      </div>

      <Panel title="品牌與首屏">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="品牌名稱" value={content.brand?.name ?? ""} onChange={(name) => setContent((c) => ({ ...c, brand: { ...c.brand, name } }))} />
          <Field label="品牌標語" value={content.brand?.tagline ?? ""} onChange={(tagline) => setContent((c) => ({ ...c, brand: { ...c.brand, tagline } }))} />
          <Field label="眉標" value={content.hero?.eyebrow ?? ""} onChange={(eyebrow) => setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow } }))} />
          <Field label="副標" value={content.hero?.subtitle ?? ""} onChange={(subtitle) => setContent((c) => ({ ...c, hero: { ...c.hero, subtitle } }))} />
          <div className="md:col-span-2">
            <Field label="主標題" value={content.hero?.title ?? ""} onChange={(title) => setContent((c) => ({ ...c, hero: { ...c.hero, title } }))} />
          </div>
          <div className="md:col-span-2">
            <TextArea label="首屏描述" value={content.hero?.description ?? ""} onChange={(description) => setContent((c) => ({ ...c, hero: { ...c.hero, description } }))} />
          </div>
          <Field label="主按鈕文字" value={content.hero?.primaryCtaLabel ?? ""} onChange={(primaryCtaLabel) => setContent((c) => ({ ...c, hero: { ...c.hero, primaryCtaLabel } }))} />
          <Field label="主按鈕連結" value={content.hero?.primaryCtaHref ?? ""} onChange={(primaryCtaHref) => setContent((c) => ({ ...c, hero: { ...c.hero, primaryCtaHref } }))} />
          <Field label="次按鈕文字" value={content.hero?.secondaryCtaLabel ?? ""} onChange={(secondaryCtaLabel) => setContent((c) => ({ ...c, hero: { ...c.hero, secondaryCtaLabel } }))} />
          <Field label="次按鈕連結" value={content.hero?.secondaryCtaHref ?? ""} onChange={(secondaryCtaHref) => setContent((c) => ({ ...c, hero: { ...c.hero, secondaryCtaHref } }))} />
          <div className="md:col-span-2">
            <Field label="首屏圖片 URL" value={content.hero?.image ?? ""} onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))} />
          </div>
        </div>
      </Panel>

      <Panel title="活動公告">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="標題" value={content.announcement?.title ?? ""} onChange={(title) => setContent((c) => ({ ...c, announcement: { ...c.announcement, title } }))} />
          <Field label="內容" value={content.announcement?.body ?? ""} onChange={(body) => setContent((c) => ({ ...c, announcement: { ...c.announcement, body } }))} />
        </div>
      </Panel>

      <Panel title="服務項目">
        <div className="space-y-4">
          {services.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-4 md:grid-cols-3">
              <Field label="服務名稱" value={item.title ?? ""} onChange={(title) => setContent((c) => ({ ...c, services: updateAt(services, index, { title }) }))} />
              <Field label="價格" value={item.price ?? ""} onChange={(price) => setContent((c) => ({ ...c, services: updateAt(services, index, { price }) }))} />
              <div className="md:col-span-3">
                <TextArea label="描述" value={item.description ?? ""} onChange={(description) => setContent((c) => ({ ...c, services: updateAt(services, index, { description }) }))} />
              </div>
            </div>
          ))}
          <button type="button" className="text-sm font-medium text-rose-brand" onClick={() => setContent((c) => ({ ...c, services: [...services, { title: "", description: "", price: "" } as ServiceItem] }))}>
            ＋ 新增服務
          </button>
        </div>
      </Panel>

      <Panel title="作品展示">
        <div className="space-y-4">
          {portfolio.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-4 md:grid-cols-3">
              <Field label="作品名稱" value={item.title ?? ""} onChange={(title) => setContent((c) => ({ ...c, portfolio: updateAt(portfolio, index, { title }) }))} />
              <Field label="分類" value={item.category ?? ""} onChange={(category) => setContent((c) => ({ ...c, portfolio: updateAt(portfolio, index, { category }) }))} />
              <Field label="圖片 URL" value={item.image ?? ""} onChange={(image) => setContent((c) => ({ ...c, portfolio: updateAt(portfolio, index, { image }) }))} />
            </div>
          ))}
          <button type="button" className="text-sm font-medium text-rose-brand" onClick={() => setContent((c) => ({ ...c, portfolio: [...portfolio, { title: "", category: "", image: "" } as PortfolioItem] }))}>
            ＋ 新增作品
          </button>
        </div>
      </Panel>

      <Panel title="價目方案">
        <div className="space-y-4">
          {pricing.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-4 md:grid-cols-3">
              <Field label="方案名稱" value={item.name ?? ""} onChange={(name) => setContent((c) => ({ ...c, pricing: updateAt(pricing, index, { name }) }))} />
              <Field label="價格" value={item.price ?? ""} onChange={(price) => setContent((c) => ({ ...c, pricing: updateAt(pricing, index, { price }) }))} />
              <Field
                label="特色（以逗號分隔）"
                value={(item.features ?? []).join("，")}
                onChange={(value) => setContent((c) => ({ ...c, pricing: updateAt(pricing, index, { features: value.split(/[，,]/).map((v) => v.trim()).filter(Boolean) }) }))}
              />
              <div className="md:col-span-3">
                <TextArea label="描述" value={item.description ?? ""} onChange={(description) => setContent((c) => ({ ...c, pricing: updateAt(pricing, index, { description }) }))} />
              </div>
            </div>
          ))}
          <button type="button" className="text-sm font-medium text-rose-brand" onClick={() => setContent((c) => ({ ...c, pricing: [...pricing, { name: "", price: "", description: "", features: [] } as PricingItem] }))}>
            ＋ 新增方案
          </button>
        </div>
      </Panel>

      <Panel title="流程與聯絡">
        <div className="mb-6 space-y-4">
          {process.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-4 md:grid-cols-2">
              <Field label="流程標題" value={item.title ?? ""} onChange={(title) => setContent((c) => ({ ...c, process: updateAt(process, index, { title }) }))} />
              <Field label="流程描述" value={item.description ?? ""} onChange={(description) => setContent((c) => ({ ...c, process: updateAt(process, index, { description }) }))} />
            </div>
          ))}
          <button type="button" className="text-sm font-medium text-rose-brand" onClick={() => setContent((c) => ({ ...c, process: [...process, { title: "", description: "" } as ProcessItem] }))}>
            ＋ 新增流程
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="地址" value={content.contact?.address ?? ""} onChange={(address) => setContent((c) => ({ ...c, contact: { ...c.contact, address } }))} />
          <Field label="電話" value={content.contact?.phone ?? ""} onChange={(phone) => setContent((c) => ({ ...c, contact: { ...c.contact, phone } }))} />
          <Field label="Email" value={content.contact?.email ?? ""} onChange={(email) => setContent((c) => ({ ...c, contact: { ...c.contact, email } }))} />
          <Field label="Line 連結" value={content.contact?.line ?? ""} onChange={(line) => setContent((c) => ({ ...c, contact: { ...c.contact, line } }))} />
          <Field label="Instagram" value={content.contact?.instagram ?? ""} onChange={(instagram) => setContent((c) => ({ ...c, contact: { ...c.contact, instagram } }))} />
          <Field label="Facebook" value={content.contact?.facebook ?? ""} onChange={(facebook) => setContent((c) => ({ ...c, contact: { ...c.contact, facebook } }))} />
          <div className="md:col-span-2">
            <Field label="Google Map 嵌入 URL（選填）" value={content.contact?.mapEmbedUrl ?? ""} onChange={(mapEmbedUrl) => setContent((c) => ({ ...c, contact: { ...c.contact, mapEmbedUrl } }))} />
          </div>
        </div>
      </Panel>
    </div>
  );
}
