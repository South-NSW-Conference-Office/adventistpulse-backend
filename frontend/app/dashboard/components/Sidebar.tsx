"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const NAV_ITEMS = [
  { label: "Dashboard",         icon: "◈", href: "/dashboard",                  active: true  },
  { label: "Conference Vitals", icon: "⬡", href: "/dashboard/vitals",           active: false },
  { label: "Conference Pulse",  icon: "♡", href: "/dashboard/pulse",            active: false },
  { label: "Conference Grid",   icon: "⊞", href: "/dashboard/grid",             active: false },
  { label: "Baptism Pipeline",  icon: "↓", href: "/dashboard/baptism",          active: false },
  { label: "Harvest Map",       icon: "⊕", href: "/dashboard/harvest",          active: false },
  { label: "Tithe Health",      icon: "₿", href: "/dashboard/tithe",            active: false },
  { label: "Retention Curve",   icon: "↺", href: "/dashboard/retention",        active: false },
  { label: "Church Lifecycle",  icon: "◐", href: "/dashboard/lifecycle",        active: false },
  { label: "Growth Velocity",   icon: "↗", href: "/dashboard/growth",           active: false },
  { label: "Benchmarks",        icon: "≡", href: "/dashboard/benchmarks",       active: false },
];

const ADMIN_ITEMS = [
  { label: "Users",       icon: "◎", href: "/dashboard/admin/users"  },
  { label: "Data Import", icon: "⊡", href: "/dashboard/admin/import" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout }          = useAuth();
  const { toast }                 = useToast();
  const router                    = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success("You've been signed out. See you next time!");
    router.replace("/");
  };

  return (
    <aside
      className="flex flex-col h-full bg-[#0A0A0A] transition-all duration-300 shrink-0"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Image
          src="/adventist-logo.png"
          alt="Adventist Pulse"
          width={28}
          height={28}
          className="shrink-0"
        />
        {!collapsed && (
          <span className="text-white text-[13px] font-bold tracking-wide whitespace-nowrap">
            ADVENTIST PULSE
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white/40 hover:text-white/80 text-xs"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] text-white/30 uppercase tracking-widest px-2 pb-2">
            Views
          </p>
        )}
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-2 py-2 rounded-lg text-[12px] font-medium transition-colors ${
              item.active
                ? "bg-blue-600 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-[14px] w-5 text-center shrink-0">{item.icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </a>
        ))}

        <div className="pt-4">
          {!collapsed && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest px-2 pb-2">
              Admin
            </p>
          )}
          {ADMIN_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-2 py-2 rounded-lg text-[12px] font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-[14px] w-5 text-center shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </a>
          ))}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-[11px] font-semibold truncate">{user?.name ?? "User"}</p>
              <p className="text-white/40 text-[10px] truncate capitalize">{user?.role ?? ""}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/5 hover:text-red-400 transition-colors w-full"
          title="Sign out"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
