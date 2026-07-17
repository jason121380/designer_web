"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import Sidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";

export default function AdminShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); // 手機：滑出選單
  // 桌機收合只維持在當前瀏覽期間，不寫入 localStorage：
  // 曾因永久記住收合狀態，使用者誤觸一次後每次進後台側欄都消失。
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userRole={userRole}
        open={open}
        collapsed={collapsed}
        onClose={() => setOpen(false)}
      />

      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div
        className={`${
          collapsed ? "md:ml-0" : "md:ml-64"
        } flex min-h-screen flex-col min-w-0 transition-[margin] duration-200 ease-out`}
      >
        <AdminHeader
          onMenu={() => setOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        <main className="flex-1 overflow-x-clip p-4 md:p-8">{children}</main>
        <Toaster position="top-right" richColors />
      </div>
    </div>
  );
}
