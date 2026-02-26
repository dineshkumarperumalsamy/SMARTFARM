import { type ReactNode } from "react";

export function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{subtitle}</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-100">{title}</h2>
      </header>
      {children}
    </section>
  );
}
