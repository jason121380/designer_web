"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: string[];
  /** 每個分類目前被幾支影片套用（用來判斷能否刪除）。 */
  usageCount: (name: string) => number;
  onAdd: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (name: string) => void;
}

const inputClass = "w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";

export default function VideoCategoryModal({ open, onClose, categories, usageCount, onAdd, onRename, onRemove }: Props) {
  const [newName, setNewName] = useState("");
  if (!open) return null;

  function add() {
    const name = newName.trim();
    if (!name) return;
    if (categories.includes(name)) { toast.error("已有相同分類"); return; }
    onAdd(name);
    setNewName("");
  }

  function commitRename(from: string, input: HTMLInputElement) {
    const to = input.value.trim();
    if (to === from) return;
    if (!to || categories.includes(to)) {
      if (to) toast.error("已有相同分類");
      input.value = from; // 還原，避免畫面停留在無效/空白名稱
      return;
    }
    onRename(from, to);
  }

  function remove(name: string) {
    if (usageCount(name) > 0) { toast.error("此分類已被影片套用，無法刪除"); return; }
    onRemove(name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">管理分類</h2>
          <button type="button" onClick={onClose} aria-label="關閉" className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="space-y-2">
          {categories.length === 0 && <p className="py-4 text-center text-sm text-gray-400">尚無分類，於下方新增。</p>}
          {categories.map((category) => {
            const used = usageCount(category);
            return (
              <div key={category} className="flex items-center gap-2">
                <input
                  defaultValue={category}
                  className={inputClass}
                  onBlur={(event) => commitRename(category, event.target)}
                  onKeyDown={(event) => { if (event.key === "Enter") (event.target as HTMLInputElement).blur(); }}
                />
                <button
                  type="button"
                  onClick={() => remove(category)}
                  disabled={used > 0}
                  title={used > 0 ? `已被 ${used} 支影片套用，無法刪除` : "刪除分類"}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <input
            className={inputClass}
            value={newName}
            placeholder="新增分類名稱"
            onChange={(event) => setNewName(event.target.value)}
          />
          <button type="button" onClick={add} className="inline-flex shrink-0 items-center gap-1.5 bg-rose-brand rounded-lg px-3.5 py-2 text-sm font-semibold text-white"><Plus size={15} />新增</button>
        </div>

        <p className="mt-3 text-xs text-gray-400">修改名稱會同步更新已套用該分類的影片；被套用中的分類無法刪除。</p>
      </div>
    </div>
  );
}
