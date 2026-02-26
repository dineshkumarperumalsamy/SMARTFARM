"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Nodes", href: "/nodes" },
  { label: "Market Intelligence", href: "/market-intelligence" },
  { label: "Storage", href: "/storage" },
  { label: "Alerts", href: "/alerts" }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-white/10 bg-[#090b0f] p-4 md:h-screen md:w-72 md:border-b-0 md:border-r md:p-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Smart Farm</p>
        <h1 className="mt-3 text-lg font-semibold text-zinc-100">Intelligence Dashboard</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                active
                  ? "border-cyan-400/35 bg-cyan-500/10 text-cyan-200"
                  : "border-white/5 bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.05]"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">View</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
