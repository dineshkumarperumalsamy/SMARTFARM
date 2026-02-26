import { SectionCard } from "@/components/section-card";

const kpis = [
  { label: "Active Nodes", value: "142", trend: "+6.2%" },
  { label: "Yield Projection", value: "2.31T", trend: "+3.8%" },
  { label: "Water Index", value: "91/100", trend: "+1.7%" },
  { label: "Automation Uptime", value: "99.3%", trend: "+0.4%" }
];

export default function DashboardPage() {
  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-sm text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-300">{item.trend}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Field Activity Timeline" subtitle="Realtime stream">
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">08:40 — Node Cluster A recalibrated moisture threshold.</li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">09:05 — Drone survey uploaded crop stress map for Sector 6.</li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">09:22 — Storage bay B switched to energy saver mode.</li>
          </ul>
        </SectionCard>

        <SectionCard title="System Health" subtitle="Operations">
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span>Sensors online</span><span>98.6%</span></li>
            <li className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span>Data latency</span><span>42ms</span></li>
            <li className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span>Critical alarms</span><span>2</span></li>
          </ul>
        </SectionCard>
      </div>
    </main>
  );
}
