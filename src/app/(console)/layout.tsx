import { SidebarNav } from "@/components/sidebar-nav";
import { AuthStatus } from "@/components/auth-status";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070b] text-zinc-100 md:flex">
      <SidebarNav />
      <div className="flex-1">
        <header className="border-b border-white/10 bg-black/30 px-6 py-4 backdrop-blur-xl md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Industrial Command Layer</p>
              <p className="mt-1 text-sm text-zinc-300">Unified field telemetry, automation control, and trade visibility.</p>
            </div>
            <AuthStatus />
          </div>
        </header>

        <div className="bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_42%)] px-6 py-7 md:px-10 md:py-9">
          {children}
        </div>
      </div>
    </div>
  );
}
