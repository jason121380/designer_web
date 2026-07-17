"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ChevronRight,
  X,
  PanelsTopLeft,
  Images,
  Users,
} from "lucide-react";

const navItems: {
  href: string;
  label: string;
  icon: typeof PanelsTopLeft;
  adminOnly?: boolean;
}[] = [
  { href: "/admin/page-management", label: "頁面管理", icon: PanelsTopLeft },
  { href: "/admin/media", label: "媒體庫", icon: Images },
  { href: "/admin/users", label: "用戶管理", icon: Users, adminOnly: true },
];

const ROLE_MAP: Record<string, string> = {
  ADMIN: "管理員",
  EDITOR: "編輯",
  AUTHOR: "作者",
};

interface SidebarProps {
  userName: string;
  userRole: string;
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userName, userRole, open = false, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const displayName = userName.replace(/mifaso|迷髮所/gi, "").trim() || "管理員";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-dvh w-64 bg-white flex flex-col z-40 border-r border-gray-100 transform transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:-translate-x-full" : "md:translate-x-0"
      )}
    >
      <div className="flex h-14 items-center px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">MLG 設計師一頁式網站後台</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉選單"
            className="md:hidden shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">主選單</p>
        <div className="space-y-0.5">
          {navItems.filter((item) => !item.adminOnly || userRole === "ADMIN").map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-rose-brand text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={12} className="text-white/70" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-brand flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {displayName[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400">{ROLE_MAP[userRole] ?? userRole}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            aria-label="登出"
            title="登出"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
