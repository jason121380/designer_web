"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DesignerWebContent } from "@/lib/designer-web-content";
import ImageUpload from "./ImageUpload";
import MediaUpload from "./MediaUpload";
import PageSectionPanel from "./PageSectionPanel";

const inputClass = "w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";
const textareaClass = `${inputClass} min-h-24 resize-y`;
const rowClass = "space-y-4 border-b border-gray-100 py-5 first:pt-0 last:border-b-0 last:pb-0";

const makeId = () => `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

type LinkItem = DesignerWebContent["links"]["items"][number];

export default function LinksManagementForm({ initialContent, slug }: { initialContent: DesignerWebContent; slug: string }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const previewPath = `/${slug}/links`;
  const links = content.links;
  const items = links.items;

  function setItems(next: LinkItem[]) {
    setContent({ ...content, links: { ...content.links, items: next } });
  }
  function updateItem(index: number, patch: Partial<LinkItem>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/designer-web/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "儲存失敗");
      setContent(body);
      toast.success("連結頁已儲存");
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯連結頁：{previewPath}</h1>
          <p className="mt-1 text-sm text-gray-400">linktree 風格的個人連結頁；名稱、主色與社群沿用一頁式的「品牌」與「聯絡資訊」設定。</p>
        </div>
        <div className="flex gap-2">
          <a href={previewPath} target="_blank" className="inline-flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600"><ExternalLink size={15} />預覽連結頁</a>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? "儲存中" : "儲存連結頁"}</button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white rounded-lg">
        <PageSectionPanel title="頭像與簡介" description="連結頁最上方的頭像與一段自我介紹" defaultOpen>
          <MediaUpload label="頭像（圖片或影片）" value={links.avatar} onChange={(avatar) => setContent({ ...content, links: { ...content.links, avatar } })} />
          <div className="mt-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">簡介</span>
              <textarea className={textareaClass} value={links.bio} placeholder="例如：中壢接髮設計師｜預約請點下方連結" onChange={(event) => setContent({ ...content, links: { ...content.links, bio: event.target.value } })} />
            </label>
          </div>
        </PageSectionPanel>

        <PageSectionPanel title="QR Code" description="上傳後連結頁右上角會出現 QR 按鈕，點擊可放大顯示（可放 LINE 加好友或本頁 QR）；留空則不顯示">
          <ImageUpload label="QR Code 圖片" value={links.qr} onChange={(qr) => setContent({ ...content, links: { ...content.links, qr } })} />
        </PageSectionPanel>

        <PageSectionPanel title="連結按鈕" description="每一列一顆按鈕，由上到下排列（可上下移動）">
          {items.map((item, index) => (
            <div key={item.id} className={rowClass}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">按鈕 {index + 1}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="上移" className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="下移" className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button type="button" onClick={() => removeItem(index)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500"><Trash2 size={13} />移除</button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">按鈕文字</span><input className={inputClass} value={item.label} placeholder="例如 預約表單、Instagram" onChange={(event) => updateItem(index, { label: event.target.value })} /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">連結網址</span><input className={inputClass} value={item.url} placeholder="https://..." onChange={(event) => updateItem(index, { url: event.target.value })} /></label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { id: makeId(), label: "", url: "" }])} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-rose-brand"><Plus size={15} />新增連結按鈕</button>
        </PageSectionPanel>

        <PageSectionPanel title="社群 icon" description="連結頁底部的社群圖示；與一頁式的「聯絡資訊」共用同一份，在任一邊修改都會同步。留空的項目不顯示。">
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["Instagram 連結", "instagram"],
              ["Facebook 連結", "facebook"],
              ["LINE 連結", "line"],
              ["Email", "email"],
              ["電話", "phone"],
              ["Google Maps 連結", "mapUrl"],
            ] as const).map(([label, key]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span>
                <input
                  className={inputClass}
                  value={content.contact[key]}
                  onChange={(event) => setContent({ ...content, contact: { ...content.contact, [key]: event.target.value } })}
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">網址免加 https://，前台會自動補上。這些欄位與一頁式「聯絡資訊」相同，儲存後兩頁一起更新。</p>
        </PageSectionPanel>
      </div>
    </div>
  );
}
