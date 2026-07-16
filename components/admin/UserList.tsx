"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const ROLE_MAP: Record<string, string> = {
  ADMIN: "管理員",
  EDITOR: "編輯",
  AUTHOR: "作者",
};

const inputClass = "w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-rose-brand focus:ring-2 focus:ring-rose-light";

export default function UserList({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [target, setTarget] = useState<UserRow | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [target]);

  function open(user: UserRow) {
    setEmail(user.email);
    setName(user.name);
    setPassword("");
    setTarget(user);
  }

  function close() {
    if (saving) return;
    setTarget(null);
  }

  async function save() {
    if (!target) return;
    if (!email.trim()) { toast.error("登入帳號不可空白"); return; }
    if (!name.trim()) { toast.error("名稱不可空白"); return; }
    if (password.length > 0 && password.length < 6) { toast.error("密碼至少 6 個字元"); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "更新失敗");
      toast.success("帳號已更新");
      setTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用戶管理</h1>
        <p className="mt-1 text-sm text-gray-400">管理後台登入帳號，可編輯登入帳號、名稱與密碼。</p>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white rounded-lg">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
              <th className="px-5 py-3">登入帳號</th>
              <th className="px-5 py-3">名稱</th>
              <th className="px-5 py-3">角色</th>
              <th className="px-5 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-5 py-4">
                  <span className="font-medium text-gray-900">{user.email}</span>
                  {user.id === currentUserId && <span className="ml-2 text-xs text-gray-400">（你）</span>}
                  {!user.active && <span className="ml-2 text-xs text-red-500">已停用</span>}
                </td>
                <td className="px-5 py-4 text-gray-600">{user.name}</td>
                <td className="px-5 py-4 text-gray-600">{ROLE_MAP[user.role] ?? user.role}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => open(user)}
                    className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:border-rose-brand hover:text-rose-brand"
                  >
                    <Pencil size={13} />編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="編輯帳號"
            className="w-full max-w-md border border-gray-200 bg-white rounded-lg p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">編輯帳號</h2>
                <p className="mt-1 text-sm text-gray-400">修改登入帳號、名稱，或設定新密碼。</p>
              </div>
              <button type="button" onClick={close} aria-label="關閉" className="shrink-0 text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">登入帳號</span>
                <input className={inputClass} value={email} placeholder="登入用的帳號" autoFocus onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">名稱</span>
                <input className={inputClass} value={name} placeholder="顯示名稱" onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">新密碼</span>
                <input className={inputClass} type="password" value={password} placeholder="留空＝不變更；至少 6 個字元" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); }} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={close} disabled={saving} className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50">取消</button>
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 bg-rose-brand rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Pencil size={15} />{saving ? "儲存中" : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
