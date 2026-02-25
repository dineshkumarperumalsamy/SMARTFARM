import { SectionCard } from "@/components/section-card";

export default function StoragePage() {
  return (
    <SectionCard title="Storage Environment" subtitle="Cold chain and silos">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-zinc-400">Cold Bay A</p>
          <p className="mt-2 text-2xl font-semibold">3.8°C</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-300">Stable humidity 61%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-zinc-400">Dry Silo C</p>
          <p className="mt-2 text-2xl font-semibold">11.4°C</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-300">Vent cycle due in 50m</p>
        </div>
      </div>
    </SectionCard>
  );
}
